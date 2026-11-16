import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import { listApprovals } from './api/approvals'
import { listArtifacts } from './api/artifacts'
import { getComputerStatus } from './api/computer'
import { useEventsStore } from './stores/events'
import { createDesktopNotificationController } from './notifications/desktop'
import Sidebar from './components/Sidebar'
import { ToastViewport } from './components/ToastViewport'
import ApprovalsPage from './pages/ApprovalsPage'
import ArtifactsPage from './pages/ArtifactsPage'
import AutomationsPage from './pages/AutomationsPage'
import ChatPage from './pages/ChatPage'
import ComputerPage from './pages/ComputerPage'
import MemoryPage from './pages/MemoryPage'
import RunDetailPage from './pages/RunDetailPage'
import RunsPage from './pages/RunsPage'
import SettingsPage from './pages/SettingsPage'
import { Icon } from './components/Icon'

export type PageKey =
  | 'chat'
  | 'runs'
  | 'automations'
  | 'approvals'
  | 'artifacts'
  | 'computer'
  | 'memory'
  | 'settings'

export interface AppState {
  page: PageKey
  selectedRunId: string | null
  navigate: (page: PageKey) => void
  openRun: (runId: string) => void
}

const PAGE_TITLES: Record<PageKey, string> = {
  chat: '工作区',
  runs: '执行历史',
  automations: '自动化',
  approvals: '审批',
  artifacts: '交付物',
  computer: '电脑',
  memory: '长期记忆',
  settings: '设置',
}

export default function App(): React.JSX.Element {
  const [page, setPage] = useState<PageKey>('chat')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [everConnected, setEverConnected] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const connect = useEventsStore((state) => state.connect)
  const disconnect = useEventsStore((state) => state.disconnect)
  const connected = useEventsStore((state) => state.connected)
  const runStatuses = useEventsStore((state) => state.runStatuses)

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  useEffect(() => {
    if (connected) setEverConnected(true)
  }, [connected])

  useEffect(() => {
    const controller = createDesktopNotificationController()
    controller?.start()
    return () => controller?.stop()
  }, [])

  const pendingApprovalsQuery = useQuery({
    queryKey: ['sidebar-approvals'],
    queryFn: () => listApprovals('pending'),
    refetchInterval: 4000,
  })

  // 侧栏背景状态：最近有新交付物（very light，不刷 dashboard 数字墙）。
  const artifactsIndicatorQuery = useQuery({
    queryKey: ['rail-artifacts'],
    queryFn: () => listArtifacts({ limit: 1 }),
    refetchInterval: 6000,
  })
  const hasArtifacts = (artifactsIndicatorQuery.data?.length ?? 0) > 0
  const computerIndicatorQuery = useQuery({
    queryKey: ['computer-status'],
    queryFn: getComputerStatus,
    refetchInterval: 3000,
    retry: false,
  })
  const computerActive = Boolean(computerIndicatorQuery.data?.lease?.busy)

  // 实时 running run 数（来自 run.status 事件）+ pending 审批数 → 侧栏徽标。
  const runningCount = Object.values(runStatuses).filter(
    (status) => status === 'running',
  ).length
  const pendingApprovalCount = pendingApprovalsQuery.data?.length ?? 0

  const navigate = useCallback((next: PageKey): void => {
    setPage(next)
    if (next !== 'runs') setSelectedRunId(null)
  }, [])

  const openRun = useCallback((runId: string): void => {
    setSelectedRunId(runId)
    setPage('runs')
  }, [])

  const openConversation = useCallback((conversationId: string): void => {
    setSelectedConversationId(conversationId)
    setSelectedRunId(null)
    setPage('chat')
  }, [])

  // macOS 全局快捷键处理 (Cmd+, 设置, Cmd+Option+S 切换侧边栏)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (cmdOrCtrl && e.key === ',') {
        e.preventDefault()
        navigate('settings')
      } else if (cmdOrCtrl && e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        setSidebarCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--sidebar-collapsed' : ''}`}>
      {!sidebarCollapsed && (
        <Sidebar
          current={page}
          onNavigate={navigate}
          connected={connected}
          badges={{
            runs: runningCount,
            approvals: pendingApprovalCount,
          }}
          dots={{
            chat: runningCount > 0,
            artifacts: hasArtifacts,
            computer: computerActive,
          }}
        />
      )}
      <div className="main">
        {/* macOS 原生风格顶栏工具条 */}
        <header className="window-toolbar" role="banner" aria-label="应用工具栏">
          <div className="window-toolbar__left">
            <button
              type="button"
              className="window-toolbar__btn"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              title={sidebarCollapsed ? '展开主导航 (⌥⌘S)' : '折叠主导航 (⌥⌘S)'}
              aria-label={sidebarCollapsed ? '展开主导航' : '折叠主导航'}
            >
              <Icon name={sidebarCollapsed ? 'panelOpen' : 'panelClose'} size={15} />
            </button>
            <div className="window-toolbar__title">
              <span className="window-toolbar__page-title">{PAGE_TITLES[page]}</span>
              {page === 'runs' && selectedRunId && (
                <span className="window-toolbar__subtitle">/ 详情</span>
              )}
            </div>
          </div>

          <div className="window-toolbar__right">
            {runningCount > 0 && (
              <div
                className="window-toolbar__status-capsule window-toolbar__status-capsule--running"
                title={`${runningCount} 个任务执行中`}
              >
                <span className="window-toolbar__status-dot pulse" />
                <span>{runningCount} 正在运行</span>
              </div>
            )}
            <div
              className={`window-toolbar__status-capsule ${connected ? 'window-toolbar__status-capsule--connected' : 'window-toolbar__status-capsule--offline'}`}
              title={connected ? 'Host 服务已连接' : 'Host 服务离线中'}
            >
              <span
                className={`window-toolbar__status-dot ${connected ? 'window-toolbar__status-dot--ready' : 'window-toolbar__status-dot--offline'}`}
              />
              <span>{connected ? 'Host 就绪' : 'Host 离线'}</span>
            </div>
            {page !== 'settings' && (
              <button
                type="button"
                className="window-toolbar__btn"
                onClick={() => navigate('settings')}
                title="设置 (⌘,)"
                aria-label="打开设置"
              >
                <Icon name="settings" size={15} />
              </button>
            )}
          </div>
        </header>

        {!connected && everConnected ? (
          <div className="host-banner" role="status">
            <span className="host-banner__dot" />
            Host 连接已断开，正在重连…
          </div>
        ) : null}
        {page === 'chat' && (
          <ChatPage
            onNavigate={navigate}
            onOpenRun={openRun}
            initialConversationId={selectedConversationId}
            onConversationChange={setSelectedConversationId}
          />
        )}
        {page === 'runs' &&
          (selectedRunId ? (
            <RunDetailPage
              runId={selectedRunId}
              onBack={() => setSelectedRunId(null)}
              onOpenConversation={openConversation}
            />
          ) : (
            <RunsPage openRun={openRun} />
          ))}
        {page === 'automations' && <AutomationsPage />}
        {page === 'approvals' && <ApprovalsPage />}
        {page === 'artifacts' && <ArtifactsPage />}
        {page === 'computer' && <ComputerPage />}
        {page === 'memory' && <MemoryPage />}
        {page === 'settings' && <SettingsPage />}
      </div>
      <ToastViewport />
    </div>
  )
}
