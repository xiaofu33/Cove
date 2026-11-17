import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import { listApprovals } from './api/approvals'
import { listArtifacts } from './api/artifacts'
import { getComputerStatus } from './api/computer'
import { getConversation } from './api/conversations'
import { useEventsStore } from './stores/events'
import { useWorkspaceStore } from './stores/workspace'
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
import type { IconName } from './components/Icon'
import { TrafficLights } from './components/TrafficLights'

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

const PAGE_ICONS: Record<PageKey, IconName> = {
  chat: 'chat',
  runs: 'clock',
  automations: 'automations',
  approvals: 'approvals',
  artifacts: 'artifacts',
  computer: 'computer',
  memory: 'book',
  settings: 'settings',
}

export default function App(): React.JSX.Element {
  const [page, setPage] = useState<PageKey>('chat')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [everConnected, setEverConnected] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatInspectorOpen, setChatInspectorOpen] = useState(false)
  const currentProject = useWorkspaceStore((state) => state.currentProject)

  // 会话历史导航栈（支持后退/前进）
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

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

  // 侧栏背景状态：最近有新交付物
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

  // 实时 running run 数 + pending 审批数
  const runningCount = Object.values(runStatuses).filter(
    (status) => status === 'running',
  ).length
  const pendingApprovalCount = pendingApprovalsQuery.data?.length ?? 0

  // 当前选中会话标题查询（供顶栏面包屑展示）
  const currentConversationQuery = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () =>
      selectedConversationId ? getConversation(selectedConversationId) : Promise.resolve(null),
    enabled: selectedConversationId !== null && page === 'chat',
  })

  const navigate = useCallback((next: PageKey): void => {
    setPage(next)
    if (next !== 'runs') setSelectedRunId(null)
  }, [])

  const openRun = useCallback((runId: string): void => {
    setSelectedRunId(runId)
    setPage('runs')
  }, [])

  const openConversation = useCallback(
    (conversationId: string): void => {
      setSelectedConversationId(conversationId)
      setSelectedRunId(null)
      setPage('chat')
      setHistory((prev) => {
        const next = [...prev.slice(0, historyIndex + 1), conversationId]
        return next
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex],
  )

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1

  const handleHistoryBack = useCallback((): void => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1
      setHistoryIndex(nextIndex)
      setSelectedConversationId(history[nextIndex])
      setPage('chat')
    }
  }, [history, historyIndex])

  const handleHistoryForward = useCallback((): void => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setSelectedConversationId(history[nextIndex])
      setPage('chat')
    }
  }, [history, historyIndex])

  // macOS 全局快捷键处理 (Cmd+, 设置, ⌥⌘S 切换侧边栏, ⌘N 新建聊天, ⌘[ / ⌘] 历史切换)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (cmdOrCtrl && e.key === ',') {
        e.preventDefault()
        navigate('settings')
      } else if (
        (cmdOrCtrl && (e.key === 'b' || e.key === 'B') && !e.shiftKey && !e.altKey) ||
        (cmdOrCtrl && e.altKey && (e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault()
        setSidebarCollapsed((prev) => !prev)
      } else if (cmdOrCtrl && (e.key === 'n' || e.key === 'N') && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        setSelectedConversationId(null)
        navigate('chat')
      } else if (cmdOrCtrl && e.key === '[') {
        e.preventDefault()
        handleHistoryBack()
      } else if (cmdOrCtrl && e.key === ']') {
        e.preventDefault()
        handleHistoryForward()
      } else if (cmdOrCtrl && e.key >= '1' && e.key <= '7' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        const keyMap: Record<string, PageKey> = {
          '1': 'chat',
          '2': 'runs',
          '3': 'memory',
          '4': 'approvals',
          '5': 'automations',
          '6': 'artifacts',
          '7': 'computer',
        }
        const targetPage = keyMap[e.key]
        if (targetPage) {
          navigate(targetPage)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, handleHistoryBack, handleHistoryForward])

  const currentTitle =
    page === 'chat'
      ? currentConversationQuery.data?.conversation?.title || '新会话'
      : PAGE_TITLES[page]

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--sidebar-collapsed' : ''}`}>
      {/* 贯穿全窗顶部的 macOS 原生风格状态/导航栏 */}
      <header className="window-toolbar" role="banner" aria-label="应用工具栏">
        <div className="window-toolbar__left">
          {/* Codex 风格 14px 原生饱满高保真红绿灯 */}
          <TrafficLights />

          <div className="window-toolbar__nav-buttons">
            <button
              type="button"
              className="window-toolbar__btn"
              onClick={handleHistoryBack}
              disabled={!canGoBack}
              title="后退 (⌘[)"
              aria-label="后退"
            >
              <Icon name="arrowLeft" size={15} />
            </button>
            <button
              type="button"
              className="window-toolbar__btn"
              onClick={handleHistoryForward}
              disabled={!canGoForward}
              title="前进 (⌘])"
              aria-label="前进"
            >
              <Icon name="arrowRight" size={15} />
            </button>
            <button
              type="button"
              className="window-toolbar__btn"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              title={sidebarCollapsed ? '展开侧边栏 (⌘B)' : '收起侧边栏 (⌘B)'}
              aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              <Icon name={sidebarCollapsed ? 'panelOpen' : 'panelClose'} size={15} />
            </button>
          </div>
        </div>

        {/* 顶部中央：当前会话/任务标题与小文件图标（像素级对齐 Codex） */}
        <div className="window-toolbar__center">
          <div className="window-toolbar__session">
            <Icon
              name={page === 'chat' ? 'file' : PAGE_ICONS[page]}
              size={13}
              className="window-toolbar__session-icon"
            />
            <span className="window-toolbar__session-title window-toolbar__page-title">{currentTitle}</span>
            {page === 'chat' && currentProject && (
              <span
                className="window-toolbar__project-badge"
                title={`当前工作区项目：${currentProject.name} (${currentProject.path})`}
              >
                <Icon name="folder" size={11} />
                <span>{currentProject.name}</span>
              </span>
            )}
            {page === 'runs' && selectedRunId && (
              <span className="window-toolbar__subtitle">/ 详情</span>
            )}
          </div>
        </div>

        {/* 顶部右侧：详情入口（右上角设置已移除，统一由左侧栏左下角提供） */}
        <div className="window-toolbar__right">
          {page === 'chat' && (
            <button
              type="button"
              className={`window-toolbar__btn window-toolbar__btn--detail ${chatInspectorOpen ? 'active' : ''}`}
              onClick={() => setChatInspectorOpen((prev) => !prev)}
              title="运行详情、上下文与执行轨迹"
              aria-label="详情"
            >
              <Icon name="activity" size={14} />
              <span>详情</span>
            </button>
          )}
        </div>
      </header>

      {/* 顶栏下方的主体：第一列 (Mini Activity Bar) + 第二列/内容区 */}
      <div className="app-shell__body">
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

        <div className="main">
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
              sidebarCollapsed={sidebarCollapsed}
              inspectorOpen={chatInspectorOpen}
              onToggleInspector={() => setChatInspectorOpen((prev) => !prev)}
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
      </div>
      <ToastViewport />
    </div>
  )
}
