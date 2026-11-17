import { contextBridge, ipcRenderer } from 'electron'

export type DesktopNotificationKind = 'approval' | 'run' | 'artifact'

export interface DesktopNotification {
  title: string
  body: string
  kind: DesktopNotificationKind
}

// preload 只暴露真正需要的最小 Desktop API；业务 RPC 不经过 Electron Main。
// Renderer 通过 WS /rpc 与 localhost Vesta Host 通信，媒体使用只读 HTTP transport。
const desktopApi = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
  openExternal: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('vesta:open-external', url) as Promise<boolean>,
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('vesta:select-directory') as Promise<string | null>,
  openPath: (targetPath: string): Promise<boolean> =>
    ipcRenderer.invoke('vesta:open-path', targetPath) as Promise<boolean>,
  notify: (notification: DesktopNotification): void => {
    ipcRenderer.send('vesta:notify', notification)
  },
  setApprovalVisible: (visible: boolean): void => {
    ipcRenderer.send('vesta:approval-set-visible', visible)
  },
  setApprovalSize: (height: number): void => {
    ipcRenderer.send('vesta:approval-set-size', height)
  },
  closeWindow: (): void => {
    ipcRenderer.send('vesta:window-close')
  },
  minimizeWindow: (): void => {
    ipcRenderer.send('vesta:window-minimize')
  },
  maximizeWindow: (): void => {
    ipcRenderer.send('vesta:window-maximize')
  },
  onFocusChange: (callback: (focused: boolean) => void): (() => void) => {
    const handler = (_event: unknown, focused: boolean) => callback(focused)
    ipcRenderer.on('vesta:window-focus-changed', handler)
    return () => {
      ipcRenderer.removeListener('vesta:window-focus-changed', handler)
    }
  },
} as const

contextBridge.exposeInMainWorld('vesta', desktopApi)

export type DesktopApi = typeof desktopApi
