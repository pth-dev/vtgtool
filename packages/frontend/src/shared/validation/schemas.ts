/**
 * Zod Validation Schemas
 * Centralized validation schemas for all forms
 */
import { z } from 'zod'

// Common field validations
const email = z.string().min(1, 'Email is required').email('Please enter a valid email address')

const password = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters')

const fullName = z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters')

// Login form schema
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})
export type LoginFormData = z.infer<typeof loginSchema>

// Create user form schema
export const createUserSchema = z.object({
  email,
  password,
  full_name: fullName,
})
export type CreateUserFormData = z.infer<typeof createUserSchema>

// Chart form schema
export const chartSchema = z.object({
  name: z.string().min(1, 'Chart name is required').min(2, 'Name must be at least 2 characters'),
  chart_type: z.enum(['bar', 'line', 'pie', 'donut', 'area', 'table', 'kpi']),
})
export type ChartFormData = z.infer<typeof chartSchema>

// Dashboard form schema
export const dashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
})
export type DashboardFormData = z.infer<typeof dashboardSchema>

// Dataset form schema
export const datasetSchema = z.object({
  name: z
    .string()
    .min(1, 'Dataset name is required')
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z0-9_\- ]+$/, 'Name can only contain letters, numbers, spaces, hyphens and underscores'),
})
export type DatasetFormData = z.infer<typeof datasetSchema>

// Share dashboard schema
export const shareDashboardSchema = z.object({
  user_id: z.number().min(1, 'Please select a user'),
  permission: z.enum(['view', 'edit']),
})
export type ShareDashboardFormData = z.infer<typeof shareDashboardSchema>

// Publish dashboard schema
export const publishDashboardSchema = z.object({
  password: z.string().optional(),
  expiresAt: z.string().optional(),
})
export type PublishDashboardFormData = z.infer<typeof publishDashboardSchema>

/**
 * Helper to validate data against schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.')
    if (!errors[field]) {
      errors[field] = issue.message
    }
  }

  return { success: false, errors }
}

/**
 * Get first error message from validation result
 */
export function getFirstError(errors: Record<string, string>): string {
  const keys = Object.keys(errors)
  if (keys.length === 0) return ''
  return errors[keys[0]]
}

