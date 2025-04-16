// Constants
const API_KEY_STORAGE_KEY = 'lite-adserver-api-key';

/**
 * Set the API key in localStorage
 */
export const setApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }
};

/**
 * Get the API key from localStorage
 */
export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }
  return null;
};

/**
 * Clear the API key from localStorage
 */
export const clearApiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
};

/**
 * Check if a user is logged in (has an API key)
 */
export const isLoggedIn = (): boolean => {
  return !!getApiKey();
}; 