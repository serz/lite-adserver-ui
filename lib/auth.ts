// Constants
const API_KEY_STORAGE_KEY = 'lite-adserver-api-key';

/**
 * Set the API key in localStorage
 */
export const setApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    console.log('auth.ts: Setting API key in localStorage');
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } else {
    console.warn('auth.ts: Cannot set API key - window is undefined');
  }
};

/**
 * Get the API key from localStorage
 */
export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    console.log('auth.ts: Retrieved API key from localStorage:', apiKey ? 'Found key' : 'No key found');
    return apiKey;
  }
  console.warn('auth.ts: Cannot get API key - window is undefined');
  return null;
};

/**
 * Clear the API key from localStorage
 */
export const clearApiKey = (): void => {
  if (typeof window !== 'undefined') {
    console.log('auth.ts: Clearing API key from localStorage');
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } else {
    console.warn('auth.ts: Cannot clear API key - window is undefined');
  }
};

/**
 * Check if a user is logged in (has an API key)
 */
export const isLoggedIn = (): boolean => {
  const hasKey = !!getApiKey();
  console.log('auth.ts: isLoggedIn check:', hasKey);
  return hasKey;
}; 