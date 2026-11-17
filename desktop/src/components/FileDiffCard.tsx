/** Codex 桌面端极简原生风格文件修改（Diff）卡片。
 * - 外层容器浅灰微边框背景，头部高 34px。
 * - 左侧展示文件图标、操作标签与文件路径。
 * - 右侧等宽呈现增删行数（如 +18 / -4）与折叠小箭头。
 * - 展开区采用等宽字体与红绿低对比 Diff 渲染。
 */

import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { Icon } from './Icon'

export interface DiffLine {
  type: 'add' | 'del' | 'context'
  content: string
}

export interface FileDiffCardProps {
  /** 文件路径 */
  path: string
  /** 操作标签，默认为“已编辑” */
  action?: string
  /** 新增行数统计（若未提供，将尝试从 diff 中计算） */
  additions?: number
  /** 删除行数统计（若未提供，将尝试从 diff 中计算） */
  deletions?: number
  /** Diff 文本内容或结构化行数据 */
  diff?: string | DiffLine[]
  /** 默认是否展开，默认为 false */
  defaultOpen?: boolean
}

/** 解析纯文本 Diff 字符串为行结构 */
function parseDiffLines(rawDiff: string): { lines: DiffLine[]; adds: number; dels: number } {
  const rawLines = rawDiff.split('\n')
  const lines: DiffLine[] = []
  let adds = 0
  let dels = 0

  for (const line of rawLines) {
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
      // 头部元信息作为上下文行或跳过
      lines.push({ type: 'context', content: line })
    } else if (line.startsWith('+')) {
      adds += 1
      lines.push({ type: 'add', content: line })
    } else if (line.startsWith('-')) {
      dels += 1
      lines.push({ type: 'del', content: line })
    } else {
      lines.push({ type: 'context', content: line })
    }
  }

  return { lines, adds, dels }
}

export default function FileDiffCard({
  path,
  action = '已编辑',
  additions,
  deletions,
  diff,
  defaultOpen = false,
}: FileDiffCardProps): ReactElement {
  const [open, setOpen] = useState(defaultOpen)

  const { parsedLines, computedAdds, computedDels } = useMemo(() => {
    if (!diff) {
      return { parsedLines: [], computedAdds: additions ?? 0, computedDels: deletions ?? 0 }
    }
    if (Array.isArray(diff)) {
      const adds = diff.filter((l) => l.type === 'add').length
      const dels = diff.filter((l) => l.type === 'del').length
      return {
        parsedLines: diff,
        computedAdds: additions ?? adds,
        computedDels: deletions ?? dels,
      }
    }
    const res = parseDiffLines(diff)
    return {
      parsedLines: res.lines,
      computedAdds: additions ?? res.adds,
      computedDels: deletions ?? res.dels,
    }
  }, [diff, additions, deletions])

  const hasDiffContent = parsedLines.length > 0

  return (
    <div className={`file-diff-card${open ? ' file-diff-card--open' : ''}`} data-testid="file-diff-card">
      <div
        className="file-diff-card__header"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`${action} ${path}`}
        onClick={() => {
          if (hasDiffContent) {
            setOpen((v) => !v)
          }
        }}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && hasDiffContent) {
            event.preventDefault()
            setOpen((v) => !v)
          }
        }}
      >
        <div className="file-diff-card__left">
          <Icon name="file" size={14} className="file-diff-card__icon" />
          <span className="file-diff-card__action">{action}</span>
          <span className="file-diff-card__path" title={path}>
            {path}
          </span>
        </div>

        <div className="file-diff-card__right">
          <span className="file-diff-card__stats">
            {computedAdds > 0 ? (
              <span className="file-diff-card__stat-add">+{computedAdds}</span>
            ) : null}
            {computedDels > 0 ? (
              <span className="file-diff-card__stat-del">-{computedDels}</span>
            ) : null}
          </span>
          {hasDiffContent ? (
            <span className="file-diff-card__chevron">
              <Icon name="chevronRight" size={12} strokeWidth={1.6} />
            </span>
          ) : null}
        </div>
      </div>

      {open && hasDiffContent ? (
        <div className="file-diff-card__body">
          {parsedLines.map((line, idx) => (
            <div
              key={idx}
              className={`file-diff-card__line diff-line--${line.type}`}
            >
              <code>{line.content || ' '}</code>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
