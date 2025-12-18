/**
 * Validation Constants
 * Regex patterns, error messages, and validation rules
 */

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  URL: /^https?:\/\/[^\s]+$/,
} as const

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 500,
  },
} as const

// Error Messages (can be used with i18n later)
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be less than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`,
  NAME_TOO_LONG: `Name must be less than ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`,
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  NETWORK_ERROR: 'Network error. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully',
  DELETED: 'Deleted successfully',
  UPLOADED: 'File uploaded successfully',
  IMPORTED: 'Data imported successfully',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
} as const
