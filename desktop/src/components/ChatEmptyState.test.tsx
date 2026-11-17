/** ChatEmptyState：Cove 极简镂空 Logo、点状下划线项目切换器与居中文本引导页测试。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import ChatEmptyState, { CoveLogo } from './ChatEmptyState'

describe('ChatEmptyState', () => {
  it('渲染 Cove 极简镂空 Logo 与居中主标题（内嵌点状下划线项目切换器），无冗余快捷选项', () => {
    const html = renderToStaticMarkup(<ChatEmptyState />)
    expect(html).toContain('cove-logo')
    expect(html).toContain('cove-logo-svg')
    expect(html).toContain('你想让我们在')
    expect(html).toContain('中构建什么？')
    expect(html).toContain('cove-project-trigger')
    expect(html).toContain('decoration-dotted')

    // 验证快捷指令选项已被彻底剔除
    expect(html).not.toContain('cove-starter-pill')
    expect(html).not.toContain('cove-empty__actions')
    expect(html).not.toContain('梳理项目结构与核心模块')

    // 验证冗余说明已被彻底剔除
    expect(html).not.toContain('新的工作空间')
    expect(html).not.toContain('直接描述你想要的结果')
    expect(html).not.toContain('普通模式直接执行')
  })

  it('未指定项目时主标题显示「选择项目」占位并保持文案一致', () => {
    const html = renderToStaticMarkup(<ChatEmptyState currentProject={null} />)
    expect(html).toContain('你想让我们在')
    expect(html).toContain('选择项目')
    expect(html).toContain('中构建什么？')
  })

  it('CoveLogo 渲染具有镂空 path 和圆形的矢量图形', () => {
    const logoHtml = renderToStaticMarkup(<CoveLogo />)
    expect(logoHtml).toContain('viewBox="0 0 32 32"')
    expect(logoHtml).toContain('stroke="currentColor"')
    expect(logoHtml).toContain('circle')
  })
})
