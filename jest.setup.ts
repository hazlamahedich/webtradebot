// Import and configure jest-dom
import '@testing-library/jest-dom';

// Add TextEncoder/TextDecoder for Node.js environment 
// (required by LangChain/LangGraph)
import { TextEncoder, TextDecoder } from 'util';

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for OpenAI
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as Response)
);

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

// Mock ReadableStream for @langchain tests
class MockReadableStream {
  constructor(public source?: any) {}
  getReader() {
    return {
      read: jest.fn().mockResolvedValue({ done: true }),
      releaseLock: jest.fn(),
    };
  }
  pipeThrough() {
    return new MockReadableStream();
  }
}

global.ReadableStream = MockReadableStream as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: () => null,
      replace: () => null,
      back: () => null,
      forward: () => null,
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Next Response
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((data) => ({
        status: 200,
        body: JSON.stringify(data),
        headers: new Headers(),
      })),
    },
    cookies: jest.fn(),
  };
});

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'mocked response' } }],
          }),
        },
      },
    })),
  };
});

// Mock for langchain/openai
jest.mock('@langchain/openai', () => {
  return {
    ChatOpenAI: jest.fn().mockImplementation(() => ({
      invoke: jest.fn().mockResolvedValue({ content: 'mocked response' }),
      stream: jest.fn().mockResolvedValue({ content: 'mocked stream' }),
    })),
  };
});

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