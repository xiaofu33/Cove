/**
 * 当前会话任务面板 (CurrentTaskPanel)
 * 遵循 Codex 风格与 Apple HIG 规范：以清晰紧凑的步骤树呈现任务目标与进度，
 * 状态同时以“符号 + 文字 + 颜色”三重表征。
 */

import type { Task, TaskStatus } from '../api/types'
import { Icon } from './Icon'

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: '等待确认',
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

const STATUS_ORDER: Record<TaskStatus, number> = {
  active: 0,
  pending: 1,
  paused: 2,
  failed: 3,
  completed: 4,
  cancelled: 5,
}

function progress(task: Task): { done: number; total: number; percent: number } {
  const total = task.steps.length
  const done = task.steps.filter((step) => step.status === 'done').length
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
}

function currentStep(task: Task): string | null {
  return (
    task.steps.find((step) => step.status === 'in_progress')?.title ??
    task.steps.find((step) => step.status === 'blocked')?.title ??
    task.steps.find((step) => step.status === 'todo')?.title ??
    null
  )
}

export function orderConversationTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    const status = STATUS_ORDER[left.status] - STATUS_ORDER[right.status]
    return status || right.updated_at.localeCompare(left.updated_at)
  })
}

export default function CurrentTaskPanel({ tasks }: { tasks: Task[] }): React.JSX.Element | null {
  const ordered = orderConversationTasks(tasks)
  const current = ordered[0]
  if (!current) return null
  const currentProgress = progress(current)
  const step = currentStep(current)

  return (
    <section className="current-task-panel" aria-label="当前会话任务">
      <details>
        <summary>
          <span className={`current-task-panel__icon current-task-panel__icon--${current.status}`}>
            <Icon name="runs" size={15} />
          </span>
          <div className="current-task-panel__identity">
            <small>当前任务 · {STATUS_LABEL[current.status]}</small>
            <strong>{current.title}</strong>
            {step ? <span>当前步骤：{step}</span> : null}
          </div>
          <div className="current-task-panel__progress">
            <span>
              {currentProgress.total > 0
                ? `${currentProgress.done}/${currentProgress.total}`
                : '暂无步骤'}
            </span>
            <i>
              <b style={{ width: `${currentProgress.percent}%` }} />
            </i>
          </div>
          {ordered.length > 1 ? (
            <span className="current-task-panel__count">{ordered.length} 个任务</span>
          ) : null}
          <Icon name="chevronDown" size={15} />
        </summary>

        <div className="current-task-panel__body">
          {ordered.map((task) => {
            const taskProgress = progress(task)
            return (
              <details key={task.id} className="current-task-item" open={task.id === current.id}>
                <summary>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{STATUS_LABEL[task.status]}</span>
                  </div>
                  <span>
                    {taskProgress.total > 0
                      ? `${taskProgress.done}/${taskProgress.total}`
                      : '无步骤'}
                  </span>
                  <Icon name="chevronDown" size={14} />
                </summary>
                <div className="current-task-item__details">
                  {task.goal ? (
                    <p className="current-task-item__goal">{task.goal}</p>
                  ) : task.description ? (
                    <p className="current-task-item__goal">{task.description}</p>
                  ) : null}
                  {task.steps.length > 0 ? (
                    <ol className="current-task-step-list">
                      {task.steps.map((taskStep, index) => (
                        <li
                          key={taskStep.id ?? index}
                          className={`current-task-step current-task-step--${taskStep.status}`}
                        >
                          <span
                            className="current-task-step__badge"
                            aria-label={`状态: ${taskStep.status}`}
                          >
                            {taskStep.status === 'done'
                              ? '✓'
                              : taskStep.status === 'blocked'
                                ? '!'
                                : taskStep.status === 'in_progress'
                                  ? '●'
                                  : '○'}
                          </span>
                          <div className="current-task-step__content">
                            <strong>{taskStep.title}</strong>
                            {taskStep.note ? <small>{taskStep.note}</small> : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <span className="empty-inline">该任务还没有拆分步骤。</span>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      </details>
    </section>
  )
}
