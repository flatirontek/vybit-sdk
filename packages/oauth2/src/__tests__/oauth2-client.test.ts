/**
 * OAuth2 Client Tests
 * 
 * These tests mirror the exact functionality tested in the developer portal,
 * covering all 6 steps of the OAuth flow.
 */

import { VybitOAuth2Client } from '../oauth2-client';
import { VybitAuthError, VybitAPIError, VybitValidationError } from '@vybit/core';

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
        clientSecret: ''
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
  });

  describe('Step 1: Authorization URL Generation', () => {
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

    it('should always use production domain', () => {
      const authUrl = client.getAuthorizationUrl();
      expect(authUrl).toContain('https://app.vybit.net');
    });
  });

  describe('Step 3: Token Exchange', () => {
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

  describe('Step 4: Token Verification', () => {
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

  describe('Step 5: Get Vybit List', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should fetch vybit list successfully', async () => {
      const mockVybitResponse = {
        '0': { name: 'My Alert', triggerKey: 'abc123def456' },
        '1': { name: 'Notification Sound', triggerKey: 'def456ghi789' },
        '2': { name: 'Status Update', triggerKey: 'ghi789jkl012' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVybitResponse)
      });

      const vybits = await client.getVybitList();

      expect(vybits).toHaveLength(3);
      expect(vybits[0]).toEqual({ name: 'My Alert', triggerKey: 'abc123def456' });
      expect(vybits[1]).toEqual({ name: 'Notification Sound', triggerKey: 'def456ghi789' });
      expect(vybits[2]).toEqual({ name: 'Status Update', triggerKey: 'ghi789jkl012' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://vybit.net/rest/vybit_list',
        {
          headers: {
            Authorization: 'Bearer test-token'
          }
        }
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      await expect(client.getVybitList()).rejects.toThrow(VybitAPIError);
    });

    it('should require access token', async () => {
      const clientWithoutToken = new VybitOAuth2Client(validConfig);
      
      await expect(
        clientWithoutToken.getVybitList()
      ).rejects.toThrow(VybitAuthError);
    });
  });

  describe('Step 6: Send Vybit Notification', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should send notification with all optional parameters', async () => {
      const mockResponse = {
        result: 1,
        plk: 'bbxope6xhryminef'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const triggerOptions = {
        message: 'Test notification',
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: 'https://example.com/redirect',
        log: 'Test log entry <a href="https://example.com">link</a>'
      };

      const result = await client.sendVybitNotification('test-trigger-key', triggerOptions);

      expect(result).toEqual(mockResponse);

      // Verify the API call
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://vybit.net/fire/test-trigger-key');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer test-token');
      expect(options.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(options.body);
      expect(body).toEqual(triggerOptions);
    });

    it('should send notification with minimal parameters', async () => {
      const mockResponse = { result: 1, plk: 'test-plk' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.sendVybitNotification('test-trigger-key');

      expect(result).toEqual(mockResponse);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({});
    });

    it('should validate URL parameters', async () => {
      await expect(
        client.sendVybitNotification('test-key', {
          imageUrl: 'invalid-url'
        })
      ).rejects.toThrow(VybitValidationError);

      await expect(
        client.sendVybitNotification('test-key', {
          linkUrl: 'also-invalid'
        })
      ).rejects.toThrow(VybitValidationError);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        client.sendVybitNotification('invalid-key')
      ).rejects.toThrow(VybitAPIError);
    });

    it('should require access token', async () => {
      const clientWithoutToken = new VybitOAuth2Client(validConfig);
      
      await expect(
        clientWithoutToken.sendVybitNotification('test-key')
      ).rejects.toThrow(VybitAuthError);
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
});