import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { useRouter } from 'next/navigation';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock the auth-provider hook
jest.mock('@/components/auth-provider', () => ({
  useAuth: jest.fn(),
}));

// Mock the auth lib
jest.mock('@/lib/auth', () => ({
  isLoggedIn: jest.fn().mockReturnValue(false),
  setApiKey: jest.fn(),
  clearApiKey: jest.fn(),
  getApiKey: jest.fn(),
}));

// Mock localStorage for direct testing
interface LocalStorageMock {
  getItem: jest.Mock;
  setItem: jest.Mock;
  clear: jest.Mock;
}

const localStorageMock: LocalStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock as unknown as Storage;

// Import after mocking
import { useAuth } from '@/components/auth-provider';
import { isLoggedIn } from '@/lib/auth';

describe('LoginPage', () => {
  let mockLogin: jest.Mock;
  let mockPush: jest.Mock;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up router mock
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Set up auth mock with login function
    mockLogin = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      apiInitialized: false,
    });

    // Default to not logged in
    (isLoggedIn as jest.Mock).mockReturnValue(false);
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Lite Adserver')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('handles form submission and calls login', async () => {
    render(<LoginPage />);
    
    const apiKeyInput = screen.getByLabelText('API Key');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Fill in the form and submit
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    fireEvent.click(submitButton);
    
    // Check if the login function was called with the API key
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test-api-key');
    });
  });

  it('redirects if already authenticated', async () => {
    // Mock that the user is already authenticated
    (isLoggedIn as jest.Mock).mockReturnValue(true);

    // Render the component
    render(<LoginPage />);
    
    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message when login fails with invalid API key', async () => {
    // Mock login to reject with 401 error
    mockLogin.mockRejectedValue(new Error('401 Unauthorized: Invalid API key'));
    
    render(<LoginPage />);
    
    const apiKeyInput = screen.getByLabelText('API Key');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Fill in the form and submit
    fireEvent.change(apiKeyInput, { target: { value: 'invalid-key' } });
    fireEvent.click(submitButton);
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid API key. Please check your key and try again.')).toBeInTheDocument();
    });
    
    // Verify login was called but redirect did not happen
    expect(mockLogin).toHaveBeenCalledWith('invalid-key');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays network error message when connection fails', async () => {
    // Mock login to reject with network error
    mockLogin.mockRejectedValue(new Error('Network error: Failed to connect to server'));
    
    render(<LoginPage />);
    
    const apiKeyInput = screen.getByLabelText('API Key');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Fill in the form and submit
    fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });
    fireEvent.click(submitButton);
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
    });
  });
}); 