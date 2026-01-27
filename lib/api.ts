interface ApiOptions {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

interface ApiError {
  error: string;
}

// Get the API URL from various sources (Next.js env, Cloudflare injected env, or fallback)
export const getApiUrl = (): string => {
  // Try Next.js environment variable first (for dev server)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AD_SERVER_URL) {
    return process.env.NEXT_PUBLIC_AD_SERVER_URL;
  }
  
  // Try Cloudflare injected environment variables (for Workers)
  if (typeof window !== 'undefined' && (window as any).__CLOUDFLARE_ENV__?.NEXT_PUBLIC_AD_SERVER_URL) {
    return (window as any).__CLOUDFLARE_ENV__.NEXT_PUBLIC_AD_SERVER_URL;
  }
  
  // Try window global (if available)
  if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_AD_SERVER_URL) {
    return (window as any).__NEXT_DATA__.env.NEXT_PUBLIC_AD_SERVER_URL;
  }
  
  // Fallback to the production URL
  return 'https://lite-adserver.affset.com';
};

const DEFAULT_API_OPTIONS: ApiOptions = {
  baseUrl: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Securely extract and validate namespace from the current domain.
 * Extracts the subdomain (first part before the first dot) and validates it.
 * 
 * @returns The validated namespace string, or empty string if invalid/not available
 */
function getNamespace(): string {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const hostname = window.location.hostname;
    
    // Handle edge cases
    if (!hostname || hostname.length === 0) {
      return '';
    }

    // Skip for localhost, IP addresses, or domains without subdomain
    // IP addresses contain only digits and dots
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      // IP address - no namespace
      return '';
    }

    // Check if it's localhost or similar
    if (hostname === 'localhost' || hostname.startsWith('localhost.')) {
      return '';
    }

    // Extract subdomain (first part before first dot)
    const parts = hostname.split('.');
    if (parts.length < 2) {
      // No subdomain (e.g., just "example.com")
      return '';
    }

    const subdomain = parts[0];
    
    // Validate namespace: alphanumeric, hyphens, underscores only
    // Length: 1-63 characters (DNS label limit)
    // Must start and end with alphanumeric character
    const namespacePattern = /^[a-z0-9]([a-z0-9_-]{0,61}[a-z0-9])?$/i;
    
    if (!namespacePattern.test(subdomain)) {
      console.warn(`API client: Invalid namespace format from hostname "${hostname}": "${subdomain}"`);
      return '';
    }

    // Additional security: prevent header injection
    // Check for newlines, carriage returns, or other control characters
    if (/[\r\n]/.test(subdomain)) {
      console.warn('API client: Namespace contains invalid characters (header injection attempt?)');
      return '';
    }

    return subdomain;
  } catch (error) {
    console.error('API client: Error extracting namespace:', error);
    return '';
  }
}

export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: ApiOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_API_OPTIONS.baseUrl || '';
    this.headers = {
      ...DEFAULT_API_OPTIONS.headers,
      ...options.headers,
    };

    if (options.apiKey) {
      this.headers['Authorization'] = `Bearer ${options.apiKey}`;
      // Namespace will be computed dynamically on each request
    }
  }

  /**
   * Update the API key used for requests
   */
  updateApiKey(apiKey: string): void {
    this.headers['Authorization'] = `Bearer ${apiKey}`;
    // Namespace will be computed dynamically on each request
  }

  /**
   * Check if the API client has an API key
   */
  hasApiKey(): boolean {
    return !!this.headers['Authorization'];
  }

  /**
   * Process data before sending to API to ensure correct formats
   * This ensures date timestamps remain in milliseconds
   */
  private processRequestData(data: any): any {
    if (!data) return data;
    
    // Check if the data is an array
    if (Array.isArray(data)) {
      // If it's an array, process each item individually
      // Currently, the processing logic only applies to campaign objects
      // with start/end dates, so we can likely return the array as is.
      // If specific array item processing was needed, it would go here.
      // For now, just return a copy of the array.
      return [...data]; 
    } 
    
    // If it's not an array, assume it's an object and process as before
    // Create a copy of the data to avoid mutating the original
    const processedData = { ...data };
    
    // Ensure campaign timestamps are sent in milliseconds
    if ('start_date' in processedData || 'end_date' in processedData) {
      // Always ensure we're using milliseconds, not seconds
      // This is a safeguard in case any conversion to seconds happens elsewhere
      if (processedData.start_date && typeof processedData.start_date === 'number') {
        // If this is a seconds timestamp (smaller than year 2000 in ms), convert to ms
        if (processedData.start_date < 100000000000) {
          console.log('API client: Converting start_date from seconds to milliseconds');
          processedData.start_date = processedData.start_date * 1000;
        }
      }
      
      if (processedData.end_date && typeof processedData.end_date === 'number') {
        // If this is a seconds timestamp (smaller than year 2000 in ms), convert to ms
        if (processedData.end_date < 100000000000) {
          console.log('API client: Converting end_date from seconds to milliseconds');
          processedData.end_date = processedData.end_date * 1000;
        }
      }
    }
    
    return processedData;
  }

  async request<T>(
    endpoint: string,
    method: string = 'GET',
    data?: unknown
  ): Promise<T> {
    // Validate that we have an API key before making requests
    if (!this.hasApiKey()) {
      console.error('API client: No API key found. Authorization will fail.');
      throw new Error('API key is required. Please log in first.');
    }

    // Compute namespace dynamically on each request for security and accuracy
    const namespace = getNamespace();
    
    // Build headers with dynamically computed namespace
    const requestHeaders: Record<string, string> = {
      ...this.headers,
    };
    
    // Only add namespace header if we have a valid namespace
    if (namespace) {
      requestHeaders['x-namespace'] = namespace;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (data) {
      // Process data to ensure proper timestamp formats
      const processedData = this.processRequestData(data);
      options.body = JSON.stringify(processedData);
    }

    console.log(`API client: Making ${method} request to ${endpoint}`, { url, headers: { ...requestHeaders, Authorization: '[REDACTED]' } });
    
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      console.log(`API client: Response received for ${endpoint}. Status: ${response.status}, Content-Type: ${contentType}`);
      
      if (!response.ok) {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json() as ApiError;
          const errorMessage = errorData.error || `API error (${response.status})`;
          console.error(`API client: Request failed with status ${response.status}:`, errorMessage);
          
          // Handle auth errors specifically
          if (response.status === 401 || response.status === 403) {
            throw new Error('API key is invalid or expired. Please log in again.');
          }
          
          throw new Error(errorMessage);
        }
        console.error(`API client: Request failed with status ${response.status}`);
        
        // Handle auth errors specifically
        if (response.status === 401 || response.status === 403) {
          throw new Error('API key is invalid or expired. Please log in again.');
        }
        
        throw new Error(`API error (${response.status})`);
      }

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        console.log(`API client: Received JSON response from ${endpoint}`, { responseShape: Object.keys(data) });
        return data;
      }

      const textData = await response.text();
      console.log(`API client: Received text response from ${endpoint}`, { responseLength: textData.length });
      return textData as unknown as T;
    } catch (error) {
      console.error(`API client: Error during request to ${endpoint}:`, error);
      
      // Handle network-specific errors with more descriptive messages
      if (error instanceof Error) {
        if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error(`Network error: Unable to resolve server address. Please check your internet connection and server configuration.`);
        } else if (error.message.includes('ERR_NETWORK') || error.message.includes('NetworkError')) {
          throw new Error(`Network error: Unable to connect to server. Please check your internet connection.`);
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error(`Network error: Failed to connect to server. Please check if the server is accessible.`);
        }
      }
      
      throw error;
    }
  }

  // Helper methods for common HTTP verbs
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'GET');
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, 'POST', data);
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }
}

// Create a default instance with dynamic base URL resolution
export const api = new ApiClient({
  baseUrl: getApiUrl(),
  // No default API key - will be set after login
}); 