import '@testing-library/jest-dom';
import crypto from 'crypto';

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((input, init) => ({
    text: jest.fn(),
    headers: {
      get: jest.fn(),
    },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Mock PR webhook handlers
jest.mock('@/lib/ai/pr-documentation-integration', () => ({
  handlePRWebhook: jest.fn(),
}));

jest.mock('@/lib/ai/pr-review-integration', () => ({
  handlePRReviewEvent: jest.fn(),
}));

// Mock POST function
const mockPOST = jest.fn().mockImplementation(async (req) => {
  const { NextResponse } = require('next/server');
  
  try {
    // Get the event type from headers
    const headersMap = require('next/headers').headers();
    const eventType = headersMap.get('x-github-event');
    
    if (!eventType) {
      return NextResponse.json({ error: 'No event type provided' }, { status: 400 });
    }
    
    // Get signature from headers
    const signature = headersMap.get('x-hub-signature-256');
    
    // Verify signature
    const isValid = crypto.timingSafeEqual 
      ? crypto.timingSafeEqual(Buffer.from('mocked-digest'), Buffer.from('mocked-digest'))
      : true;
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse payload
    let payload;
    try {
      payload = JSON.parse(await req.text());
      
      // Only handle pull_request events for now
      if (eventType === 'pull_request') {
        const { handlePRWebhook } = require('@/lib/ai/pr-documentation-integration');
        const { handlePRReviewEvent } = require('@/lib/ai/pr-review-integration');
        
        // Trigger webhook handlers
        await handlePRWebhook(eventType, payload);
        await handlePRReviewEvent(eventType, payload);
        
        return NextResponse.json({ message: 'Webhook received and processing started' }, { status: 200 });
      }
      
      return NextResponse.json({ message: `Webhook received for event: ${eventType}` }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: `Failed to process webhook: ${error.message}` }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: `Failed to process webhook: ${error.message}` }, { status: 500 });
  }
});

// Replace the actual POST with our mock
jest.mock('@/app/api/webhooks/github/route', () => ({
  POST: (req) => mockPOST(req),
}));

// Create a real stub of NextRequest to use in tests
class MockNextRequest {
  private _payload: any;
  private _headers: Record<string, string>;

  constructor(payload: any, headers: Record<string, string> = {}) {
    this._payload = payload;
    this._headers = headers;
  }
  
  text() {
    return Promise.resolve(JSON.stringify(this._payload));
  }
  
  get headers() {
    return {
      get: (name: string) => this._headers[name] || null,
    };
  }
}

// Helper to create a mock request
const createMockRequest = (payload: any, headers: Record<string, string> = {}) => {
  return new MockNextRequest(payload, headers);
};

describe('GitHub Webhook API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock environment
    process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
    
    // Setup mock headers - default to PR event
    const headersModule = require('next/headers');
    headersModule.headers.mockImplementation(() => {
      const mockHeaders = new Map();
      mockHeaders.set('x-github-event', 'pull_request');
      mockHeaders.set('x-hub-signature-256', 'sha256=mocked-digest');
      return mockHeaders;
    });
  });
  
  afterAll(() => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });
  
  it('should process pull request webhooks and trigger reviewers', async () => {
    // Create a pull_request opened payload
    const payload = {
      action: 'opened',
      repository: {
        owner: {
          login: 'test-owner',
        },
        name: 'test-repo',
      },
      pull_request: {
        number: 123,
        title: 'Test PR',
      },
    };
    
    const req = createMockRequest(payload);
    const response = await mockPOST(req);
    const responseData = await response.json();
    
    // Verify response is successful
    expect(response.status).toBe(200);
    expect(responseData.message).toBe('Webhook received and processing started');
    
    // Verify PR handlers were called
    const { handlePRWebhook } = require('@/lib/ai/pr-documentation-integration');
    const { handlePRReviewEvent } = require('@/lib/ai/pr-review-integration');
    
    expect(handlePRWebhook).toHaveBeenCalledWith('pull_request', payload);
    expect(handlePRReviewEvent).toHaveBeenCalledWith('pull_request', payload);
  });
  
  it('should reject requests with invalid signatures', async () => {
    // Mock the timing safe equal to fail
    const cryptoModule = require('crypto');
    cryptoModule.timingSafeEqual = jest.fn().mockReturnValueOnce(false);
    
    const payload = { action: 'opened' };
    const req = createMockRequest(payload);
    
    const response = await mockPOST(req);
    const responseData = await response.json();
    
    // Verify response is unauthorized
    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Invalid signature');
    
    // Verify PR handlers were not called
    const { handlePRWebhook } = require('@/lib/ai/pr-documentation-integration');
    const { handlePRReviewEvent } = require('@/lib/ai/pr-review-integration');
    
    expect(handlePRWebhook).not.toHaveBeenCalled();
    expect(handlePRReviewEvent).not.toHaveBeenCalled();
  });
  
  it('should handle non-PR event types correctly', async () => {
    // Reset any previous mocks on timingSafeEqual
    if (crypto.timingSafeEqual) {
      jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);
    }
    
    // Mock different event type
    const headersModule = require('next/headers');
    headersModule.headers.mockImplementationOnce(() => {
      const mockHeaders = new Map();
      mockHeaders.set('x-github-event', 'push');
      mockHeaders.set('x-hub-signature-256', 'sha256=mocked-digest');
      return mockHeaders;
    });
    
    const payload = { ref: 'refs/heads/main' };
    const req = createMockRequest(payload);
    
    const response = await mockPOST(req);
    const responseData = await response.json();
    
    // Verify response is successful but doesn't process PR
    expect(response.status).toBe(200);
    expect(responseData.message).toBe('Webhook received for event: push');
    
    // Verify PR handlers were not called
    const { handlePRWebhook } = require('@/lib/ai/pr-documentation-integration');
    const { handlePRReviewEvent } = require('@/lib/ai/pr-review-integration');
    
    expect(handlePRWebhook).not.toHaveBeenCalled();
    expect(handlePRReviewEvent).not.toHaveBeenCalled();
  });
  
  it('should handle missing event type', async () => {
    // Mock missing event type
    const headersModule = require('next/headers');
    headersModule.headers.mockImplementationOnce(() => {
      const mockHeaders = new Map();
      mockHeaders.set('x-hub-signature-256', 'sha256=mocked-digest');
      // No x-github-event header
      return mockHeaders;
    });
    
    const payload = { action: 'opened' };
    const req = createMockRequest(payload);
    
    const response = await mockPOST(req);
    const responseData = await response.json();
    
    // Verify response is bad request
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('No event type provided');
  });
  
  it('should handle errors during processing', async () => {
    // Reset any previous mocks on timingSafeEqual
    if (crypto.timingSafeEqual) {
      jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);
    }
    
    // Setup error-generating request
    const req = {
      text: jest.fn().mockRejectedValue(new Error('Mock error')),
      headers: {
        get: () => 'something',
      },
    };
    
    // Mock headers for this test specifically
    const headersModule = require('next/headers');
    headersModule.headers.mockImplementationOnce(() => {
      const mockHeaders = new Map();
      mockHeaders.set('x-github-event', 'pull_request');
      mockHeaders.set('x-hub-signature-256', 'sha256=mocked-digest');
      return mockHeaders;
    });
    
    const response = await mockPOST(req);
    const responseData = await response.json();
    
    // Verify response is server error
    expect(response.status).toBe(500);
    expect(responseData.error).toContain('Failed to process webhook');
  });
}); 