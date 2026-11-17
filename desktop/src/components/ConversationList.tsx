import { useEffect, useMemo, useRef, useState } from 'react'
import type { Conversation } from '../api/types'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'

const PINNED_KEY = 'vesta.pinnedConversations'
const COLLAPSED_PROJECTS_KEY = 'vesta.collapsedProjects'

function loadFromStorage(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : []
  } catch {
    return []
  }
}

function saveToStorage(key: string, value: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 忽略存储异常 */
  }
}

const STATUS_META: Record<string, { label: string; tone: string }> = {
  running: { label: '工作中', tone: 'running' },
  pending: { label: '等待中', tone: 'waiting' },
  completed: { label: '已完成', tone: 'completed' },
  failed: { label: '失败', tone: 'failed' },
  cancelled: { label: '已取消', tone: 'cancelled' },
  interrupted: { label: '已停止', tone: 'failed' },
}

function relativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

/** 解析会话标题中的项目名（例如 "[vesta] 评估原生 AppKit 重构工作量" 或 "求职网站 / 应用 Notion"） */
function extractProjectAndTitle(rawTitle: string): { project: string | null; cleanTitle: string } {
  const title = rawTitle.trim()
  const bracketMatch = title.match(/^\[(.*?)\]\s*(.*)$/)
  if (bracketMatch) {
    return { project: bracketMatch[1].trim(), cleanTitle: bracketMatch[2].trim() || bracketMatch[1].trim() }
  }
  const slashMatch = title.match(/^(.*?)\s*[/／]\s*(.*)$/)
  if (slashMatch) {
    return { project: slashMatch[1].trim(), cleanTitle: slashMatch[2].trim() }
  }
  return { project: null, cleanTitle: title }
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  statusByConversation = {},
  activityByConversation = {},
  onOpenSearch,
  pendingApprovalsCount = 0,
}: {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  /** 重命名会话（接入后端）。 */
  onRename?: (id: string, title: string) => void | Promise<void>
  /** 删除会话（接入后端）。 */
  onDelete?: (id: string) => void | Promise<void>
  /** conversationId → 最近 run 状态。 */
  statusByConversation?: Record<string, string>
  /** conversationId → 当前人类可读动作。 */
  activityByConversation?: Record<string, string>
  /** 点击搜索放大镜呼出全局命令面板。 */
  onOpenSearch?: () => void
  /** 待处理审批通知数。 */
  pendingApprovalsCount?: number
}): React.JSX.Element {
  const [pinned, setPinned] = useState<string[]>(() => loadFromStorage(PINNED_KEY))
  const [collapsedProjects, setCollapsedProjects] = useState<string[]>(() =>
    loadFromStorage(COLLAPSED_PROJECTS_KEY),
  )
  const [expandedProjectsAll, setExpandedProjectsAll] = useState<string[]>([])
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const workspaceDropdownRef = useRef<HTMLDivElement | null>(null)

  // 内联重命名状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // 点击外部关闭弹出菜单
  useEffect(() => {
    if (menuFor === null && !workspaceMenuOpen) return
    const onPointer = (event: MouseEvent): void => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuFor(null)
      }
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(target)) {
        setWorkspaceMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [menuFor, workspaceMenuOpen])

  const togglePin = (id: string): void => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [id, ...prev]
      saveToStorage(PINNED_KEY, next)
      return next
    })
  }

  const toggleProjectCollapse = (projectName: string): void => {
    setCollapsedProjects((prev) => {
      const next = prev.includes(projectName)
        ? prev.filter((p) => p !== projectName)
        : [...prev, projectName]
      saveToStorage(COLLAPSED_PROJECTS_KEY, next)
      return next
    })
  }

  const toggleProjectShowAll = (projectName: string): void => {
    setExpandedProjectsAll((prev) =>
      prev.includes(projectName) ? prev.filter((p) => p !== projectName) : [...prev, projectName],
    )
  }

  const startRename = (id: string, current: string): void => {
    setEditingValue(current)
    setEditingId(id)
    setMenuFor(null)
  }

  const commitRename = (id: string, original: string): void => {
    setEditingId(null)
    const trimmed = editingValue.trim()
    if (!trimmed || trimmed === original) return
    void onRename?.(id, trimmed)
  }

  const runDelete = (id: string): void => {
    void onDelete?.(id)
    setMenuFor(null)
  }

  // 分类与项目树计算
  const { pinnedItems, projectGroups, recentItems } = useMemo(() => {
    const pinnedList: Conversation[] = []
    const projectMap = new Map<string, Conversation[]>()
    const recentList: Conversation[] = []

    for (const conv of conversations) {
      if (pinned.includes(conv.id)) {
        pinnedList.push(conv)
      } else {
        const { project } = extractProjectAndTitle(conv.title || '')
        if (project) {
          if (!projectMap.has(project)) {
            projectMap.set(project, [])
          }
          projectMap.get(project)!.push(conv)
        } else {
          recentList.push(conv)
        }
      }
    }

    return {
      pinnedItems: pinnedList,
      projectGroups: Array.from(projectMap.entries()).map(([name, items]) => ({
        name,
        items,
      })),
      recentItems: recentList,
    }
  }, [conversations, pinned])

  const renderConversationItem = (
    conv: Conversation,
    options?: { indent?: boolean; isNestedInProject?: boolean },
  ): React.JSX.Element => {
    const status = statusByConversation[conv.id]
    const meta = status ? STATUS_META[status] : undefined
    const activity = activityByConversation[conv.id]
    const isPinned = pinned.includes(conv.id)
    const isSelected = selectedId === conv.id
    const { cleanTitle } = extractProjectAndTitle(conv.title || '')
    const timeFormatted = relativeTime(conv.updated_at)
    const itemTooltip = timeFormatted ? `${cleanTitle} • ${timeFormatted}` : cleanTitle

    return (
      <div
        key={conv.id}
        className={`conversation-item ${isSelected ? 'active' : ''} ${
          options?.indent ? 'conversation-item--indent' : ''
        }`}
      >
        <button
          type="button"
          className="conversation-item__main"
          onClick={() => onSelect(conv.id)}
          aria-current={isSelected ? 'true' : undefined}
          title={itemTooltip}
        >
          {editingId === conv.id ? (
            <input
              className="conversation-item__edit"
              value={editingValue}
              autoFocus
              aria-label="编辑会话标题"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setEditingValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitRename(conv.id, conv.title || '')
                } else if (event.key === 'Escape') {
                  setEditingId(null)
                }
              }}
              onBlur={() => {
                if (editingId === conv.id) {
                  commitRename(conv.id, conv.title || '')
                }
              }}
            />
          ) : (
            <div className="conversation-item__row">
              <span className="conversation-item__title">
                {isPinned && !options?.isNestedInProject ? (
                  <Icon name="pin" size={11} className="conversation-item__pin-icon" />
                ) : null}
                <span className="conversation-item__title-text">{cleanTitle || '未命名工作'}</span>
              </span>

              {/* 右侧固定显示 11.5px 的 #8E8E93 相对时间或 #3B82F6 状态小蓝点 */}
              <span className="conversation-item__trailing">
                {status === 'running' ? (
                  <span className="conversation-item__blue-dot" title="工作中" aria-label="工作中" />
                ) : timeFormatted ? (
                  <span className="conversation-item__time">{timeFormatted}</span>
                ) : null}
              </span>

              {/* 保留辅助节点以兼容既有测试与无障碍 */}
              {status === 'running' ? (
                <span className="conversation-item__status-icon sr-only" title="运行中">
                  <Icon name="refresh" size={11} className="spin" />
                </span>
              ) : null}

              {meta ? (
                <span
                  className={`conversation-item__status sr-only conversation-item__status--${meta.tone}`}
                >
                  {status === 'completed' ? '✓' : meta.label}
                </span>
              ) : null}

              {activity && ['running', 'pending'].includes(status ?? '') ? (
                <span className="conversation-item__activity sr-only">{activity}</span>
              ) : null}
            </div>
          )}
        </button>

        <button
          type="button"
          className="conversation-item__more"
          aria-label="更多操作"
          title="更多操作"
          onClick={(event) => {
            event.stopPropagation()
            setMenuFor((cur) => (cur === conv.id ? null : conv.id))
          }}
        >
          <Icon name="more" size={13} />
        </button>

        {menuFor === conv.id ? (
          <div className="conversation-menu" ref={menuRef} role="menu">
            <button type="button" role="menuitem" onClick={() => togglePin(conv.id)}>
              <Icon name="pin" size={13} />
              {isPinned ? '取消置顶' : '置顶'}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => startRename(conv.id, conv.title || '')}
            >
              <Icon name="pencil" size={13} />
              编辑
            </button>
            <button
              type="button"
              role="menuitem"
              className="conversation-menu__danger"
              onClick={() => runDelete(conv.id)}
            >
              <Icon name="trash" size={13} />
              删除
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="conversation-sidebar__content">
      {/* 顶部 Header：工作区切换 + 搜索与通知 (对标 Codex 精致对齐) */}
      <div className="conversation-sidebar__top">
        <div className="conversation-sidebar__workspace" ref={workspaceDropdownRef}>
          <button
            type="button"
            className="conversation-sidebar__workspace-btn"
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
            aria-label="切换工作区"
          >
            <span className="conversation-sidebar__workspace-name">Cove</span>
            <Icon name="chevronDown" size={11} className="conversation-sidebar__workspace-chevron" />
          </button>
          {/* 保留辅助文本以满足无障碍与组件测试 */}
          <span className="conversation-sidebar__label sr-only">工作</span>

          {workspaceMenuOpen ? (
            <div className="workspace-dropdown" role="menu">
              <div className="workspace-dropdown__header">工作区 / 项目</div>
              <button
                type="button"
                className="workspace-dropdown__item active"
                onClick={() => setWorkspaceMenuOpen(false)}
              >
                <Icon name="folder" size={13} />
                <span>cove (当前工作区)</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="conversation-sidebar__actions">
          <Tooltip
            content={pendingApprovalsCount > 0 ? `${pendingApprovalsCount} 条待审批` : '通知'}
            side="bottom"
          >
            <button
              type="button"
              className="conversation-sidebar__icon-btn"
              aria-label="通知"
            >
              <Icon name="bell" size={15} strokeWidth={1.6} />
              {pendingApprovalsCount > 0 ? (
                <span className="conversation-sidebar__dot" />
              ) : null}
            </button>
          </Tooltip>

          <Tooltip content="全局搜索" shortcut="⌘K" side="bottom">
            <button
              type="button"
              className="conversation-sidebar__icon-btn"
              onClick={onOpenSearch}
              aria-label="全局搜索"
            >
              <Icon name="search" size={15} strokeWidth={1.6} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 快速新建工作按钮：Codex 纯平无边框通栏项 */}
      <div className="conversation-sidebar__new-section">
        <Tooltip content="新聊天" shortcut="⌘N" side="bottom">
          <button
            className="new-conversation"
            type="button"
            onClick={onNew}
            aria-label="新建工作对话"
          >
            <Icon name="squarePen" size={16} strokeWidth={1.6} className="new-conversation__icon" />
            <span className="new-conversation__text">新聊天</span>
          </button>
        </Tooltip>
      </div>

      {/* 会话与项目分类树 */}
      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="conversation-list__empty">暂无对话</div>
        ) : null}

        {/* 分组 1：置顶 (Pinned) */}
        {pinnedItems.length > 0 ? (
          <div className="conversation-group">
            <div className="conversation-group__title">置顶</div>
            <div className="conversation-group__items">
              {pinnedItems.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        ) : null}

        {/* 分组 2：项目 (Projects) */}
        {projectGroups.length > 0 ? (
          <div className="conversation-group">
            <div className="conversation-group__title">项目</div>
            <div className="conversation-group__items">
              {projectGroups.map(({ name, items }) => {
                const isCollapsed = collapsedProjects.includes(name)
                const showAll = expandedProjectsAll.includes(name)
                const visibleItems = showAll ? items : items.slice(0, 6)
                const hasMore = items.length > 6

                return (
                  <div key={name} className="project-node">
                    <button
                      type="button"
                      className="project-node__header"
                      onClick={() => toggleProjectCollapse(name)}
                      aria-expanded={!isCollapsed}
                      title={name}
                    >
                      <span className="project-node__icon-wrap">
                        <Icon
                          name={isCollapsed ? 'folder' : 'folderOpen'}
                          size={16}
                          className="project-node__folder-icon"
                        />
                        <Icon
                          name={isCollapsed ? 'chevronRight' : 'chevronDown'}
                          size={16}
                          strokeWidth={1.6}
                          className="project-node__chevron-icon"
                        />
                      </span>
                      <span className="project-node__title">{name}</span>
                    </button>
                    {!isCollapsed ? (
                      <div className="project-node__children">
                        {visibleItems.map((conv) =>
                          renderConversationItem(conv, {
                            indent: true,
                            isNestedInProject: true,
                          }),
                        )}
                        {hasMore ? (
                          <button
                            type="button"
                            className="project-node__expand-btn"
                            onClick={() => toggleProjectShowAll(name)}
                          >
                            {showAll ? 'Collapse' : `See all (${items.length})`}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* 分组 3：最近 (Recent) */}
        {recentItems.length > 0 ? (
          <div className="conversation-group">
            {pinnedItems.length > 0 || projectGroups.length > 0 ? (
              <div className="conversation-group__title">最近</div>
            ) : null}
            <div className="conversation-group__items">
              {recentItems.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
