/** Vesta Desktop 的统一 lucide 图标入口。 */

import {
  Activity,
  AlertCircle,
  Archive,
  AtSign,
  Bell,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  Home,
  LayoutGrid,
  ListChecks,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  Pause,
  Pencil,
  Pin,
  Plus,
  RotateCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SquarePen,
  Trash2,
  User,
  Workflow,
  X,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType, ReactElement, SVGProps } from 'react'

/** Codex 风格极简高精度后退箭头 (←) */
const CodexArrowLeft: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 16,
  strokeWidth = 1.3,
  color = 'currentColor',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M13.5 8H2.5" />
    <path d="M7 4L3 8L7 12" />
  </svg>
)

/** Codex 风格极简高前进箭头 (→) */
const CodexArrowRight: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 16,
  strokeWidth = 1.3,
  color = 'currentColor',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M2.5 8H13.5" />
    <path d="M9 4L13 8L9 12" />
  </svg>
)

/** Codex 风格温润圆角 Squircle 实心染黑小房子图标 (Home Filled - 仅在选中激活时展示) */
const CodexHomeSolid: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  color = 'currentColor',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    {/* 复合路径：温润圆角实心屋身 + 底部拱形门洞透明镂空 */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.3c-.7 0-1.38.28-1.87.78L3.4 9.8c-.88.88-1.4 2.08-1.4 3.33V19c0 1.66 1.34 3 3 3h4c.55 0 1-.45 1-1v-4.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5V21c0 .55.45 1 1 1h4c1.66 0 3-1.34 3-3v-5.87c0-1.25-.52-2.45-1.4-3.33l-6.73-6.72A2.65 2.65 0 0 0 12 2.3z"
      fill={color}
    />
  </svg>
)

/** 实心染黑时钟图标 (Clock Filled - 选中态) */
const ClockSolid: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  color = 'currentColor',
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" fill={color} stroke="none" />
    <polyline
      points="12 6.5 12 12 15.5 14"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** 实心染黑展开书本图标 (Book Filled - 选中态) */
const BookSolid: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  color = 'currentColor',
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
      fill={color}
    />
    <path
      d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
      fill={color}
    />
  </svg>
)

/** 实心染黑安全审批盾牌图标 (Shield Filled - 选中态) */
const ShieldSolid: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  color = 'currentColor',
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      fill={color}
      stroke="none"
    />
    <path
      d="m9 12 2 2 4-4"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** 实心染黑设置齿轮图标 (Settings Filled - 选中态) */
const SettingsSolid: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 20,
  color = 'currentColor',
  ...props
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      fill={color}
    />
  </svg>
)

/** Codex 风格优雅圆润分栏侧边栏图标 (sidebar) */
const CodexSidebar: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> = ({
  size = 16,
  strokeWidth = 1.25,
  color = 'currentColor',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="1.5" y="2.5" width="13" height="11" rx="2.5" />
    <path d="M5.5 2.5V13.5" />
  </svg>
)

export type IconName =
  | 'home'
  | 'chat'
  | 'runs'
  | 'automations'
  | 'approvals'
  | 'artifacts'
  | 'computer'
  | 'memory'
  | 'settings'
  | 'plus'
  | 'send'
  | 'chevronDown'
  | 'chevronRight'
  | 'download'
  | 'external'
  | 'check'
  | 'alert'
  | 'activity'
  | 'panelClose'
  | 'panelOpen'
  | 'sidebar'
  | 'file'
  | 'close'
  | 'pause'
  | 'agent'
  | 'more'
  | 'pin'
  | 'pencil'
  | 'squarePen'
  | 'trash'
  | 'bell'
  | 'search'
  | 'folder'
  | 'folderOpen'
  | 'arrowLeft'
  | 'arrowRight'
  | 'refresh'
  | 'clock'
  | 'book'
  | 'at'
  | 'code'
  | 'grid'
  | 'user'
  | 'circle'

const ICONS: Record<IconName, ComponentType<any>> = {
  // 未选中普通状态：一律使用 Lucide 原生单线线框（fill="none"）
  home: Home,
  chat: MessageSquare,
  runs: ListChecks,
  automations: Workflow,
  approvals: ShieldCheck,
  artifacts: Archive,
  computer: Monitor,
  memory: BookOpen,
  settings: Settings,
  plus: Plus,
  send: Send,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  download: Download,
  external: ExternalLink,
  check: Check,
  alert: AlertCircle,
  activity: Activity,
  panelClose: CodexSidebar,
  panelOpen: CodexSidebar,
  sidebar: CodexSidebar,
  file: FileText,
  close: X,
  pause: Pause,
  agent: Bot,
  more: MoreHorizontal,
  pin: Pin,
  pencil: Pencil,
  squarePen: SquarePen,
  trash: Trash2,
  bell: Bell,
  search: Search,
  folder: Folder,
  folderOpen: FolderOpen,
  arrowLeft: CodexArrowLeft,
  arrowRight: CodexArrowRight,
  refresh: RotateCw,
  clock: Clock,
  book: BookOpen,
  at: AtSign,
  code: Code2,
  grid: LayoutGrid,
  user: User,
  circle: Circle,
}

export interface IconProps extends Omit<LucideProps, 'name'> {
  name: IconName
  size?: number
  /** 选中状态下给图标内部染黑 (Filled / Solid) */
  filled?: boolean
}

export function Icon({
  name,
  size = 16,
  strokeWidth,
  filled = false,
  ...rest
}: IconProps): ReactElement {
  // 1. 仅当明确传入 filled={true}（被选中激活）时，才切换为内部染黑的实心版本
  if (filled) {
    if (name === 'home') {
      return <CodexHomeSolid size={size} color="currentColor" {...rest} />
    }
    if (name === 'clock') {
      return <ClockSolid size={size} color="currentColor" {...rest} />
    }
    if (name === 'book') {
      return <BookSolid size={size} color="currentColor" {...rest} />
    }
    if (name === 'approvals') {
      return <ShieldSolid size={size} color="currentColor" {...rest} />
    }
    if (name === 'settings') {
      return <SettingsSolid size={size} color="currentColor" {...rest} />
    }
  }

  // 2. 正常未选中状态：必须是纯正清爽的单线线框，绝无内部染黑！
  const Component = ICONS[name]
  const defaultStrokeWidth =
    name === 'panelClose' || name === 'panelOpen' || name === 'sidebar'
      ? 1.25
      : name === 'arrowLeft' || name === 'arrowRight'
        ? 1.3
        : 1.5

  // 严格保证未选中时 fill="none"，选中时（若无特定 Solid 组件）才使用 currentColor
  const fillValue = filled ? 'currentColor' : 'none'

  return (
    <Component
      size={size}
      strokeWidth={strokeWidth ?? defaultStrokeWidth}
      fill={fillValue}
      aria-hidden="true"
      {...rest}
    />
  )
}

export const ActivityClockIcon = Clock3
