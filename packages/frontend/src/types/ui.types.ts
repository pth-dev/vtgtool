/**
 * UI Component Types
 * Types for UI components and interactions
 */

// Notification Types
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  message: string
  type: NotificationType
}

// Dialog Types
export interface DialogState<T = unknown> {
  open: boolean
  data?: T
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'multiselect' | 'number' | 'date'
  required?: boolean
  options?: SelectOption[]
  placeholder?: string
}

export interface SelectOption<T = string | number> {
  value: T
  label: string
}

// Table Types
export interface TableColumn<T = unknown> {
  key: keyof T | string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: number | string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface TableSortState {
  column: string
  direction: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  rowsPerPage: number
}

// Chart UI Types
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area'

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max'

export interface ChartStyling {
  title: string
  xAxisLabel: string
  yAxisLabel: string
  showLegend: boolean
  showGrid: boolean
  colorPalette: string
}

export interface ChartPreviewConfig {
  type: ChartType
  data: ChartDataItem[]
  title?: string
  colors?: string[]
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface ChartDataItem {
  name: string
  value?: number
  count?: number
  percent?: number
  [key: string]: string | number | undefined
}

// Theme Types
export type ThemeMode = 'light' | 'dark'

export interface ThemeColors {
  paper: string
  paperMuted: string
  input: string
  overlay: string
  border: string
  borderHover: string
  textMuted: string
  primary: string
  success: string
  error: string
}

// Filter Types
export interface FilterState {
  month: string
  customers: string[]
  categories: string[]
  statuses: string[]
  products: string[]
}

export interface FilterOptions {
  months: string[]
  customers: string[]
  categories: string[]
  statuses: string[]
  products: string[]
}

export type FilterKey = keyof FilterState
export type MultiFilterKey = Exclude<FilterKey, 'month'>
export type FilterChangeHandler = (key: FilterKey, value: string | string[]) => void

export interface MultiFilterConfig {
  key: MultiFilterKey
  label: string
}

export interface MonthRange {
  minDate?: import('dayjs').Dayjs
  maxDate?: import('dayjs').Dayjs
}

export interface FilterPanelProps {
  filters: FilterState
  options: FilterOptions
  selectedMonth: string
  onChange: FilterChangeHandler
  onClear: () => void
}

export interface MonthPickerProps {
  value: import('dayjs').Dayjs | null
  range: MonthRange
  isDark: boolean
  isMobile: boolean
  isDisabled: boolean
  onChange: (value: import('dayjs').Dayjs | null) => void
}

export interface FilterSelectorsProps {
  filters: FilterState
  options: FilterOptions
  isDark: boolean
  isMobile: boolean
  onChange: FilterChangeHandler
}

export interface ActiveFilterChipsProps {
  filters: FilterState
  onChange: FilterChangeHandler
}

export interface MobileFilterBarProps {
  monthPicker: React.ReactNode
  activeCount: number
  isDark: boolean
  onOpen: () => void
}

export interface MobileFilterDrawerProps {
  open: boolean
  isDark: boolean
  activeCount: number
  filters: FilterState
  options: FilterOptions
  onChange: FilterChangeHandler
  onClear: () => void
  onClose: () => void
}

export interface DesktopFilterPanelProps {
  monthPicker: React.ReactNode
  activeCount: number
  isDark: boolean
  filters: FilterState
  options: FilterOptions
  onChange: FilterChangeHandler
  onClear: () => void
}

export const MONTH_FORMAT = 'YYYY-MM'

export const MULTI_FILTERS: MultiFilterConfig[] = [
  { key: 'customers', label: 'Customer' },
  { key: 'categories', label: 'Category' },
  { key: 'statuses', label: 'Status' },
  { key: 'products', label: 'Product' },
]

// Chat Types
export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
}

export interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  sessionId: string | null
}

export interface ChatResponse {
  response: string
  session_id: string
  model_used: string
  timestamp: string
}
