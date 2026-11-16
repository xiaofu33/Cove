/**
 * Codex / macOS 原生风格 14px 高保真矢量红绿灯组件。
 *
 * 尺寸：精准 14px × 14px 饱满大圆点，两两圆心距 21px (gap: 7px)，完全 1:1 对标 Codex 实测数据。
 * 特性：
 * - 激活态：原生红黄绿三色调色盘；
 * - 失焦态：自动转为浅灰色 (#d1d5db / #4b5563)，与系统原生体验无缝结合；
 * - 悬浮态：整个区域悬浮时浮现 ×、−、+ 极细原生符号；
 * - 操作闭环：点击联动关闭、最小化、全屏。
 */

import { useEffect, useState } from 'react'

export function TrafficLights() {
  const [isFocused, setIsFocused] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hasFocus() : true,
  )

  useEffect(() => {
    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Electron 主进程原生焦点事件联动
    const unbind = window.vesta?.onFocusChange?.(setIsFocused)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      unbind?.()
    }
  }, [])

  const handleClose = () => {
    window.vesta?.closeWindow?.()
  }

  const handleMinimize = () => {
    window.vesta?.minimizeWindow?.()
  }

  const handleMaximize = () => {
    window.vesta?.maximizeWindow?.()
  }

  return (
    <div
      className={`traffic-lights ${isFocused ? 'traffic-lights--focused' : 'traffic-lights--blurred'}`}
      role="group"
      aria-label="窗口控制"
    >
      <button
        type="button"
        className="traffic-lights__btn traffic-lights__btn--close"
        onClick={handleClose}
        title="关闭窗口"
        aria-label="关闭窗口"
      >
        <svg viewBox="0 0 14 14" className="traffic-lights__symbol" aria-hidden="true">
          <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        className="traffic-lights__btn traffic-lights__btn--minimize"
        onClick={handleMinimize}
        title="最小化"
        aria-label="最小化"
      >
        <svg viewBox="0 0 14 14" className="traffic-lights__symbol" aria-hidden="true">
          <path d="M3.5 7H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        className="traffic-lights__btn traffic-lights__btn--maximize"
        onClick={handleMaximize}
        title="缩放全屏"
        aria-label="缩放全屏"
      >
        <svg viewBox="0 0 14 14" className="traffic-lights__symbol" aria-hidden="true">
          {/* macOS 经典双对角三角全屏符号 */}
          <path
            d="M3.8 8.2L8.2 3.8M3.8 8.2V5.5M3.8 8.2H6.5M10.2 5.8L5.8 10.2M10.2 5.8V8.5M10.2 5.8H7.5"
            stroke="currentColor"
            strokeWidth="1.05"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
