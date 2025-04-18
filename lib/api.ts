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
      options.body = JSON.stringify(data);
    }

    console.log(`API client: Making ${method} request to ${endpoint}`);
    
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
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
        console.log(`API client: Received JSON response from ${endpoint}`);
        return data;
      }

      const textData = await response.text();
      console.log(`API client: Received text response from ${endpoint}`);
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