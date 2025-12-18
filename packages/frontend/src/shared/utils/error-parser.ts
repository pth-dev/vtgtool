/**
 * Error Parser Utility
 * Parses backend error responses into user-friendly messages
 */

// FastAPI/Pydantic validation error structure
interface ValidationErrorDetail {
  type: string
  loc: (string | number)[]
  msg: string
  input?: unknown
  ctx?: Record<string, unknown>
}

interface FastAPIErrorResponse {
  detail: ValidationErrorDetail[] | string
}

// Field-level errors for forms
export interface FieldErrors {
  [field: string]: string
}

// Parsed error result
export interface ParsedError {
  message: string
  fieldErrors?: FieldErrors
  isValidationError: boolean
}

/**
 * Parse backend error response into user-friendly format
 */
export function parseApiError(error: unknown): ParsedError {
  // Default error
  const defaultError: ParsedError = {
    message: 'An unexpected error occurred. Please try again.',
    isValidationError: false,
  }

  if (!error) return defaultError

  // Handle Error objects
  if (error instanceof Error) {
    return parseErrorMessage(error.message)
  }

  // Handle string errors
  if (typeof error === 'string') {
    return parseErrorMessage(error)
  }

  return defaultError
}

/**
 * Parse error message string (could be JSON or plain text)
 */
function parseErrorMessage(message: string): ParsedError {
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(message) as FastAPIErrorResponse

    // Handle validation errors array
    if (Array.isArray(parsed.detail)) {
      return parseValidationErrors(parsed.detail)
    }

    // Handle string detail
    if (typeof parsed.detail === 'string') {
      return {
        message: formatErrorMessage(parsed.detail),
        isValidationError: false,
      }
    }

    // Handle other formats
    if (parsed.detail) {
      return {
        message: String(parsed.detail),
        isValidationError: false,
      }
    }
  } catch {
    // Not JSON, use as-is but clean it up
  }

  return {
    message: formatErrorMessage(message),
    isValidationError: false,
  }
}

/**
 * Parse validation errors from FastAPI/Pydantic
 */
function parseValidationErrors(errors: ValidationErrorDetail[]): ParsedError {
  const fieldErrors: FieldErrors = {}
  const messages: string[] = []

  for (const err of errors) {
    const fieldName = err.loc.slice(1).join('.') || 'input'
    const readableField = formatFieldName(fieldName)
    const message = formatValidationMessage(err)

    fieldErrors[fieldName] = message
    messages.push(`${readableField}: ${message}`)
  }

  // Return single combined message if only one error
  if (messages.length === 1) {
    return {
      message: messages[0],
      fieldErrors,
      isValidationError: true,
    }
  }

  return {
    message: messages.join('\n'),
    fieldErrors,
    isValidationError: true,
  }
}

/**
 * Format validation error message to be user-friendly
 */
function formatValidationMessage(err: ValidationErrorDetail): string {
  const { type, msg } = err

  // Map common validation error types to friendly messages
  const errorMessages: Record<string, string> = {
    value_error: extractCoreMessage(msg),
    string_type: 'Must be a text value',
    string_too_short: 'Is too short',
    string_too_long: 'Is too long',
    missing: 'Is required',
    int_parsing: 'Must be a number',
    float_parsing: 'Must be a number',
    bool_parsing: 'Must be true or false',
    enum: 'Invalid option selected',
    email: 'Must be a valid email address',
  }

  // Check for email-specific validation
  if (msg.toLowerCase().includes('email')) {
    return 'Must be a valid email address'
  }

  // Check for password-specific validation
  if (msg.toLowerCase().includes('password')) {
    return extractCoreMessage(msg)
  }

  return errorMessages[type] || extractCoreMessage(msg)
}

/**
 * Extract core message from detailed error string
 */
function extractCoreMessage(msg: string): string {
  // Remove technical prefixes like "value is not a valid"
  let cleaned = msg
    .replace(/^value is not a valid /i, 'Invalid ')
    .replace(/^value_error\./i, '')
    .replace(/\s*Input should be/i, 'Should be')

  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

  return cleaned
}

/**
 * Format field name to be human-readable
 */
function formatFieldName(field: string): string {
  return field
    .split(/[._]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Clean up generic error messages
 */
function formatErrorMessage(message: string): string {
  // Handle common HTTP errors
  if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
    return 'Your session has expired. Please log in again.'
  }

  if (message.includes('403') || message.toLowerCase().includes('forbidden')) {
    return 'You do not have permission to perform this action.'
  }

  if (message.includes('404') || message.toLowerCase().includes('not found')) {
    return 'The requested resource was not found.'
  }

  if (message.includes('500') || message.toLowerCase().includes('internal server')) {
    return 'A server error occurred. Please try again later.'
  }

  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'Unable to connect to server. Please check your connection.'
  }

  // If message is too long or looks technical, use generic message
  if (message.length > 200 || message.includes('{') || message.includes('Error:')) {
    return 'An error occurred. Please try again.'
  }

  return message
}

/**
 * Get error message for a specific field
 */
export function getFieldError(error: ParsedError | null, field: string): string | undefined {
  return error?.fieldErrors?.[field]
}

/**
 * Check if error has any field-level errors
 */
export function hasFieldErrors(error: ParsedError | null): boolean {
  return !!error?.fieldErrors && Object.keys(error.fieldErrors).length > 0
}

/**
 * Get user-friendly error message from any error
 */
export function getUserFriendlyMessage(error: unknown): string {
  return parseApiError(error).message
}

