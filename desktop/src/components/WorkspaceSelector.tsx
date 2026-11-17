import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export interface WorkspaceSelectorProps {
  workspacePath?: string | null
  fixed?: boolean
  available?: boolean
  disabled?: boolean
  onSelectWorkspace?: (path: string | null) => Promise<void> | void
  /** 呈现位置变体：'top' 适用于新会话顶栏，'bottom' 适用于底部工具栏 */
  variant?: 'top' | 'bottom'
}

const RECENT_WORKSPACES_KEY = 'vesta_recent_workspaces'
const MAX_RECENT_COUNT = 8

export function getStoredRecentWorkspaces(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_WORKSPACES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return Array.from(
        new Set(
          parsed.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())),
        ),
      )
    }
    return []
  } catch {
    return []
  }
}

export function saveStoredRecentWorkspace(path: string): void {
  try {
    const normalized = path.trim()
    if (!normalized) return
    const current = getStoredRecentWorkspaces()
    const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, MAX_RECENT_COUNT)
    localStorage.setItem(RECENT_WORKSPACES_KEY, JSON.stringify(next))
  } catch {
    // 忽略 localStorage 写入限制
  }
}

export function removeStoredRecentWorkspace(path: string): string[] {
  try {
    const current = getStoredRecentWorkspaces()
    const next = current.filter((item) => item !== path)
    localStorage.setItem(RECENT_WORKSPACES_KEY, JSON.stringify(next))
    return next
  } catch {
    return []
  }
}

export function getBaseName(filePath: string): string {
  const parts = filePath.split(/[/\\]/).filter(Boolean)
  return parts.at(-1) || filePath
}

export default function WorkspaceSelector({
  workspacePath,
  fixed = false,
  available = true,
  disabled = false,
  onSelectWorkspace,
  variant = 'top',
}: WorkspaceSelectorProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentList, setRecentList] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isNoProject = !workspacePath || !workspacePath.trim()
  const baseName = isNoProject ? 'No Project' : getBaseName(workspacePath!)
  const isTop = variant === 'top'

  useEffect(() => {
    if (open) {
      setRecentList(getStoredRecentWorkspaces())
      setSearch('')
      // 弹开后自动聚焦搜索框
      setTimeout(() => searchInputRef.current?.focus(), 30)
    }
  }, [open])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  const handleOpenFolder = useCallback(async (): Promise<void> => {
    if (!workspacePath) return
    if (window.vesta?.openPath) {
      await window.vesta.openPath(workspacePath)
    }
  }, [workspacePath])

  const handleSelectSystemDirectory = useCallback(async (): Promise<void> => {
    setOpen(false)
    let selected: string | null = null
    if (window.vesta?.selectDirectory) {
      selected = await window.vesta.selectDirectory()
    } else {
      // 浏览器降级：prompt 输入路径
      const promptInput = window.prompt('请输入本地工作区绝对路径：', workspacePath ?? '')
      if (promptInput && promptInput.trim()) {
        selected = promptInput.trim()
      }
    }

    if (selected && selected.trim()) {
      const cleanPath = selected.trim()
      saveStoredRecentWorkspace(cleanPath)
      await onSelectWorkspace?.(cleanPath)
    }
  }, [workspacePath, onSelectWorkspace])

  const handleChooseRecent = useCallback(
    async (path: string): Promise<void> => {
      setOpen(false)
      saveStoredRecentWorkspace(path)
      await onSelectWorkspace?.(path)
    },
    [onSelectWorkspace],
  )

  const handleClearWorkspace = useCallback(async (): Promise<void> => {
    setOpen(false)
    await onSelectWorkspace?.(null)
  }, [onSelectWorkspace])

  // 搜索过滤 Recent 项目
  const filteredRecent = recentList.filter((item) => {
    if (!search.trim()) return true
    const name = getBaseName(item).toLowerCase()
    return name.includes(search.toLowerCase().trim()) || item.toLowerCase().includes(search.toLowerCase().trim())
  })

  // 开始聊天后（已固定状态）：只读展示
  if (fixed) {
    return (
      <div
        className={`workspace-tag ${available ? '' : 'workspace-tag--unavailable'} ${
          isTop ? 'workspace-tag--top' : ''
        }`}
        title={
          isNoProject
            ? '当前聊天未绑定本地工作区（No project）'
            : available
              ? `已绑定工作区：${workspacePath}`
              : `工作区目录不可用（已删除或无法访问）：${workspacePath}`
        }
      >
        <span className="workspace-tag__icon">
          <Icon name={available ? 'folder' : 'alert'} size={13} />
        </span>
        <span className="workspace-tag__name">{baseName}</span>
        {!available && <span className="workspace-tag__badge">不可用</span>}
        {!isNoProject && available && (
          <button
            type="button"
            className="workspace-tag__action"
            onClick={() => void handleOpenFolder()}
            title="在 Finder 中打开"
            aria-label="在 Finder 中打开工作区"
          >
            <Icon name="external" size={12} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={isTop ? 'composer__top-project-wrap' : 'workspace-selector'}
      ref={containerRef}
    >
      {isTop ? (
        <button
          type="button"
          className={`composer__top-project-btn ${open ? 'active' : ''}`}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          title={isNoProject ? '未绑定项目（No Project）' : `当前选择工作区：${workspacePath}`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Icon name="folder" size={14} className="composer__top-icon" />
          <span className="composer__top-project-name">
            {baseName}
          </span>
          <Icon name="chevronDown" size={11} className="composer__top-chevron" />
        </button>
      ) : (
        <button
          type="button"
          className={`workspace-selector__trigger ${open ? 'active' : ''}`}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          title={isNoProject ? '未绑定项目（No Project）' : `当前选择工作区：${workspacePath}`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <span className="workspace-selector__icon">
            <Icon name="folder" size={13} />
          </span>
          <span className="workspace-selector__label">{baseName}</span>
          <span className="workspace-selector__chevron">
            <Icon name="chevronDown" size={11} />
          </span>
        </button>
      )}

      {open && (
        <div
          className={`workspace-menu ${isTop ? 'workspace-menu--top composer__project-dropdown' : ''}`}
          role="menu"
        >
          {/* 1. 顶部搜索栏 */}
          <div className="workspace-menu__search-row">
            <Icon name="search" size={13} className="workspace-menu__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="workspace-menu__search-input"
              placeholder="Search Projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                }
              }}
            />
          </div>

          {/* 2. Recent 区域 */}
          <div className="workspace-menu__header">Recent</div>
          <div className="workspace-menu__list">
            {filteredRecent.length > 0 ? (
              filteredRecent.map((recentPath) => {
                const isSelected = recentPath === workspacePath
                const name = getBaseName(recentPath)
                return (
                  <button
                    key={recentPath}
                    type="button"
                    className={`workspace-menu__item workspace-menu__item--recent ${
                      isSelected ? 'selected' : ''
                    }`}
                    role="menuitem"
                    onClick={() => void handleChooseRecent(recentPath)}
                    title={recentPath}
                  >
                    <Icon name="folder" size={14} className="workspace-menu__item-icon" />
                    <span className="workspace-menu__recent-name">{name}</span>
                    {isSelected && (
                      <Icon name="check" size={13} className="workspace-menu__check-icon" />
                    )}
                  </button>
                )
              })
            ) : (
              <div className="workspace-menu__empty">
                {search.trim() ? '未找到匹配项目' : '暂无最近使用的项目'}
              </div>
            )}
          </div>

          <div className="workspace-menu__divider" />

          {/* 3. This Computer (系统文件夹选择) */}
          <button
            type="button"
            className="workspace-menu__item"
            role="menuitem"
            onClick={() => void handleSelectSystemDirectory()}
          >
            <Icon name="computer" size={14} className="workspace-menu__item-icon" />
            <span className="workspace-menu__item-label">This Computer</span>
            <Icon name="chevronRight" size={12} className="workspace-menu__arrow-icon" />
          </button>

          {/* 4. New Project (新建/选择目录) */}
          <button
            type="button"
            className="workspace-menu__item"
            role="menuitem"
            onClick={() => void handleSelectSystemDirectory()}
          >
            <Icon name="folderPlus" size={14} className="workspace-menu__item-icon" />
            <span className="workspace-menu__item-label">New Project</span>
          </button>

          <div className="workspace-menu__divider" />

          {/* 5. No Project */}
          <button
            type="button"
            className={`workspace-menu__item workspace-menu__item--no-project ${
              isNoProject ? 'selected' : ''
            }`}
            role="menuitem"
            onClick={() => void handleClearWorkspace()}
          >
            <Icon name="folderX" size={14} className="workspace-menu__item-icon" />
            <span className="workspace-menu__item-label">No Project</span>
            {isNoProject && (
              <Icon name="check" size={13} className="workspace-menu__check-icon" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
