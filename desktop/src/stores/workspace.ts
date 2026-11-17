/** 工作区与项目上下文：管理当前会话绑定的工作目录、工作树/分支与最近项目列表。 */

import { create } from 'zustand'

export interface ProjectContext {
  id: string
  name: string
  path: string
  lastOpened?: number
}

export const DEFAULT_PROJECTS: ProjectContext[] = [
  { id: 'cove-desktop', name: 'cove-desktop', path: '~/code/ai/vesta/desktop', lastOpened: 1700000000000 },
  { id: 'vesta-backend', name: 'vesta-backend', path: '~/code/ai/vesta/backend', lastOpened: 1699900000000 },
  { id: 'vesta-core', name: 'vesta-core', path: '~/code/ai/vesta/core', lastOpened: 1699800000000 },
]

export const DEFAULT_WORKTREES: string[] = ['main', 'ui', 'feature/cove-ui']

interface WorkspaceState {
  currentProject: ProjectContext
  recentProjects: ProjectContext[]
  currentWorktree: string
  worktrees: string[]
  setCurrentProject: (project: ProjectContext) => void
  addProject: (name: string, path: string) => ProjectContext
  setCurrentWorktree: (worktree: string) => void
  addWorktree: (worktree: string) => void
}

function loadInitial(): {
  current: ProjectContext
  recent: ProjectContext[]
  currentWorktree: string
  worktrees: string[]
} {
  try {
    const rawRecent = typeof localStorage !== 'undefined' ? localStorage.getItem('cove.recentProjects') : null
    const rawCurrentId = typeof localStorage !== 'undefined' ? localStorage.getItem('cove.currentProjectId') : null
    const recent: ProjectContext[] = rawRecent ? (JSON.parse(rawRecent) as ProjectContext[]) : DEFAULT_PROJECTS
    const current = recent.find((p) => p.id === rawCurrentId) ?? recent[0] ?? DEFAULT_PROJECTS[0]

    const rawWorktree = typeof localStorage !== 'undefined' ? localStorage.getItem('cove.currentWorktree') : null
    const rawWorktrees = typeof localStorage !== 'undefined' ? localStorage.getItem('cove.worktrees') : null
    const worktrees: string[] = rawWorktrees ? (JSON.parse(rawWorktrees) as string[]) : DEFAULT_WORKTREES
    const currentWorktree = rawWorktree && worktrees.includes(rawWorktree) ? rawWorktree : (worktrees[0] ?? 'main')

    return { current, recent, currentWorktree, worktrees }
  } catch {
    return {
      current: DEFAULT_PROJECTS[0],
      recent: DEFAULT_PROJECTS,
      currentWorktree: DEFAULT_WORKTREES[0] ?? 'main',
      worktrees: DEFAULT_WORKTREES,
    }
  }
}

const initial = loadInitial()

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentProject: initial.current,
  recentProjects: initial.recent,
  currentWorktree: initial.currentWorktree,
  worktrees: initial.worktrees,
  setCurrentProject: (project) => {
    set((state) => {
      const updatedRecent = [
        project,
        ...state.recentProjects.filter((p) => p.id !== project.id),
      ]
      try {
        localStorage.setItem('cove.currentProjectId', project.id)
        localStorage.setItem('cove.recentProjects', JSON.stringify(updatedRecent))
      } catch {
        // ignore
      }
      return { currentProject: project, recentProjects: updatedRecent }
    })
  },
  addProject: (name, path) => {
    const newProj: ProjectContext = {
      id: `proj-${Date.now()}`,
      name,
      path,
      lastOpened: Date.now(),
    }
    set((state) => {
      const updatedRecent = [newProj, ...state.recentProjects.filter((p) => p.path !== path)]
      try {
        localStorage.setItem('cove.currentProjectId', newProj.id)
        localStorage.setItem('cove.recentProjects', JSON.stringify(updatedRecent))
      } catch {
        // ignore
      }
      return { currentProject: newProj, recentProjects: updatedRecent }
    })
    return newProj
  },
  setCurrentWorktree: (worktree) => {
    set((state) => {
      const updatedWorktrees = state.worktrees.includes(worktree)
        ? state.worktrees
        : [worktree, ...state.worktrees]
      try {
        localStorage.setItem('cove.currentWorktree', worktree)
        localStorage.setItem('cove.worktrees', JSON.stringify(updatedWorktrees))
      } catch {
        // ignore
      }
      return { currentWorktree: worktree, worktrees: updatedWorktrees }
    })
  },
  addWorktree: (worktree) => {
    set((state) => {
      const updatedWorktrees = [worktree, ...state.worktrees.filter((w) => w !== worktree)]
      try {
        localStorage.setItem('cove.currentWorktree', worktree)
        localStorage.setItem('cove.worktrees', JSON.stringify(updatedWorktrees))
      } catch {
        // ignore
      }
      return { currentWorktree: worktree, worktrees: updatedWorktrees }
    })
  },
}))
