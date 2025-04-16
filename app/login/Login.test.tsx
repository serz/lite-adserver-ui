import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './page';
import { useRouter } from 'next/navigation';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock as any;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Lite Adserver')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('handles form submission', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });

    render(<LoginPage />);
    
    const apiKeyInput = screen.getByLabelText('API Key');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Button should be disabled when input is empty
    expect(submitButton).toBeDisabled();
    
    // Fill in the form and submit
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.click(submitButton);
    
    // Check if localStorage was set correctly
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'lite-adserver-api-key', 
      'test-api-key'
    );
    
    // Check if navigation occurred
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
}); 