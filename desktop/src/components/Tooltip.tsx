/**
 * 对标 Codex 的高保真 Tooltip 提示浮层组件。
 *
 * 特性：
 * - 样式：深色半透明胶囊背景 (rgba(15, 23, 42, 0.95))、0.5px 微白描边；
 * - 动效：Apple HIG 标准 150ms cubic-bezier(0.23, 1, 0.32, 1) 微缩放与透明度过渡；
 * - 支持快捷键徽标 (如 ⌘1, ⌘N)；
 * - 120ms 防抖延迟，避免鼠标划过时闪烁。
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface TooltipProps {
  content: string
  shortcut?: string
  children: ReactNode
  side?: 'right' | 'top' | 'bottom'
  disabled?: boolean
}

export function Tooltip({
  content,
  shortcut,
  children,
  side = 'right',
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (disabled) return
    timerRef.current = setTimeout(() => {
      setMounted(true)
      // 下一帧触发动画过渡
      requestAnimationFrame(() => setVisible(true))
    }, 120)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
    setTimeout(() => setMounted(false), 150)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {mounted && (
        <div
          className={`codex-tooltip codex-tooltip--${side} ${visible ? 'codex-tooltip--visible' : ''}`}
          role="tooltip"
          aria-hidden={!visible}
        >
          <span className="codex-tooltip__content">{content}</span>
          {shortcut && <kbd className="codex-tooltip__shortcut">{shortcut}</kbd>}
        </div>
      )}
    </div>
  )
}
