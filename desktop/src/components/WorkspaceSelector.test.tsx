import { beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import WorkspaceSelector, {
  getBaseName,
  getStoredRecentWorkspaces,
  removeStoredRecentWorkspace,
  saveStoredRecentWorkspace,
} from './WorkspaceSelector'

// Mock 基础 localStorage
const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true })

describe('WorkspaceSelector utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('correctly extracts base folder name', () => {
    expect(getBaseName('/Users/alice/projects/my-app')).toBe('my-app')
    expect(getBaseName('/Users/alice/projects/my-app/')).toBe('my-app')
    expect(getBaseName('')).toBe('')
  })

  it('saves, deduplicates and retrieves recent workspaces', () => {
    expect(getStoredRecentWorkspaces()).toEqual([])
    saveStoredRecentWorkspace('/path/to/project1')
    saveStoredRecentWorkspace('/path/to/project2')
    saveStoredRecentWorkspace('/path/to/project1') // 重复项置顶
    expect(getStoredRecentWorkspaces()).toEqual(['/path/to/project1', '/path/to/project2'])

    const updated = removeStoredRecentWorkspace('/path/to/project2')
    expect(updated).toEqual(['/path/to/project1'])
    expect(getStoredRecentWorkspaces()).toEqual(['/path/to/project1'])
  })
})

describe('WorkspaceSelector component markup', () => {
  it('renders default No project state in un-fixed mode', () => {
    const topHtml = renderToStaticMarkup(
      <WorkspaceSelector workspacePath={null} fixed={false} variant="top" />,
    )
    expect(topHtml).toContain('No Project')
    expect(topHtml).toContain('composer__top-project-btn')
    expect(topHtml).toContain('aria-haspopup="true"')

    const bottomHtml = renderToStaticMarkup(
      <WorkspaceSelector workspacePath={null} fixed={false} variant="bottom" />,
    )
    expect(bottomHtml).toContain('No Project')
    expect(bottomHtml).toContain('workspace-selector__trigger')
    expect(bottomHtml).toContain('aria-haspopup="true"')
  })

  it('renders selected folder name and shows full path in title', () => {
    const html = renderToStaticMarkup(
      <WorkspaceSelector
        workspacePath="/Users/alice/repo/vesta-frontend"
        fixed={false}
      />,
    )
    expect(html).toContain('vesta-frontend')
    expect(html).toContain('title="当前选择工作区：/Users/alice/repo/vesta-frontend"')
  })

  it('renders readonly tag when fixed=true without dropdown trigger', () => {
    const html = renderToStaticMarkup(
      <WorkspaceSelector
        workspacePath="/Users/alice/my-app"
        fixed={true}
        available={true}
      />,
    )
    expect(html).toContain('my-app')
    expect(html).toContain('workspace-tag')
    expect(html).toContain('aria-label="在 Finder 中打开工作区"')
    expect(html).not.toContain('aria-haspopup="true"')
  })

  it('renders fixed No project badge as read-only', () => {
    const html = renderToStaticMarkup(
      <WorkspaceSelector
        workspacePath={null}
        fixed={true}
      />,
    )
    expect(html).toContain('No Project')
    expect(html).toContain('title="当前聊天未绑定本地工作区（No project）"')
    expect(html).not.toContain('aria-haspopup="true"')
    expect(html).not.toContain('aria-label="在 Finder 中打开工作区"')
  })

  it('renders unavailable warning badge when available=false', () => {
    const html = renderToStaticMarkup(
      <WorkspaceSelector
        workspacePath="/Users/alice/deleted-app"
        fixed={true}
        available={false}
      />,
    )
    expect(html).toContain('deleted-app')
    expect(html).toContain('不可用')
    expect(html).toContain('workspace-tag--unavailable')
    expect(html).toContain('工作区目录不可用（已删除或无法访问）：/Users/alice/deleted-app')
  })
})
