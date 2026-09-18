# Changelog

本文件记录 dg-piagent skill 的全部修订历史（永久保留，只增不删）。维护规则见 [skill-maintenance.md](references/skill-maintenance.md)。

## [2026-09-19] 清单 v3:回归纯 pi 基准 + 全功能面补遗

应用户要求清除全部外部来源内容(🌍 业界条目、交叉验证、时效审计、外部评估/长期记忆节),清单重写为**纯 pi v0.85.1 基准**。同时反向盘点 pi 全部包/文档,补入此前遗漏的 pi 功能:
- 新增**第 7 节 扩展与能力注入层**(pi 的招牌):扩展 API 全家(13 个 pi.* 方法)、扩展四来源、Skills 系统、Prompt Templates(/command + substituteArgs 占位符)、pi package/.piplugin 分发;
- 第 12 节评估改为 **pi 自带 packages/evals**(真实 AgentSession + vitest-evals 行为级评测、隔离临时目录、session artifacts);
- 补遗散落功能:多模态输入(PromptOptions.images/ImageSettings)、本地模型 llama-cpp、订阅类凭据与成本估算、usage totals、thinking level 7 档体系、edit 的 details.diff/patch、bash shellCommandPrefix aliases、Context Files(AGENTS.md 优先级链)与 SYSTEM.md/APPEND_SYSTEM.md、branch summary、SQLite 会话后端(session-backends/sqlite-node)、export-html 与会话分享、telemetry 包、cache-stats。
- 移除:长期记忆节(pi 无此功能)、全部 🌍 外部条目。TUI/主题/键位/tmux 标注为 CLI 专属可跳过。

## [2026-09-19] 清单 v2.2:旧知识时效审计

应用「假设会过期」原则审计清单内 2023-2025 来源的每条 🌍 条目:
- 确认延续:错误回喂/ACI/KV-cache/风险分级/HITL/致命三要素/最简起步/记忆检索(均有 2026 证据);
- 加时效警告 3 处:多 agent 90.2%/15×(Opus-4 代数字,换代重测)、12-Factor #10「小而专注 3-10 步」(被 Opus 4.6 连贯 2h+ 削弱,且仓库 2025-09 停更一年)、反框架绝对主义(修正为「own 模型面契约,基础设施可用框架」);
- 确认无过期条目(初版未收录已被模型内化的 2023 规划技术);
- 固化维护规则:带数字或「即使模型变强也成立」断言的条目,新模型代必须重测。

## [2026-09-19] 清单 v2.1:2026 harness 工程浪潮复核增补

用户质询来源时效后定向复核,发现并补入 2026 上半年成型的 harness engineering 浪潮(初版调研正典止于 2026-03):
- Anthropic《Harness Design for Long-Running Application Development》:假设会过期(Bitter Lesson for harness)、三 agent GAN 架构(Planner/Generator/Evaluator)、context anxiety 与 reset-vs-compaction、成本参照(solo $9 vs harness $200);
- Anthropic《Scaling Managed Agents: Decoupling the brain from the hands》(2026-04):Session/Harness/Sandbox 三接口解耦、无状态 brain 的 wake 恢复、Session≠context window、token 结构性不可达、p50 TTFT -60%;
- OpenAI《Harness Engineering》(2026-09-11):AGENTS.md 当目录(~100 行)+docs/ 为 system of record、执行不变量而非实现、lint 报错即修复指令、熵管理(周期清理 agent)、无聊技术偏好;
- LangChain《Anatomy of an Agent Harness》五原语 + context rot + 共演化警告;
- 聚合仓库 ai-boost/awesome-harness-engineering 收入来源清单。
新增"2026-09 复核增补"小节(8 条 🌍),并修正多 agent 结论:2026 正解是角色分离的顺序协作(Anthropic 三 agent 模式),非并行对等协商。

## [2026-09-19] 清单 v2:业界交叉验证与大幅扩充

对 8 篇权威工程指南(Anthropic BEA/ACI/多agent帖、OpenAI practical guide、HumanLayer 12-Factor、Cognition 反多agent、Manus 上下文工程、Lilian Weng)、6 类课程/教学仓库(microsoft/ai-agents-for-beginners、HF Agents Course、OpenAI Agents SDK、LangGraph、mini-swe-agent、NirDiamant 等)、4 个安全框架(OWASP LLM/ASI Top 10、Willison lethal trifecta、微软 Secure agentic systems、Anthropic 注入防御)交叉验证后,扩充 agent-capability-checklist.md:
- 新增 **第 11 节 评估(Evals)**(pi 未内置,业界四方共识"第一天就建")与 **第 12 节 长期记忆**(pi 显式缺口,标注按需自建);
- 第 2/3/5/6/7/8/9 节各增 🌍 业界基准条目:选型谱系与 verify 阶段、ACI 设计哲学、KV-cache 第一指标/重述目标/反few-shot漂移、无状态 reducer 与 pause 语义、多 agent 适用边界(Cognition vs Anthropic 分歧及取态)、触发模型与 rainbow 部署、注入防御/致命三要素/工具风险分级/确定性 HITL/输出处理/记忆投毒/熔断;
- 新增"交叉验证"一节:pi 做对了的 4 点(外部反向确认)与业界补充清单、完整来源列表;
- 标记体系:不带标记=pi 源码基准,🌍=业界来源基准。
- 调研结论:现有 skill 生态无同类"以具体 agent 为基准的分级对标清单"(空白),12-Factor 最接近但无分级/无验收/无安全。

## [2026-09-19] 新增:Agent 开发完整能力清单(agent-capability-checklist.md)

新增 `references/agent-capability-checklist.md`:10 模块 × L1(及格)/L2(生产级)/L3(顶级=pi v0.85.1 实测基准)分级清单——Provider 适配、Agent Loop、工具系统、事件系统、上下文引擎、会话管理、Subagent 编排、集成面(RPC/SSE/SDK)、安全、可观测性。每项 L3 标准给出 pi 的具体做法与硬参数(已核对到源码),附事件流等价等 4 种验收方法与裁剪建议。用途:从零实现/复刻 agent 引擎(含 Rust/Go/Java 等其他语言)的功能对标与成熟度评估。SKILL.md 的 When to Use 与二开起步检查清单已加入口。

## [2026-09-19] 基线升级 v0.83.0 → v0.85.1 + 全面勘误

对齐官方 `@earendil-works/pi-coding-agent` **0.85.1**（npm latest，2026-09-05）。修订依据：pi-mono 官方源码 v0.83.0 / v0.85.1 两个 tag 逐条核对 + 0.84.0→0.85.1 CHANGELOG。

### 修复：照抄即报错（v0.83.0 下编译失败/行为相反）

- **`createAgentSession({ extensions: [...] })` 选项不存在**——该选项在 0.85.1 依然不存在（15 个合法字段：cwd/agentDir/modelRuntime/model/thinkingLevel/scopedModels/noTools/tools/excludeTools/customTools/resourceLoader/sessionManager/settingsManager/sessionStartEvent）。D06/E05/E06 共 4 处改写为 `DefaultResourceLoader({ extensionFactories })` + 手动 `reload()` 的正确写法。
- **C01**：`session.getResourceLoader()` → getter 属性 `session.resourceLoader`。
- **A06**：SDK 入口脚本 `import { Type } from "@sinclair/typebox"` → `typebox`（别名仅对 pi 加载的扩展文件生效）。
- **18-compaction**：`pi.command(...)` → `pi.registerCommand(name, { handler })`；`agentSession.on(...)` ×4 → `session.subscribe(...)`。
- **D05 陷阱 12 / E06 details 回退**：原文"handler 只 return content 会丢原始 usage/details"与源码**相反**（`emitToolResult` 逐字段合并进原事件副本 + agent-loop 层兜底），改写为正确的合并语义。
- **06-tools**：4 个批量工具工厂（createCodingToolDefinitions 等）实际未从包根导出（0.85.1 亦然），改为"内部实现参考"并给出根导出替代方案。
- **13-settings**：删除任何版本都不存在的 `getUiMode` / `setUiMode` / `UiMode`；导出符号计数 8 → 7。

### 修复：版本混血（原文档把 0.84+ 符号写进 0.83.0 基线）

升级到 0.85.1 基线后以下内容**由错变对**，保留原文并统一基线声明：
`modelRuntimeSignal`（03）、`CredentialSynchronizationError`（05）、`removeRuntimeApiKey/listCredentials` 的 options 参数（05）、`ModelRegistry.refresh(options)` / `.complete()`（05/21/E02/H06——0.85.1 起 ModelRegistry 已有 complete，`ctx.modelRegistry` 类型即 ModelRegistry）、`oauth.refreshToken(credentials, signal)`（07/16，0.84.0 起强制）、`thinkingFormat: "baseten"`（16，0.85.1 为 11 个枚举值）、`getFullscreenScrollbar`（13）。

### 修复：断链与旧名

- 新建 `references/skill-maintenance.md`（此前 SKILL.md 引用但不存在）。
- 新建本文件（此前 SKILL.md / I04 引用 `../../CHANGELOG.md` 但不存在）。
- 锚点：`#坑-46-个扩展独有事件…`（14 处）→ 04-events.md 实际标题锚点 `#坑-47-个扩展独有事件-subscribe-静默收不到--最大集成坑`。
- 断链：E06 `A06-xxx.md` → `A06-load-extensions.md`；D06 `A06-custom-tool.md` → `A04-tool-whitelist.md`；D06 `sdk_doc/06-agent-session.md` → `sdk_doc/01-create-agent-session.md`；E11 对不存在的 E03/E08 的引用删除；B01 孤立代码围栏删除。
- 旧包名 `@earendil-works/pi-agent`（npm 404）→ `@earendil-works/pi-agent-core`（5 处）。

### 修复：口径与事实

- 扩展独有事件计数 **6 → 7**（补 `thinking_level_select`）：SKILL.md 概览图与关键区分、D05/D06/E01/E02/E04/E06/E11/G01/G04 共 15 处同步。
- `AgentSessionEvent` 计数 **23 → 24 种 / 13 → 14 个 session 独有**（v0.85.0 新增 `bash_execution_update`）：02-agent-session、E11（原文 22 → 24）。
- 默认激活工具澄清：仅 `read/bash/edit/write` 四件套；`grep/find/ls`（及 Windows 下 v0.84.3 新增的 `powershell`）是内置但**非默认激活**（E01/E11）；06-tools 内置清单 7 → 8 个工具。
- `PI_AGENT_DIR` → `PI_CODING_AGENT_DIR`（D02）；`createAgentSession({ cwd })` "必填" → 可选（E01/E05）；E02 git 来源格式说明修正；E04 `systemPrompt` 选项虚构改为 `systemPromptOverride` 指引。

### 新增：0.84/0.85 内容

- 04-events：`ui_prompt_start` / `ui_prompt_end`（v0.84.4）、`session_compact_failed`（v0.84.3）事件行；session_* 计数 8 → 9。
- F01：v0.85.0 `inMemory()` 支持从外部管理的会话条目恢复。
- H01：清除针对 v0.80.x 的过时兼容警告（基线已 ≥0.83）。
- SKILL.md：补 RPC 模式与 provider 请求拦截的官方文档直达指引（本 skill 有意不覆盖的两个主题）。

### 版本号

全文安装命令 `@0.83.0` → `@0.85.1`（SKILL.md ×2、source-fallback、A01/A02/A03/A05/A06）；skills/README.md 与仓库主 README 的基线声明同步更新。

---

## [历史] v0.83.0 基线（2026-08）

初版对齐 v0.83.0 的内容骨架（18 个 sdk_doc + 42 个 scenarios + project-structure + source-fallback）。
