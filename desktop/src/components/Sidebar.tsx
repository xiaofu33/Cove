/** 48px Desktop Mini Activity Bar：对标 Codex 的纯图标沉浸式活动栏。 */

import type { ReactElement } from 'react'
import type { PageKey } from '../App'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { Tooltip } from './Tooltip'

export interface SidebarItem {
  key: PageKey
  label: string
  icon: IconName
  shortcut?: string
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'runs', label: '执行历史', icon: 'clock', shortcut: '⌘2' },
  { key: 'memory', label: '长期记忆', icon: 'book', shortcut: '⌘3' },
  { key: 'approvals', label: '审批', icon: 'approvals', shortcut: '⌘4' },
  { key: 'automations', label: '自动化', icon: 'automations', shortcut: '⌘5' },
  { key: 'artifacts', label: '交付物', icon: 'artifacts', shortcut: '⌘6' },
  { key: 'computer', label: '电脑', icon: 'computer', shortcut: '⌘7' },
]

export interface SidebarProps {
  current: PageKey
  onNavigate: (page: PageKey) => void
  connected?: boolean
  /** 各导航项徽标（数字 >0 才显示），如 running run 数 / pending 审批数。 */
  badges?: Partial<Record<PageKey, number>>
  /** 背景状态点（非常克制）：Chat running、Artifacts 有新结果等。 */
  dots?: Partial<Record<PageKey, boolean>>
}

export default function Sidebar({
  current,
  onNavigate,
  connected: _connected,
  badges,
  dots,
}: SidebarProps): ReactElement {
  const badgeFor = (key: PageKey): number | null => {
    const value = badges?.[key]
    return typeof value === 'number' && value > 0 ? value : null
  }

  // 主页即是聊天工作区
  const isChatActive = current === 'chat'

  return (
    <nav className="sidebar sidebar--mini" aria-label="Vesta 主导航">
      {/* 顶部主页 (即聊天工作区)：未选中为正常图标，选中后内部染黑 */}
      <div className="sidebar-brand-wrap">
        <Tooltip content="工作区" shortcut="⌘1" side="right">
          <button
            type="button"
            className={`nav-item nav-item--home ${isChatActive ? 'active' : ''}`}
            onClick={() => onNavigate('chat')}
            aria-current={isChatActive ? 'page' : undefined}
            aria-label="工作区"
            title="工作区"
          >
            <span className="nav-item__icon-wrap">
              <Icon name="home" size={20} filled={isChatActive} />
              {badgeFor('chat') !== null ? (
                <span className="nav-badge" aria-label={`${badgeFor('chat')}`}>
                  {badgeFor('chat')! > 99 ? '99+' : badgeFor('chat')}
                </span>
              ) : dots?.chat ? (
                <span className="nav-badge nav-badge--dot" aria-hidden="true" />
              ) : null}
            </span>
          </button>
        </Tooltip>
      </div>

      {/* 主导航图标列表：未选中正常图标，选中后内部染黑 */}
      <div className="sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => {
          const isItemActive = current === item.key
          return (
            <Tooltip key={item.key} content={item.label} shortcut={item.shortcut} side="right">
              <button
                type="button"
                className={`nav-item ${isItemActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
                aria-current={isItemActive ? 'page' : undefined}
                aria-label={item.label}
                title={item.label}
              >
                <span className="nav-item__icon-wrap">
                  <Icon name={item.icon} size={20} filled={isItemActive} />
                  {badgeFor(item.key) !== null ? (
                    <span className="nav-badge" aria-label={`${badgeFor(item.key)}`}>
                      {badgeFor(item.key)! > 99 ? '99+' : badgeFor(item.key)}
                    </span>
                  ) : dots?.[item.key] ? (
                    <span className="nav-badge nav-badge--dot" aria-hidden="true" />
                  ) : null}
                </span>
              </button>
            </Tooltip>
          )
        })}
      </div>

      {/* 底部设置、Host 状态与个人头像 */}
      <div className="sidebar-footer">
        <Tooltip content="偏好设置" shortcut="⌘," side="right">
          <button
            type="button"
            className={`nav-item ${current === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
            aria-current={current === 'settings' ? 'page' : undefined}
            aria-label="设置"
            title="设置"
          >
            <span className="nav-item__icon-wrap">
              <Icon name="settings" size={20} filled={current === 'settings'} />
            </span>
          </button>
        </Tooltip>

        <Tooltip content="个人工作区 (Vesta)" side="right">
          <div className="sidebar-avatar" title="当前工作区 (Vesta)" aria-label="当前工作区 (Vesta)">
            <span className="sidebar-avatar__inner">U</span>
          </div>
        </Tooltip>
      </div>
    </nav>
  )
}
