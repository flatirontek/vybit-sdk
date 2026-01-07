// Global test setup
// Only mock fetch if we're NOT running integration tests
// Integration tests need real fetch to hit the API
const isIntegrationTest = process.env.VYBIT_API_KEY || process.env.VYBIT_OAUTH2_TOKEN;

if (!isIntegrationTest) {
  // Mock fetch for unit tests only
  global.fetch = require('jest-fetch-mock');
}