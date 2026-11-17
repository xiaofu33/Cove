/** TerminalCommandCard：终端命令执行卡片测试。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import TerminalCommandCard from './TerminalCommandCard'

describe('TerminalCommandCard', () => {
  it('执行成功状态：渲染提示符 $、命令文本与耗时', () => {
    const html = renderToStaticMarkup(
      <TerminalCommandCard
        command="git status --short"
        status="completed"
        durationMs={120}
        output="M desktop/src/index.css"
        defaultOpen
      />,
    )

    expect(html).toContain('terminal-command-card')
    expect(html).toContain('terminal-command-card__prompt')
    expect(html).toContain('git status --short')
    expect(html).toContain('120ms')
    expect(html).toContain('terminal-command-card__output')
    expect(html).toContain('M desktop/src/index.css')
  })

  it('执行失败状态：展示 Exit 1 错误提示', () => {
    const html = renderToStaticMarkup(
      <TerminalCommandCard
        command="cargo test"
        status="failed"
        exitCode={1}
        output="error: build failed"
      />,
    )

    expect(html).toContain('terminal-command-card--failed')
    expect(html).toContain('Exit 1')
  })

  it('运行中状态：展示 spinner 呼吸动画指示器', () => {
    const html = renderToStaticMarkup(
      <TerminalCommandCard
        command="npm run build"
        status="running"
      />,
    )

    expect(html).toContain('terminal-command-card__spinner')
    expect(html).not.toContain('terminal-command-card__output')
  })
})
