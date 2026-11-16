/**
 * Plan Mode 独立计划确认卡片 (PlanCard)
 * 遵循 Codex 风格与 Apple HIG 规范：呈现结构化步骤蓝图，提供明确的批准与拒绝决策，
 * 与普通系统权限审批在视觉和交互上保持明确区分。
 */

import type { ReactElement } from 'react'
import type { Task } from '../api/types'
import { Icon } from './Icon'

export default function PlanCard({
  task,
  busy = false,
  onAccept,
  onReject,
}: {
  task: Task
  busy?: boolean
  onAccept: (id: string) => void
  onReject: (id: string) => void
}): ReactElement {
  return (
    <section className="plan-card" data-testid="plan-card" aria-label="执行计划确认">
      <div className="plan-card__eyebrow">
        <Icon name="runs" size={14} />
        <span>Plan</span>
        <span className="plan-card__steps-count">{task.steps.length} 个规划步骤</span>
      </div>
      <h2 className="plan-card__title">{task.title}</h2>
      {task.goal ? <p className="plan-card__goal">{task.goal}</p> : null}

      <ol className="plan-card__steps">
        {task.steps.map((step, index) => (
          <li key={step.id ?? index} className="plan-card__step-item">
            <span className="plan-card__step-number">{index + 1}</span>
            <div className="plan-card__step-content">
              <strong>{step.title}</strong>
              {step.note ? <small className="plan-card__step-note">{step.note}</small> : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="plan-card__actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => onAccept(task.id)}
          aria-label="批准并执行计划"
          title="批准并执行计划"
        >
          {busy ? <span className="spinner spinner--light" /> : <Icon name="check" size={14} />}
          <span>Accept plan</span>
        </button>
        <button
          type="button"
          className="btn btn-text-danger"
          disabled={busy}
          onClick={() => onReject(task.id)}
          aria-label="拒绝计划"
          title="拒绝计划"
        >
          <span>Reject</span>
        </button>
      </div>
    </section>
  )
}
