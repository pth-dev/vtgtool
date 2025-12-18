/**
 * API Constants
 * Base URLs, endpoints, and API configuration
 */

export const API_BASE_URL = '/api'

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    USERS: '/auth/users',
  },
  // Data Sources
  DATASOURCES: {
    BASE: '/datasources',
    UPLOAD: '/datasources/upload',
    PREVIEW: (id: number) => `/datasources/${id}/preview`,
    VALIDATE: (id: number) => `/datasources/${id}/validate`,
    SCHEMA: (id: number) => `/datasources/${id}/schema`,
    DELETE: (id: number) => `/datasources/${id}`,
  },
  // Datasets
  DATASETS: {
    BASE: '/datasets',
    DETAIL: (id: number) => `/datasets/${id}`,
    PREVIEW: (id: number) => `/datasets/${id}/preview`,
    DATA: (id: number) => `/datasets/${id}/data`,
    PROCESS: '/datasets/process',
  },
  // Charts
  CHARTS: {
    BASE: '/charts',
    DETAIL: (id: number) => `/charts/${id}`,
    DATA: (id: number) => `/charts/${id}/data`,
    PREVIEW: '/charts/preview',
  },
  // Dashboards
  DASHBOARDS: {
    BASE: '/dashboards',
    DETAIL: (id: number) => `/dashboards/${id}`,
    CLONE: (id: number) => `/dashboards/${id}/clone`,
    SHARE: (id: number) => `/dashboards/${id}/share`,
    SHARES: (id: number) => `/dashboards/${id}/shares`,
    PUBLISH: (id: number) => `/dashboards/${id}/publish`,
    UNPUBLISH: (id: number) => `/dashboards/${id}/unpublish`,
    PUBLIC: (token: string) => `/dashboards/public/${token}`,
  },
  // Export
  EXPORT: {
    DATASET_CSV: (id: number) => `/export/dataset/${id}/csv`,
    DATASET_EXCEL: (id: number) => `/export/dataset/${id}/xlsx`,
    CHART_PNG: (id: number) => `/export/chart/${id}/png`,
    CHART_SVG: (id: number) => `/export/chart/${id}/svg`,
    DASHBOARD_PDF: (id: number) => `/export/dashboard/${id}/pdf`,
  },
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const

export const API_TIMEOUT = 30000 // 30 seconds
