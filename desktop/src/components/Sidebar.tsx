/** 48px Desktop Mini Activity Bar：对标 Codex 的纯图标沉浸式活动栏。 */

import type { ReactElement } from 'react'
import type { PageKey } from '../App'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { StatusDot } from './ui'

export interface SidebarItem {
  key: PageKey
  label: string
  icon: IconName
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'chat', label: '工作区', icon: 'chat' },
  { key: 'runs', label: '执行历史', icon: 'clock' },
  { key: 'memory', label: '长期记忆', icon: 'book' },
  { key: 'approvals', label: '审批', icon: 'approvals' },
  { key: 'automations', label: '自动化', icon: 'automations' },
  { key: 'artifacts', label: '交付物', icon: 'artifacts' },
  { key: 'computer', label: '电脑', icon: 'computer' },
]

export interface SidebarProps {
  current: PageKey
  onNavigate: (page: PageKey) => void
  connected: boolean
  /** 各导航项徽标（数字 >0 才显示），如 running run 数 / pending 审批数。 */
  badges?: Partial<Record<PageKey, number>>
  /** 背景状态点（非常克制）：Chat running、Artifacts 有新结果等。 */
  dots?: Partial<Record<PageKey, boolean>>
}

export default function Sidebar({
  current,
  onNavigate,
  connected,
  badges,
  dots,
}: SidebarProps): ReactElement {
  const badgeFor = (key: PageKey): number | null => {
    const value = badges?.[key]
    return typeof value === 'number' && value > 0 ? value : null
  }

  return (
    <nav className="sidebar sidebar--mini" aria-label="主导航">
      {/* 顶部微型品牌标记 */}
      <div className="sidebar-brand" aria-label="Vesta" title="Vesta">
        <span className="sidebar-brand__logo" aria-hidden="true">V</span>
      </div>

      {/* 主导航图标列表 */}
      <div className="sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`nav-item ${current === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
            aria-current={current === item.key ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
          >
            <span className="nav-item__icon-wrap">
              <Icon name={item.icon} size={18} />
              {badgeFor(item.key) !== null ? (
                <span className="nav-badge" aria-label={`${badgeFor(item.key)}`}>
                  {badgeFor(item.key)! > 99 ? '99+' : badgeFor(item.key)}
                </span>
              ) : dots?.[item.key] ? (
                <span className="nav-badge nav-badge--dot" aria-hidden="true" />
              ) : null}
            </span>
            <span className="nav-item__label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 底部设置、Host 状态与个人头像 */}
      <div className="sidebar-footer">
        <button
          type="button"
          className={`nav-item ${current === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          aria-current={current === 'settings' ? 'page' : undefined}
          title="设置"
          aria-label="设置"
        >
          <span className="nav-item__icon-wrap">
            <Icon name="settings" size={18} />
          </span>
          <span className="nav-item__label">设置</span>
        </button>

        <div
          className="host-status"
          title={connected ? 'Host 已连接' : 'Host 已离线'}
          aria-label={connected ? 'Host 就绪' : 'Host 离线'}
        >
          <StatusDot tone={connected ? 'ready' : 'offline'} />
        </div>

        <div className="sidebar-avatar" title="当前工作区 (Vesta)">
          <span className="sidebar-avatar__inner">U</span>
        </div>
      </div>
    </nav>
  )
}
