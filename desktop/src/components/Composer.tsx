import { useEffect, useMemo, useRef, useState } from 'react'

import type { ModelProvider, ModelSettingsView } from '../api/modelSettings'
import type { AgentMode } from '../api/types'
import { useWorkspaceStore, type ProjectContext } from '../stores/workspace'
import CommandPalette, { type ComposerCommand } from './CommandPalette'
import { Icon } from './Icon'

export type { ComposerCommand }

export interface ComposerProps {
  disabled: boolean
  sending?: boolean
  /** 当前 run 正在执行中：发送按钮转为暂停按钮。 */
  running?: boolean
  onStop?: () => void
  mode?: AgentMode
  onModeChange?: (mode: AgentMode) => void
  onSend: (content: string) => Promise<void>
  value?: string
  onValueChange?: (value: string) => void
  /** 轻量 Command palette 项（⌘K）。 */
  commands?: ComposerCommand[]
  placeholder?: string
  /** 本地模型配置视图 */
  modelSettings?: ModelSettingsView
  /** 切换默认模型提供商 */
  onModelChange?: (provider: ModelProvider) => void
  /** 当前绑定的工作区项目 */
  project?: ProjectContext
  /** 是否已有消息（用户发出第一条消息开始对话后为 true，隐藏顶部项目+工作树选择栏） */
  hasMessages?: boolean
  messagesCount?: number
}

export interface LocalModelOption {
  provider: ModelProvider
  name: string
  tier: string
  model: string
  configured: boolean
}

export function formatLocalModel(
  provider: ModelProvider,
  rawModel = '',
  configured = true,
): LocalModelOption {
  const m = (rawModel || '').toLowerCase()
  switch (provider) {
    case 'qwen': {
      let tier = 'Plus'
      if (m.includes('max')) tier = 'Max'
      else if (m.includes('turbo')) tier = 'Turbo'
      else if (m.includes('coder')) tier = 'Coder'
      return { provider, name: 'Qwen', tier, model: rawModel || 'qwen-plus', configured }
    }
    case 'deepseek': {
      const tier = m.includes('reasoner') || m.includes('r1') ? 'R1' : 'V3'
      return { provider, name: 'DeepSeek', tier, model: rawModel || 'deepseek-chat', configured }
    }
    case 'anthropic': {
      let tier = 'Sonnet'
      if (m.includes('haiku')) tier = 'Haiku'
      else if (m.includes('opus')) tier = 'Opus'
      return { provider, name: 'Claude 3.7', tier, model: rawModel || 'claude-3-7-sonnet-latest', configured }
    }
    case 'openai':
    default: {
      let tier = 'GPT-4o'
      if (m.includes('mini')) tier = '4o-mini'
      else if (m.includes('o1')) tier = 'o1'
      else if (m.includes('o3')) tier = 'o3-mini'
      else if (m.includes('gpt-4.5')) tier = '4.5'
      return { provider: 'openai', name: 'OpenAI', tier, model: rawModel || 'gpt-4o', configured }
    }
  }
}

export const DEFAULT_LOCAL_MODELS: LocalModelOption[] = [
  { provider: 'qwen', name: 'Qwen', tier: 'Plus', model: 'qwen-plus', configured: true },
  { provider: 'deepseek', name: 'DeepSeek', tier: 'V3', model: 'deepseek-chat', configured: true },
  { provider: 'anthropic', name: 'Claude 3.7', tier: 'Sonnet', model: 'claude-3-7-sonnet-latest', configured: true },
  { provider: 'openai', name: 'OpenAI', tier: 'GPT-4o', model: 'gpt-4o', configured: true },
]

export default function Composer({
  disabled,
  sending = false,
  running = false,
  onStop,
  mode = 'normal',
  onModeChange,
  onSend,
  value,
  onValueChange,
  commands,
  placeholder = '输入任务指令，@ 引用文件，/ 调用命令',
  modelSettings,
  onModelChange,
  project,
  hasMessages,
  messagesCount,
}: ComposerProps): React.JSX.Element {
  const [internalValue, setInternalValue] = useState('')
  const [commandOpen, setCommandOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [worktreeMenuOpen, setWorktreeMenuOpen] = useState(false)

  // 当 messages.length === 0（新对话未发送消息前）渲染顶部项目+工作树栏
  const isNewConversation =
    hasMessages !== undefined
      ? !hasMessages
      : messagesCount !== undefined
        ? messagesCount === 0
        : true

  const storeProject = useWorkspaceStore((state) => state.currentProject)
  const recentProjects = useWorkspaceStore((state) => state.recentProjects)
  const setStoreProject = useWorkspaceStore((state) => state.setCurrentProject)
  const addStoreProject = useWorkspaceStore((state) => state.addProject)
  const currentWorktree = useWorkspaceStore((state) => state.currentWorktree)
  const worktrees = useWorkspaceStore((state) => state.worktrees)
  const setCurrentWorktree = useWorkspaceStore((state) => state.setCurrentWorktree)
  const addWorktree = useWorkspaceStore((state) => state.addWorktree)

  const activeProject = project ?? storeProject

  // 本地模型列表与当前选中模型
  const localModels = useMemo<LocalModelOption[]>(() => {
    if (modelSettings?.providers && modelSettings.providers.length > 0) {
      return modelSettings.providers.map((p) =>
        formatLocalModel(p.provider, p.model, p.configured),
      )
    }
    return DEFAULT_LOCAL_MODELS
  }, [modelSettings])

  const [fallbackProvider, setFallbackProvider] = useState<ModelProvider>('qwen')
  const activeProvider = modelSettings?.default_provider ?? fallbackProvider

  const currentModel = useMemo<LocalModelOption>(() => {
    return (
      localModels.find((m) => m.provider === activeProvider) ??
      localModels[0] ??
      DEFAULT_LOCAL_MODELS[0]
    )
  }, [localModels, activeProvider])

  const isComposingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  const projectMenuRef = useRef<HTMLDivElement>(null)
  const worktreeMenuRef = useRef<HTMLDivElement>(null)

  const draft = value ?? internalValue
  const busy = disabled || sending
  const canSend = draft.trim() !== '' && !busy

  // 点击外部关闭弹层菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Node
      if (modelMenuRef.current && !modelMenuRef.current.contains(target)) {
        setModelMenuOpen(false)
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setModeMenuOpen(false)
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(target)) {
        setProjectMenuOpen(false)
      }
      if (worktreeMenuRef.current && !worktreeMenuRef.current.contains(target)) {
        setWorktreeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 快捷键 ⌘K 唤起命令面板
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const setDraft = (next: string): void => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  // 随文本输入高度自适应：初始 1 行（min-height: 24px），随内容自适应最高 180px
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 180)
    textarea.style.height = `${newHeight}px`
  }, [draft])

  const submit = async (): Promise<void> => {
    const content = draft.trim()
    if (!content || busy) return
    setDraft('')
    try {
      await onSend(content)
    } catch {
      // 发送失败时恢复草稿，避免用户输入丢失
      setDraft(content)
    }
  }

  const handleCompositionStart = (): void => {
    setIsComposing(true)
    isComposingRef.current = true
  }

  const handleCompositionEnd = (): void => {
    setIsComposing(false)
    isComposingRef.current = false
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // 中文输入法 (IME) 组合输入期间，Return 仅确认候选字，绝对禁止发送消息
    if (isComposing || isComposingRef.current || event.nativeEvent.isComposing) {
      return
    }

    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

    // 支持 Cmd+Enter / Ctrl+Enter 或常规 Enter（非 Shift+Enter）发送
    if ((cmdOrCtrl && event.key === 'Enter') || (event.key === 'Enter' && !event.shiftKey)) {
      event.preventDefault()
      void submit()
    }
  }

  const handleOpenFolder = (): void => {
    setProjectMenuOpen(false)
    const inputPath = window.prompt?.('输入或选择本地项目文件夹绝对路径：', '~/code/new-project')
    if (inputPath && inputPath.trim()) {
      const cleanPath = inputPath.trim()
      const segs = cleanPath.split('/').filter(Boolean)
      const folderName = segs[segs.length - 1] || 'custom-project'
      const newProj = addStoreProject(folderName, cleanPath)
      setStoreProject(newProj)
    }
  }

  const handleAddWorktree = (): void => {
    setWorktreeMenuOpen(false)
    const inputBranch = window.prompt?.('输入要切换或新建的 Git 分支/Worktree：', 'feature/new-branch')
    if (inputBranch && inputBranch.trim()) {
      const cleanBranch = inputBranch.trim()
      addWorktree(cleanBranch)
      setCurrentWorktree(cleanBranch)
    }
  }

  return (
    <div className="composer-wrapper composer-dock">
      {/* 
        双层嵌套容器结构：
        - 新对话时（isNewConversation）：外层底座为浅灰圆角底座 rounded-[22px] bg-[#F5F5F6] p-1 border border-zinc-200/70，带顶部项目+工作树栏
        - 对话进行中（!isNewConversation）：外层浅灰底座收起 p-0 bg-transparent border-transparent
      */}
      <div
        className={`composer-outer-ring ${
          isNewConversation
            ? 'composer-outer-ring--new rounded-[22px] bg-[#F5F5F6] p-1 border border-zinc-200/70'
            : 'composer-outer-ring--chat p-0 bg-transparent border-transparent'
        }`}
      >
        {/* 新对话未发送消息前：外层底座的顶部栏 */}
        {isNewConversation ? (
          <div className="composer__meta-bar px-3.5 py-1.5 flex items-center gap-3.5 text-[13px] text-zinc-600">
            {/* 1. 项目选择器：[Folder 图标] {currentProject?.name || '选择项目'} [ChevronDown 图标] */}
            <div className="composer__top-project-wrap" ref={projectMenuRef}>
              <button
                type="button"
                className="composer__project-pill composer__top-project-btn flex items-center gap-1.5 hover:text-zinc-900 transition-colors cursor-pointer"
                onClick={() => {
                  setWorktreeMenuOpen(false)
                  setProjectMenuOpen((v) => !v)
                }}
                aria-haspopup="listbox"
                aria-expanded={projectMenuOpen}
                title={`当前项目：${activeProject?.name || '选择项目'} (${activeProject?.path || ''})`}
              >
                <Icon name="folder" size={14} className="composer__top-icon text-zinc-500" />
                <span className="composer__top-project-name font-medium text-zinc-800">
                  {activeProject?.name || '选择项目'}
                </span>
                <Icon name="chevronDown" size={11} className="composer__top-chevron text-zinc-400" />
              </button>

              {projectMenuOpen ? (
                <div className="composer__dropdown composer__project-dropdown" role="listbox">
                  <div className="composer__dropdown-header">最近项目 · Recent Projects</div>
                  {recentProjects.map((p) => {
                    const isCurrent = activeProject?.id === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`composer__dropdown-item ${isCurrent ? 'active' : ''}`}
                        onClick={() => {
                          setStoreProject(p)
                          setProjectMenuOpen(false)
                        }}
                      >
                        <div className="composer__dropdown-item-meta">
                          <span className="composer__dropdown-name">{p.name}</span>
                          <span className="composer__dropdown-tier">{p.path}</span>
                        </div>
                        {isCurrent ? <Icon name="check" size={12} /> : null}
                      </button>
                    )
                  })}
                  <div className="composer__dropdown-divider" />
                  <button
                    type="button"
                    className="composer__dropdown-item composer__dropdown-item--add"
                    onClick={handleOpenFolder}
                  >
                    <Icon name="plus" size={13} />
                    <span>打开本地文件夹...</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* 2. 工作树 / 分支选择器：[GitBranch 图标] {currentWorktree || 'main'} [ChevronDown 图标] */}
            <div className="composer__top-worktree-wrap" ref={worktreeMenuRef}>
              <button
                type="button"
                className="composer__top-worktree-btn flex items-center gap-1.5 hover:text-zinc-900 transition-colors cursor-pointer"
                onClick={() => {
                  setProjectMenuOpen(false)
                  setWorktreeMenuOpen((v) => !v)
                }}
                aria-haspopup="listbox"
                aria-expanded={worktreeMenuOpen}
                title={`工作树 / 分支：${currentWorktree || 'main'}`}
              >
                <Icon name="gitBranch" size={14} className="composer__top-icon text-zinc-500" />
                <span className="composer__top-worktree-name font-medium text-zinc-800">
                  {currentWorktree || 'main'}
                </span>
                <Icon name="chevronDown" size={11} className="composer__top-chevron text-zinc-400" />
              </button>

              {worktreeMenuOpen ? (
                <div className="composer__dropdown composer__worktree-dropdown" role="listbox">
                  <div className="composer__dropdown-header">工作树 / Git 分支</div>
                  {worktrees.map((wt) => {
                    const isCurrent = currentWorktree === wt
                    return (
                      <button
                        key={wt}
                        type="button"
                        className={`composer__dropdown-item ${isCurrent ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentWorktree(wt)
                          setWorktreeMenuOpen(false)
                        }}
                      >
                        <div className="composer__dropdown-item-meta">
                          <span className="composer__dropdown-name">{wt}</span>
                        </div>
                        {isCurrent ? <Icon name="check" size={12} /> : null}
                      </button>
                    )
                  })}
                  <div className="composer__dropdown-divider" />
                  <button
                    type="button"
                    className="composer__dropdown-item composer__dropdown-item--add"
                    onClick={handleAddWorktree}
                  >
                    <Icon name="plus" size={13} />
                    <span>新建或切换分支...</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 内层纯白主体卡片：rounded-[18px] bg-white border border-zinc-200/80 shadow-xs */}
        <div
          className={`composer-inner-box composer ${
            isNewConversation
              ? 'composer-inner-box--new rounded-[18px] bg-white border border-zinc-200/80 shadow-xs'
              : 'composer-inner-box--chat'
          } ${busy ? 'composer--busy' : ''}`}
        >
          {/* 上层自适应文本输入区 */}
          <textarea
            ref={textareaRef}
            className="composer__input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={busy}
            aria-label="消息输入框"
          />

          {/* 下层左右工具栏 (高 28px，两端对齐) */}
          <div className="composer__toolbar composer__footer">
            {/* 左侧控件区：+ 号附件按钮 + 模型选择器 (+ 对话进行中的项目小胶囊) */}
            <div className="composer__toolbar-left">
              <button
                type="button"
                className="composer__attach-btn"
                title="添加附件"
                aria-label="添加附件"
                disabled={busy}
              >
                <Icon name="plus" size={16} />
              </button>

              <div className="composer__model-selector-wrap" ref={modelMenuRef}>
                <button
                  type="button"
                  className="composer__model-selector"
                  onClick={() => setModelMenuOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={modelMenuOpen}
                  title="切换模型"
                >
                  <span className="composer__model-name">{currentModel.name}</span>
                  <span className="composer__model-tier">{currentModel.tier}</span>
                  <Icon name="chevronDown" size={12} className="composer__chevron" />
                </button>

                {modelMenuOpen ? (
                  <div className="composer__dropdown composer__model-dropdown" role="listbox">
                    {localModels.map((m) => (
                      <button
                        key={m.provider}
                        type="button"
                        className={`composer__dropdown-item ${currentModel.provider === m.provider ? 'active' : ''}`}
                        onClick={() => {
                          setFallbackProvider(m.provider)
                          onModelChange?.(m.provider)
                          setModelMenuOpen(false)
                        }}
                        title={m.configured ? `${m.name} (${m.model})` : `${m.name} (未配置 API Key)`}
                      >
                        <span className="composer__dropdown-name">
                          {m.name}
                          {!m.configured ? (
                            <span className="composer__dropdown-unconfigured"> (未配置)</span>
                          ) : null}
                        </span>
                        <span className="composer__dropdown-tier">{m.tier}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* 对话进行中（!isNewConversation）保留紧凑的项目胶囊标识 */}
              {!isNewConversation ? (
                <div className="composer__project-selector-wrap" ref={projectMenuRef}>
                  <button
                    type="button"
                    className="composer__project-pill"
                    onClick={() => setProjectMenuOpen((v) => !v)}
                    title={`当前项目：${activeProject.name} (${activeProject.path})`}
                  >
                    <Icon name="folder" size={13} className="composer__project-icon" />
                    <span className="composer__project-name">{activeProject.name}</span>
                    <Icon name="chevronDown" size={11} className="composer__chevron" />
                  </button>

                  {projectMenuOpen ? (
                    <div className="composer__dropdown composer__project-dropdown" role="listbox">
                      <div className="composer__dropdown-header">当前项目上下文</div>
                      {recentProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`composer__dropdown-item ${activeProject.id === p.id ? 'active' : ''}`}
                          onClick={() => {
                            setStoreProject(p)
                            setProjectMenuOpen(false)
                          }}
                        >
                          <span className="composer__dropdown-name">{p.name}</span>
                          <span className="composer__dropdown-tier">{p.path}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* 右侧控件区：执行模式选择器 + 语音输入 + 圆形发送按钮 */}
            <div className="composer__toolbar-right">
              <div className="composer__mode-selector-wrap" ref={modeMenuRef}>
                <button
                  type="button"
                  className="composer__mode-selector"
                  onClick={() => setModeMenuOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={modeMenuOpen}
                  title="Switch mode"
                  disabled={busy || !onModeChange}
                >
                  <span className="composer__mode-label">
                    {mode === 'plan' ? 'Plan' : 'Direct'}
                  </span>
                  <Icon name="chevronDown" size={12} className="composer__chevron" />
                </button>

                {/* 模式切换下拉菜单：提供纯英文 Direct 与 Plan 选项 */}
                <div
                  className={`composer__dropdown composer__mode-dropdown mode-switch ${
                    modeMenuOpen ? 'open' : ''
                  }`}
                  aria-label="Execution mode"
                >
                  {(['normal', 'plan'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`${
                        mode === item ? 'mode-switch__item active' : 'mode-switch__item'
                      } composer__dropdown-item`}
                      onClick={() => {
                        onModeChange?.(item)
                        setModeMenuOpen(false)
                      }}
                      aria-pressed={mode === item}
                      title={
                        item === 'plan'
                          ? 'Plan mode: investigate and generate a structured plan before executing.'
                          : 'Direct mode: execute your request directly.'
                      }
                      disabled={busy || !onModeChange}
                    >
                      <span>{item === 'normal' ? 'Direct' : 'Plan'}</span>
                      <span className="composer__dropdown-tier">
                        {item === 'normal' ? 'Normal' : 'Review'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 语音输入按钮 */}
              <button
                type="button"
                className="composer__mic-btn"
                title="语音输入"
                aria-label="语音输入"
                disabled={busy}
              >
                <Icon name="mic" size={15} />
              </button>

              {/* 圆形发送/暂停按钮 */}
              {running ? (
                <button
                  type="button"
                  className="send-button composer__send composer__stop"
                  onClick={() => onStop?.()}
                  aria-label="暂停"
                  title="暂停"
                >
                  <Icon name="pause" size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className={`send-button composer__send ${
                    canSend ? 'send-button--active' : 'send-button--idle'
                  }`}
                  onClick={() => void submit()}
                  disabled={!canSend}
                  aria-label={sending ? '正在发送' : '发送'}
                  title="发送"
                >
                  {sending ? (
                    <span className="spinner spinner--light" />
                  ) : (
                    <Icon
                      name="arrowRight"
                      size={14}
                      strokeWidth={canSend ? 2.2 : 2.0}
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {commandOpen && commands && (
        <CommandPalette
          open={commandOpen}
          commands={commands}
          onClose={() => setCommandOpen(false)}
        />
      )}
    </div>
  )
}
