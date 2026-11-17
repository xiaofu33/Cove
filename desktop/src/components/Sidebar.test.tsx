/** App Shell：Sidebar 导航 + Host 状态渲染测试（renderToStaticMarkup）。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import Sidebar from './Sidebar'

describe('Sidebar (App Shell)', () => {
  it('渲染全部导航项', () => {
    const html = renderToStaticMarkup(
      <Sidebar current="chat" onNavigate={() => {}} connected />,
    )
    for (const label of [
      '工作区',
      '执行历史',
      '自动化',
      '审批',
      '长期记忆',
      '交付物',
      '电脑',
      '设置',
    ]) {
      expect(html).toContain(label)
    }
    expect(html).toContain('Vesta')
  })

  it('当前页有 active 状态', () => {
    const html = renderToStaticMarkup(
      <Sidebar current="runs" onNavigate={() => {}} connected />,
    )
    expect(html).toContain('nav-item active')
  })

  it('底部不展示多余的 Host 状态噪点', () => {
    const html = renderToStaticMarkup(
      <Sidebar current="chat" onNavigate={() => {}} connected />,
    )
    expect(html).not.toContain('host-status')
    expect(html).not.toContain('Host 就绪')
    expect(html).not.toContain('Host 离线')
  })

  it('图标导航提供 title 与无障碍名称，不在窄栏展示版本噪声', () => {
    const html = renderToStaticMarkup(
      <Sidebar current="chat" onNavigate={() => {}} connected />,
    )
    expect(html).toContain('title="工作区"')
    expect(html).toContain('aria-label="工作区"')
    expect(html).not.toContain('v0.1.0')
  })

  it('提供 badges 时在对应导航项渲染徽标', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        current="chat"
        onNavigate={() => {}}
        connected
        badges={{ runs: 2, approvals: 3 }}
      />,
    )
    expect(html).toContain('nav-badge')
    expect(html).toContain('>2</span>')
    expect(html).toContain('>3</span>')
  })

  it('badges 为 0 或缺失时不渲染徽标', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        current="chat"
        onNavigate={() => {}}
        connected
        badges={{ runs: 0, approvals: undefined }}
      />,
    )
    expect(html).not.toContain('nav-badge')
  })

  it('dots 为 true 时在对应导航项渲染状态点', () => {
    const html = renderToStaticMarkup(
      <Sidebar current="chat" onNavigate={() => {}} connected dots={{ chat: true }} />,
    )
    expect(html).toContain('nav-badge--dot')
  })

  it('在非主页时主页按钮正确渲染未激活状态且可供点击', () => {
    const html = renderToStaticMarkup(
      <Sidebar current="settings" onNavigate={() => {}} connected />,
    )
    expect(html).toContain('sidebar-brand-wrap')
    expect(html).toContain('nav-item nav-item--home')
    expect(html).not.toContain('nav-item nav-item--home active')
  })

  it('无 dots 时不渲染状态点', () => {
    const html = renderToStaticMarkup(
      <Sidebar current="chat" onNavigate={() => {}} connected />,
    )
    expect(html).not.toContain('nav-badge--dot')
  })
})
