interface ApiOptions {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

interface ApiError {
  error: string;
}

const DEFAULT_API_OPTIONS: ApiOptions = {
  baseUrl: process.env.NEXT_PUBLIC_AD_SERVER_URL || 'https://api.liteadserver.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
};

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
    }
  }

  /**
   * Update the API key used for requests
   */
  updateApiKey(apiKey: string): void {
    this.headers['Authorization'] = `Bearer ${apiKey}`;
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

    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.headers,
    };

    if (data) {
      // Process data to ensure proper timestamp formats
      const processedData = this.processRequestData(data);
      options.body = JSON.stringify(processedData);
    }

    console.log(`API client: Making ${method} request to ${endpoint}`, { url, headers: { ...this.headers, Authorization: '[REDACTED]' } });
    
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      console.log(`API client: Response received for ${endpoint}. Status: ${response.status}, Content-Type: ${contentType}`);
      
      if (!response.ok) {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json() as ApiError;
          const errorMessage = errorData.error || `API error (${response.status})`;
          console.error(`API client: Request failed with status ${response.status}:`, errorMessage);
          throw new Error(errorMessage);
        }
        console.error(`API client: Request failed with status ${response.status}`);
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

// Create a default instance with only the base URL from environment
export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_AD_SERVER_URL,
  // No default API key - will be set after login
}); 