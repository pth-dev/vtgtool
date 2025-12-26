import { z } from 'zod'

/**
 * API Response Validation Schemas
 * SECURITY: Validate all API responses to prevent malicious data injection
 */

// User Schema
export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'viewer']),
})

export type User = z.infer<typeof userSchema>

// DataSource Schema
export const dataSourceSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  name: z.string().min(1),
  file_type: z.string(),
  file_path: z.string(),
  file_size: z.number().int().nonnegative(),
  data_type: z.enum(['dashboard', 'isc']),
  status: z.enum(['pending', 'processing', 'completed', 'error']),
  error_message: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type DataSource = z.infer<typeof dataSourceSchema>

// Column Schema
export const columnSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean().optional(),
})

export type ColumnSchema = z.infer<typeof columnSchema>

// Paginated Response
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
  })

// Chart Schema
export const chartSchema = z.object({
  id: z.number().int().positive(),
  dataset_id: z.number().int().positive(),
  name: z.string().min(1),
  chart_type: z.string(),
  config: z.record(z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Chart = z.infer<typeof chartSchema>

// Dashboard Schema
export const dashboardSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  widgets: z.array(z.record(z.unknown())).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Dashboard = z.infer<typeof dashboardSchema>

// Generic Message Response
export const messageResponseSchema = z.object({
  message: z.string(),
})

// Error Response
export const errorResponseSchema = z.object({
  detail: z.union([
    z.string(),
    z.array(z.object({
      loc: z.array(z.union([z.string(), z.number()])),
      msg: z.string(),
      type: z.string(),
    })),
  ]),
})

/**
 * Safe parse helper with error logging
 */
export function safeParseApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    console.error('API Response Validation Failed:', {
      errors: result.error.errors,
      data,
    })
    throw new Error('Invalid API response format')
  }
  
  return result.data
}

/**
 * Sanitize HTML to prevent XSS
 * Use this for any user-generated content that might be rendered
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Sanitize object by removing potentially dangerous fields
 */
export function sanitizeObject<T>(obj: T): T {
  // Handle arrays - sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item =>
      typeof item === 'object' && item !== null ? sanitizeObject(item) : item
    ) as T
  }

  // Handle objects
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = { ...obj } as Record<string, unknown>

    // Remove common XSS vectors
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']
    dangerousKeys.forEach(key => {
      delete sanitized[key]
    })

    return sanitized as T
  }

  return obj
}

