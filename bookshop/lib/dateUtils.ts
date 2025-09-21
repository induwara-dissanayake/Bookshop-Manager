/**
 * Date utilities for consistent timezone handling
 * 
 * These functions ensure dates are created and handled consistently
 * across the application, taking into account the Sri Lanka timezone.
 */

/**
 * Get the current date in local timezone (Sri Lanka)
 * Returns a Date object that will store correctly in the database
 */
export function getCurrentLocalDate(): Date {
  const now = new Date()
  // Create date at noon local time to avoid timezone conversion issues
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
}

/**
 * Get the current date as ISO string for database storage
 * This ensures the date is stored consistently
 */
export function getCurrentDateForDB(): string {
  const now = new Date()
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return localDate.toISOString()
}

/**
 * Add days to a date and return new date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime())
  result.setDate(result.getDate() + days)
  // Ensure the time remains at noon to avoid timezone issues
  result.setHours(12, 0, 0, 0)
  return result
}

/**
 * Format date for display in Sri Lankan context
 */
export function formatDateForDisplay(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Get date string in YYYY-MM-DD format for input fields
 */
export function getDateInputValue(date?: Date | string): string {
  const d = date ? new Date(date) : new Date()
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return localDate.toISOString().split('T')[0]
}
