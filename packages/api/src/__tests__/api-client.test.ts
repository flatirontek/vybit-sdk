/**
 * API Client Unit Tests
 *
 * Tests VybitAPIClient methods with mocked fetch.
 * These tests run in CI without requiring an API key.
 */

import { VybitAPIClient } from '../api-client';
import { VybitAPIError, VybitAuthError, VybitValidationError } from '@vybit/core';

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

    test('should use provided access token', () => {
      const testClient = new VybitAPIClient({ accessToken: 'test-token' });
      expect(testClient).toBeDefined();
    });

    test('should fall back to VYBIT_API_KEY environment variable', () => {
      process.env.VYBIT_API_KEY = 'env-key';
      const testClient = new VybitAPIClient();
      expect(testClient).toBeDefined();
      delete process.env.VYBIT_API_KEY;
    });

    test('should fall back to VYBIT_ACCESS_TOKEN environment variable', () => {
      process.env.VYBIT_ACCESS_TOKEN = 'env-token';
      const testClient = new VybitAPIClient();
      expect(testClient).toBeDefined();
      delete process.env.VYBIT_ACCESS_TOKEN;
    });

    test('should prefer apiKey over accessToken', () => {
      const testClient = new VybitAPIClient({ apiKey: 'key', accessToken: 'token' });
      expect(testClient).toBeDefined();
    });

    test('should throw when no credentials provided', () => {
      expect(() => new VybitAPIClient({})).toThrow(VybitValidationError);
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
    test('should return status response with API key header', async () => {
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

    test('should send Bearer token header when using accessToken', async () => {
      const tokenClient = new VybitAPIClient({ accessToken: 'test-oauth-token' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'up' }),
      } as Response);

      await tokenClient.getStatus();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/status',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-oauth-token',
          }),
        })
      );
      // Should not have X-API-Key header
      const callHeaders = (mockFetch.mock.calls[0][1] as any).headers;
      expect(callHeaders).not.toHaveProperty('X-API-Key');
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

    test('should throw 400 error for non-image imageUrl format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'imageUrl must be a direct link to a JPG, PNG, or GIF image' }),
      } as Response);

      await expect(
        client.createVybit({ name: 'Test', imageUrl: 'https://example.com/page' })
      ).rejects.toThrow(VybitAPIError);
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

    test('should throw 400 error for non-image imageUrl format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'imageUrl must be a direct link to a JPG, PNG, or GIF image' }),
      } as Response);

      await expect(
        client.patchVybit('vyb123', { imageUrl: 'https://example.com/page' })
      ).rejects.toThrow(VybitAPIError);
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

    test('should trigger vybit with runOnce param', async () => {
      const mockResponse = { result: 1, plk: 'log789' };
      const params = { runOnce: true };

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
          body: JSON.stringify({ runOnce: true }),
        })
      );
    });

    test('should trigger vybit with log param', async () => {
      const mockResponse = { result: 1, plk: 'log101' };
      const params = { log: 'Triggered from test' };

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
          body: JSON.stringify({ log: 'Triggered from test' }),
        })
      );
    });

    test('should trigger vybit with all params including runOnce and log', async () => {
      const mockResponse = { result: 1, plk: 'log202' };
      const params = {
        message: 'Full trigger',
        imageUrl: 'https://example.com/img.jpg',
        linkUrl: 'https://example.com',
        log: 'Full test',
        runOnce: true,
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

    test('should silently ignore non-image imageUrl', async () => {
      // Trigger endpoint accepts any URL but silently ignores non-image URLs
      const mockResponse = { result: 1, plk: 'log303' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.triggerVybit('vyb123', { imageUrl: 'https://example.com/page' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Reminders', () => {
    test('should create reminder with required params', async () => {
      const mockResponse = {
        result: 1,
        reminder: {
          id: 'a3f2b1c9d0e4',
          cron: '30 14 20 2 *',
          timeZone: 'America/Denver',
          message: 'Test reminder',
          imageUrl: null,
          linkUrl: null,
          log: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await client.createReminder('vyb123', {
        cron: '30 14 20 2 *',
        timeZone: 'America/Denver',
        message: 'Test reminder',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.id).toBe('a3f2b1c9d0e4');
      expect(result.reminder.cron).toBe('30 14 20 2 *');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/reminders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            cron: '30 14 20 2 *',
            timeZone: 'America/Denver',
            message: 'Test reminder',
          }),
        })
      );
    });

    test('should create reminder with year param', async () => {
      const mockResponse = {
        result: 1,
        reminder: {
          id: 'b4c3d2e1f0a5',
          cron: '0 9 25 12 *',
          timeZone: 'UTC',
          year: 2027,
          message: 'Future reminder',
          imageUrl: null,
          linkUrl: null,
          log: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await client.createReminder('vyb123', {
        cron: '0 9 25 12 *',
        timeZone: 'UTC',
        year: 2027,
        message: 'Future reminder',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.year).toBe(2027);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/reminders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            cron: '0 9 25 12 *',
            timeZone: 'UTC',
            year: 2027,
            message: 'Future reminder',
          }),
        })
      );
    });

    test('should create reminder with all fields including year', async () => {
      const mockResponse = {
        result: 1,
        reminder: {
          id: 'c5d4e3f2a1b6',
          cron: '30 14 20 6 *',
          timeZone: 'America/New_York',
          year: 2027,
          message: 'Full reminder',
          imageUrl: 'https://example.com/img.jpg',
          linkUrl: 'https://example.com/event',
          log: 'Test log entry',
        },
      };

      const params = {
        cron: '30 14 20 6 *',
        timeZone: 'America/New_York',
        year: 2027,
        message: 'Full reminder',
        imageUrl: 'https://example.com/img.jpg',
        linkUrl: 'https://example.com/event',
        log: 'Test log entry',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await client.createReminder('vyb123', params);

      expect(result.result).toBe(1);
      expect(result.reminder.year).toBe(2027);
      expect(result.reminder.message).toBe('Full reminder');
      expect(result.reminder.imageUrl).toBe('https://example.com/img.jpg');
      expect(result.reminder.linkUrl).toBe('https://example.com/event');
      expect(result.reminder.log).toBe('Test log entry');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/reminders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        })
      );
    });

    test('should list reminders', async () => {
      const mockResponse = {
        result: 1,
        reminders: [
          { id: 'abc123', cron: '0 9 * * *', timeZone: 'UTC', message: 'Morning', imageUrl: null, linkUrl: null, log: null },
          { id: 'def456', cron: '0 17 * * *', timeZone: 'UTC', message: 'Evening', imageUrl: null, linkUrl: null, log: null },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.listReminders('vyb123');

      expect(result.result).toBe(1);
      expect(result.reminders).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/reminders',
        expect.any(Object)
      );
    });

    test('should update reminder', async () => {
      const mockResponse = {
        result: 1,
        reminder: {
          id: 'abc123',
          cron: '0 10 * * *',
          timeZone: 'America/New_York',
          message: 'Updated',
          imageUrl: null,
          linkUrl: null,
          log: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.updateReminder('vyb123', 'abc123', {
        cron: '0 10 * * *',
        timeZone: 'America/New_York',
        message: 'Updated',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.cron).toBe('0 10 * * *');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/reminders/abc123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            cron: '0 10 * * *',
            timeZone: 'America/New_York',
            message: 'Updated',
          }),
        })
      );
    });

    test('should delete reminder', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: 1, message: 'Reminder deleted' }),
      } as Response);

      const result = await client.deleteReminder('vyb123', 'abc123');

      expect(result.result).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb123/reminders/abc123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    test('should throw error for wrong trigger type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'Vybit trigger type must be reminders' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *' })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw error for non-existent reminder', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ result: 0, message: 'Reminder not found' }),
      } as Response);

      await expect(
        client.updateReminder('vyb123', 'invalid', { message: 'test' })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for invalid cron on create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'Invalid cron expression. Expected 5 fields: minute hour day month dayOfWeek' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: 'not a cron' })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for invalid cron on update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'Invalid cron expression. Expected 5 fields: minute hour day month dayOfWeek' }),
      } as Response);

      await expect(
        client.updateReminder('vyb123', 'abc123', { cron: '* * *' })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for message exceeding 256 characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'message must be 256 characters or fewer' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *', message: 'a'.repeat(257) })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for imageUrl exceeding 512 characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'imageUrl must be 512 characters or fewer' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *', imageUrl: 'https://example.com/' + 'a'.repeat(500) })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for linkUrl exceeding 512 characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'linkUrl must be 512 characters or fewer' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *', linkUrl: 'https://example.com/' + 'a'.repeat(500) })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for log exceeding 1024 characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'log must be 1024 characters or fewer' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *', log: 'a'.repeat(1025) })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for invalid imageUrl format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'imageUrl must be a valid URL' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *', imageUrl: 'not a url' })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for invalid linkUrl format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'linkUrl must be a valid URL' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *', linkUrl: 'not a url' })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for reminder more than one year in the future', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'Reminder must be within one year from today' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 12 1 1 *', year: new Date().getFullYear() + 2 })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for non-image imageUrl on createReminder', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'imageUrl must be a direct link to a JPG, PNG, or GIF image' }),
      } as Response);

      await expect(
        client.createReminder('vyb123', { cron: '0 9 * * *', imageUrl: 'https://example.com/page' })
      ).rejects.toThrow(VybitAPIError);
    });

    test('should throw 400 error for non-image imageUrl on updateReminder', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ result: 0, message: 'imageUrl must be a direct link to a JPG, PNG, or GIF image' }),
      } as Response);

      await expect(
        client.updateReminder('vyb123', 'rem456', { imageUrl: 'https://example.com/page' })
      ).rejects.toThrow(VybitAPIError);
    });
  });

  describe('Schedule triggerType', () => {
    test('should create vybit with schedule triggerType and triggerSettings', async () => {
      const createParams = {
        name: 'Schedule Test',
        triggerType: 'schedule' as const,
        triggerSettings: {
          crons: [
            { cron: '0 9 * * *', timeZone: 'America/Denver' },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...createParams, key: 'vyb789' }),
      } as Response);

      const result = await client.createVybit(createParams);

      expect(result.triggerType).toBe('schedule');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createParams),
        })
      );
    });

    test('should update vybit triggerSettings for schedule type', async () => {
      const updateParams = {
        triggerSettings: {
          crons: [
            { cron: '0 10 * * 1-5', timeZone: 'America/New_York' },
            { cron: '0 12 * * 6', timeZone: 'America/New_York' },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          key: 'vyb789',
          name: 'Schedule Test',
          triggerType: 'schedule',
          ...updateParams,
        }),
      } as Response);

      const result = await client.patchVybit('vyb789', updateParams);

      expect(result.triggerSettings.crons).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb789',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateParams),
        })
      );
    });

    test('should remove a cron entry by patching with reduced crons array', async () => {
      const updateParams = {
        triggerSettings: {
          crons: [
            { cron: '0 10 * * 1-5', timeZone: 'America/New_York' },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          key: 'vyb789',
          name: 'Schedule Test',
          triggerType: 'schedule',
          ...updateParams,
        }),
      } as Response);

      // Previously had 2 crons, now sending only 1 to remove the second
      const result = await client.patchVybit('vyb789', updateParams);

      expect(result.triggerSettings.crons).toHaveLength(1);
      expect(result.triggerSettings.crons[0].cron).toBe('0 10 * * 1-5');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit/vyb789',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateParams),
        })
      );
    });

    test('should create vybit with reminders triggerType', async () => {
      const createParams = {
        name: 'Reminders Test',
        triggerType: 'reminders' as const,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...createParams, key: 'vyb101' }),
      } as Response);

      const result = await client.createVybit(createParams);

      expect(result.triggerType).toBe('reminders');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vybit.net/v1/vybit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createParams),
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
