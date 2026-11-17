/** UserMessageBubble：用户气泡渲染、外置元信息与交互测试。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { UserMessageBubble } from './UserMessageBubble'

describe('UserMessageBubble', () => {
  it('渲染基本用户消息内容', () => {
    const html = renderToStaticMarkup(<UserMessageBubble content="帮我分析代码" />)
    expect(html).toContain('message-user')
    expect(html).toContain('user-prompt-bubble')
    expect(html).toContain('帮我分析代码')
  })

  it('顶部外置元信息栏包含相对时间与操作按钮', () => {
    const html = renderToStaticMarkup(
      <UserMessageBubble content="测试内容" timeAgo="26m ago" />,
    )
    expect(html).toContain('message-user__meta')
    expect(html).toContain('26m ago')
    expect(html).toContain('复制内容')
  })
})
