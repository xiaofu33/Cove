/** AssistantReasoning：思考过程折叠栏测试。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import AssistantReasoning from './AssistantReasoning'

describe('AssistantReasoning', () => {
  it('思考中展示思考中文案与 Shimmer 流光样式类', () => {
    const html = renderToStaticMarkup(
      <AssistantReasoning text="第一步先读取配置文件" busy autoExpand={false} />,
    )
    expect(html).toContain('assistant-reasoning')
    expect(html).toContain('assistant-reasoning__header')
    expect(html).toContain('思考中...')
    expect(html).toContain('assistant-reasoning__label--shimmer')
    expect(html).toContain('第一步先读取配置文件')
  })

  it('完成态展示深度思考耗时与展开小箭头', () => {
    const html = renderToStaticMarkup(
      <AssistantReasoning
        text="分析完成，准备写入更新"
        busy={false}
        durationMs={1800}
        autoExpand
      />,
    )
    expect(html).toContain('已深度思考 1.8s')
    expect(html).toContain('assistant-reasoning--open')
    expect(html).toContain('assistant-reasoning__chevron')
    expect(html).toContain('assistant-reasoning__body')
    expect(html).toContain('分析完成，准备写入更新')
  })

  it('空文本时不渲染', () => {
    const html = renderToStaticMarkup(
      <AssistantReasoning text="" busy={false} />,
    )
    expect(html).toBe('')
  })
})
