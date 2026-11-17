/** Codex 桌面端极简原生风格终端命令执行卡片。
 * - 浅灰低对比卡片背景，顶栏高 32px。
 * - 左侧展示终端提示符 $ 与命令内容（单行省略）。
 * - 右侧展示状态（运行中 Spinner、耗时或 Exit 1）与折叠小箭头。
 * - 展开区展示纯文本终端命令输出。
 */

import { useState } from 'react'
import type { ReactElement } from 'react'
import { Icon } from './Icon'
import { formatDuration } from '../agent/turnPresentation'

export interface TerminalCommandCardProps {
  /** 终端执行的具体命令行 */
  command: string
  /** 命令执行状态 */
  status?: 'running' | 'completed' | 'failed'
  /** 执行耗时（毫秒） */
  durationMs?: number | null
  /** 退出码，非 0 表示失败 */
  exitCode?: number | null
  /** 命令输出内容 */
  output?: string | null
  /** 默认是否展开输出，默认为 false */
  defaultOpen?: boolean
}

export default function TerminalCommandCard({
  command,
  status = 'completed',
  durationMs = null,
  exitCode = 0,
  output,
  defaultOpen = false,
}: TerminalCommandCardProps): ReactElement {
  const [open, setOpen] = useState(defaultOpen)
  const isFailed = status === 'failed' || (exitCode !== null && exitCode !== undefined && exitCode !== 0)
  const isRunning = status === 'running'
  const hasOutput = Boolean(output && output.trim().length > 0)

  return (
    <div
      className={`terminal-command-card${open ? ' terminal-command-card--open' : ''}${isFailed ? ' terminal-command-card--failed' : ''}`}
      data-testid="terminal-command-card"
    >
      <div
        className="terminal-command-card__header"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`终端命令: ${command}`}
        onClick={() => {
          if (hasOutput) {
            setOpen((v) => !v)
          }
        }}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && hasOutput) {
            event.preventDefault()
            setOpen((v) => !v)
          }
        }}
      >
        <div className="terminal-command-card__left">
          <span className="terminal-command-card__prompt">$</span>
          <span className="terminal-command-card__command" title={command}>
            {command}
          </span>
        </div>

        <div className="terminal-command-card__status">
          {isRunning ? (
            <span className="terminal-command-card__spinner" aria-label="执行中" />
          ) : isFailed ? (
            <span className="terminal-command-card__exit-code">
              Exit {exitCode || 1}
            </span>
          ) : durationMs !== null ? (
            <span className="terminal-command-card__duration">
              {formatDuration(durationMs)}
            </span>
          ) : (
            <span className="terminal-command-card__dot" aria-hidden="true" />
          )}

          {hasOutput ? (
            <span className="terminal-command-card__chevron">
              <Icon name="chevronRight" size={12} strokeWidth={1.6} />
            </span>
          ) : null}
        </div>
      </div>

      {open && hasOutput ? (
        <div className="terminal-command-card__output">
          <code>{output}</code>
        </div>
      ) : null}
    </div>
  )
}
