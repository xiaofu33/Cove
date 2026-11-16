/** Vesta Desktop 的统一 lucide 图标入口。 */

import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
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
  PanelLeftClose,
  PanelLeftOpen,
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
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import type { ReactElement } from 'react'

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

const ICONS: Record<IconName, LucideIcon> = {
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
  panelClose: PanelLeftClose,
  panelOpen: PanelLeftOpen,
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
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
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

export function Icon({ name, size = 16, ...rest }: IconProps): ReactElement {
  const Component = ICONS[name]
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" {...rest} />
}

export const ActivityClockIcon = Clock3
