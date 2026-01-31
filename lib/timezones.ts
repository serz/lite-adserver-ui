/**
 * Common timezones for fallback when Intl.supportedValuesOf is not available
 */
const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

/**
 * Get list of timezone identifiers for the timezone selector.
 * Uses Intl.supportedValuesOf when available, otherwise returns common timezones.
 * UTC is always included (first) so it can always be selected.
 */
export function getTimezoneOptions(): string[] {
  let list: string[];
  if (
    typeof Intl !== "undefined" &&
    "supportedValuesOf" in Intl &&
    typeof (Intl as any).supportedValuesOf === "function"
  ) {
    try {
      list = (Intl as any).supportedValuesOf("timeZone") as string[];
    } catch {
      list = COMMON_TIMEZONES;
    }
  } else {
    list = COMMON_TIMEZONES;
  }
  const seen = new Set(list);
  if (!seen.has("UTC")) {
    return ["UTC", ...list];
  }
  return list;
}

/**
 * Build timezone options for the settings form, ensuring the current value
 * is in the list so the Select can pre-select it (e.g. after page refresh).
 */
export function getTimezoneOptionsWithCurrent(
  currentTimezone: string | undefined
): string[] {
  const list = getTimezoneOptions();
  if (!currentTimezone || currentTimezone === "UTC") return list;
  if (list.includes(currentTimezone)) return list;
  return [currentTimezone, ...list];
}
