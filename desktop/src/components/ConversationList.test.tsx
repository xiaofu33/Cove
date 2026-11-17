/** ConversationList：紧凑列表、选中态与新建入口测试。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Conversation } from '../api/types'
import ConversationList from './ConversationList'

const conversation: Conversation = {
  id: 'conv-1',
  title: 'Desktop redesign',
  message_count: 12,
  created_at: '2026-08-20T00:00:00+00:00',
  updated_at: '2026-08-20T01:00:00+00:00',
}

describe('ConversationList', () => {
  it('渲染新建入口、标题、状态与选中态', () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[conversation]}
        selectedId="conv-1"
        statusByConversation={{ 'conv-1': 'running' }}
        onSelect={() => {}}
        onNew={() => {}}
      />,
    )
    expect(html).toContain('工作')
    expect(html).toContain('Cove')
    expect(html).toContain('Desktop redesign')
    expect(html).toContain('工作中')
    expect(html).toContain('conversation-item__status--running')
    expect(html).toContain('conversation-item active')
    expect(html).not.toContain('12 messages')
  })

  it('空列表提供轻量空状态', () => {
    const html = renderToStaticMarkup(
      <ConversationList conversations={[]} selectedId={null} onSelect={() => {}} onNew={() => {}} />,
    )
    expect(html).toContain('暂无对话')
  })

  it('突出 working / approval / failed，弱化 completed，并展示当前动作', () => {
    const conversations = ['running', 'pending', 'failed', 'completed'].map((status) => ({
      ...conversation,
      id: status,
      title: status,
    }))
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={conversations}
        selectedId="running"
        statusByConversation={{ running: 'running', pending: 'pending', failed: 'failed', completed: 'completed' }}
        activityByConversation={{ running: 'Typing in Notes', pending: 'Waiting for approval' }}
        onSelect={() => {}}
        onNew={() => {}}
      />,
    )
    expect(html).toContain('Typing in Notes')
    expect(html).toContain('Waiting for approval')
    expect(html).toContain('工作中')
    expect(html).toContain('等待中')
    expect(html).toContain('失败')
    expect(html).toContain('conversation-item__status--completed">✓')
    expect(html).not.toContain('>已完成</span>')
  })

  it('顶部栏细节：通知铃铛在左，全局搜索在右，新聊天按钮展示', () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[conversation]}
        selectedId="conv-1"
        pendingApprovalsCount={2}
        onSelect={() => {}}
        onNew={() => {}}
      />,
    )
    // 验证右上角图标顺序：通知（aria-label="通知"）在全局搜索（aria-label="全局搜索"）之前
    const bellIndex = html.indexOf('aria-label="通知"')
    const searchIndex = html.indexOf('aria-label="全局搜索"')
    expect(bellIndex).toBeGreaterThan(-1)
    expect(searchIndex).toBeGreaterThan(-1)
    expect(bellIndex).toBeLessThan(searchIndex)
    // 验证新聊天按钮文案
    expect(html).toContain('新聊天')
    expect(html).toContain('conversation-sidebar__dot')
  })

  it('项目文件夹树形结构：不显示常驻箭头与统计数字，子项缩进，超过6条显示 See all (N) 按钮', () => {
    // 构造带项目的会话列表（共 7 个同项目会话，超过 6 条触发折叠）
    const projectConvs: Conversation[] = Array.from({ length: 7 }, (_, i) => ({
      ...conversation,
      id: `p-${i}`,
      title: `[ProjectX] 任务步骤 ${i + 1}`,
    }))

    const html = renderToStaticMarkup(
      <ConversationList
        conversations={projectConvs}
        selectedId="p-0"
        onSelect={() => {}}
        onNew={() => {}}
      />,
    )

    // 验证项目标题与分组标题
    expect(html).toContain('项目')
    expect(html).toContain('ProjectX')

    // 验证移除最右侧数量统计（如不再有 project-node__count 包含 "7"）
    expect(html).not.toContain('project-node__count')

    // 验证文件夹图标容器与原地替换图标
    expect(html).toContain('project-node__icon-wrap')
    expect(html).toContain('project-node__folder-icon')
    expect(html).toContain('project-node__chevron-icon')

    // 验证子项缩进 class
    expect(html).toContain('conversation-item--indent')

    // 验证超过 6 条时提供“See all (7)”按钮
    expect(html).toContain('project-node__expand-btn')
    expect(html).toContain('See all (7)')
  })
})
