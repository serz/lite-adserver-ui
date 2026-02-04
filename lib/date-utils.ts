import { format, isValid } from 'date-fns';

/**
 * Formats a timestamp or Date object as a readable date string
 * @param date Timestamp (number) or Date object to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: number | Date | undefined | null,
  options: {
    format?: string;
    fallback?: string;
  } = {}
): string {
  if (date === undefined || date === null) {
    return options.fallback || 'N/A';
  }

  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  if (!isValid(dateObj)) {
    return options.fallback || 'Invalid date';
  }

  return format(dateObj, options.format || 'MMM dd, yyyy');
}

/**
 * Formats a timestamp or Date object as a readable date and time string
 * @param date Timestamp (number) or Date object to format
 * @param options Formatting options
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: number | Date | undefined | null,
  options: {
    format?: string;
    fallback?: string;
  } = {}
): string {
  if (date === undefined || date === null) {
    return options.fallback || 'N/A';
  }

  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  if (!isValid(dateObj)) {
    return options.fallback || 'Invalid date';
  }

  return format(dateObj, options.format || 'MMM dd, yyyy h:mm a');
}

/** 24h datetime format: e.g. "Feb 02, 2026 15:15" */
export const FORMAT_DATETIME_24H = 'MMM dd, yyyy HH:mm'; 