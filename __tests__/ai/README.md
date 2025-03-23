# Documentation Generator Tests

This directory contains tests for the AI-powered documentation generator system.

## Overview

The documentation generator system automatically analyzes repositories and generates comprehensive documentation, including:

- Component descriptions and usage
- Architecture diagrams
- Code quality assessments
- Missing documentation detection

The system is designed to work with Vercel's free tier constraints by processing documentation in chunks, using a webhook-based architecture to avoid timeouts.

## Test Structure

The test suite is organized into several parts:

1. **Unit Tests**: Testing individual functions in isolation
2. **Integration Tests**: Testing the interaction between components
3. **E2E Tests**: Testing the entire documentation generation flow

## Running Tests

### Unit Tests

To run all documentation generator unit tests:

```bash
npm run test:docs
```

These tests verify individual component behavior with mocked dependencies.

### End-to-End Tests

For a complete test of the documentation generation process using a real repository:

```bash
npm run test:docs:e2e
```

This script:
1. Creates a test documentation request in the database
2. Triggers the actual documentation generation process
3. Polls for completion and reports results
4. Cleans up test data when finished

To preserve test data for inspection, run:

```bash
KEEP_TEST_DATA=true npm run test:docs:e2e
```

## Test Configuration

The default test repository is [shadcn/ui](https://github.com/shadcn/ui), chosen for its reasonable size and well-structured code.

To use a different repository, modify the `TEST_REPO` constant in `scripts/test-documentation-generation.ts`.

## Testing Strategies

### Mocking Approach

Tests use Jest mocks for:

- GitHub API responses
- Database operations
- Fetch API calls
- Time-based functions

### Test Environment

Tests run in a Node.js environment with:
- Mock fetch implementation
- Mocked Supabase database
- Local webhook processing

## Debugging Failed Tests

If tests fail, check:

1. Environment variables - ensure GitHub token is configured
2. Database connectivity - verify Supabase connection
3. Webhook timeouts - check if processing takes too long
4. Memory issues - large repositories might need chunking adjustment

## CI/CD Integration

These tests are designed to run in CI/CD pipelines. The E2E test has a 5-minute timeout to accommodate documentation generation for medium-sized repositories.

# AI Component Tests

This directory contains tests for the AI components of the application, including documentation generators, code review functionality, and associated models and prompts.

## Test Structure

The test files are organized by component:

- `code-review-minimal.test.ts`: Basic tests for the code review functionality
- `documentation-prompts.test.ts`: Tests for documentation prompt templates
- `models.test.ts`: Tests for AI model configurations
- `pr-review-integration.test.ts`: Integration tests for the pull request review flow

## Running Tests

You can run all AI component tests using:

```bash
npm run test:ai
```

To run specific test files:

```bash
npx jest __tests__/ai/models.test.ts
npx jest __tests__/ai/documentation-prompts.test.ts
```

## Test Coverage

Current test coverage by component:

- **Documentation Prompts**: 100% coverage of prompt templates and structure
- **Models**: Basic coverage for model configuration parameters
- **Code Review**: Basic coverage for exported functions using mocks
- **PR Review Integration**: Integration testing with mocked dependencies

## CI Integration

These tests are integrated into the GitHub Actions workflow defined in `.github/workflows/test-documentation.yml`. The workflow runs:

1. All AI component tests using `npm run test:ai`
2. Documentation generator tests using `npm run test:docs`
3. Documentation webhook tests using `npm run test:docs:webhooks`

## Mock Setup

The tests use various mocks to avoid actual API calls:

- **OpenAI API**: Mocked using Jest mock functions
- **LangChain Components**: Mocked to return predefined responses
- **Supabase Database**: Mocked database queries and responses
- **GitHub API**: Mocked client and API responses
- **Web APIs**: Request/Response objects mocked where needed

## Known Issues

- `code-review.ts` contains duplicate declarations of `createCodeReviewGraph`, requiring special mocking approaches
- LangGraph dependency issues with the documentation generator tests
- Some tests need to use `jest.isolateModules()` to avoid mock conflicts

## Future Improvements

Areas for improving test coverage:

1. **Enhanced Unit Testing**:
   - More granular testing of individual functions
   - Error handling tests for edge cases
   - Testing for rate limiting and retry logic

2. **Integration Testing**:
   - End-to-end tests with controlled inputs
   - Tests for the complete processing pipeline

3. **Mock Improvements**:
   - More realistic mock responses
   - Better state transition mocks
   - Testing various AI model responses

4. **Edge Case Testing**:
   - Large repository handling
   - Timeout and error recovery
   - Invalid input handling 