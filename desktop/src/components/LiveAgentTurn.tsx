/** Persistent AgentTurn：同一组件承载实时执行与完成后的 Work Record。 */

import { useMemo } from 'react'
import type { AgentEvent } from '../api/types'
import {
  buildTurnView,
  formatCacheHitRate,
  formatDuration,
  formatTokens,
  type ToolStepVM,
} from '../agent/turnPresentation'
import { useEventsStore } from '../stores/events'
import { AssistantContent } from './AssistantContent'
import AssistantReasoning from './AssistantReasoning'
import FileDiffCard from './FileDiffCard'
import TerminalCommandCard from './TerminalCommandCard'

const STATUS = {
  thinking: { label: '正在思考', tone: 'working' },
  working: { label: '正在思考', tone: 'working' },
  waiting_approval: { label: '正在思考', tone: 'working' },
  verifying: { label: '正在思考', tone: 'working' },
  completed: { label: '已完成', tone: 'completed' },
  failed: { label: '已停止', tone: 'failed' },
  interrupted: { label: '已中断', tone: 'failed' },
  cancelled: { label: '已取消', tone: 'cancelled' },
} as const

/** 从 ToolStepVM 解析出文件修改或终端命令卡片 */
function renderToolCard(tool: ToolStepVM): React.JSX.Element | null {
  const isFileTool = ['write_file', 'edit_file', 'patch_file', 'create_file'].includes(tool.name)
  const isTerminalTool = ['run_shell_command', 'run_command', 'bash', 'terminal'].includes(tool.name)

  if (isFileTool) {
    let path = 'file'
    let diffContent: string | undefined
    try {
      const parsed = JSON.parse(tool.details)
      path = parsed.path || parsed.Path || parsed.file || parsed.filename || path
      diffContent = parsed.diff || parsed.content || parsed.patch || parsed.Replacement
    } catch {
      /* 忽略解析错误 */
    }
    const action = tool.name === 'create_file' ? '已创建' : tool.name === 'write_file' ? '已写入' : '已编辑'
    return (
      <FileDiffCard
        key={tool.id}
        path={path}
        action={action}
        diff={diffContent}
      />
    )
  }

  if (isTerminalTool) {
    let command = 'command'
    try {
      const parsed = JSON.parse(tool.details)
      command = parsed.command || parsed.CommandLine || parsed.cmd || command
    } catch {
      /* 忽略解析错误 */
    }
    const status =
      tool.state === 'active' || tool.state === 'waiting'
        ? 'running'
        : tool.state === 'done'
          ? 'completed'
          : 'failed'
    return (
      <TerminalCommandCard
        key={tool.id}
        command={command}
        status={status}
        durationMs={tool.durationMs}
        output={tool.resultDetails}
      />
    )
  }

  return null
}

export default function LiveAgentTurn({
  runId,
  step,
  events,
  settling = false,
  streamText,
  onRecover,
  onInspect,
}: {
  runId: string | null
  step: number | null
  events: AgentEvent[]
  settling?: boolean
  streamText?: string
  onRecover?: () => void
  onInspect?: () => void
}): React.JSX.Element {
  const liveText = useEventsStore((state) =>
    runId && step !== null && step !== undefined
      ? (state.streamTextByRun[runId]?.[step] ?? '')
      : '',
  )
  const liveReasoning = useEventsStore((state) =>
    runId && step !== null && step !== undefined
      ? (state.reasoningByRun[runId]?.[step] ?? '')
      : '',
  )
  const view = buildTurnView(events, { now: Date.now() })
  const status = STATUS[view.status]
  const terminal = ['completed', 'failed', 'interrupted', 'cancelled'].includes(
    view.status,
  )
  const text = streamText !== undefined ? streamText : liveText || view.finalText

  const toolCards = useMemo(() => {
    return view.tools
      .map((tool) => renderToolCard(tool))
      .filter((card): card is React.JSX.Element => card !== null)
  }, [view.tools])

  return (
    <section
      className={`agent-turn live-turn agent-turn--${view.status}${settling ? ' live-turn--settling' : ''}`}
      aria-live="polite"
      aria-label="Vesta Agent Turn"
      data-status={view.status}
    >
      <header className="agent-turn__header">
        <div className="message-assistant__author">
          <span
            className={`message-assistant__avatar${!terminal ? ' message-assistant__avatar--busy' : ''}`}
            aria-hidden="true"
          />
          Vesta
        </div>
        {view.status !== 'completed' ? (
          <span className={`agent-turn__status agent-turn__status--${status.tone}`}>
            {status.label}
          </span>
        ) : null}
      </header>

      {/* 顶部思考/执行耗时栏：渲染为单行无边框纯文本 Worked for ... › */}
      {view.durationMs !== null ? (
        <div
          className="agent-turn__worked-summary"
          onClick={onInspect}
          role={onInspect ? 'button' : undefined}
          tabIndex={onInspect ? 0 : undefined}
        >
          Worked for {formatDuration(view.durationMs)} ›
        </div>
      ) : null}

      {/* 思考过程折叠栏：仅当存在流式思考且不为空时内联呈现 */}
      {liveReasoning ? (
        <div className="agent-turn__reasoning">
          <AssistantReasoning
            text={liveReasoning}
            busy={!terminal && !text}
            durationMs={view.durationMs}
          />
        </div>
      ) : null}

      {/* 工具卡片流：文件修改与终端命令卡片组 */}
      {toolCards.length > 0 ? (
        <div className="tool-cards-group">
          {toolCards}
        </div>
      ) : null}

      {view.error ? (
        <div className="agent-turn__error">
          <strong>{view.error.title}</strong>
          <p>{view.error.message}</p>
          {view.error.technical ? (
            <details className="agent-turn__error-details">
              <summary>查看技术详情</summary>
              <code>{view.error.technical}</code>
            </details>
          ) : null}
          <div className="agent-turn__error-actions">
            {view.status === 'interrupted' && onRecover ? (
              <button className="btn btn-primary btn-sm" onClick={onRecover}>
                恢复执行
              </button>
            ) : null}
            {onInspect ? (
              <button className="btn btn-sm" onClick={onInspect}>查看详情</button>
            ) : null}
          </div>
        </div>
      ) : text ? (
        <div className="live-turn__response agent-turn__response">
          <AssistantContent content={text} streaming={!terminal} />
          {!terminal ? <span className="stream-cursor" aria-hidden="true" /> : null}
        </div>
      ) : !terminal ? (
        <div className="live-turn__waiting">
          正在思考
        </div>
      ) : null}

      {view.steps > 0 || view.toolCount > 0 || view.usage || view.durationMs !== null ? (
        <footer className="turn-usage agent-turn__footer">
          第 {view.steps} 步
          {' · '}{view.toolCount} 次操作
          {view.usage ? (
            <>
              {' · '}输入 {formatTokens(view.usage.inputTokens)}
              {' · '}输出 {formatTokens(view.usage.outputTokens)}
              {' · '}缓存 {formatCacheHitRate(view.usage.cacheHitRate)}
            </>
          ) : null}
          {view.durationMs !== null ? ` · ${formatDuration(view.durationMs)}` : ''}
          {view.targetApp ? ` · 目标 ${view.targetApp}` : ''}
        </footer>
      ) : null}
    </section>
  )
}
