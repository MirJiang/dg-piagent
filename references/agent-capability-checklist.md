# Agent 开发完整能力清单(纯 pi-agent v0.85.1 基准)

> 用途:①从零实现/复刻一个 agent 引擎时的**功能对标清单**;②评估现有 agent 的**成熟度标尺**。
> 分级:**L1 及格**(能跑通)→ **L2 生产级**(稳、可运维)→ **L3 顶级**(= pi v0.85.1 完整功能面,全部核对到官方源码/文档)。
> 本清单**只以 pi 为基准**,不含外部框架的实践;数字与行为以 `pi-mono` v0.85.1 为准。
> 约定:按业务裁剪,但每项至少知道 pi 长什么样,才知道差距在哪。

---

## 0. 总览:pi 的 12 个能力模块

```
Provider 适配层 ── 模型调用/流式/重试降级/OAuth/多模态/用量
      │
Agent Loop ──── Trace/Turn 循环 + 36 种事件钩子 + steering
      │
工具系统 ────── 四阶段管道 + 错误回喂 + 截断 + 中止/进度 (8 内置工具)
      │
事件系统 ────── 两层派发(参与者/观察者) + 24 种 subscribe 事件
      │
上下文引擎 ──── 截断 + 压缩 + 缓存命中 + context files + branch summary
      │
会话管理 ────── JSONL/SQLite 持久化 + 树/恢复/分叉 + 导出分享
      │
扩展与能力注入 ── 扩展 API + skills + prompt templates + 自定义命令/flag
      │
      ├──────────────┬─────────────┬──────────────┐
 Subagent 编排     RPC/SSE 集成面    安全(信任/拦截/沙箱)
      │
可观测(telemetry/cache统计) + 评估(packages/evals)
```

CLI 专属能力(终端 TUI、主题、键位、tmux 集成)自研 Web 形态可整体跳过,本清单不展开。

---

## 1. Provider 适配层

| 级别 | 标准 |
|---|---|
| L1 | 调通一家模型的 chat + function calling |
| L2 | 流式;key 多来源(env/文件);网络错误重试 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **统一抽象**:`streamSimple/stream` 一套接口覆盖 Anthropic Messages / OpenAI Responses / Chat Completions / Google / llama.cpp / OpenRouter 等;11 种 `thinkingFormat` 逐家适配 reasoning 参数。
- **本地模型**:llama-cpp 完整支持(docs/llama-cpp.md),含 chat template 的 enable_thinking 与 thinking level 对接。
- **凭据四级优先级**:runtime 注入 > 环境变量 > auth.json > models.json;订阅类凭据(Codex/ZAI Token Plan 等)与 API key 并存;OAuth 每家单独实现;并发写用文件锁。
- **重试与降级**:agent 级重试退避上限 `retry.maxAgentDelayMs`(默认 60s);模型 fallback 链(model + scopedModels + 顺序回退)。
- **思考等级体系**:ThinkingLevel 7 档(agent-core)/6 档(pi-ai),per-model 配置,`/thinking` 切换;模型不支持时 clamp 到 off。
- **多模态输入**:PromptOptions.images 支持图片输入;ImageSettings 管理图像行为;`detectSupportedImageMimeTypeFromFile` 检测格式(EXIF 方向感知)。
- **用量与成本**:每条 AssistantMessage 携带 usage(含 cache 读写 token);usage totals 汇总;订阅类模型给 API 等效成本估算。
- **Prompt cache 友好**:前缀稳定设计(见第 5 节)。

## 2. Agent Loop

| 级别 | 标准 |
|---|---|
| L1 | "模型调工具→执行→回喂→再调用"循环跑通 |
| L2 | 多轮 turn 管理;能中止;基础重试 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **Trace/Turn 双层**:Trace = 一次输入到最终答复(retry 产生新 Trace);Turn = 一次模型调用含其工具执行;`agent_start/end` 每 trace 一对、`turn_start/end` 每 turn 一对。
- **全链路钩子**:36 个 `pi.on` 事件(0.85.1),覆盖 session/agent/turn/message/tool/provider/input 七族。
- **结束信号分级**:`agent_end`(单轮,retry 多次触发)vs `agent_settled`(所有 retry/压缩/队列处理完,**每 prompt 恰好一次**,两层派发)。
- **Steering**:运行中 `steer()`(默认 one-at-a-time 插队当前轮)与 `followUp()`(排队下轮);队列变化广播 `queue_update`;消息插入顺序保护(不插进 tool_call 与 result 之间);`clearQueue` 取走并清空;`followUpMode` 可切。
- **异常兜底**:Provider 自动重试(`auto_retry_start/end` 可观测);压缩失败可重试;`abort()` 三步语义(resolve 即已停;不杀 bash);`abortRetry` 单独公开。

## 3. 工具系统

| 级别 | 标准 |
|---|---|
| L1 | 定义工具,模型能调 |
| L2 | 白/黑名单;超时;错误不崩循环 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **8 个内置工具**:read / bash / edit / write / grep / find / ls / powershell(Windows,0.84.3+);默认激活仅 read/bash/edit/write 四件套;`tools`/`noTools`/`excludeTools` 三层控制,白名单统一滤内置+扩展+自定义;同名 first-wins + 冲突检测。
- **四阶段管道**:参数验证(JSON 序列化修复、schema 类型自动转换)→ 调用前检查 → 调用中错误处理 → 调用后结果调整。
- **错误回喂**:报错当结果返模型自纠,循环不断;错误描述具体到"哪错、怎么办"。
- **截断**:`TOOL_RESULT_MAX_CHARS=2000`,完整结果落盘、给模型截断文本+路径。
- **执行器五参数**:`execute(toolCallId, params, signal, onUpdate, ctx)`——abort 层层传导、进度回调、执行上下文注入。
- **edit 的结构化输出**:`details.diff` / `details.patch` 返回统一 unified patch 供 SDK/前端做 diff 审计与审批流。
- **bash 工程细节**:timeout 单位秒;`shellCommandPrefix` 支持用户 shell aliases;Windows 缺 taskkill 兜底;执行时长格式化(分/时)。
- **结构化输出约束**:`constrainedSampling`(json_schema strict prefer/require + openai_lark/openai_regex)。
- **文件变更队列**:写类工具经 `withFileMutationQueue` 串行化。

## 4. 事件系统

| 级别 | 标准 |
|---|---|
| L1 | 有回调机制 |
| L2 | 统一总线;类型化 payload;观察者不碍主流程 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **两层派发**:参与者层(`pi.on`,可改行为,被 await)与观察者层(`session.subscribe`,只读旁路,不被 await 可做慢 IO);**7 个扩展独有事件**(context/tool_call/tool_result/before_agent_start/input/model_select/thinking_level_select)只在参与者层;`AgentSessionEvent` 共 24 种(10 AgentEvent + 14 session 独有,含 `bash_execution_update`)。
- **payload 防篡改**:handler 收到的是克隆(`structuredClone`)。
- **合并语义**:可修改事件的 handler 返回值逐字段合并进原事件(未给字段保留原值)。
- **流式子事件协议**:assistant 消息 12 种子事件(text/thinking/toolcall 三通道,`*_end` 携带完整内容)。
- **异常隔离**:单 handler 抛错进错误流(emitError,含扩展路径/堆栈),不中断他人与主循环;串行顺序=注册顺序。
- **provider 级事件**:before_provider_request(改请求体)/ before_provider_headers(in-place 改头,null 删头)/ after_provider_response(状态码与响应头)。

## 5. 上下文引擎

| 级别 | 标准 |
|---|---|
| L1 | 历史消息能发模型 |
| L2 | 超长裁剪;系统提示词可配 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **压缩**:`reserveTokens=16384` / `keepRecentTokens=20000`;`shouldCompact` 阈值主动触发(不等爆错);双用途公式 `min(floor(0.8×reserve), maxTokens)`;时机在上一轮任务结束后;结构化模板(用户目标/约束/工作流程/关键决策/文件操作/下一步);结果替换被压区间且 fork 保留压缩边界;大工具结果跨阈值时在"工具后、下次模型调用前"中途压缩;压缩可中止、失败可重试。
- **branch summary**:离开会话树分支时自动生成分支摘要(branch-summarization,独立于主压缩,含 usage 记账)。
- **截断**:工具结果 2000 字符 + 落盘 + 路径回传;按工具场景决定保留头/尾。
- **Context Files 体系**:AGENTS.md > AGENTS.MD > CLAUDE.md > CLAUDE.MD 优先级;发现顺序 = 全局 agentDir → cwd 逐级向上(父级在前);受项目信任门槛管控;`noContextFiles`/`agentsFilesOverride` 可控。
- **System Prompt Files**:`SYSTEM.md`(整体替换)/ `APPEND_SYSTEM.md`(追加);SDK 级 `systemPromptOverride`/`appendSystemPromptOverride`。
- **缓存命中**:系统提示词分层组装(稳定段在前)、前缀不漂移、工具定义顺序稳定;cache 读写 token 进 usage 可统计。
- **渐进式披露**:Skills 只注入名字+描述,正文模型按需 read。

## 6. 会话管理

| 级别 | 标准 |
|---|---|
| L1 | 进程内存消息 |
| L2 | 落盘可恢复;能列历史 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **JSONL 追加式**:格式版本 v3,9 种 entry 类型;首条 assistant 消息到达才落盘(hasAssistant 守卫);缺尾换行的损坏文件兼容。
- **双后端 + SQLite**:文件(默认)与 `inMemory()`(0.85.0 起支持从外部管理的条目恢复);SQLite 后端独立包(`session-backends/sqlite-node`)。
- **树结构**:navigateTree 深潜分支;fork 从任意 user 消息分叉(保留压缩边界);switchSession 热切换;importFromJsonl 导入(防同名覆盖)。
- **导出与分享**:export-html(会话渲染为独立 HTML,含样式);会话分享(concurrent shares 并发保护);`/tree` 复制选中消息。
- **元数据**:SessionInfo 10 字段(名称/标签/时间/模型/分支);`PI_CODING_AGENT_DIR` 重定位配置目录。

## 7. 扩展与能力注入层(pi 的招牌)

| 级别 | 标准 |
|---|---|
| L1 | 配置文件能改行为(提示词/工具清单) |
| L2 | 插件机制:运行时注册工具/命令/钩子 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **扩展 API 面**:`pi.on`(36 事件)/ `registerTool` / `registerCommand`(handler 签名 `(args, ctx) => Promise<void>`)/ `registerShortcut` / `registerFlag`+`getFlag` / `registerProvider` / `registerMessageRenderer` / `registerEntryRenderer` / `sendMessage` / `appendEntry` / `exec` / `setActiveTools` / `pi.ui`(confirm/notify,SDK 场景 no-op 需 hasUI 守卫)。
- **扩展四来源**:项目级 `<cwd>/.pi/extensions/*.ts`(须受信)、用户级 `~/.pi/agent/extensions/`、显式路径(本地/npm:/git URL)、内联 factory(`<inline:1>` 命名);同名工具/flag 冲突检测告警。
- **Skills 系统**:SKILL.md + frontmatter(name 校验 `[a-z0-9-]` ≤64、description ≤1024 空则不加载);渐进披露;`/skill:name` 展开;`disableModelInvocation`;user→project→skillPaths 三级发现与 ignore 规则。
- **Prompt Templates**:`/command` 模板 + `argument-hint`;`substituteArgs` 全套占位符(`$N`/`$@`/`${N:-default}`/`${@:N:L}`);优先级链:扩展命令 > /skill: > 模板;`expandPromptTemplates:false` 可关(steer/followUp 恒展开)。
- **能力分发的包形态**:pi package(`pi.pi` manifest)、`.piplugin` 分发、npm/git 安装与版本信任(`pi install/-e/list`)。
- (TS 扩展文件加载器与虚拟模块别名属 TS 生态实现细节,自研按自己语言的插件机制对应。)

## 8. Subagent 编排

| 级别 | 标准 |
|---|---|
| L1 | 能再起 agent 实例干活 |
| L2 | 并行多任务、汇总、失败处理 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **三模式**:single / parallel(映射)/ chain(流水线,`{previous}` 传递);失败语义显式(parallel 可配置继续/中止,chain 断链)。
- **实测参数**:`MAX_PARALLEL_TASKS=8`、`MAX_CONCURRENCY=4`、单任务输出上限 50KB(截断防淹没)。
- **handoff 消息协议**:子 agent 结束生成结构化交接消息(`getHandoffMessages`),主 agent 无缝续接。
- **上下文治理**:子任务独立会话文件,主 agent 收摘要;`agentScope` 三档控制能力继承;每 agent 必填字段(cwd/model 等)。
- **实现为内核之上的扩展**,不污染循环。

## 9. 集成面(RPC / SSE / SDK)

| 级别 | 标准 |
|---|---|
| L1 | 进程内 SDK 调用 |
| L2 | HTTP 服务封装能问答 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **三种宿主形态一套内核**:SDK 同进程 / stdio RPC(跨语言、进程隔离,docs/rpc.md 完整协议)/ JSON 流模式(`--mode json`,一次性事件流输出)。
- **RPC 命令面**:prompt / steer / abort / followUp / clear_queue / 模型与思考级切换 / 会话管理 / Extension UI Protocol。
- **事件流完整转发**:宿主收到与内核同构的事件流(含流式 delta)。
- **双向控制**:前端停止 → abort → 工具内 AbortSignal;工具 onUpdate 进度推前端。
- **SSE/Web 形态**:进度信号源(text 通道/tool_execution_start/bash 增量)、thinking 不转发、done 双保险(agent_settled + prompt finally)。
- **多用户**:每用户独立 session + inMemory 自管存储;切换会话重订阅+重绑扩展两步都不能省。

## 10. 安全

| 级别 | 标准 |
|---|---|
| L1 | key 不明文、演示不删库 |
| L2 | 工具白名单 + 危险命令拦截 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **项目信任门槛**:未受信目录先问;决策持久化 trust.json;不受信项目不加载其 `.pi/` 资源(防仓库投毒);SDK 级 `setProjectTrusted`。
- **分层拦截**:工具白名单滤网 → `tool_call` 事件拦截(可改参数可 block,reason 回喂)→ 路径白名单(拦截器须与工具的 `~` 展开语义一致)→ 执行前确认闸门(`ctx.ui.confirm`,无人值守 no-op 需硬阻断)。
- **沙箱分级**(docs/security.md + containerization.md):裸跑/容器化/Gondolin;扩展工具不一定跟内置工具同一沙箱,边界显式声明。
- **`user_bash` fail-closed**:拦截 handler 出错/非法返回时中止命令而非放行(master 起;0.85.1 为宽松语义)。
- **错误信息卫生**:回喂模型的报错具体,对外日志不泄凭据。

## 11. 可观测

| 级别 | 标准 |
|---|---|
| L1 | console.log |
| L2 | 结构化日志;token 统计 |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **用量精确到消息**:每条 AssistantMessage 带 usage(含 cache 读写);压缩/分支摘要用量单独计;`getLastAssistantUsage` 可查;usage totals 汇总与成本估算。
- **缓存统计**:cache-stats 模块;cache miss 通知可开(transcript notices)。
- **telemetry 包**:vendor-neutral telemetry 契约与类型化 schema(packages/telemetry)。
- **错误双通道**:handler 异常走 emitError(扩展路径+堆栈),与业务事件分离;Settings 写入错误可 drain。
- **诊断分级**:ResourceDiagnostic warning 不阻塞启动、可查询。
- **性能计时内建**:资源加载/模型调用等关键阶段自动计时。

## 12. 评估(packages/evals——pi 自带)

| 级别 | 标准 |
|---|---|
| L1 | 手测任务清单 |
| L2 | 固定测试集 + 自动判定进 CI |
| L3 | pi 完整功能面(见下) |

**pi 的完整做法**:
- **行为级评测**:pi evals = "behavioral, model-backed checks"——把真实 `AgentSession` 适配到 vitest-evals 上跑,**端到端**测行为而非单元断言。
- **隔离环境**:每个 eval 在独立的临时项目目录与 agent 目录中运行,可重复。
- **原生产物挂载**:评测自动附带 pi 会话工件(session artifacts),失败可回放 trace。
- **对比维度**:官方定位即对比 prompts / tools / skills / models / 其他 harness 配置。
- **运行**:`npm run eval -- --provider X --model Y`(PI_PROVIDER/PI_MODEL 等价);参数透传 Vitest;认证走 ModelRuntime 全套。

---

## 验收方法:怎么证明你做到了 L3

1. **事件流等价测试**:与 pi 并排跑同一组任务(含工具调用/压缩触发/中途 steer/工具报错自纠),逐事件对比 `turn_start → tool_call → tool_result → message_end → agent_settled` 序列与 payload——序列等价即核心等价。
2. **格式互认**:你的会话 JSONL 能被 pi `importFromJsonl` 读回(对齐 sdk_doc/12 的 v3 规格)。
3. **极端场景清单**:爆窗前主动压缩、中途 abort 后 steer、工具连错 3 次自纠、断电重启无损恢复、8 并发 subagent 单分支超 50KB 截断、fork 不丢压缩边界——每项有自动化测试。
4. **安全红队**:不受信目录资源不加载;路径白名单下 `~/` 变体绕不过;`user_bash` 拦截器崩溃时命令不执行。
5. **evals 复用**:直接用 pi evals 的思路(真实 session + vitest)给你的引擎建行为级测试。

## 使用建议

- **从零造引擎**:按模块顺序实现(Provider → Loop → 工具 → 事件 → 上下文 → 会话),每完成一个模块回本清单对级;扩展层/编排/集成/安全是"往上盖的楼"最后加;**评估(第 12 节)从第一天建**。
- **裁剪原则**:垂直 agent 常见裁剪——Provider 只接 1-2 家、本地模型按需、TUI 跳过。**错误回喂(3)、两层事件(4)、压缩参数(5)、扩展与能力注入(7)、评估(12)** 五项不建议裁——前三项是"强"的本体,后两项是"可迭代"的本体。
- **注意**:压缩参数等数字是 pi 针对**当前模型代**的调优值,模型换代应重调(参考官方 CHANGELOG 对应条目)。
- **对标源码**:最终裁判是 `pi-mono` v0.85.1 源码;各条目在本 skill 的 sdk_doc/scenarios 有对应详解。
