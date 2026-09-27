/**
 * OAuth2 Client Tests
 *
 * Tests the OAuth2 authorization flow: configuration validation,
 * authorization URL generation, token exchange, and token verification.
 */

import { VybitOAuth2Client } from '../oauth2-client';
import { VybitAuthError, VybitAPIError, VybitValidationError, generateCodeVerifier, generateCodeChallenge } from '@vybit/core';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('VybitOAuth2Client', () => {
  let client: VybitOAuth2Client;

  const validConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://example.com/callback'
  };

  beforeEach(() => {
    client = new VybitOAuth2Client(validConfig);
    mockFetch.mockClear();
  });

  describe('Configuration Validation', () => {
    it('should validate required configuration', () => {
      expect(() => new VybitOAuth2Client({
        ...validConfig,
        clientId: ''
      })).toThrow(VybitValidationError);

      expect(() => new VybitOAuth2Client({
        ...validConfig,
        redirectUri: ''
      })).toThrow(VybitValidationError);
    });

    it('should validate redirect URI format', () => {
      expect(() => new VybitOAuth2Client({
        ...validConfig,
        redirectUri: 'invalid-url'
      })).toThrow(VybitValidationError);
    });

    it('should accept valid configuration', () => {
      expect(() => new VybitOAuth2Client(validConfig)).not.toThrow();
    });

    it('should accept configuration without clientSecret (PKCE public client)', () => {
      expect(() => new VybitOAuth2Client({
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback'
      })).not.toThrow();
    });
  });

  describe('Authorization URL Generation', () => {
    it('should generate correct authorization URL', () => {
      const authUrl = client.getAuthorizationUrl();

      expect(authUrl).toContain('https://app.vybit.net');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('state=');
    });

    it('should use custom state when provided', () => {
      const customState = 'custom-state-123';
      const authUrl = client.getAuthorizationUrl({ state: customState });

      expect(authUrl).toContain(`state=${customState}`);
    });

    it('should include scope when provided', () => {
      const authUrl = client.getAuthorizationUrl({ scope: 'read' });

      expect(authUrl).toContain('scope=read');
    });

    it('should include nonce when provided', () => {
      const authUrl = client.getAuthorizationUrl({ scope: 'openid email rw', nonce: 'n-0S6_WzA2Mj' });

      expect(authUrl).toContain('scope=openid+email+rw');
      expect(authUrl).toContain('nonce=n-0S6_WzA2Mj');
    });

    it('should not include nonce when not provided', () => {
      const authUrl = client.getAuthorizationUrl();

      expect(authUrl).not.toContain('nonce=');
    });

    it('should always use production domain', () => {
      const authUrl = client.getAuthorizationUrl();
      expect(authUrl).toContain('https://app.vybit.net');
    });
  });

  describe('Token Exchange', () => {
    it('should successfully exchange code for token', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const result = await client.exchangeCodeForToken('test-auth-code');

      expect(result).toEqual(mockTokenResponse);
      expect(client.getAccessToken()).toBe('test-access-token');

      // Verify correct API call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.vybit.net/service/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: expect.any(URLSearchParams)
        })
      );
    });

    it('should handle token exchange errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(
        client.exchangeCodeForToken('invalid-code')
      ).rejects.toThrow(VybitAPIError);
    });

    it('should send the configured redirect_uri', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token', token_type: 'Bearer' })
      });

      await client.exchangeCodeForToken('test-code');

      const body = mockFetch.mock.calls[0][1].body as URLSearchParams;
      expect(body.get('redirect_uri')).toBe('https://example.com/callback');
    });

    it('should surface the server error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ errors: [{ message: 'invalid or expired access code' }] })
      });

      await expect(
        client.exchangeCodeForToken('used-code')
      ).rejects.toThrow('Token exchange failed: invalid or expired access code');
    });

    it('should return the id_token when openid was granted', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        scope: 'openid email rw',
        id_token: 'eyJhbGciOiJSUzI1NiJ9.e30.sig'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const result = await client.exchangeCodeForToken('test-code');

      expect(result.id_token).toBe('eyJhbGciOiJSUzI1NiJ9.e30.sig');
      expect(result.scope).toBe('openid email rw');
    });

    it('should handle auth errors in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 'invalid_client' })
      });

      await expect(
        client.exchangeCodeForToken('test-code')
      ).rejects.toThrow(VybitAuthError);
    });
  });

  describe('Token Verification', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should verify valid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      });

      const isValid = await client.verifyToken();
      expect(isValid).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://vybit.net/service/test',
        {
          headers: {
            Authorization: 'Bearer test-token'
          }
        }
      );
    });

    it('should handle invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const isValid = await client.verifyToken();
      expect(isValid).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isValid = await client.verifyToken();
      expect(isValid).toBe(false);
    });

    it('should require access token', async () => {
      const clientWithoutToken = new VybitOAuth2Client(validConfig);

      await expect(
        clientWithoutToken.verifyToken()
      ).rejects.toThrow(VybitAuthError);
    });
  });

  describe('UserInfo', () => {
    it('should fetch claims from the userinfo endpoint', async () => {
      const claims = { sub: 'bbxope6xhryminef', email: 'pat@example.com', email_verified: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(claims)
      });

      const result = await client.getUserInfo('test-token');

      expect(result).toEqual(claims);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.vybit.net/oauth/userinfo',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' }
        })
      );
    });

    it('should use the stored token when none is provided', async () => {
      client.setAccessToken('stored-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sub: 'abc' })
      });

      await client.getUserInfo();

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer stored-token');
    });

    it('should throw an auth error when the openid scope was not granted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'insufficient_scope', error_description: 'The openid scope is required' })
      });

      const error = await client.getUserInfo('test-token').catch(e => e);
      expect(error).toBeInstanceOf(VybitAuthError);
      expect(error.message).toBe('UserInfo request failed: The openid scope is required');
      expect(error.statusCode).toBe(403);
    });

    it('should throw an API error on server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'server_error' })
      });

      await expect(client.getUserInfo('test-token')).rejects.toThrow(VybitAPIError);
    });

    it('should require access token', async () => {
      await expect(client.getUserInfo()).rejects.toThrow(VybitAuthError);
    });
  });

  describe('Token Management', () => {
    it('should set and get access token', () => {
      expect(client.getAccessToken()).toBeUndefined();

      client.setAccessToken('new-token');
      expect(client.getAccessToken()).toBe('new-token');
    });

    it('should allow overriding token in API calls', async () => {
      client.setAccessToken('default-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      });

      await client.verifyToken('override-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer override-token'
          })
        })
      );
    });
  });

  describe('PKCE Authorization URL', () => {
    it('should include code_challenge and code_challenge_method in auth URL', () => {
      const authUrl = client.getAuthorizationUrl({
        codeChallenge: 'test-challenge-value',
      });

      expect(authUrl).toContain('code_challenge=test-challenge-value');
      expect(authUrl).toContain('code_challenge_method=S256');
    });

    it('should allow custom code_challenge_method', () => {
      const authUrl = client.getAuthorizationUrl({
        codeChallenge: 'test-challenge-value',
        codeChallengeMethod: 'plain',
      });

      expect(authUrl).toContain('code_challenge_method=plain');
    });

    it('should not include PKCE params when no codeChallenge provided', () => {
      const authUrl = client.getAuthorizationUrl();

      expect(authUrl).not.toContain('code_challenge');
      expect(authUrl).not.toContain('code_challenge_method');
    });
  });

  describe('PKCE Token Exchange', () => {
    it('should include code_verifier in form data when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'pkce-token',
          token_type: 'Bearer',
        }),
      });

      await client.exchangeCodeForToken('auth-code', 'test-code-verifier');

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.get('code_verifier')).toBe('test-code-verifier');
    });

    it('should not include code_verifier when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'regular-token',
          token_type: 'Bearer',
        }),
      });

      await client.exchangeCodeForToken('auth-code');

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.has('code_verifier')).toBe(false);
    });

    it('should include client_secret when configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token',
          token_type: 'Bearer',
        }),
      });

      await client.exchangeCodeForToken('auth-code');

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.get('client_secret')).toBe('test-client-secret');
    });

    it('should not include client_secret when not configured (PKCE-only)', async () => {
      const pkceClient = new VybitOAuth2Client({
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'pkce-only-token',
          token_type: 'Bearer',
        }),
      });

      await pkceClient.exchangeCodeForToken('auth-code', 'verifier-123');

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.has('client_secret')).toBe(false);
      expect(body.get('code_verifier')).toBe('verifier-123');
    });
  });
});

describe('PKCE Utility Functions', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a string of the default length (43)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBe(43);
    });

    it('should generate a string of custom length', () => {
      const verifier = generateCodeVerifier(128);
      expect(verifier.length).toBe(128);
    });

    it('should only contain base64url characters', () => {
      const verifier = generateCodeVerifier(128);
      expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should generate unique values', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a base64url-encoded string', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should produce consistent output for the same input', async () => {
      const verifier = 'test-verifier-for-consistency';
      const c1 = await generateCodeChallenge(verifier);
      const c2 = await generateCodeChallenge(verifier);
      expect(c1).toBe(c2);
    });

    it('should produce different output for different inputs', async () => {
      const c1 = await generateCodeChallenge('verifier-one');
      const c2 = await generateCodeChallenge('verifier-two');
      expect(c1).not.toBe(c2);
    });

    it('should produce correct S256 hash for known input', async () => {
      // RFC 7636 Appendix B test vector
      // verifier: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
      // expected challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    });
  });
});
