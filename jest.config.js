module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/src/**/__tests__/**/*.ts',
    '**/src/**/*.test.ts',
    '**/src/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs'
      }
    }]
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/__tests__/**',
    '!packages/*/src/**/*.test.ts',
    '!packages/*/src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@vybit/core$': '<rootDir>/packages/core/src',
    '^@vybit/oauth2-sdk$': '<rootDir>/packages/oauth2/src',
    '^@vybit/api-sdk$': '<rootDir>/packages/api/src'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};