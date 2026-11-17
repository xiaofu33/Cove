/** FileDiffCard：文件修改卡片与 Diff 代码区测试。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import FileDiffCard from './FileDiffCard'

describe('FileDiffCard', () => {
  it('渲染头部路径、操作标签与增删行数统计', () => {
    const rawDiff = `--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,3 +1,3 @@
-import oldLib from 'old'
+import newLib from 'new'
 const a = 1
+const b = 2`

    const html = renderToStaticMarkup(
      <FileDiffCard
        path="src/App.tsx"
        action="已编辑"
        diff={rawDiff}
        defaultOpen
      />,
    )

    expect(html).toContain('file-diff-card')
    expect(html).toContain('src/App.tsx')
    expect(html).toContain('已编辑')
    // 验证增删行数计算 (+2, -1)
    expect(html).toContain('file-diff-card__stat-add">+2</span>')
    expect(html).toContain('file-diff-card__stat-del">-1</span>')
    // 验证展开后的 diff 行渲染
    expect(html).toContain('diff-line--add')
    expect(html).toContain('diff-line--del')
    expect(html).toContain('diff-line--context')
    expect(html).toContain('import newLib')
    expect(html).toContain('import oldLib')
  })

  it('折叠状态默认不渲染 diff 代码区内容', () => {
    const html = renderToStaticMarkup(
      <FileDiffCard
        path="package.json"
        action="已修改"
        additions={5}
        deletions={2}
        diff="+ newline"
        defaultOpen={false}
      />,
    )

    expect(html).toContain('package.json')
    expect(html).toContain('+5')
    expect(html).toContain('-2')
    expect(html).not.toContain('file-diff-card__body')
  })
})
