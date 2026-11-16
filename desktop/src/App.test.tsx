/** App 顶层骨架与 macOS 原生工具栏集成测试 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import App from './App'

describe('App Shell', () => {
  it('成功渲染三栏骨架、主导航与原生风格顶栏工具条', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    )

    // 检查顶层 app-shell
    expect(html).toContain('app-shell')
    // 检查原生窗口工具栏
    expect(html).toContain('window-toolbar')
    expect(html).toContain('window-toolbar__page-title')
    expect(html).toContain('工作区')
    // 检查侧栏导航与核心入口
    expect(html).toContain('sidebar')
    expect(html).toContain('主导航')
    // 检查状态指示胶囊
    expect(html).toContain('window-toolbar__status-capsule')
  })
})
