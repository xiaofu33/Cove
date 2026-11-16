# Vesta 对标 Codex UI / UX 客户端重构实施进度与追踪矩阵

> 创建日期：2026-11-16
> 执行者：builder (Agent)
> 对应执行计划：`2026-11-16-codex-style-ui-ux-plan.md`
> 技术栈：Electron + React + TypeScript + Vite + Tailwind/CSS Modules + Zustand + TanStack Query

---

## 1. 基线环境与运行状态

| 项目 | 记录值 | 说明 |
|---|---|---|
| 基线 Commit | `9b297a8` (origin/main) | 干净工作树基线 |
| Node 版本 | v20+ / macOS (Darwin arm64) | 本地开发环境 |
| 客户端架构 | `desktop/` (Electron + React 18 + TS 5.6 + Vite 5.4) | 沿用现有工程 |
| 初始单元测试 | 43 test files passed (240 tests passed) | Vitest `npm test -- --run` 3.21s |
| 初始类型检查 | Clean (0 errors) | `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.electron.json` |
| 状态管理/事件 | TanStack Query + Zustand (`stores/events.ts` ~33ms batching) | 保持服务端契约不变 |
| 现有 9 大功能页面 | Chat, Runs, Automations, Approvals, Artifacts, Computer, Memory, Settings, RunDetail | 全部保留或重映射，不减功能 |

---

## 2. 分阶段执行状态追踪 (P0 - P8)

| 阶段 | 任务目标 | 负责人 | 状态 | 交付物 / 备注 |
|---|---|---|---|---|
| **P0** | 核对现场、建立基线与进度追踪矩阵 | builder | 🟢 已完成 | 建立 `codex-ui-execution-progress.md`，跑通 240 个基线测试 |
| **P1** | 视觉与交互规范设计、Codex 参考与 HIG 评审 | designer | 🟢 已完成 | `design-spec.md`, `codex-reference.md`, `design-review.md` (全优评级) |
| **P2** | 语义 Tokens 落地、工作区三栏骨架与路由保持 | builder | 🟢 已完成 | 落地 `tokens.css` (浅/深/高对比度)，重构 `App.tsx` 原生窗口工具栏与侧栏折叠，新增 `App.test.tsx` (241 测试通过) |
| **P3** | 对话核心体验 (ChatPage, Composer, 消息与推理折叠) | builder | 🟢 已完成 | Composer 中文 IME 保护/高度自适应/快捷键，AssistantContent 代码高亮与纯净复制，ChatPage 滚动锚定与“回到最新”悬浮指示器 (243 测试通过) |
| **P4** | 任务执行、运行控制与成果展示 | builder | 🟢 已完成 | 重构 CurrentTaskPanel 紧凑步骤树与状态符号，重构 PlanCard 独立确认蓝图；重构 ExecutionTrace 渐进披露（SF Mono 代码与 JSON 复制）；重构 ResultCard 成果卡片标准化 (245 测试通过) |
| **P5** | 审批系统与 Computer Runtime 链路 | builder | 🟢 已完成 | 落地 ApprovalCard 风险等级三权分离（Prominent/Destructive）与键盘快捷操作；重构 ApprovalFloatingCard 无焦点半透明毛玻璃 HUD 浮窗与深浅色语义 Tokens；全面清除 index.css 写死样式 |
| **P6** | 管理功能统一 (Runs, Automations, Memory, Settings) | builder | 🟡 进行中 | 页面风格统一样式与状态反馈对齐 |
| **P7** | macOS 原生系统体验、深浅外观、可访问性与性能 | builder | ⚪ 待开始 | 主题自适应、键盘可达性、字体缩放与高负载测试 |
| **P8** | 交付验证、文档更新与构建验收 | builder | ⚪ 待开始 | 打包验证、README 与最终交付物归档 |

---

## 3. 功能迁移矩阵追踪

| 既有能力 / 页面 | 原入口与组件 | 新入口与布局位置 | 状态 | 验证记录 |
|---|---|---|---|---|
| 1. 会话工作区 | `ChatPage.tsx` | 工作区核心（侧边栏切换 + 中间正文 + 底部沉浸 Composer） | 待重构 | P2/P3 |
| 2. 运行历史 | `RunsPage.tsx` | 侧栏“活动”导航入口 / 可选右侧检查器 | 保持可用 | P2/P6 |
| 3. 运行详情 | `RunDetailPage.tsx` | 点击运行项下钻，展示 Trace / Timeline / Usage | 保持可用 | P4/P6 |
| 4. 自动化管理 | `AutomationsPage.tsx` | 侧栏“自动化”导航入口，Cron / Interval 任务配置与启停 | 保持可用 | P6 |
| 5. 审批中心 | `ApprovalsPage.tsx` | 侧栏“待审批”徽标入口 + 工作区卡片 + 后台浮窗 | 保持可用 | P5 |
| 6. 产物交付物 | `ArtifactsPage.tsx` | 侧栏“交付物”导航入口 + 当前会话右侧成果区 | 保持可用 | P4/P6 |
| 7. 电脑控制 | `ComputerPage.tsx` | 侧栏“电脑”导航入口 / 运行中检查器实时观察面板 | 保持可用 | P5/P6 |
| 8. 长期记忆 | `MemoryPage.tsx` | 侧栏“记忆”导航入口，Core / Active / Archived 只读浏览 | 保持可用 | P6 |
| 9. 系统设置 | `SettingsPage.tsx` | 侧栏底部齿轮 / Cmd+, 系统配置（模型、扩展、Computer诊断） | 保持可用 | P2/P6 |

---

## 4. 验收用例追踪 (AC01 - AC18)

| ID | 场景与核心验收标准 | 状态 | 验证证据 / 说明 |
|---|---|---|---|
| **AC01** | 冷启动与 Host 离线连接提示，草稿不丢 | ⚪ 未验证 | |
| **AC02** | 新建→发送→流式正文→完成，历史一致无重复 | ⚪ 未验证 | |
| **AC03** | macOS 中文输入法 Return 候选确认不误发送，撤销与多行 | 🟢 已验证 | Composer 实现 compositionstart/end 与 isComposing 拦截，添加自动化单测保障 |
| **AC04** | 运行时切会话不串流，后台持续更新 | ⚪ 未验证 | |
| **AC05** | 流式期间用户滚动锚定、文本选区保留与宽度自适应 | 🟢 已验证 | ChatPage 实现智能判断，离开底部时出现“回到最新”悬浮胶囊，阅读区设为 760px |
| **AC06** | 网络异常与重连时不重发 mutation，状态权威查询 | ⚪ 未验证 | |
| **AC07** | 计划模式接受/拒绝、中断与恢复语义区分 | 🟢 已验证 | PlanCard 独立确认蓝图与 CurrentTaskPanel 状态符号表征，单测通过 |
| **AC08** | pending 审批双入口防重入与多端状态同步 | 🟢 已验证 | ApprovalCard 与 ApprovalFloatingCard 共享 FIFO 队列与防双击 busy 状态，支持键盘快捷处理 |
| **AC09** | 跨应用审批浮窗不夺取系统目标焦点 | 🟢 已验证 | ApprovalFloatingCard 落实 focusable:false、毛玻璃 HUD 质感与深浅色语义 Tokens，避让系统热区并提供主窗口指引 |
| **AC10** | 主窗口关闭后审批浮窗仍正常唤起，Dock 可重新恢复主窗口 | ⚪ 未验证 | |
| **AC11** | 全键盘无障碍导航、焦点可见与快捷键支持 (Cmd+N, Cmd+, 等) | ⚪ 未验证 | |
| **AC12** | 浅色/深色主题无缝切换，WCAG 2.1 AA 级对比度 | ⚪ 未验证 | |
| **AC13** | 800×600 紧凑视口自适应收折，正文支持 200% 缩放无截断 | ⚪ 未验证 | |
| **AC14** | 500+ 消息及高频 delta 流式渲染性能稳定无掉帧 | ⚪ 未验证 | |
| **AC15** | 9 大功能页面无缝平移，不损失任何现有能力 | ⚪ 未验证 | |
| **AC16** | 错误反馈具体明确，包含下一步指引，无假死 spinner | ⚪ 未验证 | |
| **AC17** | `npm run build` 与生产启动正常 | ⚪ 未验证 | |
| **AC18** | 对标 Codex 桌面端，侧边栏、正文、输入区、折叠块具备高品质感与明确差异表 | ⚪ 未验证 | |

---

## 5. Git 提交记录

*随阶段测试通过实时记录：*
- `544238c`: `docs: 建立 Codex UI 重构执行方案与追踪矩阵 (P0/P1)`
- `25b4012`: `feat(ui): 引入 CSS 语义 Tokens 体系并支持深浅色与高对比度 (P2)`
- `1258ca7`: `refactor(desktop): 重构 App.tsx 骨架与原生窗口工具栏及侧边栏折叠支持 (P2)`
- `f3aca12`: `feat(chat): 优化 Composer 中文输入法保护、代码块纯净复制与回到最新锚定 (P3)`
- `6102857`: `test(chat): 增加代码块复制栏与 Composer 输入法无障碍测试 (P3)`
- `4aa4eb6`: `refactor(task): 重构 CurrentTaskPanel 与 PlanCard 步骤树及样式规范 (P4)`
- `a7f9154`: `refactor(trace): 落实 ExecutionTrace 渐进式披露与 ResultCard 交付规范 (P4)`
- `9c0af82`: `test(p4): 增加 PlanCard 步骤总数与 ResultCard 无障碍测试 (P4)`
- `feat(approval): 完善审批卡片风险分离与无焦点毛玻璃浮窗视觉体系 (P5)`
- 阶段验证结果：44 测试文件 245 用例全绿，类型检查 0 errors。
