# dg-piagent — pi-agent SDK 开发助手 Skill(v0.85.1 修正增强版)

> 一个教你(和你的 AI)用 **pi-agent**([earendil-works/pi](https://github.com/earendil-works/pi),原 badlogic/pi-mono)SDK 做二次开发、乃至从零复刻 pi 级 Agent 引擎的 Skill。
> API 已逐条对齐官方源码 **v0.85.1**(npm latest),附带纯 pi 基准的 **12 模块能力对标清单**。

本 Skill 是 [buchidonggua/dg-ai-notes](https://github.com/buchidonggua/dg-ai-notes)(B 站 UP 主[费曼学徒冬瓜](https://www.bilibili.com/video/BV1JB8o6BEit))中 dg-piagent skill 的**修正 + 增强分支**,遵循其 MIT 协议。修正内容见 [CHANGELOG.md](CHANGELOG.md)。

## 这是什么

装进你的 AI 编程助手(ZCode / Claude Code / Codex / pi 本身)后,它会获得一套关于 pi-agent SDK 的完整知识:

- **SDK 参考视角**(`references/sdk_doc/`,18 篇):createAgentSession / AgentSession / 事件系统 / 工具 / 扩展 API / 会话 / 压缩 / 自定义 Provider……每个 API 都核对到官方 v0.85.1 源码;
- **场景手册视角**(`references/scenarios/`,42 篇):"我想拦截工具调用 / 做自定义工具 / SSE 流式集成 / 企业内网模型接入评估 / 多 Agent 协作" → 直接查对应场景,代码可照抄;
- **能力对标清单**(`references/agent-capability-checklist.md`):纯 pi 基准的 12 模块 × L1/L2/L3 分级,想自己造一个 pi 级别的 Agent 引擎(含 Rust/Go/Java 复刻)时逐模块对标——压缩参数 16384/20000、工具截断 2000 字符、subagent 并发 8/4、两层事件派发、错误回喂、branch summary、SQLite 会话后端、pi evals 等硬指标全部来自源码核对。

## 安装

```bash
git clone https://github.com/MirJiang/dg-piagent.git
```

把 `dg-piagent` 文件夹放进你所用智能体的 skills 目录:

| 智能体 | 用户级目录 |
|---|---|
| ZCode | `~/.zcode/skills/dg-piagent/` |
| Claude Code | `~/.claude/skills/dg-piagent/` |
| Codex | `~/.codex/skills/dg-piagent/` |
| pi | `~/.pi/agent/skills/dg-piagent/` |

装好后直接说人话,例如:"帮我用 pi-agent SDK 写一个带危险 SQL 拦截的数据分析 Agent"、"评估一下这个企业内网模型接口能不能接 pi"。

**版本约定**:新项目请安装基线版本 `npm install @earendil-works/pi-coding-agent@0.85.1`(skill 的 API 描述精确核对到该版本,不要装 latest——详见 SKILL.md 的"版本协议")。

## 相比上游版本的修正(摘要,详见 CHANGELOG)

1. **基线 v0.83.0 → v0.85.1**:全文安装命令与 API 描述统一;上游混入的 0.84+ 符号在 0.85.1 下已合法;
2. **修复 12 处"照抄即错"**:不存在的 `createAgentSession({ extensions })` 选项 ×4、`getResourceLoader()`(实为属性)、`@sinclair/typebox` 导入、`pi.command`/`agentSession.on` 笔误、D05/E06 与源码相反的"usage 丢失"断言、虚构的 `getUiMode` 等;
3. **修复全部断链**(原 SKILL.md 引用的 skill-maintenance.md / CHANGELOG.md 不存在,已补建)、5 处 npm 404 的旧包名(`@earendil-works/pi-agent` → `pi-agent-core`);
4. **口径修正**:扩展独有事件 6→7(补 `thinking_level_select`)、事件计数 24 种、默认工具四件套澄清、内置工具 7→8(补 powershell)等;
5. **新增**:0.84/0.85 新事件(`ui_prompt_start/end`、`session_compact_failed`)、inMemory 外部恢复、**纯 pi 基准 12 模块能力对标清单**(含 pi 全功能面补遗:扩展与能力注入层、packages/evals、多模态、llama-cpp、context files、branch summary、SQLite 会话后端、export-html 等)。

全部修正均经官方源码 v0.83.0 / v0.85.1 双 tag 逐条核对,修正后的代码模式在真实安装的 0.85.1 上通过 TypeScript strict 编译验证(零错误)。

## 目录结构

```
dg-piagent/
├── SKILL.md                    # 主入口:心智模型 + 意图总表 + 版本协议 + 源码兜底
├── CHANGELOG.md                # 修订史(含对上游的全部修正明细)
└── references/
    ├── agent-capability-checklist.md  # 12 模块能力对标清单(纯 pi 基准)
    ├── sdk_doc/                # 18 篇 SDK 参考
    ├── scenarios/              # 42 篇场景手册(A01-I05)
    ├── project-structure.md    # 二开项目结构建议
    ├── skill-maintenance.md    # skill 维护原则与升级流程
    └── source-fallback.md      # 源码兜底协议(node_modules 4 层检索)
```

## 致谢与许可

- 原版 skill 作者:[费曼学徒冬瓜](https://github.com/buchidonggua)([dg-ai-notes](https://github.com/buchidonggua/dg-ai-notes)),配套讲解视频 [BV1JB8o6BEit](https://www.bilibili.com/video/BV1JB8o6BEit);
- pi-agent 作者:[earendil-works](https://github.com/earendil-works)/pi(原 badlogic/pi-mono);
- 本仓库遵循 MIT 协议(见 [LICENSE](LICENSE)),衍生自上游 MIT 项目并保留其版权声明。
