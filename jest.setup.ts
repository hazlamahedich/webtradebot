// Import and configure jest-dom
import '@testing-library/jest-dom';

// This adds custom matchers like `toBeInTheDocument` to expect
// This makes TypeScript recognize the custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | number | RegExp): R;
      toHaveStyle(style: Record<string, any>): R;
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ 
    data: null, 
    status: 'unauthenticated',
    update: jest.fn()
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Set up global environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.com';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Suppress console errors during tests
global.console.error = jest.fn();

// Cleanup after tests
afterEach(() => {
  jest.clearAllMocks();
}); 