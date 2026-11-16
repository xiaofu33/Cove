import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { listArtifacts } from '../api/artifacts'
import { SERVER_URL } from '../api/config'
import { getLatestComputerObservation } from '../api/computer'
import { cancelRun, getRun, getRunTrace, recoverRun } from '../api/runs'
import { buildTurnView, formatDuration, formatTokens, humanizeRunError } from '../agent/turnPresentation'
import ArtifactList from '../components/ArtifactList'
import ComputerObservationPanel from '../components/ComputerObservationPanel'
import ContextInspector from '../components/ContextInspector'
import { ConfirmDialog } from '../components/ConfirmDialog'
import ExecutionTrace from '../components/ExecutionTrace'
import { Icon } from '../components/Icon'
import { ErrorState, LoadingState } from '../components/PageStates'
import { PageShell } from '../components/PageShell'
import { ActivityItems } from '../components/RunActivity'
import RunBadge from '../components/RunBadge'
import UsageInspector from '../components/UsageInspector'
import { toast } from '../stores/toasts'

export default function RunDetailPage({
  runId,
  onBack,
  onOpenConversation,
}: {
  runId: string
  onBack: () => void
  onOpenConversation: (conversationId: string) => void
}): React.JSX.Element {
  const queryClient = useQueryClient()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const runQuery = useQuery({ queryKey: ['run', runId], queryFn: () => getRun(runId), refetchInterval: 3000 })
  const traceQuery = useQuery({ queryKey: ['run-trace', runId], queryFn: () => getRunTrace(runId), refetchInterval: 3000 })
  const computerQuery = useQuery({ queryKey: ['computer-observation', runId], queryFn: () => getLatestComputerObservation(runId), retry: false })
  const artifactsQuery = useQuery({ queryKey: ['artifacts', 'run', runId], queryFn: () => listArtifacts({ runId, limit: 100 }) })
  const run = runQuery.data
  const events = traceQuery.data?.events ?? []
  const turn = buildTurnView(events)
  const error = run && ['failed', 'interrupted'].includes(run.status)
    ? humanizeRunError(run.stop_reason, run.error)
    : null

  const cancel = async (): Promise<void> => {
    try {
      await cancelRun(runId)
      toast.info('执行已取消')
      void queryClient.invalidateQueries({ queryKey: ['run', runId] })
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setConfirmCancel(false)
    }
  }
  const recover = async (): Promise<void> => {
    try {
      const next = await recoverRun(runId)
      toast.success(`已恢复为新执行 ${next.run.id.slice(0, 8)}`)
      void queryClient.invalidateQueries({ queryKey: ['runs'] })
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <PageShell
      title="执行详情"
      subtitle={`执行 ID: ${runId.slice(0, 8)}`}
      maxWidth={1040}
      actions={
        <div className="page-actions">
          <button className="btn btn-sm" onClick={onBack} title="返回执行历史">
            <Icon name="panelOpen" size={14} /> 历史列表
          </button>
          {run ? <RunBadge status={run.status} /> : null}
          {run?.status === 'running' ? (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmCancel(true)}>
              终止执行
            </button>
          ) : null}
          {run?.status === 'interrupted' ? (
            <button className="btn btn-primary btn-sm" onClick={() => void recover()}>
              恢复执行
            </button>
          ) : null}
        </div>
      }
    >
      {runQuery.isPending || traceQuery.isPending ? (
        <LoadingState label="正在加载执行详情…" />
      ) : runQuery.isError || traceQuery.isError ? (
        <ErrorState message={String(runQuery.error ?? traceQuery.error)} />
      ) : run ? (
        <div className="run-detail">
          <section className="run-summary">
            <div className="section-heading">
              <div>
                <h2>概览</h2>
                <p>{run.user_message || '未命名执行'}</p>
              </div>
              {run.conversation_id ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onOpenConversation(run.conversation_id as string)}
                >
                  <Icon name="chat" size={14} /> 打开关联会话
                </button>
              ) : null}
            </div>
            {error ? (
              <div className="run-error">
                <strong>{error.title}</strong>
                <p>{error.message}</p>
              </div>
            ) : null}
            <dl className="stat-strip">
              <div><dt>状态</dt><dd>{run.status}</dd></div>
              <div><dt>模式</dt><dd>{run.mode === 'plan' ? '计划' : '普通'}</dd></div>
              <div><dt>步数</dt><dd>{turn.steps || traceQuery.data?.run.steps || 0}</dd></div>
              <div><dt>动作数</dt><dd>{turn.toolCount}</dd></div>
              <div><dt>Token</dt><dd>{turn.usage ? formatTokens(turn.usage.totalTokens) : formatTokens(traceQuery.data?.run.total_tokens ?? 0)}</dd></div>
              <div><dt>耗时</dt><dd>{formatDuration(turn.durationMs) || '—'}</dd></div>
            </dl>
          </section>

          <section className="run-detail-section">
            <div className="section-heading">
              <div>
                <h2>Token 用量</h2>
                <p>主 Agent、后处理、缓存命中与 Provider 总计</p>
              </div>
            </div>
            <UsageInspector summary={traceQuery.data?.usage} />
          </section>

          <section className="run-detail-section">
            <div className="section-heading">
              <div>
                <h2>执行时间线</h2>
                <p>按步骤展开的结构化动作轨迹</p>
              </div>
            </div>
            <ActivityItems events={events} />
          </section>

          <section className="run-detail-section">
            <div className="section-heading">
              <div>
                <h2>上下文</h2>
                <p>每步输入与上下文压缩情况</p>
              </div>
            </div>
            <ContextInspector events={events} />
          </section>

          <RunArtifactsSection artifacts={artifactsQuery.data ?? []} />

          {computerQuery.data?.observation ? (
            <section className="run-detail-section">
              <ComputerObservationPanel
                observation={computerQuery.data.observation}
                runId={computerQuery.data.run_id}
                eventTime={computerQuery.data.event_time}
                serverUrl={SERVER_URL}
                title="电脑操作记录"
              />
            </section>
          ) : null}

          <section className="run-detail-section">
            <div className="section-heading">
              <div>
                <h2>技术轨迹</h2>
                <p>底层完整事件序列与元数据</p>
              </div>
            </div>
            <dl className="technical-grid">
              <div><dt>Run ID</dt><dd className="mono">{run.id}</dd></div>
              <div><dt>会话 ID</dt><dd className="mono">{run.conversation_id ?? '—'}</dd></div>
              <div><dt>Provider</dt><dd>{traceQuery.data?.run.provider ?? '—'}</dd></div>
              <div><dt>Model</dt><dd>{traceQuery.data?.run.model ?? '—'}</dd></div>
              <div><dt>终止原因</dt><dd>{run.stop_reason ?? '—'}</dd></div>
              <div><dt>原始错误</dt><dd>{run.error ?? '—'}</dd></div>
            </dl>
            <ExecutionTrace events={events} />
          </section>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmCancel}
        title="终止本次执行？"
        message="Vesta 将在当前可取消的操作完成后停止执行。"
        confirmLabel="终止执行"
        onConfirm={() => void cancel()}
        onCancel={() => setConfirmCancel(false)}
      />
    </PageShell>
  )
}

export function RunArtifactsSection({
  artifacts,
}: {
  artifacts: Awaited<ReturnType<typeof listArtifacts>>
}): React.JSX.Element | null {
  if (artifacts.length === 0) return null
  return (
    <section className="run-detail-section">
      <div className="section-heading"><div><h2>交付物</h2><p>本次执行产生的文件与链接</p></div></div>
      <ArtifactList artifacts={artifacts} compact />
    </section>
  )
}
