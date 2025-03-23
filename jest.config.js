const nextJest = require('next/jest');

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: './' });

// Any custom config you want to pass to Jest
const customJestConfig = {
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/"
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock problematic imports that cause syntax errors
    '^@/lib/ai/code-review$': '<rootDir>/__mocks__/code-review.js'
  },
  transformIgnorePatterns: [
    "/node_modules/(?![@]?langchain)"
  ]
};

// createJestConfig is exported in this way to ensure that next/jest can load the Next.js configuration, which is async
module.exports = createJestConfig(customJestConfig); 