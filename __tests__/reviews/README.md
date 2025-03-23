# Code Review Tests

This directory contains automated tests for the code review functionality of the application. These tests verify that both the webhook-based automatic review creation and the manual review request processes work correctly.

## Test Coverage

The tests cover:

1. **PR Review Integration** (`pr-review-integration.test.ts`):
   - Creating new code reviews for PRs
   - Handling PR events (open, synchronize)
   - Posting review comments on PRs
   - Error handling scenarios

2. **GitHub Webhook Handler** (`github-webhook.test.ts`):
   - Processing incoming webhook events
   - Signature verification
   - Proper event routing
   - Error handling

3. **Manual Review Request** (`request-review.test.ts`):
   - Requesting code reviews manually
   - Authentication validation
   - Error handling
   - PR data fetching

4. **Repository API** (`repositories-api.test.ts`):
   - Fetching user repositories
   - Authentication checks
   - Error handling

## Running the Tests

You can run all tests with:

```bash
npm test
```

To run only the code review tests:

```bash
npm run test:reviews
```

To run a specific test file:

```bash
npx jest __tests__/reviews/pr-review-integration.test.ts
```

## Test Setup

These tests use Jest's mocking capabilities to simulate:

- Database operations
- GitHub API calls
- Authentication
- Webhook requests

No actual external services are called during testing, making these tests fast and reliable.

## Extending the Tests

When adding new functionality to the code review system, please add corresponding tests following the patterns established in these files.

Key considerations:
- Mock all external dependencies
- Test both success and error scenarios
- Verify proper authentication checks
- Ensure webhook signature verification works correctly 