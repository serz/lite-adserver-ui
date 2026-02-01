import { getCachedTenantSettings } from '@/lib/tenant-settings-cache';

/**
 * Timezone utilities for consistent date/time handling.
 * Uses timezone from tenant settings (profile) when available.
 */

/**
 * Get the timezone (profile/platform timezone from tenant settings, defaults to UTC)
 */
export const getTimezone = (): string => {
  const settings = getCachedTenantSettings().settings;
  return settings?.timezone ?? 'UTC';
};

/**
 * Get UTC offset in ms for a given date in a timezone (at noon UTC that day to avoid DST edge cases).
 */
function getOffsetMsAtNoonUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string
): number {
  const noonUTC = Date.UTC(year, month, day, 12, 0, 0, 0);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(noonUTC));
  const get = (name: string) =>
    parseInt(parts.find((p) => p.type === name)?.value ?? '0', 10);
  const localH = get('hour');
  const localM = get('minute');
  const localS = get('second');
  const localMs = Date.UTC(year, month, day, localH, localM, localS, 0);
  return localMs - noonUTC;
}

/**
 * UTC ms for 00:00:00.000 on the given calendar day in the given timezone.
 */
export function getUtcMsForStartOfDayInTimezone(
  year: number,
  month: number,
  day: number,
  timeZone: string
): number {
  const noonUTC = Date.UTC(year, month, day, 12, 0, 0, 0);
  const offsetMs = getOffsetMsAtNoonUtc(year, month, day, timeZone);
  return Date.UTC(year, month, day, 0, 0, 0, 0) - offsetMs;
}

/**
 * UTC ms for 23:59:59.999 on the given calendar day in the given timezone.
 */
export function getUtcMsForEndOfDayInTimezone(
  year: number,
  month: number,
  day: number,
  timeZone: string
): number {
  return (
    getUtcMsForStartOfDayInTimezone(year, month, day, timeZone) +
    24 * 60 * 60 * 1000 -
    1
  );
}

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