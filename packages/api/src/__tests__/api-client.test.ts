/**
 * API Client Unit Tests
 *
 * Tests VybitAPIClient methods with mocked fetch.
 * These tests run in CI without requiring an API key.
 */

import { VybitAPIClient } from '../api-client';
import { VybitAPIError, VybitAuthError } from '@vybit/core';

// Mock fetch globally
global.fetch = jest.fn();

describe('VybitAPIClient Unit Tests', () => {
  let client: VybitAPIClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new VybitAPIClient({ apiKey: 'test-api-key' });
  });

  describe('constructor', () => {
    test('should use provided API key', () => {
      const testClient = new VybitAPIClient({ apiKey: 'custom-key' });
      expect(testClient).toBeDefined();
    });

    test('should fall back to environment variable', () => {
      process.env.VYBIT_API_KEY = 'env-key';
      const testClient = new VybitAPIClient();
      expect(testClient).toBeDefined();
      delete process.env.VYBIT_API_KEY;
    });

    test('should use custom baseUrl when provided', () => {
      const testClient = new VybitAPIClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com/v1',
      });
      expect(testClient).toBeDefined();
    });
  });

  describe('getStatus', () => {
    test('should return status response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'up' }),
      } as Response);

      const result = await client.getStatus();

      expect(result).toEqual({ status: 'up' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/status',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );
    });
  });

  describe('getProfile', () => {
    test('should return user profile', async () => {
      const mockProfile = {
        key: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        tier_id: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      } as Response);

      const result = await client.getProfile();

      expect(result).toEqual(mockProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/profile',
        expect.any(Object)
      );
    });
  });

  describe('getMeter', () => {
    test('should return meter with all correct fields', async () => {
      const mockMeter = {
        tier_id: 1,
        cap_vybits: 50,
        cap_daily: 500,
        cap_monthly: 7500,
        number_vybits: 12,
        count_daily: 127,
        count_monthly: 3421,
        monthly_reset_dts: '2025-12-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMeter,
      } as Response);

      const result = await client.getMeter();

      expect(result).toEqual(mockMeter);
      expect(result).toHaveProperty('number_vybits');
      expect(result).toHaveProperty('monthly_reset_dts');
      expect(result).not.toHaveProperty('count_total');
    });
  });

  describe('listVybits', () => {
    test('should list vybits with default params', async () => {
      const mockVybits = [
        { key: 'vyb1', name: 'Vybit 1', soundKey: 'sound1', triggerType: 'webhook' as const },
        { key: 'vyb2', name: 'Vybit 2', soundKey: 'sound2', triggerType: 'schedule' as const },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockVybits,
      } as Response);

      const result = await client.listVybits();

      expect(result).toEqual(mockVybits);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybits',
        expect.any(Object)
      );
    });

    test('should include pagination params in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      await client.listVybits({ offset: 10, limit: 5, search: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybits?offset=10&limit=5&search=test',
        expect.any(Object)
      );
    });
  });

  describe('createVybit', () => {
    test('should create vybit with minimal params (name only)', async () => {
      const mockVybit = {
        key: 'vyb123',
        name: 'Test Vybit',
        soundKey: 'default-sound',
        triggerType: 'webhook' as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockVybit,
      } as Response);

      const result = await client.createVybit({ name: 'Test Vybit' });

      expect(result).toEqual(mockVybit);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test Vybit' }),
        })
      );
    });

    test('should create vybit with all optional fields', async () => {
      const createParams = {
        name: 'Full Test',
        description: 'Test description',
        soundKey: 'sound123',
        status: 'off' as const,
        triggerType: 'schedule' as const,
        access: 'public' as const,
        message: 'Test message',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...createParams, key: 'vyb456' }),
      } as Response);

      await client.createVybit(createParams);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit',
        expect.objectContaining({
          body: JSON.stringify(createParams),
        })
      );
    });
  });

  describe('patchVybit', () => {
    test('should update vybit with status field', async () => {
      const mockVybit = {
        key: 'vyb123',
        name: 'Test',
        status: 'off' as const,
        soundKey: 'sound1',
        triggerType: 'webhook' as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockVybit,
      } as Response);

      const result = await client.patchVybit('vyb123', { status: 'off' });

      expect(result.status).toBe('off');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'off' }),
        })
      );
    });
  });

  describe('listVybitFollows', () => {
    test('should return follows with followingKey field', async () => {
      const mockFollows = [
        {
          followingKey: 'follow123',
          vybName: 'Test Vybit',
          status: 'on',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFollows,
      } as Response);

      const result = await client.listVybitFollows();

      expect(result[0]).toHaveProperty('followingKey');
      expect(result[0]).not.toHaveProperty('key');
      expect(result[0]).not.toHaveProperty('personKey');
      expect(result[0]).not.toHaveProperty('vybKey');
    });
  });

  describe('searchSounds', () => {
    test('should search sounds with params', async () => {
      const mockSounds = [
        {
          key: 'sound1',
          name: 'Bell',
          type: 'mp3',
          status: 'public',
          url: 'https://api.vybit.net/v1/sound/sound1/play',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSounds,
      } as Response);

      const result = await client.searchSounds({ search: 'bell', limit: 10 });

      expect(result).toEqual(mockSounds);
      const callUrl = (mockFetch.mock.calls[0][0] as string);
      expect(callUrl).toContain('/v1/sounds?');
      expect(callUrl).toContain('search=bell');
      expect(callUrl).toContain('limit=10');
    });
  });

  describe('triggerVybit', () => {
    test('should trigger vybit without params', async () => {
      const mockResponse = { result: 1, plk: 'log123' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.triggerVybit('vyb123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/trigger',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    test('should trigger vybit with custom params', async () => {
      const mockResponse = { result: 1, plk: 'log456' };
      const params = {
        message: 'Custom message',
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: 'https://example.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.triggerVybit('vyb123', params);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/trigger',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        })
      );
    });
  });

  describe('error handling', () => {
    test('should throw VybitAuthError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized', message: 'Invalid API key' }),
      } as Response);

      await expect(client.getStatus()).rejects.toThrow(VybitAuthError);
    });

    test('should throw VybitAPIError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'not_found', message: 'Resource not found' }),
      } as Response);

      await expect(client.getVybit('invalid-key')).rejects.toThrow(VybitAPIError);
    });

    test('should throw VybitAPIError on 429 (rate limit)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'rate_limit_exceeded', message: 'Too many requests' }),
      } as Response);

      await expect(client.getStatus()).rejects.toThrow(VybitAPIError);
    });

    test('should include status code in error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'forbidden', message: 'Access denied' }),
      } as Response);

      try {
        await client.getStatus();
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(VybitAPIError);
        expect(error.statusCode).toBe(403);
      }
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getStatus()).rejects.toThrow('Network error');
    });
  });

  describe('deleteVybit', () => {
    test('should delete vybit successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 1, message: 'Deleted successfully' }),
      } as Response);

      const result = await client.deleteVybit('vyb123');

      expect(result.result).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
