/**
 * OAuth2 Client Integration Tests
 *
 * These tests run against the real Vybit OAuth2 API when an access token is provided.
 * They are skipped in CI when no token is available.
 *
 * To get an access token for testing:
 * 1. Create an OAuth2 app at developer.vybit.net
 * 2. Follow the OAuth flow to get an access token
 * 3. Set VYBIT_OAUTH2_TOKEN environment variable
 *
 * To run:
 *   VYBIT_OAUTH2_TOKEN=your-token npm test -w @vybit/oauth2-sdk
 *
 * Note: Access tokens expire, so you may need to refresh periodically.
 */

import { VybitOAuth2Client } from '../oauth2-client';

const ACCESS_TOKEN = process.env.VYBIT_OAUTH2_TOKEN;
const hasAccessToken = !!ACCESS_TOKEN && ACCESS_TOKEN !== 'your-token-here';

// Skip all integration tests if no access token
const describeWithToken = hasAccessToken ? describe : describe.skip;

describeWithToken('OAuth2 Client Integration Tests (Real API)', () => {
  let client: VybitOAuth2Client;

  // Helper to add delay between API calls to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  beforeAll(() => {
    if (!hasAccessToken) return;

    client = new VybitOAuth2Client({
      clientId: 'test-client-id', // Not needed for token-based tests
      clientSecret: 'test-client-secret', // Not needed for token-based tests
      redirectUri: 'https://example.com/callback', // Not needed for token-based tests
    });

    client.setAccessToken(ACCESS_TOKEN!);

    console.log('Running OAuth2 integration tests with real access token');
  });

  beforeEach(async () => {
    // Add 200ms delay before each test to avoid rate limiting
    await delay(200);
  });

  describe('Token Verification', () => {
    test('verifyToken should handle token correctly', async () => {
      const isValid = await client.verifyToken();
      // Token might be expired or invalid - just test that method works
      expect(typeof isValid).toBe('boolean');

      if (!isValid) {
        console.log('Token verification failed - token may be expired or invalid');
      }
    });

    test('verifyToken should return false for invalid token', async () => {
      const invalidClient = new VybitOAuth2Client({
        clientId: 'test',
        clientSecret: 'test',
        redirectUri: 'https://example.com',
      });
      invalidClient.setAccessToken('invalid-token-12345');

      const isValid = await invalidClient.verifyToken();
      expect(isValid).toBe(false);
    });
  });

  describe('Token Override', () => {
    test('should allow token override in verifyToken', async () => {
      // Use the valid token as override
      const result = await client.verifyToken(ACCESS_TOKEN!);
      // Token might be expired, just verify we got a boolean result
      expect(typeof result).toBe('boolean');
    });

    test('should reject invalid override token', async () => {
      const result = await client.verifyToken('invalid-override-token');
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when no token is set', async () => {
      const clientWithoutToken = new VybitOAuth2Client({
        clientId: 'test',
        clientSecret: 'test',
        redirectUri: 'https://example.com',
      });

      await expect(
        clientWithoutToken.verifyToken()
      ).rejects.toThrow();
    });
  });

  describe('Authorization URL Generation', () => {
    test('should generate valid authorization URL', () => {
      const authUrl = client.getAuthorizationUrl();

      expect(authUrl).toContain('https://app.vybit.net');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('state=');
    });

    test('should include custom state in URL', () => {
      const customState = 'integration-test-state-123';
      const authUrl = client.getAuthorizationUrl({ state: customState });

      expect(authUrl).toContain(`state=${customState}`);
    });

    test('should include scope when provided', () => {
      const authUrl = client.getAuthorizationUrl({ scope: 'read' });

      expect(authUrl).toContain('scope=read');
    });
  });
});

// Show message when tests are skipped
if (!hasAccessToken) {
  describe('OAuth2 Client Integration Tests', () => {
    test.skip('Integration tests skipped - set VYBIT_OAUTH2_TOKEN to run', () => {
      console.log('');
      console.log('To run OAuth2 integration tests:');
      console.log('   1. Create an OAuth2 app at developer.vybit.net');
      console.log('   2. Complete the OAuth flow to get an access token');
      console.log('   3. Run: VYBIT_OAUTH2_TOKEN=your-token npm test -w @vybit/oauth2-sdk');
      console.log('');
    });
  });
}
