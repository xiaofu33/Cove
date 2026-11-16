/**
 * Execution Trace：按步骤与事件类别查看完整技术轨迹。
 * 遵循渐进式披露 (Progressive Disclosure) 原则：默认展示紧凑事件摘要与耗时，
 * 点击展开查看原始入参与 JSON 结构。
 */

import { useMemo, useState } from 'react'

import type { AgentEvent } from '../api/types'
import { buildTraceGroups } from '../agent/runAnalysis'
import { formatDuration, formatTokens } from '../agent/turnPresentation'
import { EmptyState } from './ui'
import { Icon } from './Icon'

type TraceFilter = 'all' | 'model' | 'tools' | 'approval' | 'memory'

const FILTERS: Array<{ id: TraceFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'model', label: 'Model' },
  { id: 'tools', label: 'Tools' },
  { id: 'approval', label: 'Approval' },
  { id: 'memory', label: 'Memory' },
]

function matches(event: AgentEvent, filter: TraceFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'model') return event.type.startsWith('model_')
  if (filter === 'tools') return event.type.startsWith('tool_') && !event.type.includes('approval')
  if (filter === 'approval') return event.type.includes('approval')
  return event.type.startsWith('memory_')
}

function time(iso: string): string {
  const value = new Date(iso)
  return Number.isNaN(value.getTime())
    ? iso
    : value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function eventMeta(event: AgentEvent): string {
  const parts: string[] = []
  if (event.tool_call?.name) parts.push(event.tool_call.name)
  if (event.tool_result) {
    parts.push(event.tool_result.success ? 'success' : 'failed')
    parts.push(formatDuration(event.tool_result.duration_ms))
  }
  if (event.usage) parts.push(`${formatTokens(event.usage.total_tokens)} tokens`)
  if (event.compaction_stage && event.compaction_stage !== 'none') {
    parts.push(event.compaction_stage.replaceAll('_', ' '))
  }
  return parts.join(' · ')
}

export default function ExecutionTrace({ events }: { events: AgentEvent[] }): React.JSX.Element {
  const [filter, setFilter] = useState<TraceFilter>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => events.filter((event) => matches(event, filter)), [events, filter])
  const groups = useMemo(() => buildTraceGroups(filtered), [filtered])

  const copyEventJson = async (eventId: string, raw: AgentEvent): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(raw, null, 2))
      setCopiedId(eventId)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="execution-trace" aria-label="执行轨迹检查器">
      <div className="trace-filters" aria-label="Trace filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? 'active' : ''}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        <EmptyState title="没有匹配的 Trace" hint="切换筛选条件查看其它事件。" />
      ) : (
        groups.map((group) => (
          <section key={group.id} className="trace-group">
            <h3 className="trace-group__title">{group.label}</h3>
            <div className="trace-events">
              {group.events.map((event) => {
                const isFailed =
                  event.type.includes('failed') ||
                  (event.tool_result !== null && !event.tool_result.success)
                const meta = eventMeta(event)

                return (
                  <details
                    key={event.event_id}
                    className={`trace-event trace-event--${isFailed ? 'failed' : 'normal'}`}
                  >
                    <summary className="trace-event__summary">
                      <time className="trace-event__time mono">{time(event.event_time)}</time>
                      <span className="trace-event__type">{event.type.replaceAll('_', ' ')}</span>
                      {meta ? <small className="trace-event__meta">{meta}</small> : null}
                      <Icon name="chevronDown" size={13} />
                    </summary>
                    <div className="trace-event__body">
                      <div className="trace-event__actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => void copyEventJson(event.event_id, event)}
                        >
                          <Icon name={copiedId === event.event_id ? 'check' : 'file'} size={12} />
                          <span>{copiedId === event.event_id ? '已复制 JSON' : '复制 JSON'}</span>
                        </button>
                      </div>
                      <pre className="trace-event__code mono">
                        {JSON.stringify(event, null, 2)}
                      </pre>
                    </div>
                  </details>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
