/** Vesta Desktop 的统一 lucide 图标入口。 */

import {
  Activity,
  AlertCircle,
  Archive,
  AtSign,
  Bell,
  BookOpen,
  Bot,
  Brain,
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
  chat: MessageSquare,
  runs: ListChecks,
  automations: Workflow,
  approvals: ShieldCheck,
  artifacts: Archive,
  computer: Monitor,
  memory: Brain,
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
}

export function Icon({ name, size = 16, strokeWidth, ...rest }: IconProps): ReactElement {
  const Component = ICONS[name]
  const defaultStrokeWidth =
    name === 'panelClose' || name === 'panelOpen' || name === 'sidebar'
      ? 1.25
      : name === 'arrowLeft' || name === 'arrowRight'
        ? 1.3
        : 1.8
  return <Component size={size} strokeWidth={strokeWidth ?? defaultStrokeWidth} aria-hidden="true" {...rest} />
}

export const ActivityClockIcon = Clock3
