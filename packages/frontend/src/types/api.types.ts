/**
 * API Response Types
 * Centralized types for all API responses
 */

// Column/Schema Types
export interface ColumnSchema {
  name: string
  original_dtype: string
  detected_type: ColumnDataType
  nullable: boolean
  unique_count: number
  null_count: number
  sample_values: unknown[]
}

export type ColumnDataType = 'string' | 'number' | 'date' | 'boolean'

// Data Source Types
export interface DataSource {
  id: number
  name: string
  file_type: string
  row_count: number
  column_count: number
  columns_meta: ColumnSchema[]
  status: DataSourceStatus
  created_at: string
}

export type DataSourceStatus = 'pending' | 'processing' | 'ready' | 'error'

// Dataset Types
export interface Dataset {
  id: number
  name: string
  columns: ColumnSchema[]
  row_count: number
  column_count?: number
  data_type?: string
  status?: string
  created_at: string
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages?: number
}

export interface PaginatedData {
  columns: ColumnSchema[]
  data: Record<string, unknown>[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// Validation Types
export interface ValidationResult {
  valid: boolean
  row_count: number
  column_count: number
  duplicate_rows: number
  errors: string[]
  warnings: string[]
}

// Auth Types
export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
}

export type UserRole = 'admin' | 'viewer'

export interface AuthResponse {
  access_token: string
}

// Chart Types
export interface Chart {
  id: number
  name: string
  chart_type: string
  config: ChartConfig
  created_at?: string
}

export interface ChartConfig {
  x_col: string
  y_col?: string
  agg?: string
  group_by?: string
  styling?: ChartStyling
}

export interface ChartStyling {
  title?: string
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  showDataLabels?: boolean
  colorPalette?: string
}

export interface ChartDataPoint {
  name: string
  value: number
  percent?: number
  count?: number
}

// Dashboard Types
export interface Dashboard {
  id: number
  name: string
  description?: string
  is_public: boolean
  public_token?: string
  widgets: DashboardWidget[]
  updated_at?: string
}

export interface DashboardWidget {
  id: string
  type: WidgetType
  chartId?: number
  chart_id?: number // Backend uses snake_case
  chartName?: string
  content?: string
  x: number
  y: number
  w: number
  h: number
  config?: Record<string, unknown>
}

export type WidgetType = 'chart' | 'kpi' | 'table' | 'text'

// Share Types
export interface DashboardShare {
  user_id: number
  email: string
  full_name: string
  permission: SharePermission
}

export type SharePermission = 'view' | 'edit'
