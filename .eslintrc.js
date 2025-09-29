module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2020: true,
    jest: true, // Add Jest globals
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    '**/*.test.ts', // Ignore test files
    '**/__tests__/**/*', // Ignore test directories
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-unused-vars': 'off', // Turn off base rule
  },
};