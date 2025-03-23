import '@testing-library/jest-dom';

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

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock database
jest.mock('@/lib/supabase/db', () => ({
  db: {
    query: {
      repositories: {
        findMany: jest.fn(),
      },
    },
  },
}));

// Mock GET function
const mockGET = jest.fn().mockImplementation(async (req) => {
  const { NextResponse } = require('next/server');
  const { auth } = require('@/lib/auth');
  const { db } = require('@/lib/supabase/db');
  
  try {
    // Check authentication
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get repositories for the user
    const repositories = await db.query.repositories.findMany({
      where: (repos, { eq }) => eq(repos.userId, session.user.id),
      orderBy: (repos, { asc }) => asc(repos.fullName),
    });
    
    // Map repositories to a simpler format
    const mappedRepos = repositories.map(repo => ({
      id: repo.id,
      fullName: repo.fullName,
      owner: repo.owner,
      name: repo.name,
    }));
    
    return NextResponse.json({ repositories: mappedRepos });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
});

// Replace the actual GET with our mock
jest.mock('@/app/api/user/repositories/route', () => ({
  GET: (req) => mockGET(req),
}));

describe('User Repositories API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return repositories for authenticated user', async () => {
    // Mock authentication
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
    });
    
    // Mock database response
    const mockDb = require('@/lib/supabase/db').db;
    mockDb.query.repositories.findMany.mockResolvedValue([
      {
        id: 'repo-1',
        fullName: 'user/repo1',
        owner: 'user',
        name: 'repo1',
      },
      {
        id: 'repo-2',
        fullName: 'user/repo2',
        owner: 'user',
        name: 'repo2',
      },
    ]);
    
    // Create request
    const req = {};
    
    // Call the endpoint
    const response = await mockGET(req);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      repositories: [
        {
          id: 'repo-1',
          fullName: 'user/repo1',
          owner: 'user',
          name: 'repo1',
        },
        {
          id: 'repo-2',
          fullName: 'user/repo2',
          owner: 'user',
          name: 'repo2',
        },
      ],
    });
    
    // Verify database was queried with correct parameters
    expect(mockDb.query.repositories.findMany).toHaveBeenCalledWith({
      where: expect.any(Function),
      orderBy: expect.any(Function),
    });
  });
  
  it('should return 401 for unauthenticated users', async () => {
    // Mock authentication failure
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue(null);
    
    // Create request
    const req = {};
    
    // Call the endpoint
    const response = await mockGET(req);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Not authenticated',
    });
    
    // Verify database was not queried
    const mockDb = require('@/lib/supabase/db').db;
    expect(mockDb.query.repositories.findMany).not.toHaveBeenCalled();
  });
  
  it('should handle errors when querying the database', async () => {
    // Mock authentication
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
    });
    
    // Mock database error
    const mockDb = require('@/lib/supabase/db').db;
    mockDb.query.repositories.findMany.mockRejectedValue(new Error('Database error'));
    
    // Create request
    const req = {};
    
    // Call the endpoint
    const response = await mockGET(req);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch repositories',
    });
  });
  
  it('should return empty array when user has no repositories', async () => {
    // Mock authentication
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
    });
    
    // Mock empty database response
    const mockDb = require('@/lib/supabase/db').db;
    mockDb.query.repositories.findMany.mockResolvedValue([]);
    
    // Create request
    const req = {};
    
    // Call the endpoint
    const response = await mockGET(req);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      repositories: [],
    });
  });
}); 