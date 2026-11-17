/** 新会话的工作入口：以 Cove 镂空 Logo 与居中标题（内嵌点状下划线项目选择器）为核心的极简桌面端引导页。 */

import { useEffect, useRef, useState, type ReactElement } from 'react'

import { Icon } from './Icon'
import { useWorkspaceStore, type ProjectContext } from '../stores/workspace'

export function CoveLogo({ className = 'w-9 h-9 text-zinc-800' }: { className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.5 9.2C21.6 7.2 18.9 6 16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C18.9 26 21.6 24.8 23.5 22.8"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="3.2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

export const EXAMPLE_PROMPTS = [
  '梳理项目结构与核心模块',
  '检查当前 Git 变更并总结',
  '定位并修复近期报错',
  '规划新功能实现方案',
] as const

export interface ChatEmptyStateProps {
  onSelectPrompt?: (prompt: string) => void
  currentProject?: ProjectContext | null
  onProjectChange?: (project: ProjectContext) => void
}

export default function ChatEmptyState({
  currentProject: controlledProject,
  onProjectChange,
}: ChatEmptyStateProps): ReactElement {
  const storeProject = useWorkspaceStore((state) => state.currentProject)
  const recentProjects = useWorkspaceStore((state) => state.recentProjects)
  const setStoreProject = useWorkspaceStore((state) => state.setCurrentProject)
  const addStoreProject = useWorkspaceStore((state) => state.addProject)

  const activeProject = controlledProject !== undefined ? controlledProject : storeProject
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const popoverRef = useRef<HTMLSpanElement>(null)

  // 点击外部关闭 Popover
  useEffect(() => {
    if (!projectMenuOpen) return
    const handleClickOutside = (e: MouseEvent): void => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [projectMenuOpen])

  const handleSelectProject = (project: ProjectContext): void => {
    setStoreProject(project)
    onProjectChange?.(project)
    setProjectMenuOpen(false)
  }

  const handleOpenFolder = (): void => {
    const inputPath = window.prompt?.('输入或选择本地项目文件夹绝对路径：', '~/code/new-project')
    if (inputPath && inputPath.trim()) {
      const cleanPath = inputPath.trim()
      const segs = cleanPath.split('/').filter(Boolean)
      const folderName = segs[segs.length - 1] || 'custom-project'
      const newProj = addStoreProject(folderName, cleanPath)
      handleSelectProject(newProj)
    }
  }

  const projectName = activeProject?.name || '选择项目'

  return (
    <section className="cove-empty" aria-label="开始新会话">
      {/* 1. Cove 极简镂空品牌 Logo (约 36px × 36px) */}
      <div className="cove-logo-wrap" title="Cove">
        <div className="cove-logo" aria-hidden="true">
          <CoveLogo className="cove-logo-svg w-9 h-9 text-zinc-800" />
        </div>
      </div>

      {/* 2. 新建对话居中标题：你想让我们在 {currentProject?.name || '选择项目'} 中构建什么？ */}
      <h1 className="cove-empty__title text-[24px] font-normal tracking-tight text-zinc-900">
        你想让我们在{' '}
        <span className="cove-project-picker-wrap inline-block relative" ref={popoverRef}>
          <button
            type="button"
            className="cove-project-trigger cursor-pointer underline decoration-dotted decoration-zinc-400 underline-offset-[6px] hover:decoration-zinc-800 transition-colors"
            onClick={() => setProjectMenuOpen((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={projectMenuOpen}
            title={activeProject ? `当前工作目录：${activeProject.path}` : '选择项目目录'}
          >
            {projectName}
          </button>

          {projectMenuOpen ? (
            <div className="cove-project-popover" role="dialog" aria-label="选择工作区项目">
              <div className="cove-project-popover__header">最近项目 · Recent Projects</div>
              <div className="cove-project-popover__list">
                {recentProjects.map((proj) => {
                  const isCurrent = activeProject?.id === proj.id
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      className={`cove-project-popover__item ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleSelectProject(proj)}
                    >
                      <div className="cove-project-popover__item-left">
                        <Icon name="folder" size={14} className="cove-project-popover__folder-icon" />
                        <div className="cove-project-popover__meta">
                          <span className="cove-project-popover__item-name">{proj.name}</span>
                          <span className="cove-project-popover__item-path">{proj.path}</span>
                        </div>
                      </div>
                      {isCurrent ? (
                        <Icon name="check" size={13} className="cove-project-popover__check" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <div className="cove-project-popover__footer">
                <button
                  type="button"
                  className="cove-project-popover__add-btn"
                  onClick={handleOpenFolder}
                >
                  <Icon name="plus" size={13} />
                  <span>打开本地文件夹...</span>
                </button>
              </div>
            </div>
          ) : null}
        </span>{' '}
        中构建什么？
      </h1>
    </section>
  )
}
