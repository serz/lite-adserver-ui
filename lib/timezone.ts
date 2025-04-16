/**
 * Timezone utilities for consistent date/time handling
 */

/**
 * Get the configured timezone from environment variables
 */
export const getTimezone = (): string => {
  return process.env.NEXT_PUBLIC_TIMEZONE || 'UTC';
};

/**
 * Format a date using the configured timezone
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }
): string => {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  const timezone = getTimezone();
  
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: timezone
  }).format(dateObj);
};

/**
 * Convert a date to the configured timezone
 */
export const convertToTimezone = (date: Date | string | number): Date => {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return new Date(
    new Date(dateObj).toLocaleString('en-US', { timeZone: getTimezone() })
  );
}; 