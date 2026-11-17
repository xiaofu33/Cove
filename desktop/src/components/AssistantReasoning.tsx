/** Codex 桌面端极简原生风格思考过程折叠栏。
 * - 纯文本内联风格，无背景框、无外边框与阴影。
 * - 触发行带有小箭头和状态文案，思考中带有 Shimmer 流光渐变动画。
 * - 展开内容区左侧带有 1.5px 纯净竖线。
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { formatDuration } from '../agent/turnPresentation'
import { Icon } from './Icon'

export default function AssistantReasoning({
  text,
  autoExpand = false,
  busy = false,
  durationMs = null,
}: {
  text: string
  /** 思考仍在进行时置 true：自动展开并跟随 */
  autoExpand?: boolean
  /** 思考进行中（添加 Shimmer 流光动画与状态文案） */
  busy?: boolean
  /** 思考耗时 */
  durationMs?: number | null
}): ReactElement | null {
  const [open, setOpen] = useState(autoExpand)
  const [userPinned, setUserPinned] = useState(false)
  const prevAutoExpand = useRef(autoExpand)

  useEffect(() => {
    const wasAuto = prevAutoExpand.current
    prevAutoExpand.current = autoExpand
    if (autoExpand) {
      setUserPinned(false)
      setOpen(true)
    } else if (wasAuto && !autoExpand && !userPinned) {
      setOpen(false)
    }
  }, [autoExpand, userPinned])

  if (!text) return null

  const labelText = busy
    ? '思考中...'
    : durationMs !== null
      ? `已深度思考 ${formatDuration(durationMs)}`
      : '思考过程'

  return (
    <div
      className={`assistant-reasoning${open ? ' assistant-reasoning--open' : ''}${busy ? ' assistant-reasoning--busy' : ''}`}
      data-testid="assistant-reasoning"
    >
      <div
        className="assistant-reasoning__header"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? '收起思考过程' : '展示思考过程'}
        onClick={() => {
          setUserPinned(true)
          setOpen((value) => !value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setUserPinned(true)
            setOpen((value) => !value)
          }
        }}
      >
        <span className="assistant-reasoning__chevron">
          <Icon name="chevronRight" size={12} strokeWidth={1.6} />
        </span>
        <span className={`assistant-reasoning__label${busy ? ' assistant-reasoning__label--shimmer' : ''}`}>
          {labelText}
        </span>
      </div>
      <div className="assistant-reasoning__wrap">
        <div className="assistant-reasoning__body">{text}</div>
      </div>
    </div>
  )
}
