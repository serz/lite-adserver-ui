/**
 * Generic query parameter builder for API requests
 */

export interface QueryBuilderConfig {
  /**
   * Custom transforms for specific parameters
   * e.g., { sort: (value) => value.replace(/_\d+$/, '') }
   */
  transforms?: Record<string, (value: any) => string>;
  
  /**
   * Parameters to omit from query string
   * e.g., ['useCache'] - internal options that shouldn't be sent to API
   */
  omit?: string[];
}

/**
 * Build URLSearchParams from options object
 * 
 * @param options - Object with query parameters
 * @param config - Optional configuration for transforms and omissions
 * @returns URLSearchParams ready to append to URL
 */
export function buildQueryParams(
  options: Record<string, any> = {},
  config?: QueryBuilderConfig
): URLSearchParams {
  const queryParams = new URLSearchParams();
  const omitSet = new Set(config?.omit || []);
  const transforms = config?.transforms || {};

  for (const [key, value] of Object.entries(options)) {
    // Skip undefined, null, or omitted parameters
    if (value === undefined || value === null || omitSet.has(key)) {
      continue;
    }

    // Apply custom transform if configured
    if (transforms[key]) {
      const transformed = transforms[key](value);
      if (transformed !== undefined && transformed !== null) {
        queryParams.append(key, transformed);
      }
      continue;
    }

    // Handle arrays (join with comma)
    if (Array.isArray(value)) {
      if (value.length > 0) {
        queryParams.append(key, value.join(','));
      }
      continue;
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      queryParams.append(key, value.toString());
      continue;
    }

    // Handle numbers
    if (typeof value === 'number') {
      queryParams.append(key, value.toString());
      continue;
    }

    // Handle strings
    if (typeof value === 'string') {
      queryParams.append(key, value);
      continue;
    }

    // For other types, convert to string
    queryParams.append(key, String(value));
  }

  return queryParams;
}

/**
 * Common transform for stripping timestamp suffixes from sort fields
 * e.g., 'created_at_1234567890' -> 'created_at'
 */
export function stripTimestampSuffix(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Handle 'created_at' with timestamp appended (for cache busting)
  if (value.startsWith('created_at_')) {
    return 'created_at';
  }
  
  return value;
}
