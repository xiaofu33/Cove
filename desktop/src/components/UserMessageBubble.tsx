/** 用户输入气泡组件：支持超长自动折叠、渐隐淡出与点击展开/收起，Codex/Antigravity 风格。 */

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export interface UserMessageBubbleProps {
  content: string
  timeAgo?: string
  onEdit?: () => void
}

export const UserMessageBubble = memo(function UserMessageBubble({
  content,
  timeAgo = 'Just now',
  onEdit,
}: UserMessageBubbleProps): React.JSX.Element {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [isOverflow, setIsOverflow] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // 检测气泡内容是否超过 116px（约 5 行）
  useEffect(() => {
    const el = bubbleRef.current
    if (!el) return
    const checkOverflow = (): void => {
      if (el.scrollHeight > 116) {
        setIsOverflow(true)
      } else {
        setIsOverflow(false)
      }
    }
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [content])

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 忽略剪贴板权限错误
    }
  }, [content])

  const handleBubbleClick = useCallback(() => {
    if (isOverflow) {
      setIsExpanded((prev) => !prev)
    }
  }, [isOverflow])

  return (
    <div className="message-user">
      <div className="message-user__meta">
        <span className="message-user__time">{timeAgo}</span>
        <div className="message-user__actions">
          <button
            type="button"
            className="message-user__action-btn"
            onClick={handleCopy}
            title={copied ? '已复制' : '复制内容'}
            aria-label={copied ? '已复制' : '复制内容'}
          >
            <Icon name={copied ? 'check' : 'copy'} size={14} />
          </button>
          {onEdit ? (
            <button
              type="button"
              className="message-user__action-btn"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              title="编辑消息"
              aria-label="编辑消息"
            >
              <Icon name="pencil" size={14} />
            </button>
          ) : null}
          {isOverflow && isExpanded ? (
            <button
              type="button"
              className="message-user__action-btn message-user__action-btn--collapse"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(false)
              }}
              title="收起内容"
              aria-label="收起内容"
            >
              <Icon name="chevronDown" size={14} className="rotate-180" />
            </button>
          ) : null}
        </div>
      </div>
      <div
        ref={bubbleRef}
        className={`user-prompt-bubble message-user__body${
          isOverflow && !isExpanded ? ' user-prompt-bubble--collapsed' : ''
        }${isOverflow ? ' user-prompt-bubble--overflow' : ''}`}
        onClick={handleBubbleClick}
        role={isOverflow ? 'button' : undefined}
        tabIndex={isOverflow ? 0 : undefined}
        onKeyDown={(e) => {
          if (isOverflow && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleBubbleClick()
          }
        }}
      >
        {content}
      </div>
    </div>
  )
})
