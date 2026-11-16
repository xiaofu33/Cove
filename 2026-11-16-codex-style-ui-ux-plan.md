# Vesta 对标 Codex 的 UI / UX 重设计与 Electron 客户端重构执行计划

> 日期：2026-11-16；修订版 v2。代码检查基线：`9b297a8`。
> 本版取代 AppKit + SwiftUI 迁移计划，采用 Electron + React + TypeScript，在现有 desktop 项目上重设计。
> 文档性质：可交给另一位 AI 独立执行的设计、开发和验收任务书。
> 当前状态：计划已编写，产品设计和客户端实现尚未执行。文中布局为建议执行基线，不代表用户已经看过并认可最终视觉稿。
> 仓库：`/Users/yumixiaofu/code/ai/vesta`。换机器时以实际仓库根目录代替；下文代码路径均相对此根目录。

## 0. 给执行 AI 的启动指令

你的任务是重新设计 Vesta 的 UI 与 UX，并在现有 Electron + React + TypeScript 客户端中实现。不能把任务缩减成更换主题色或模仿一张 Codex 截图，也不能只交付静态样机。最终需要接入真实 Python Host，覆盖现有用户能力，完成真实 Electron 应用的界面与行为验证。

执行顺序：

1. 完整阅读本文件；检查当前 Git 状态、适用的 AGENTS.md 和代码实际情况。
2. 阅读 `apple-design/SKILL.md`，按第 3 节加载对应参考。该 skill 必须贯穿设计、组件实现和最终审查，而非只在最后提一句“遵循 HIG”。
3. 将阶段 P0–P8 和验收编号建立为任务清单；记录在新的实施进度文件中，不把本轮“计划编写完成”当成“重构完成”。
4. 先核查能力和运行环境，再完成紧凑的设计方案，随后尽快打通一个真实工作流。不要先造完整组件库或花大量时间搭框架。
5. 用户后续若授权执行本计划，常规技术选择按本文默认值推进；不要每改一个控件都请求确认。需要改变目标、删除现有能力、扩大后端范围时说明具体影响。若执行环境另有强制设计审批规则，提供可评审结果后再按规则处理。
6. 每一阶段都提交真实交付物和证据；无法验证的事项明确标记“未验证”，不能用模拟数据截图替代真实联调。

### 0.1 已确定的目标与约束

- 重新设计信息架构、交互流程、视觉层级和 macOS 操作体验。
- 使用 **Electron 管桌面窗口和系统集成，React + TypeScript 管 UI 与交互，Vite 管现有构建流程**。不进行 SwiftUI/AppKit 客户端迁移。
- UI 使用 React + HTML/CSS；沿用 React Markdown/GFM/Shiki。现有 Swift Computer Helper 继续负责系统操作，不把业务界面移入 Helper。
- 保留 Python Host、业务数据、JSON-RPC 协议和 macOS Computer Helper，尽量不改变后端。
- AI 辅助快速迭代，以可运行结果推进；不按大型商业软件项目建立繁重流程。
- 避免不必要的副标题、解释文案、标签和装饰；优先使用分组、对齐、间距和层级表达关系。
- 在现有 `desktop/` 内渐进重构，保留基线 commit、截图及必要的短期布局开关；不永久维护两套客户端或复制整个后端。

### 0.2 默认决策，可在有证据时调整

- 产品方向：对标 Codex 工作流和界面品质、安静清晰的桌面 Agent 工作台，围绕“当前工作”组织信息。
- 首版只有一个主窗口、一个设置窗口和一个审批浮窗；不额外实现任意多聊天窗口。
- 工作目录：`desktop/src/` 与 `desktop/electron/`；复用现有 API、RPC、stores、测试和构建。按职责提取组件，避免为新架构大规模搬文件。
- 支持版本沿用当前 Electron 与 Helper 的实际交集，P0 核对并记录。不要为视觉重设计同时进行无必要的 Electron/React 大版本升级。
- 跟随系统浅色/深色外观，不新增独立主题选择器。
- 首版开发模式连接用户已启动的 Host。可重复构建 `.app` 属于交付；自包含 Python 打包、签名公证、自动更新属于后续发行范围。
- 界面中文优先，字符串集中管理；保留英文术语的诊断信息，但日常任务流程使用易懂名称。

## 1. 成功是什么，以及不做什么

### 1.1 主要体验目标

1. 启动后可直接开始或继续工作，不需要理解 Conversation / Task / Run 的内部关系。
2. 执行期间能清楚知道当前动作、是否等待用户、是否仍在运行以及怎样停止。
3. 详细工具轨迹和用量可以查看，但不占据默认阅读路径。
4. 审批内容明确、操作可靠；审批浮窗不会破坏 Computer Runtime 的目标应用焦点。
5. 完成后交付物和结果容易找到，继续讨论时保留上下文。
6. 界面符合 macOS 的窗口、菜单、键盘、文字编辑和外观习惯。
7. 所有现有能力有新入口或明确的临时迁移状态；完整替换时不得遗漏功能。

### 1.2 不在本次默认范围

- 重写 Agent Runtime、模型 Adapter、数据库、沙箱、MCP 协议或 Helper。
- 增加云同步、账号、团队协作、插件市场、iOS/Windows 客户端。
- 实现后端不存在的消息编辑重跑、任意记忆编辑、附件上传、自动化编辑、全量全文搜索等能力。
- 给工具执行添加绕过原有权限层的桌面快捷路径。
- 更换所有品牌资产、制作宣传网站、开发可复用到任意项目的设计系统。
- 把普通 UI 重构扩大成完整安装器、App Store 上架或生产更新系统。

发现功能缺口时，区分“现有能力必须迁移”与“新增建议”。新增建议进入 backlog，不伪造可点击入口，不以 UI 需求为由悄悄扩展后端。

## 2. 已核对的项目事实与阅读地图

本轮只做了代码检查，没有启动现有 UI；以下是功能和架构事实，不是对当前界面效果的完整视觉审计。执行者 P0 必须补看真实应用。

| 领域 | 关键路径 | 需要理解的内容 |
|---|---|---|
| 总体结构 | `README.md`、`desktop/package.json` | Electron + React + TS、Python Host、Swift Helper；启动和测试方式 |
| 导航 | `desktop/src/App.tsx`、`components/Sidebar.tsx` | Chat、Runs、Automations、Approvals、Artifacts、Computer、Memory、Settings 及 Run 详情 |
| 会话 | `pages/ChatPage.tsx`、`components/ConversationList.tsx`、`Composer.tsx`、`MessageList.tsx` | 选择会话、发送、模式、运行状态与历史恢复 |
| 正文 | `components/AssistantContent.tsx`、`AssistantReasoning.tsx` | Markdown/GFM、代码高亮、流式渲染、推理展示 |
| 执行过程 | `components/LiveAgentTurn.tsx`、`RunActivity.tsx`、`RunStatusBar.tsx`、`CurrentTaskPanel.tsx`、`PlanCard.tsx` | 状态优先级、计划、工具调用、执行控制 |
| 诊断 | `pages/RunDetailPage.tsx`、`components/TraceTimeline.tsx`、`UsageInspector.tsx`、`ContextInspector.tsx`、`agent/` | 用量、预算、上下文和轨迹的解释规则 |
| 审批 | `approval/`、`components/ApprovalFloatingWindow.tsx`、`ComputerApprovalPopup.tsx`、`electron/main.ts` | 队列、去重、后台浮窗、多屏、焦点 |
| 设置 | `components/ModelSettingsPanel.tsx`、`ExtensionsSettings.tsx`、`pages/SettingsPage.tsx` | 模型配置、测试、MCP、Skills 导入与启停 |
| 契约 | `src/api/`、`src/rpc/`，均位于 `desktop/` 下 | 方法名、DTO、错误、请求超时与事件 |
| 事件缓存 | `desktop/src/stores/events.ts` | 约 33ms 合并流式增量，按 Run/step 分组，结构事件去重 |
| 后端权威契约 | `backend/app/server/rpc/methods/`、`protocol.py`、`connection.py`、`hub.py` | 请求、结果、广播与生命周期；TS 类型不能替代后端真值 |
| HTTP 媒体 | `backend/app/server/app.py` | `/health`、Computer screenshot、Artifact content；业务不改成 REST CRUD |
| 原生 Helper | `native/macos-computer-helper/` | 现有权限和执行链路；不能因 UI 重设计就跳过 Host |

重要语义：

- `conversation.send` 可能持续很久，包括等待审批；当前客户端不设固定请求超时。
- 客户端断线不等于取消 Run。RPC 结果不确定时，先查权威状态，不自动重发 mutation。
- WebSocket 是实时提示通道，持久状态仍从后端查询。不能假定支持 replay、cursor 或 exactly-once。
- Memory 当前为只读观察入口。
- interrupt、cancel、recover 是不同操作；recover 会产生恢复 Run，不能当成原 Run 原地继续。
- 新客户端应通过 artifact ID 访问受控媒体，不用 UI 返回的任意路径读取文件。
- 现有桌面项目已有 Vitest、TypeScript 和 Vite 检查；优先复用。只有修改 Helper 才需要其 Swift 工具链检查。

### 2.1 Codex 技术栈核实、边界与选型结论

核实日期：2026-11-16。必须将已观察事实和本项目选择分开：

| 信息 | 证据 | 能得出的结论 |
|---|---|---|
| 本机桌面应用使用 Electron | `/Applications/ChatGPT.app/Contents/Resources/app.asar` 中 package.json 的 name 为 `openai-codex-electron`，version 为 `26.1106.51428` | 确认当前安装包采用 Electron 桌面壳；不据此排除局部原生模块，也不声称完整 UI 实现已公开 |
| 本机入口有 Vite 构建产物 | 同一 package.json 的 main 为 `.vite/build/early-bootstrap.js` | 能确认入口路径；不能据此推断全部内部构建配置 |
| Codex App 团队使用的前端方向 | [OpenAI 官方 Codex App 前端工程师说明](https://openai.com/careers/frontend-software-engineer-codex-app-san-francisco/) 明确列出 React、TypeScript，并提及 Electron 类桌面经验 | 为 React + TypeScript 桌面方向提供官方依据；招聘说明不是完整依赖清单 |
| 当前产品入口 | [官方桌面应用文档](https://learn.chatgpt.com/docs/app)；本机使用 ChatGPT.app 名称承载 Codex | 执行者识别当前 Codex 视图，不把普通 Chat 聊天页面当作参考 |

本次只读检查了应用包元数据，没有复制私有源代码或资产。尚未核实 Codex 的完整样式系统、组件库和状态管理库；不能宣称 Tailwind、Radix、shadcn/ui、某个编辑器或 React 具体版本就是其内部实现。

**确定采用的栈**：Electron + React + TypeScript；Vite 沿用本仓库。继续使用现有 React Query、Zustand、react-markdown、remark-gfm、Shiki 和 Lucide，这是 Vesta 的复用决策，不是对 Codex 私有依赖的断言。默认以 CSS custom properties + 现有样式组织构建自己的紧凑组件体系；没有必要不引入 Tailwind/大型 UI 库。

**对标不等于复制**：参考 Codex 的导航密度、会话阅读宽度、输入区、过程折叠、详情面板、状态反馈和键盘行为；保留 Vesta 的品牌、后端模型与已有能力。相同技术栈只是实现基础，验收仍需真实的界面和交互对照。

## 3. apple-design 使用协议：设计与代码都必须遵守

### 3.1 安装位置与可移植性

当前路径：`/Users/yumixiaofu/.agents/skills/apple-design/SKILL.md`。

来源：<https://github.com/dickwu/apple-design-skill>。换机器时先寻找全局或项目级 `apple-design/SKILL.md`；不存在则安装：

```bash
npx skills add dickwu/apple-design-skill --agent codex --global --yes
```

其他 AI 平台按其 agent 配置安装。记录实际 skill 路径、版本或内容哈希。安装命令不应改变项目业务依赖。

Skill 是设计依据，不是 API 文档。Electron 窗口行为、浏览器可访问性和 React 状态生命周期需要实际运行及对应官方 API 文档验证。参考文件若与当前平台不符，说明冲突；不因参考中提到某个新特性就强行采用。

### 3.2 每次设计/审查的必读集合

每轮使用约 8–12 个文件，不一次性加载整个参考目录。所有路径相对 skill 根目录。

固定读：

- `SKILL.md`
- `references/cross-platform.md`（Electron 必读，将原生术语翻译为 Web/Electron 实现）
- `references/hig/accessibility.md`
- `references/hig/layout.md`
- `references/hig/typography.md`
- `references/hig/color.md`
- `references/hig/designing-for-macos.md`

按阶段追加 3–6 个最相关文件；内容多时分轮审查：

| 本轮主题 | 追加参考 |
|---|---|
| 导航与工作区 | `sidebars.md`、`split-views.md`、`toolbars.md`、`windows.md` |
| 输入与聊天 | `text-views.md`、`entering-data.md`、`keyboards.md`、`focus-and-selection.md`、`generative-ai.md` |
| 执行与结果 | `generative-ai.md`、`progress-indicators.md`、`feedback.md`、`disclosure-controls.md` |
| 审批和面板 | `panels.md`、`alerts.md`、`modality.md`、`buttons.md`、`keyboards.md` |
| 设置和扩展 | `settings.md`、`text-fields.md`、`toggles.md`、`menus.md` |
| 外观与动效 | `dark-mode.md`、`materials.md`、`motion.md`、`sf-symbols.md`；使用玻璃再读 `liquid-glass.md` |
| 最终系统操作审查 | `the-menu-bar.md`、`keyboards.md`、`windows.md`、`focus-and-selection.md`、`voiceover.md` |

后续轮次中列出的文件是执行者必读路由，不表示本计划编写者已逐一全文审阅。

### 3.3 从规则到实现的可追踪要求

每个核心组件在 `design-spec.md` / `design-review.md` 中记录：

`组件 → 用户目的 → 实现选择 → HIG 文件与标题 → 验证方法 → 结果/例外`。

只引用实际读过的章节；短引文即可。把“HIG 规则”“skill 的工作室设计判断”“Vesta 产品选择”分开。不能把自己的尺寸和视觉喜好写成 Apple 的硬规定。

审查顺序沿用 skill：**可访问性 → 平台惯例 → 视觉与设计品质 → 交互 → 文案**。输出采用 Summary、Critical、Improvements、Craft notes、What works、Platform notes；没有内容的部分省略。

### 3.4 本项目落实的规则与验收

| 编号 | 依据与短引文 | Vesta 落地要求 |
|---|---|---|
| D01 | `layout.md › Visual hierarchy`：“Use progressive disclosure” | 默认显示当前工作、关键进展和结果；原始参数、Trace、Usage 按需展开，不堆成仪表盘 |
| D02 | 同章节：“Group related items” | 通过间距、对齐、缩进表达关系；不为每一行添加副标题或卡片边框 |
| D03 | `windows.md › Best practices`：“Avoid creating custom window UI.” | Electron 保留系统交通灯、缩放与全屏行为；自定义标题区正确划分 drag/no-drag，不手绘交通灯 |
| D04 | `sidebars.md › Best practices` 与 Desktop 小节 | 侧栏最多两层，可隐藏；关键审批和停止动作不只存在于侧栏底部 |
| D05 | `keyboards.md › Standard keyboard shortcuts` | 保留 Cmd+C/V/Z/W/Q、Cmd+, 等习惯；界面命令有菜单入口和有效的启用状态 |
| D06 | `color.md › System colors`：“Avoid hard-coding system color values” | 用 CSS 语义 tokens、prefers-color-scheme 与 Electron nativeTheme 同步外观；验证增加对比度，不能假设 CSS 自动继承所有系统辅助设置 |
| D07 | `accessibility.md › Vision` | 状态用文字/形状补充颜色；常规小字按 4.5:1 检查，较大文字依据参考标准；实际记录颜色、背景和比值 |
| D08 | `accessibility.md › Mobility` | macOS 常规点击区域以 28×28pt 为设计目标，紧凑自定义控件不低于 20×20pt；参考系统控件度量，检查实际 DOM 命中区；文中 pt 目标在默认缩放按逻辑尺寸落实并实测 |
| D09 | `typography.md › Ensuring legibility` | 默认系统字体与中文回退；常规 UI 13pt 起，正文建议 14–15pt；不以 10pt 下限作为默认，不使用细字重塞内容 |
| D10 | `accessibility.md › Vision`、`layout.md › Adaptability` | 支持正文放大至 200%，避免文字裁切和重叠；macOS 缩放实现需实际验证，不能假定用了系统字体就自动完成 |
| D11 | `generative-ai.md › Best practices`：“Keep people in control.” | 提供真实有效的停止/中断/恢复/审批操作；不自动同意权限，不虚构 Undo 能撤回已执行的系统操作 |
| D12 | `generative-ai.md › Outputs` | 状态来自真实事件，未知进度不造百分比；错误有具体下一步，重连与执行失败区分 |
| D13 | `panels.md › Best practices` | 面板简洁、用途明确、可移动；普通检查器随主界面工作。后台审批属于例外，见 3.5 |
| D14 | `SKILL.md › Lens 3 / Design improvement mode` | 一个产品特征即可：工作过程清晰收束为成果。保持其余区域安静，不用装饰性数字、霓虹强调或全屏玻璃制造“高级感” |

### 3.5 必须记录的有意例外

1. **后台审批浮窗**：`panels.md › Best practices` 通常建议应用失活时隐藏 panel；Vesta 的 Computer 操作需要用户在其他应用中批准，因此待处理审批可以跨应用显示。仅在有 pending 项时出现，不默认抢键盘焦点，不作为广告或普通状态通知使用。此项为明确产品需求，不声称完全遵循普通 panel 模式。
2. **底部输入框**：保留聊天输入位于内容底部的熟悉模式，但关键运行状态、审批入口和停止动作同时在顶部/菜单可达；不把重要信息塞入独占底部状态栏。
3. **语义颜色与精确色值**：skill 要求 token 提案提供可量化颜色；系统颜色则不能硬编码。设计文档记录指定系统/外观下的取样 hex 与对比度，Electron/Web 代码保留 CSS 语义变量和外观映射。记录项目色值与对比度，不能把 CSS 变量等同于自动动态的 AppKit NSColor；系统高对比度等设置需要显式验证。
4. **平台规则与框架区分**：HIG 在此约束 macOS 操作习惯和体验质量，不要求使用 AppKit/SwiftUI 控件。通过 Electron 系统集成、React 语义组件、ARIA、CSS 与真实输入行为落实。

## 4. 产品设计方向与信息架构

### 4.1 方案选择

| 方案 | 优点 | 问题 | 结论 |
|---|---|---|---|
| 原样迁移现有八入口 | 最容易对照功能 | 保留内部概念暴露，设计提升有限 | 不作为目标 |
| 工作区为中心，管理入口辅助 | 对话、执行与成果连续，适合长任务 | 需处理详情层级和事件归属 | 默认采用 |
| Task 看板为中心 | 多项目管理突出 | 当前请求未要求项目管理，容易新增业务模型 | 不做首版 |

设计主张：**让用户专注于正在完成的工作，并随时看清执行状态和产物。**

不是“所有东西塞进聊天流”。聊天保存交流，当前任务展示进度，检查器承载详情，交付物保持稳定可达位置。

### 4.1.1 Codex 参考采集与差异表（P0/P1 必做）

- 只读观察本机 Codex 视图或用户指定的 Codex 版本；不创建/删除用户聊天来凑样例，不暴露会话敏感内容。
- 至少记录：工作区整体、侧栏与会话选中态、空态输入区、长回复与代码块、执行中状态/折叠过程、详情面板、设置入口、紧凑窗口与浅深外观。无法看到的状态标明，不推断为已观察。
- 对每个样例记录版本、窗口逻辑尺寸、外观、截图来源、布局尺寸和交互观察。实际数值与设计判断区分。
- 产出 `codex-reference.md`：参考特征 → 用户收益 → Vesta 实现 → 刻意差异 → 验收证据。至少覆盖上述八类。
- 以 Codex 的克制层级、连续阅读和过程渐进披露为方向；不能强塞 Vesta 不具备的项目/worktree、多 agent、diff review、终端等功能。
- 不复用 Codex 私有 CSS、图标、字体包或品牌资产；自行实现同类体验。必要的界面截图仅作为本地设计参考，并脱敏。
- 若本机无法观察，用官方产品截图作为有限参考，记录限制；继续实现明确的工作流，不宣称像素级一致。

### 4.2 默认导航

- 工作区：近期会话、当前会话、当前任务与成果。
- 自动化：定时工作列表与详情。
- 记忆：Core / Active / Archived 的只读浏览。
- 交付物：跨会话结果集合，可回到来源会话。
- 活动：全局 Run 历史与待审批集合；保留全局可发现性，不只靠浮窗。
- 设置：通过应用菜单与 Cmd+, 打开独立窗口，含模型、扩展能力、Computer 权限/连接诊断等现有配置。

“Computer”不必占据常驻一级入口：运行中的观察信息可放当前工作详情，完整权限与状态在设置中可达。P0 核查现有 Computer 页面能力后映射，不能只迁移一个状态灯。

侧栏允许对近期会话做一层分组；不引入三层项目/文件夹结构。主导航与会话列表避免同一信息重复显示两次。搜索首版只承诺已加载会话标题过滤，明确不宣称全历史全文检索。

### 4.3 工作区线框（建议基线）

宽布局：

```text
┌ 系统窗口栏 / 工具栏：侧栏、当前标题、运行状态、停止、详情 ────────┐
│ 导航与会话      │ 对话 / 工作内容               │ 可选检查器     │
│ 新建会话        │ 用户目标                      │ 当前任务       │
│ 近期会话        │ 关键进展（展开工具详情）       │ 步骤/阻塞      │
│ ……              │ 助手正文                      │ 交付物         │
│                 │ 完成摘要与结果                │ 执行详情入口   │
│ 自动化/记忆等   │ 输入框 + 模式 + 发送          │                │
└───────────────────────────────────────────────────────────────┘
```

紧凑布局：

```text
┌ 侧栏开关 / 当前标题 / 状态 / 操作菜单 ┐
│ 当前任务摘要；有审批时明确提示        │
│ 对话 / 工作内容                      │
│ 检查器由工具栏打开为替换详情/弹出层   │
│ 输入框                               │
└──────────────────────────────────────┘
```

建议初始窗口约 1200×800pt，最小目标 800×600pt；侧栏约 220–280pt，检查器约 280–360pt。数值是产品起点，不是 HIG 规定。按内容可用宽度收起检查器、再收起侧栏；不通过压缩正文到无法阅读解决空间问题。测试至少 800×600、1024×768、1440×900 和全屏。

### 4.4 核心流程与状态

| 流程 | 默认体验 | 异常/边界 |
|---|---|---|
| 开始工作 | 简洁空状态、输入目标、选择普通/计划模式、发送 | Host 离线保留草稿；不显示虚假已提交消息 |
| 查看执行 | 即时显示已提交/等待模型，真实事件更新动作 | 没有进度数据用不定进度；长时间无事件不能自动判失败 |
| 查看计划 | 展示步骤、接受/拒绝，保留后端真实流程 | 过期计划、已处理计划禁用操作并刷新 |
| 中断/取消 | 解释操作区别，按后端允许状态启用 | 不把中断按钮标成瞬时暂停；请求完成前显示处理中 |
| 恢复 | 从可恢复记录发起，关联新旧 Run | 无 checkpoint 不显示可恢复承诺；失败保留原记录 |
| 审批 | 简述目标动作、范围、关键参数，批准/拒绝 | 过期、另一窗口已处理、断线提交结果未知，均查询再决定 |
| 完成与交付 | 展示真实完成状态、最终回复、文件/链接 | 完成但无 artifact 是合法结果；文件缺失给出原因 |
| 继续工作 | 新输入沿用会话，重新产生实际执行过程 | 同会话并发提交行为依据后端；不新增隐式排队语义 |
| 后台与重开 | 关闭主窗口后仍能接收审批，Dock 可重开 | 显式退出客户端不自动 cancel 后端任务；说明审批需重开处理 |

Run 的状态枚举以当前 DTO 为准；UI 可映射为“正在执行、等待确认、已中断、已完成、失败、已取消”等可读文案，不能自建与后端矛盾的状态机。“等待确认”可能是从审批派生的视图状态，需要明确来源。

## 5. 视觉、交互与文本渲染规范

### 5.1 小型设计 token，不造大框架

建立 CSS 语义 tokens（优先 `desktop/src/styles/tokens.css`）与 `design-spec.md`，包含：

- 颜色角色：window/content/grouped surface、primary/secondary text、separator、accent、success/warning/error。为浅深色与高对比度定义语义 CSS 变量，状态附带图形与文案。
- 排版：系统标题、UI 13pt、正文建议 15pt、说明 12pt、代码等宽 13pt 起；中文由系统回退。准确值在真实窗口里验证。
- 间距：4/8/12/16/24/32pt 少量级别。与系统控件默认度量冲突时优先系统，不强制套网格。
- 圆角和材质：参考 Codex 与 macOS 的容器层级；正文背景稳定，避免嵌套卡片和重阴影。只有功能性导航/工具层需要时使用 Electron 支持的系统材质；避免用大面积 backdrop-filter 模拟玻璃。
- 图标：沿用 Lucide 的一致图标体系，匹配文字字重；不要求 Web 强行加载 SF Symbols；图标按钮有 tooltip、可访问性标签和清晰的键盘焦点。
- 动效：只用于真实状态转换；Reduce Motion 下取消非必要位移，Reduce Transparency 下使用清晰实底。

不为“品牌差异”硬加入衬线标题、装饰性大数字、整屏彩色渐变或发光状态。Vesta 的特征来自执行过程到交付物的组织方式。

### 5.2 输入与命令

- 输入框优先基于现有 Composer 和原生 HTML textarea，验证 compositionstart/compositionend、isComposing 与中文组合输入、换行、粘贴、撤销、选区、光标和高度变化。
- 默认 Return 发送、Shift+Return 换行；IME 组合输入期间 Return 只确认候选，不能发出消息。菜单提供发送命令，Cmd+Return 可作为明确的替代发送方式。
- 空内容不发送；发送按钮按请求状态禁用重复提交；发送失败或结果未知时保留恢复途径。
- 每会话草稿在会话切换时保留；至少保证客户端本次运行内不丢草稿。持久化草稿另行说明存储位置，不直接写业务数据库。
- Cmd+N 新建会话，Cmd+, 设置，Cmd+W 关闭当前窗口，Cmd+Q 退出；编辑菜单使用 Electron 标准 role，DOM 编辑器保留默认剪贴板和撤销行为。
- Cmd+F 执行已实现的查找范围，界面说明范围；不创建不可用的搜索入口。
- Escape 优先处理 IME/弹出层/当前编辑；不能绑定成任意情况下取消后台任务。
- 停止、中断、恢复通过统一 command 路由，工具栏、菜单、上下文菜单共用权限和状态判断。

### 5.3 消息与 Markdown

最小完整支持：段落、标题、强调、链接、有序/无序列表、引用、分隔、代码块、行内代码、GFM 表格、任务列表和删除线。依据旧客户端实际渲染确认外链图片等能力，记录兼容策略。

实施原则：

1. 复用 react-markdown + remark-gfm + Shiki；主要重做排版、主题、代码容器和流式刷新策略，不重新造 Markdown parser。
2. 原始 Markdown 与渲染结构分开保存；复制代码必须得到原文，不含行号或 UI 标签。
3. 流式期间容忍未闭合代码块、链接和表格；不能逐 token 全量高亮整段历史。
4. 完成后只更新受影响消息；稳定 identity，避免选区和滚动位置重置。
5. 表格/代码块允许局部横向滚动，不使整个窗口横向溢出；提供整条消息和单代码块复制。
6. 默认可选择正文；跨消息连续选择是否支持在原型阶段明确，验证 DOM 跨消息选区；若引入虚拟列表，检查卸载节点是否破坏选择与复制。
7. 只在用户接近底部时自动跟随；用户上翻后显示“回到最新”，新 token 不抢滚动。
8. URL 只走允许的浏览器打开路径；不执行内容中的命令或 HTML；远程图片的加载与缓存策略明确，截图不做无界磁盘缓存。
9. React effect 必须对称清理订阅与计时器，兼容 StrictMode；高亮结果仅来自受控的 Shiki 输出，用户 Markdown 原始 HTML 不直接注入 DOM。

P2 必须先验证大代码块、表格、选区和中文输入。优先修正 React 更新范围、稳定 key、滚动锚定和异步高亮；只有实测需要才引入列表虚拟化/Web Worker，且验证选择复制。不要把性能问题直接变成框架迁移。

## 6. 工程架构与边界

### 6.1 依赖方向与复用边界

```text
Electron main：窗口 / 菜单 / 通知 / 系统操作
               ↕ 最小、类型化、参数验证的 preload IPC
React renderer：页面 / 组件 / CSS tokens
               ↓ Commands / hooks
React Query（后端快照） + Zustand（实时/界面状态）
               ↓ 现有 API wrappers / RpcClient
Python Host：JSON-RPC + 受控媒体 HTTP → 现有 Helper
```

默认沿用现有 renderer RPC 接入方式，不为了 UI 重设计把业务连接整体迁到 main。主窗口和审批窗口各自的 renderer 若保留独立连接，必须跨窗口协调已处理状态；不能声称不同 renderer 的 JS 单例天然共享。

建议目录（保留现有文件位置，只在必要时抽取）：

```text
desktop/
  electron/main.ts              # 保留窗口/通知行为，补菜单和统一 command 路由
  electron/preload.ts           # 窄接口，不暴露通用 ipcRenderer 或任意 Node 能力
  src/App.tsx                  # 新布局与导航
  src/components/              # 优先重构既有组件
  src/pages/                   # 保留管理功能，逐步统一布局
  src/styles/tokens.css        # 语义变量、浅深外观
  src/index.css                # 入口样式；按组件拆分避免叠加旧覆盖规则
  src/api/                     # 尽量复用
  src/rpc/                     # 尽量复用
  src/stores/                  # 保留事件流语义，细化 selectors
  src/approval/                # 复用队列、同步与状态判断
  src/notifications/           # 复用通知去重与路由
  tests/e2e/                   # 按实际测试工具补充
  scripts/                     # 需要时增加打包/检查脚本
```

不要新建 Swift 客户端，不引入 Next.js 服务端或第二套 API。不默认新增 Tailwind/shadcn；需要可访问性 primitive 时说明现有组件的具体缺口和依赖成本，再局部采用。版本遵循 lockfile，架构不以“追上 Codex 的版本号”为目标。

### 6.2 所有权、状态与安全边界

- Electron main 唯一拥有 BrowserWindow、菜单、通知和窗口生命周期；React 不自行模拟系统窗口。
- preload 提供最小、类型化能力；main 验证 IPC sender 和参数，外链协议、文件/媒体 ID 都受限。保留 contextIsolation 与 nodeIntegration:false，不为 UI 方便关闭边界。
- 现有 sandbox:false 等设置先记录原因和风险；如能验证兼容再单独调整，不盲目切换造成权限/构建回归。
- React Query 拥有服务端查询快照；Zustand 管实时聚合和必要 UI 状态。避免两个 store 各自成为同一字段的权威来源。
- 复用现有 RpcClient，不复制第二套消息发送、恢复与重连逻辑。按 run/message 订阅细粒度 selectors，避免每 token 重渲染整个工作区。
- 窗口隐藏不等于卸载应用订阅；保留 backgroundThrottling 等既有后台行为并实测。
- 主窗口和审批窗口的连接/状态按真实进程边界设计。优先沿用后端广播、提交前后权威查询和应用级 IPC 协调；不要为了“单连接”先大改后端。
- 工具栏、菜单、快捷键调用统一 commands，不复制业务判断。IPC command 路由只转发允许动作。
- 组件 effect 必须解绑；稳定 key；区分用户主动滚动与程序滚动；防止 StrictMode 下重复发送。
- secrets 由 Host 既有契约管理，日志/截图脱敏，不新增 localStorage API key 存储。
- Markdown 渲染保留转义原始 HTML 策略，链接走现有受限外部打开接口；不加载任意远程页面为主窗口内容。

### 6.3 RPC 和事件的不可破坏约束

复用并核查现有 request ID 关联、发送顺序、接收循环、超时策略、断线 pending 清理、重连退避和未知事件容错；只有存在实际缺口才修改，不重复实现已稳定的协议层。

- 等待一个长请求不能阻塞接收通知和发出取消/审批请求。
- 普通查询设置合理超时；长执行请求按实际语义处理，不能统一 30 秒超时。
- mutation 不自动重试；按用户点击禁重入，不宣称服务端 exactly-once。
- mutation 发出后断线且未收到结果：显示“结果待确认”，重连查询；避免把已执行的发送/批准再次执行。
- 先建立监听，再发查询/命令；重连使用 connection generation 防止旧 socket 回调污染新状态。
- 以 run_id、step、event_id 等真实字段聚合。事件无稳定 ID 时不能虚构去重依据；从完整消息/Trace 重建，清晰定义实时缓存与快照切换边界。
- 流式增量先缓冲，建议 33–50ms 合并一次；终态/结构事件到来前 flush，避免漏掉末尾字符。
- 查询快照和实时事件交错时不简单重复 append；建立 fixtures 验证不会正文重复或终态倒退。
- 重连后刷新当前会话、关联 Runs、待审批和必要 Task；不要把旧 running 缓存永久当真。
- 事件/截图/高亮缓存有上限；关闭会话释放观察者，不无限增长。
- 业务只走已有 JSON-RPC；HTTP 只承担现有 health/媒体。保留 loopback 限制，不为方便新客户端放宽网络边界。

### 6.4 审批浮窗

- 复用 `electron/main.ts` 中审批 BrowserWindow 的 focusable:false、showInactive、alwaysOnTop、acceptFirstMouse、全屏/Space 行为；根据实际 Electron 版本文档验证，不盲目照抄 NSPanel API。
- 主窗口关闭后，应用级审批订阅仍存活；窗口内容继续使用 React。
- 简单批准/拒绝按钮不应激活主窗口；复杂输入或键盘审批切换到主窗口可访问的审批详情，不为无焦点目标牺牲键盘用户。
- 同一审批 ID 在主界面和浮窗同步权威状态；跨 renderer 通过 main IPC 协调 in-flight 请求，不能只用各自的本地 boolean；只允许一次 in-flight 操作，过期/已处理立即同步。
- 使用当前鼠标所在屏幕的可见区域定位，考虑 Dock/菜单栏、缩放、屏幕断开和全屏 Space。
- 不主动激活主窗口；点击批准后验证原目标应用仍接收 Helper 操作。
- 不在 UI 中抢先恢复目标应用或直接调用 Helper，保留 Host/Helper 的既有执行责任。
- 初期调试不能同时开启多个 Electron 实例的审批浮窗，以免误判焦点或重复操作。

## 7. 功能迁移矩阵

P0 把下表扩成实际 RPC 字段/页面动作清单，之后逐项写入状态与证据。

| 既有能力 | 新入口 | 必须保留的行为 | 阶段 |
|---|---|---|---|
| 会话 | 工作区侧栏 | 列表、新建、选择、重命名、删除、历史；草稿与错误处理 | P3 |
| 普通/计划执行 | 输入框与任务区 | normal/plan、发送、计划接受/拒绝 | P3/P4 |
| 消息 | 工作区正文 | 流式、Markdown、Reasoning 折叠、复制、历史一致 | P3 |
| Run 控制 | 顶部状态/活动详情 | cancel、interrupt、recover 语义区别，状态约束 | P4 |
| 运行细节 | 检查器/活动详情 | Trace、工具、Usage、缓存/预算/上下文/Post-Run 信息 | P4/P6 |
| 审批 | 当前工作、活动待办、独立浮窗 | 队列、批准/拒绝、已处理同步、无焦点行为 | P5 |
| Artifacts | 当前成果与全局交付物 | 文件/URL、下载/打开、来源关联、缺失错误 | P4/P6 |
| 自动化 | 自动化列表与表单 | once/interval/cron、创建、暂停/恢复/取消、时区与状态 | P6 |
| Memory | 记忆浏览 | Core、Active、Archived、正文/修订等现有信息，只读 | P6 |
| 模型设置 | 独立设置窗口 | 现有 provider/model/参数、保存、连接测试、秘密脱敏 | P3/P6 |
| MCP/Skills | 设置→扩展 | 导入预览/应用、安装、启停、删除；保留危险模式说明 | P6 |
| Computer | 运行检查器/设置 | 状态、权限请求、观察/截图、现有诊断字段 | P5/P6 |
| 系统能力 | 菜单/通知/设置 | Host 状态、已有 restart 能力、通知、外链、窗口恢复 | P2/P7 |

注意：自动化以当前 API 的 create/pause/resume/cancel 为准，不凭表单假定存在 edit；Memory 不添加删除/编辑；技能候选不自动晋升。UI 的“重试”必须指向实际支持的动作，不能把“重新发送目标”和“从 checkpoint 恢复”混为一谈。

## 8. 分阶段执行任务

每阶段结束更新 `docs/plans/codex-ui-execution-progress.md`：完成项、变更文件、测试命令与结果、截图路径、问题和下一步。依赖顺序为 P0 → P1 → P2 → P3 → P4/P5 → P6 → P7 → P8；P4/P5 可按风险先后切换，不要求并行 agent。

### P0：核对现场与建立基线

**输入**：本计划、README、适用 AGENTS、Git 状态、第 2 节代码。

任务：

- 记录当前 commit 和已有修改，不覆盖用户工作。需要分支时使用 `codex/codex-style-ui` 或按当前授权命名。
- 核对 Node/npm、Electron/React/TypeScript 及 lockfile，运行现有 test/typecheck/build 建立基线；Swift 工具链只在修改 Helper 时检查。
- 启动现有客户端，走一遍会话→执行→审批→结果→详情→设置，保存关键状态截图。无模型凭证时分别记录可验证 UI 与未验证真实执行。
- 从后端方法和 TS wrappers 建立 `capability-matrix.md`，列出准确方法名、参数、返回值、事件和错误。
- 核实 Host endpoint、配置加载、workspace 路径、运行日志和 Helper 启动关系；不猜端口。
- 记录支持系统版本、现有 Markdown/状态管理复用清单和不能改变的业务行为；完成 4.1.1 的 Codex 参考采集。

**交付物**：baseline 截图、`codex-reference.md`、能力矩阵、`architecture-decisions.md`、实施进度文件。

**通过条件**：所有现有主功能有去向；构建和测试路径可行；没有把代码推断写成观察到的 UX 问题。

### P1：完成可实施的设计方案

**输入**：P0、apple-design 基础与导航参考、第 4–5 节。

任务：

- 用最多三个最重要的现有流程问题说明重设计重点；每个问题给截图/行为依据。
- 结合 codex-reference 差异表落实信息架构、宽/窄线框、tokens、空态/运行/审批/失败/完成状态；分别标注保留、重设计和不适用的 Codex 特征。
- 画出一条完整工作流，至少覆盖会话切换、任务执行、审批、产物打开和恢复。
- 为工作区、审批、设置给出足以开发的布局与状态说明；其他页面复用同一规范。
- 先使用 skill 自审：无障碍、平台、视觉、交互、文案；至少指出一个可以删除的冗余元素，若已足够简洁则说明。
- 将设计关键选择标为产品判断，不把设计规范写成只能照搬的像素稿。

**交付物**：`docs/design/codex-style-desktop/design-spec.md`、线框/预览、初始 `design-review.md`。

**通过条件**：布局可在 800×600 工作；关键状态明确；不只是旧页面换皮；实现者无需再猜主要入口和动作位置。

### P2：现有客户端重构骨架与高风险验证

**输入**：P1、现有 App/Composer/AssistantContent、RPC、Electron main/preload。

任务：

- 在 desktop 内建立新布局和 CSS tokens，先复用现有 API/store；保存可回退 commit，必要时短期 layout flag。
- 重做侧栏、工具栏、正文容器和可选检查器，接入真实会话数据。不要用完整 fake app 掩盖原有状态链路。
- 补齐菜单/快捷键 command 路由与主题同步，保留真实系统窗口控制。
- 验证 Composer 的中文输入与撤销、Markdown 表格/代码/选区、列表滚动与主题切换。
- 验证既有审批浮窗与新 UI 的状态通信、焦点和后台行为；实验 fixture 明确标记。
- 跑 test/typecheck/build；检查 drag 区域、DOM focus、IPC 边界与 effect 清理。

**交付物**：可运行的新工作区骨架、复用/修改清单、技术验证记录。

**通过条件**：真实连接和现有主链路不回归；布局可调整；没有另写 Swift UI，没有重建第二套 RPC。

### P3：可用聊天与基础配置

**输入**：conversation/model_settings API、events store、ChatPage。

任务：

- 复用 DTO、RPC 请求关联和事件 store；只修复已验证问题，细化会话/消息状态隔离。
- 会话列表、新建、重命名、删除、历史加载、草稿、普通/计划模式选择。
- 输入、发送、流式正文与 reasoning 折叠、现有 Markdown/GFM 能力及新排版、代码复制、滚动锚定。
- 发送按钮禁重入，区分网络断线与执行失败，支持长请求期间继续接收事件。
- 模型配置读取/保存/测试，使新客户端可以独立完成最基础使用配置。
- 真实完成一次会话，关闭窗口后重开并核对历史与状态。

**交付物**：真实可用的新聊天体验、相关协议/状态测试、浅深色核心截图与 Codex 对照记录。

**通过条件**：AC01–AC06 达成；不能通过硬编码完成文本或模拟 token 冒充真实联调；复用旧代码的稳定逻辑是明确要求。

### P4：任务、执行过程与成果

**输入**：Task、Run、Trace、Artifact API 与旧展示分析函数。

任务：

- 当前任务摘要、步骤、接受/拒绝计划；无 Task 的普通聊天也正常。
- 当前动作摘要与展开的工具详情，分离模型正文、过程信息和最终结果。
- 实现 cancel / interrupt / recover，正确展示新旧 Run 关系与允许操作。
- 当前会话成果、打开文件/URL、返回来源；缺失文件/无产物状态。
- 运行结束后以权威持久记录协调临时 delta，避免双份最终回复。
- 活动历史、Run 详情、基础 Trace/Usage；复杂诊断字段在 P6 补齐。

**交付物**：完整“目标→执行→结果→继续”工作流、状态和来源导航证据。

**通过条件**：真实任务可跟踪和控制，用户无需打开原始 Trace 才知道任务发生了什么。

### P5：审批与 Computer 链路

**输入**：approval 代码、Computer 页面/观察组件、Electron main、Host 方法。

任务：

- 复用 approval 模块的队列和状态判断，完善跨 renderer 同步与 main 层 in-flight 协调。
- 实现当前工作审批卡、全局待审批列表与独立 Electron 审批窗口。
- 支持已处理、拒绝、失效、断线待确认；返回权威状态后更新所有视图。
- 接入 Computer 状态、权限入口与截图/观察，不直接调用 Helper 绕过 Host。
- 测试其他应用前台、主窗口关闭、多屏、全屏、Space 切换与屏幕断开。
- 提供键盘用户可达的主窗口审批路径，浮窗不抢焦点不意味着审批不可访问。

**交付物**：真实审批闭环、焦点验证录屏/日志、Computer 集成记录。

**通过条件**：AC08–AC10；模型/工具动作只能在原权限链路批准后继续，不存在双重执行。

### P6：管理功能与功能对齐

**输入**：迁移矩阵、各管理页面和 API wrappers。

任务：

- 自动化列表、创建、暂停、恢复、取消；展示 schedule、时区、下次运行与后端真实状态。
- Memory 只读浏览、详情、Core/Active/Archived 分层。
- 全局交付物及来源跳转；活动筛选与完整运行诊断。
- Settings 完成模型高级项、扩展预览/安装/启停/删除、MCP 风险选项与系统能力。
- 为列表、表单统一 loading/empty/error/permission/保存中/保存失败状态。
- 对照 capability-matrix 逐项打勾；未迁移项不能以“后面再说”计入完成。

**交付物**：全部现有能力对应的新界面入口、更新后的能力矩阵、管理界面截图。

**通过条件**：用户无需为了既有功能切回旧布局；没有凭空增加无后端支持的操作。

### P7：系统体验、性能与可访问性

**输入**：完整客户端、apple-design 对应主题参考。

任务：

- 补齐菜单、快捷键、启用状态、窗口重开、通知点击定位、设置窗口行为。
- 保存窗口 frame、侧栏宽度、检查器可见性和选中会话等 UI 偏好；无效历史 ID 安全回退。
- 手工验证 VoiceOver 标签/顺序、全键盘、可见焦点、中文输入、放大文字。
- 浅深色、增加对比度、减少透明度、减少动态效果；测量实际颜色，而非凭截图肉眼判合格。
- 用 fixtures 压测长会话、长代码、多 Run 和高速 delta；通过 React Profiler/Chromium Performance 记录更新范围、长任务、内存与滚动，不凭框架名称推断性能。
- 运行 app 在后台/隐藏时不停止必要连接，也不高频刷新不可见视图。
- 按 codex-reference 在相同尺寸/外观下对照新版，完成 AC18，记录布局和交互的刻意差异。
- 生成按严重性排序的 skill 审查报告，修复所有 Critical 和影响核心流程的 High。

**交付物**：测试报告、性能记录、设计审查和修复后截图。

**通过条件**：AC11–AC16 与 AC18；若有剩余 High，明确范围和原因，不宣称完全达标。

### P8：交付、切换与回退

**输入**：已通过验收的代码与文档。

任务：

- 从干净构建目录执行完整 build/check，产出 `.app` 并实际启动。
- README 写明系统版本、工具链、Host 启动、客户端启动、权限设置、测试与常见问题。
- 默认切换到新布局，移除已失去作用的旧 CSS/组件与临时 flag；回退使用记录的基线 commit，不长期复制两套产品。
- 不改写/搬迁现有业务数据库，不删除历史会话或 Helper 权限数据。
- 交付最终截图、验收矩阵、已知限制、未验证项和后续发行 backlog。
- 用户未要求发布、推送或删除仍在使用的旧功能时，不自动做这些操作。

**交付物**：重设计后的 Electron App、源码、运行文档、Codex 对照与验收证据包。

**通过条件**：另一位开发者按文档能构建、连接 Host、完成核心流程；剩余范围如签名公证明确列为未包含。

## 9. 测试策略与验收矩阵

### 9.1 自动化覆盖重点

不要为每个间距写测试，也不要把实现细节复制一遍当测试。优先覆盖高风险行为：

- RPC：长请求并存、错误响应、断线、旧 socket 回调、未知事件、取消等待、mutation 不重发。
- Reducer：重复结构事件、交错快照、末尾 delta flush、会话切换、恢复 Run 归属、终态不倒退。
- 审批：双击、两个 UI 入口同时点击、已过期、结果丢失后重连、队列推进。
- Markdown：未闭合 fence、Unicode/中文/emoji、超长代码行、表格、复制原文。
- Services：DTO 解码、nullable/未知枚举、日期和时区、媒体 ID 构造、秘密脱敏。
- UI：关键导航、输入/发送、全键盘与窗口行为；优先 Vitest + 现有测试，按需补 Playwright Electron 集成测试；浏览器测试不能替代真实 Electron 的菜单、IPC、窗口和焦点验证。

Fixture 必须脱敏、可复现，模拟通道通过依赖注入隔离，生产启动不得默认展示假数据。

### 9.2 验收用例

| ID | 场景与步骤 | 通过条件 |
|---|---|---|
| AC01 | 冷启动、Host 未启动，再启动 Host | 无白屏/崩溃，连接提示与恢复正确，草稿保留 |
| AC02 | 新建→发送→收到流式→完成→重开会话 | 一份用户消息、一份最终正文；历史一致，无重复追加 |
| AC03 | 中文输入法候选阶段按 Return，撤销、粘贴、多行 | 不误发送，选区/光标/撤销遵循编辑习惯 |
| AC04 | 运行时切换其他会话再返回 | 文本归属正确，后台任务继续，不串流 |
| AC05 | 流式期间上翻、选字、窗口缩放 | 不抢滚动、不清空选区、不横向溢出 |
| AC06 | 发送结果返回前断网/断开 socket，再重连 | 不自动再次发送；查询可恢复真实执行结果 |
| AC07 | 计划接受/拒绝、中断、取消、恢复 | 每项对应真实后端语义；恢复新 Run 有来源 |
| AC08 | pending 审批分别从主界面和浮窗操作 | 一次提交、状态同步，过期/失败可理解 |
| AC09 | 其他应用前台批准 Computer 操作 | 不激活主窗口，目标应用继续收到预期操作 |
| AC10 | 关闭主窗口→产生审批→处理→Dock 重开 | 连接存活、无多余窗口、已处理状态不复活 |
| AC11 | 全键盘完成新会话、输入、设置和审批 | 焦点可见、Tab 顺序合理、标准快捷键有效 |
| AC12 | 浅深色/高对比度/减少动态和透明度 | 内容可读、状态非仅颜色、动效与材质有降级 |
| AC13 | 800×600 至全屏，正文放大 200% | 关键动作可达，无重叠；侧栏/检查器合理折叠 |
| AC14 | 至少 500 条混合消息、约 50KB 代码块、50 个 delta/秒 fixture | 输入/滚动可用，无逐 token 全量重排、无持续内存泄漏 |
| AC15 | Memory/Automation/MCP/Skills/Computer/Usage 逐项操作 | 与能力矩阵对齐，不需要旧客户端兜底 |
| AC16 | Host 重启、权限拒绝、artifact 缺失、审批已处理、配置保存失败 | 具体错误、可操作下一步，无假成功/无限 spinner |
| AC17 | clean build 后启动 `.app` | 按 README 可运行；资源/配置路径不依赖开发者绝对路径 |
| AC18 | 将 Codex 参考和新版放在相同窗口尺寸/外观下对照 | 侧栏、正文宽度、输入区、过程折叠、详情层级和状态反馈逐项有证据；说明刻意差异，不只写“风格类似” |

性能初始目标（工程目标，不是 Apple 要求）：本机 production 构建中，点击/输入到视觉反馈 P95 尽量低于 100ms；热缓存会话切换低于 300ms。记录硬件、OS、构建模式和样本数，外部模型耗时单独记录。未达标先定位刷新范围/布局/高亮；不得删功能或编造结果。AC14 的数据量是最低压力样本，不是“支持无限历史”的宣称。

### 9.3 运行检查

现有项目已具备以下命令：

```bash
cd desktop
npm ci
npm test
npm run typecheck
npm run build
npm run electron:dev
```

`npm run build` 目前只构建 Vite 与 Electron JS，不能称为已生成可分发 `.app`。P8 选择轻量 Electron 打包方式、增加明确的 package 脚本并验证资源路径；签名、公证、自包含 Host 仍不在默认范围。仅启动 Web renderer 不能验证桌面特性。

按阶段运行受影响测试，最终运行完整 desktop 检查。变更 RPC 或 Host 时运行对应 `backend/tests/offline/` 测试；修改 Helper 才运行其现有 Swift 构建/协议检查。最终报告逐条区分已运行、未运行与原因。

## 10. 交付目录与证据要求

```text
docs/design/codex-style-desktop/
  design-spec.md
  design-review.md
  architecture-decisions.md
  codex-reference.md             # 参考版本、截图、观察与 Vesta 刻意差异
  capability-matrix.md
  acceptance-report.md
  screenshots/                 # 基线与新界面；注明真实/fixture、外观、窗口尺寸
docs/plans/codex-ui-execution-progress.md
desktop/                      # 重构后的既有 Electron 客户端、构建与测试
README.md                     # 新入口和回退说明
```

每张截图必须标注 OS、窗口尺寸、浅深色、测试数据来源和对应场景。设计审查只能从实际可见内容推断视觉问题；对比度、焦点、性能必须有测量或操作证据。

`acceptance-report.md` 至少包含：

- 当前 commit、环境与依赖版本。
- AC01–AC18 的 Pass / Fail / Not verified，链接到证据。
- 功能矩阵完成情况。
- apple-design 审查结果：引用文件/标题、具体问题、修复、产品例外。
- 构建与测试命令、结果及失败原因。
- 未包含的发行工作与现存限制。

完成定义：P0–P8 交付物存在、Codex 参考对照有证据、核心真实链路通过、能力对齐、无 Critical、关键 High 已修复、构建可复现。若真实模型或权限验证受环境阻塞，交付可运行部分并列出明确待验证步骤，不能把整个项目标记为完全完成。

## 11. 范围与进度控制

以下只是集中 AI 辅助开发的工作假设，不是承诺，也不是跳过验证的理由：

- 核心技术样机：约 1–3 天，重点是 Codex 参考、新布局和现有主链路不回归。
- 核心日用版：累计约 5–10 天，覆盖主要聊天、执行、审批、基础设置。
- 完整替换：累计约 2–4 周，补齐管理功能并通过本计划验收。

P2 结束后根据真实难点重估一次；不因为上面的目标自动宣布成功，也不先花一周写设计文档。

发现进度受阻时按顺序处理：

1. 减少装饰与非必要动效。
2. 用成熟 HTML 控件与可访问性组件模式替代昂贵的自定义控件。
3. 简化默认信息展示，但保留详情和既有能力。
4. 优先局部优化 DOM/React/CSS 和 Electron 集成，不为单个难点引入 Swift 客户端。
5. 将新增功能放入 backlog；现有功能如果暂缓，必须保留在迁移矩阵中并标明完整替换尚未完成。

禁止的“捷径”：只改配色就宣称达到 Codex 效果、假数据冒充联调、删掉审批/恢复等难点、为 UI 改写运行语义、用超长文件和重复状态换取短期速度。

## 12. 后续 AI 的交接模板

每次暂停或交接填写：

```text
当前阶段与任务：
当前分支/commit/未提交变更：
已阅读的 skill 与参考章节：
已实现功能：
已验证场景与证据：
尚未验证/已知失败：
关键设计决策及例外：
下一个具体动作（文件/命令/验收编号）：
禁止覆盖的用户修改：
```

执行 AI 的最终回复应交代：做了什么、如何启动、哪些功能已验证、哪些仍有缺口，并链接最终报告和真实截图。不要只列修改了多少 React 文件，也不要把“符合 HIG”或“和 Codex 一样”当成无需证据的结论。

## 13. 计划自审记录

- 此计划针对 Vesta 的长请求、持续 Run、异步审批、Computer 焦点、只读 Memory、Trace/Usage 和既有扩展边界制定，不是通用聊天客户端模板。
- 没有将原有八入口原样视为新设计；功能保持，组织方式重做。
- 架构按用户最新要求修订为 Codex 同类 Electron + React + TypeScript 方向；现有 Vite/状态/渲染库是 Vesta 复用选择，不冒充 Codex 全量依赖。
- 用户目标与本文建议基线已区分；未宣称最终视觉稿获批。
- 技能规则已通过 cross-platform 映射转成 Electron/React 的实现约束、审查流程和验收；未把产品例外隐瞒成符合标准。
- 快速核心版与完整替换有不同验收，不用前者替代后者。
- 文档本身没有实施产品变更；执行者应从 P0 开始。

## 14. v2 修订摘要

- 用户最新选择取代 AppKit + SwiftUI 路线；不再新建 native/macos-app。
- 从“迁移客户端技术栈”改为“复用现有 Electron/React 技术栈、对标 Codex 重设计”。
- 将 Swift DTO/actor、NSHostingController、NSTextView、NSPanel、XCTest/SPM 等任务替换为现有 RPC/store 复用、React 状态隔离、textarea/Markdown、Electron 窗口与 Vitest/E2E。
- 保留原有详细功能、长请求、断线恢复、审批、验收与交接要求；增加 Codex 技术栈证据、参考采集、差异表与 AC18。
- 保留 apple-design，新增 cross-platform 必读与 CSS/ARIA/系统菜单映射，不再将 HIG 错当成必须使用 Apple UI 框架。
