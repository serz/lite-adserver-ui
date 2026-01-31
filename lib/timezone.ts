/**
 * Timezone utilities for consistent date/time handling
 * TODO: Integrate with tenant settings timezone when available
 */

/**
 * Get the timezone (defaults to UTC)
 * In the future, this will fetch from tenant settings
 */
export const getTimezone = (): string => {
  // For now, always use UTC since NEXT_PUBLIC_TIMEZONE env var has been removed
  // This will be updated to fetch from tenant settings in the future
  return 'UTC';
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