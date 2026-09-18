# examples

## faux-e2e.ts — 无 API key 的端到端自检

按 skill 教法(H03 Faux + A03 提示词覆盖 + D01 自定义工具 + E01 tool_call 拦截 + F01 inMemory)组装的迷你垂直 agent,断言 8 项核心机制(工具执行/拦截回喂自纠/事件链/agent_settled 语义)。运行:

```bash
npm install @earendil-works/pi-coding-agent@0.85.1 @earendil-works/pi-ai@0.85.1 typebox
node --experimental-strip-types examples/faux-e2e.ts   # Node >= 23.6;或用 tsx
```

> ⚠️ 若报 `No API provider registered for api: faux:...`,是 npm 双 pi-ai 实例问题——脚本已按文件路径从嵌套副本导入,详见 skill 的 H03 场景「前置陷阱」。
