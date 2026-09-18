# Skill 维护手册

> 本文件定义 dg-piagent 的维护原则与升级流程。SKILL.md 的「版本协议」第 3 步（升级即更新 skill）以此为准执行。

## 六条维护原则

1. **单一事实源**：所有 API 声明以**基线版本的官方产物**为准——`node_modules/@earendil-works/*/dist/**/*.d.ts`（类型）、`docs/*.md`（行为）、`examples/`（用法）。skill 内容与源码冲突时，改 skill，不改事实。禁止凭记忆或 AI 生成的"合理推测"新增符号；每个新写入的 API 名/字段名必须先在 d.ts 里 grep 到。

2. **版本基线唯一**：SKILL.md 顶部只维护一个基线版本号，全文安装命令、行为描述统一对齐该版本。**禁止混入其他版本的符号**——记录新版差异时必须显式标注版本（如 `⭐ v0.84.4`），让读者能区分"当前可用"与"历史/未来"。

3. **照抄必须可编译**：场景文档中的代码块是给读者直接复制的。写入前自测：`npm install @earendil-works/pi-coding-agent@<基线>` 后 `tsc --noEmit --strict` 通过。任何"示意性伪代码"必须显式标注「不可直接运行」。

4. **行号引用带保质期**：引用源码行号时注明文件即可，行号仅作定位提示；升级基线后行号必然漂移，以符号名为准重新核对，不逐行追改。

5. **断链即缺陷**：新增/修改引用任何文件（场景互链、sdk_doc、锚点）时，检查目标存在且锚点与标题一致。改标题必须同步改所有入链锚点。

6. **变更留痕**：任何修改同步记录到 [CHANGELOG.md](../CHANGELOG.md)（永久保留，只增不删），写明：改了什么、依据（源码/CHANGELOG 证据）、影响哪些文件。

## 升级审查流程（升级到 X.Y.Z 时）

1. **取差集**：读官方 `CHANGELOG.md`（node_modules 内或 GitHub `packages/coding-agent/CHANGELOG.md`），摘出 基线版本 → X.Y.Z 之间所有 **Breaking Changes** 与 SDK 相关的 Added。
2. **对类型**：逐条在新版 `dist/index.d.ts`（含子入口）grep 验证：skill 里描述的符号是否仍存在、签名是否变化、是否有该新增而 skill 未收录的高价值 API。
3. **出清单**：产出三张表——①skill 声明已失效需改写 ②签名变化需更新 ③新版新增建议收录。**报用户确认**后再动笔。
4. **改与验**：按清单修改；每个被改的代码块用新基线重跑 strict 编译自测（原则 3）。
5. **收尾**：更新 SKILL.md 顶部基线版本号 + 安装命令（全文 `@旧版本` 一并替换），CHANGELOG.md 记录本次升级。

## 兜底回流

走 [source-fallback.md](source-fallback.md) 查 `node_modules` 解决的问题，若具备普遍性（任何 pi 二开项目都可能遇到），主动建议用户「值得补进 skill 吗」；用户同意后按上述原则写入对应 scenarios / sdk_doc，并在 CHANGELOG.md 记录来源（哪个项目、什么问题）。

## 已知历史教训（修订记录见 CHANGELOG.md）

- `createAgentSession` **没有** `extensions` / `systemPrompt` 选项——扩展注入走 `resourceLoader.extensionFactories`，提示词覆盖走 `systemPromptOverride`。曾有多处文档凭"对称直觉"虚构这两个选项。
- `session.resourceLoader` 是 getter 属性，不是 `getResourceLoader()` 方法。
- `emitToolResult` 的 handler 返回值是**逐字段合并**进原事件副本——只 return `content` 不会丢 `usage` / `details`。曾据此写出"必须手动回传 usage"的错误最佳实践。
- SDK 入口脚本的 typebox 导入用 `typebox`；`@sinclair/typebox` 别名仅对 pi 加载的扩展文件生效。
- 中间层包的 npm 名是 `@earendil-works/pi-agent-core`；`@earendil-works/pi-agent` 在 npm 上不存在（404）。
