#!/bin/bash

# Script to run code review tests with proper environment setup

# Set environment variables for testing
export NODE_ENV=test
export GITHUB_WEBHOOK_SECRET=test-secret
export GITHUB_ACCESS_TOKEN=test-token
export NEXT_PUBLIC_APP_URL=http://localhost:3000

# Create __tests__/reviews directory if it doesn't exist
mkdir -p __tests__/reviews

# Run only code review tests
echo "Running code review tests..."
npm run test:reviews

# Show test coverage
echo ""
echo "Generating test coverage report..."
npx jest --testMatch="**/__tests__/reviews/**/*.test.[jt]s?(x)" --coverage

# Show summary
echo ""
echo "Test run complete!"
echo "Check coverage report above for details." 