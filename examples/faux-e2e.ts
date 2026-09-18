/**
 * 端到端验证:按 skill 教法组装的迷你垂直 agent(Faux Provider,无网络无 API key)
 * 覆盖:H03 Faux 模板 + A03 系统提示词覆盖 + A06 loader/reload + D01 自定义工具
 *      + E01 tool_call 拦截(block 回喂)+ F01 inMemory + 04 事件两层派发 + agent_settled 语义
 */
// 关键:必须与 pi-coding-agent 用同一份 pi-ai 实例(嵌套副本),否则全局 api 注册表不互通
import { registerFauxProvider } from "./node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/compat.js";
import {
  fauxAssistantMessage,
  fauxToolCall,
  fauxText,
} from "./node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/providers/faux.js";
import { Type } from "typebox";
import {
  createAgentSession,
  DefaultResourceLoader,
  defineTool,
  getAgentDir,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

// ---- 业务工具(D01 模式:typebox schema + 错误回喂式返回) ----
const toolCalls: Array<{ name: string; args: unknown }> = [];
const queryOrdersTool = defineTool({
  name: "query_orders",
  label: "query_orders",
  description: "查询订单,返回摘要文本",
  parameters: Type.Object({
    limit: Type.Optional(Type.Number({ description: "最多几单" })),
  }),
  async execute(_id, params) {
    toolCalls.push({ name: "query_orders", args: params });
    return {
      content: [{ type: "text", text: `共 ${params.limit ?? 20} 单,总额 1000 元` }],
      details: {},
    };
  },
});

const dropTableTool = defineTool({
  name: "drop_table", label: "drop_table",
  description: "删除表(危险,应被安全扩展拦截)",
  parameters: Type.Object({ table: Type.String() }),
  async execute(_id, params) {
    toolCalls.push({ name: "drop_table", args: params });
    return { content: [{ type: "text", text: "deleted" }], details: {} };
  },
});

// ---- 扩展(E01 模式:tool_call 参与者层拦截 + 危险工具 block 回喂) ----
const interceptLog: string[] = [];
let blockedCount = 0;
const guardExtension = (pi: import("@earendil-works/pi-coding-agent").ExtensionAPI) => {
  pi.on("tool_call", (event) => {
    interceptLog.push(event.toolName);
    if (event.toolName === "drop_table") {
      blockedCount++;
      return { block: true, reason: "危险操作已拦截:drop_table 被安全策略禁止,请改用只读查询。" };
    }
    return undefined;
  });
};

// ---- Faux Provider(H03 模板) ----
const faux = registerFauxProvider({ tokensPerSecond: 1000 });
const modelRuntime = await ModelRuntime.create({ modelsPath: null, allowModelNetwork: false });
modelRuntime.registerProvider(faux.models[0].provider, {
  baseUrl: faux.models[0].baseUrl,
  apiKey: "faux-key",
  api: faux.api,
  models: faux.models.map((m) => ({
    id: m.id, name: m.name, api: m.api, reasoning: m.reasoning, input: m.input,
    cost: m.cost, contextWindow: m.contextWindow, maxTokens: m.maxTokens, baseUrl: m.baseUrl,
  })),
});

// 响应序列:轮1 工具调用 → 轮2 终答;轮3 危险调用被拦 → 轮4 自纠终答
faux.setResponses([
  fauxAssistantMessage(
    [fauxText("我先查订单。"), fauxToolCall("query_orders", { limit: 5 })],
    { stopReason: "toolUse" },
  ),
  fauxAssistantMessage("查询完成:共 5 单,总额 1000 元。"),
  fauxAssistantMessage([fauxToolCall("drop_table", { table: "orders" })], { stopReason: "toolUse" }),
  fauxAssistantMessage("明白,drop_table 被拦截了。我改用只读方式完成需求。"),
]);

// ---- A03 + A06:系统提示词覆盖 + loader + 手动 reload ----
const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  systemPromptOverride: () => "你是订单查询助手,只做只读操作。",
  extensionFactories: [guardExtension],
});
await loader.reload();

// ---- F01 + 组装 ----
const { session } = await createAgentSession({
  model: faux.getModel(),
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
  resourceLoader: loader,
  customTools: [queryOrdersTool, dropTableTool],
});

// ---- 04:观察者层订阅(不被 await,收集事件序列) ----
const seen: string[] = [];
let settledCount = 0;
let assistantTexts = 0;
session.subscribe((event) => {
  seen.push(event.type);
  if (event.type === "agent_settled") settledCount++;
  if (event.type === "message_end" && event.message.role === "assistant") assistantTexts++;
});

// ---- 跑两个 prompt:正常工具链 + 危险拦截自纠 ----
await session.prompt("查最近 5 单");
await session.prompt("帮我把 orders 表删了重建");

session.dispose();
faux.unregister();

// ---- 断言 ----
const mustHave = [
  "turn_start", "tool_execution_start", "tool_execution_end",
  "message_end", "agent_settled",
];
const missing = mustHave.filter((t) => !seen.includes(t));
const checks: Array<[string, boolean]> = [
  ["工具真实执行(query_orders 跑了 1 次)", toolCalls.length === 1 && toolCalls[0].name === "query_orders"],
  ["扩展参与者层拦截生效(drop_table 被 block)", blockedCount === 1],
  ["被拦截的工具未执行(toolCalls 无 drop_table)", !toolCalls.some((c) => c.name === "drop_table")],
  ["拦截 reason 回喂后模型自纠(第 4 轮终答产出)", faux.getPendingResponseCount() === 0],
  ["agent_settled 每 prompt 恰好一次(共 2 次)", settledCount === 2],
  ["事件序列含核心链路", missing.length === 0],
  ["观察者层收到 assistant 终答 ×2", assistantTexts >= 2],
  ["拦截器看到了 2 次工具调用意图(含 drop_table)", interceptLog.length === 2 && interceptLog[1] === "drop_table"],
];

let pass = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (ok) pass++;
}
console.log(`\n事件流样本: ${seen.slice(0, 14).join(" → ")} ...`);
console.log(`结果: ${pass}/${checks.length} 通过`);
if (pass !== checks.length) process.exit(1);
console.log("\n=== 端到端验证成功:按 skill 教法组装的 agent 完整跑通 ===");
