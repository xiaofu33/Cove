/**
 * 统一审批卡片 (ApprovalCard)
 * 遵循 Codex 风格与 Apple HIG 规范：操作类型、参数与风险等级清晰分离，
 * 提供 Prominent / Destructive 规范化按钮（按钮高度 ≥ 28pt）与键盘快捷提示。
 */

import type { ReactElement } from 'react'
import type { ApprovalRequest } from '../api/types'
import {
  computerActionDescription,
  computerActionLabel,
  isDesktopApproval,
} from '../approval/computerApproval'
import { Icon } from './Icon'
import { Button } from './ui'

export interface ApprovalCardProps {
  approval: ApprovalRequest
  busy?: boolean
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}

function sandboxApprovalLabel(approval: ApprovalRequest): string {
  if (['run_shell_command', 'run_command'].includes(approval.tool_name)) {
    return '执行终端命令'
  }
  if (approval.tool_name === 'http_request') return '访问外部网络'
  return '执行敏感操作'
}

function sandboxApprovalDescription(approval: ApprovalRequest): string {
  if (['run_shell_command', 'run_command'].includes(approval.tool_name)) {
    return 'Vesta 需要在本地终端执行以下命令。请确认命令内容和影响后再允许。'
  }
  if (approval.tool_name === 'http_request') {
    return 'Vesta 需要向外部服务发送网络请求。请确认目标和参数后再允许。'
  }
  return '这项操作可能修改本地环境或访问外部资源，请确认后再继续。'
}

function commandPreview(approval: ApprovalRequest): string | null {
  if (!['run_shell_command', 'run_command'].includes(approval.tool_name)) {
    return null
  }
  const command = approval.arguments?.command
  return typeof command === 'string' && command.trim() ? command.trim() : null
}

export default function ApprovalCard({
  approval,
  busy = false,
  onApprove,
  onDeny,
}: ApprovalCardProps): ReactElement {
  const desktop = isDesktopApproval(approval)
  const title = desktop
    ? computerActionLabel(approval)
    : sandboxApprovalLabel(approval)
  const description = desktop
    ? computerActionDescription(approval)
    : sandboxApprovalDescription(approval)
  const command = commandPreview(approval)
  const argsText = (() => {
    try {
      return JSON.stringify(approval.arguments, null, 2)
    } catch {
      return String(approval.arguments)
    }
  })()

  const isHighRisk = ['run_shell_command', 'run_command'].includes(approval.tool_name)

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (busy) return
    if (e.key === 'Escape') {
      e.preventDefault()
      onDeny(approval.id)
    } else if (e.key === 'Enter' && (e.metaKey || !isHighRisk)) {
      e.preventDefault()
      onApprove(approval.id)
    }
  }

  return (
    <div
      className={`approval-card ${isHighRisk ? 'approval-card--high-risk' : ''}`}
      data-testid="approval-card"
      aria-label="权限审批确认"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="approval-card__heading">
        <span className="approval-card__icon" aria-hidden="true">
          <Icon name="approvals" size={17} />
        </span>
        <div className="approval-card__identity">
          <div className="approval-card__eyebrow">
            <span>需要你的确认</span>
            <span className="approval-card__risk-badge">
              {isHighRisk ? '终端权限' : desktop ? '电脑控制' : '外部请求'}
            </span>
          </div>
          <div className="approval-card__title">允许“{title}”吗？</div>
          <div className="approval-card__desc">{description}</div>
        </div>
      </div>

      {command ? (
        <div className="approval-card__command">
          <span className="approval-card__command-label">即将执行</span>
          <code className="approval-card__command-code mono">{command}</code>
        </div>
      ) : null}

      {approval.reason ? (
        <div className="approval-card__reason">{approval.reason}</div>
      ) : null}

      {argsText ? (
        <details className="approval-card__details">
          <summary>查看技术详情</summary>
          <div className="approval-card__tech mono">工具：{approval.tool_name}</div>
          <pre className="approval-card__json mono">{argsText}</pre>
        </details>
      ) : null}

      <div className="approval-card__actions">
        <Button
          variant="danger"
          size="sm"
          disabled={busy}
          onClick={() => onDeny(approval.id)}
          aria-label="拒绝此项操作"
          title="拒绝执行此操作 (Esc)"
        >
          拒绝
        </Button>
        <Button
          variant={isHighRisk ? 'default' : 'primary'}
          size="sm"
          disabled={busy}
          onClick={() => onApprove(approval.id)}
          aria-label="允许执行此操作"
          title={isHighRisk ? '高风险操作，请确认后点击或按 ⌘⏎ 允许' : '允许执行此操作 (⏎)'}
          className={isHighRisk ? 'approval-card__btn--caution' : ''}
        >
          {busy ? <span className="spinner spinner--light" /> : <Icon name="check" size={13} />}
          <span>允许执行</span>
        </Button>
      </div>
    </div>
  )
}
