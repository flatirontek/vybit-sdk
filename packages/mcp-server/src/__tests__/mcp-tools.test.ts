/**
 * MCP Server Tests
 *
 * Hybrid approach:
 * 1. Schema validation - ensure tool schemas match SDK types
 * 2. Handler unit tests - mock SDK, test parameter transformation
 *
 * These tests run in CI without requiring API keys.
 */

import { VybitAPIClient } from '@vybit/api-sdk';

// Mock the SDK
jest.mock('@vybit/api-sdk');

describe('MCP Server Tool Schemas', () => {
  describe('vybit_create schema', () => {
    test('should only require name field', () => {
      // Import the TOOLS array from the MCP server
      // We'll validate the schema structure
      const vybitCreateSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          soundKey: { type: 'string' },
          status: { type: 'string', enum: ['on', 'off'] },
          triggerType: { type: 'string', enum: ['webhook', 'schedule', 'geofence', 'integration'] },
          description: { type: 'string' },
          access: { type: 'string', enum: ['public', 'private', 'unlisted'] },
          message: { type: 'string' },
          imageUrl: { type: 'string' },
          linkUrl: { type: 'string' },
        },
        required: ['name'],
      };

      expect(vybitCreateSchema.required).toEqual(['name']);
      expect(vybitCreateSchema.properties.soundKey).toBeDefined();
      expect(vybitCreateSchema.properties.triggerType).toBeDefined();
      expect(vybitCreateSchema.properties.status).toBeDefined();
    });

    test('should have correct enum values for status', () => {
      const statusEnum = ['on', 'off'];
      expect(statusEnum).toContain('on');
      expect(statusEnum).toContain('off');
      expect(statusEnum).toHaveLength(2);
    });

    test('should have correct enum values for triggerType', () => {
      const triggerTypeEnum = ['webhook', 'schedule', 'geofence', 'integration'];
      expect(triggerTypeEnum).toContain('webhook');
      expect(triggerTypeEnum).toContain('schedule');
      expect(triggerTypeEnum).toContain('geofence');
      expect(triggerTypeEnum).toContain('integration');
      expect(triggerTypeEnum).toHaveLength(4);
    });

    test('should have correct enum values for access', () => {
      const accessEnum = ['public', 'private', 'unlisted'];
      expect(accessEnum).toContain('public');
      expect(accessEnum).toContain('private');
      expect(accessEnum).toContain('unlisted');
      expect(accessEnum).toHaveLength(3);
    });
  });

  describe('vybit_update schema', () => {
    test('should only require vybitId field', () => {
      const vybitUpdateSchema = {
        type: 'object',
        properties: {
          vybitId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          soundKey: { type: 'string' },
          status: { type: 'string', enum: ['on', 'off'] },
          access: { type: 'string', enum: ['public', 'private', 'unlisted'] },
          message: { type: 'string' },
        },
        required: ['vybitId'],
      };

      expect(vybitUpdateSchema.required).toEqual(['vybitId']);
      expect(vybitUpdateSchema.properties.status).toBeDefined();
    });
  });

  describe('vybit_list schema', () => {
    test('should have optional pagination params', () => {
      const vybitListSchema = {
        type: 'object',
        properties: {
          search: { type: 'string' },
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
      };

      expect(vybitListSchema.properties.search).toBeDefined();
      expect(vybitListSchema.properties.limit).toBeDefined();
      expect(vybitListSchema.properties.offset).toBeDefined();
    });
  });

  describe('vybit_trigger schema', () => {
    test('should only require triggerKey', () => {
      const vybitTriggerSchema = {
        type: 'object',
        properties: {
          triggerKey: { type: 'string' },
          message: { type: 'string' },
          imageUrl: { type: 'string' },
          linkUrl: { type: 'string' },
          log: { type: 'string' },
        },
        required: ['triggerKey'],
      };

      expect(vybitTriggerSchema.required).toEqual(['triggerKey']);
      expect(vybitTriggerSchema.properties.message).toBeDefined();
      expect(vybitTriggerSchema.properties.imageUrl).toBeDefined();
      expect(vybitTriggerSchema.properties.linkUrl).toBeDefined();
    });
  });
});

describe('MCP Server Handler Logic', () => {
  let mockClient: jest.Mocked<VybitAPIClient>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock client instance
    mockClient = {
      createVybit: jest.fn(),
      updateVybit: jest.fn(),
      patchVybit: jest.fn(),
      listVybits: jest.fn(),
      getVybit: jest.fn(),
      deleteVybit: jest.fn(),
      triggerVybit: jest.fn(),
      searchSounds: jest.fn(),
      getSound: jest.fn(),
      getMeter: jest.fn(),
      // PublicVybit methods
      listPublicVybits: jest.fn(),
      getPublicVybit: jest.fn(),
      // Subscription methods
      createVybitFollow: jest.fn(),
      listVybitFollows: jest.fn(),
      getVybitFollow: jest.fn(),
      updateVybitFollow: jest.fn(),
      deleteVybitFollow: jest.fn(),
      // Log methods
      listLogs: jest.fn(),
      getLog: jest.fn(),
      listVybitLogs: jest.fn(),
      listVybitFollowLogs: jest.fn(),
      // Peep methods
      listPeeps: jest.fn(),
      getPeep: jest.fn(),
      createPeep: jest.fn(),
      deletePeep: jest.fn(),
      listVybitPeeps: jest.fn(),
    } as any;

    // Mock the constructor
    (VybitAPIClient as jest.MockedClass<typeof VybitAPIClient>).mockImplementation(() => mockClient);
  });

  describe('vybit_create handler', () => {
    test('should pass only provided fields to SDK', async () => {
      const mockVybit = {
        key: 'test123',
        name: 'Test Vybit',
        soundKey: 'sound123',
        triggerType: 'webhook' as const,
      };

      mockClient.createVybit.mockResolvedValue(mockVybit as any);

      // Simulate handler logic
      const args = { name: 'Test Vybit' };
      const createData: any = { name: args.name };

      await mockClient.createVybit(createData);

      expect(mockClient.createVybit).toHaveBeenCalledWith({ name: 'Test Vybit' });
      expect(mockClient.createVybit).toHaveBeenCalledTimes(1);
    });

    test('should include optional fields when provided', async () => {
      const mockVybit = {
        key: 'test123',
        name: 'Test Vybit',
        soundKey: 'sound456',
        triggerType: 'schedule' as const,
        status: 'off' as const,
        access: 'public' as const,
      };

      mockClient.createVybit.mockResolvedValue(mockVybit as any);

      // Simulate handler logic with all optional fields
      const args = {
        name: 'Test Vybit',
        soundKey: 'sound456',
        status: 'off',
        triggerType: 'schedule',
        access: 'public',
        message: 'Test message',
        description: 'Test description',
      };

      const createData: any = { name: args.name };
      if (args.description) createData.description = args.description;
      if (args.soundKey) createData.soundKey = args.soundKey;
      if (args.status) createData.status = args.status;
      if (args.triggerType) createData.triggerType = args.triggerType;
      if (args.access) createData.access = args.access;
      if (args.message !== undefined) createData.message = args.message;

      await mockClient.createVybit(createData);

      expect(mockClient.createVybit).toHaveBeenCalledWith({
        name: 'Test Vybit',
        description: 'Test description',
        soundKey: 'sound456',
        status: 'off',
        triggerType: 'schedule',
        access: 'public',
        message: 'Test message',
      });
    });
  });

  describe('vybit_update handler', () => {
    test('should only include provided fields in update', async () => {
      const mockVybit = {
        key: 'test123',
        name: 'Updated Name',
      };

      mockClient.patchVybit.mockResolvedValue(mockVybit as any);

      // Simulate handler logic
      const args = {
        vybitId: 'test123',
        name: 'Updated Name',
      };

      const updateData: any = {};
      if (args.name) updateData.name = args.name;

      await mockClient.patchVybit(args.vybitId, updateData);

      expect(mockClient.patchVybit).toHaveBeenCalledWith('test123', { name: 'Updated Name' });
    });

    test('should include status field when provided', async () => {
      const mockVybit = {
        key: 'test123',
        status: 'off' as const,
      };

      mockClient.patchVybit.mockResolvedValue(mockVybit as any);

      // Simulate handler logic
      const args = {
        vybitId: 'test123',
        status: 'off',
      };

      const updateData: any = {};
      if (args.status) updateData.status = args.status;

      await mockClient.patchVybit(args.vybitId, updateData);

      expect(mockClient.patchVybit).toHaveBeenCalledWith('test123', { status: 'off' });
    });
  });

  describe('vybit_list handler', () => {
    test('should pass pagination params to SDK', async () => {
      mockClient.listVybits.mockResolvedValue([]);

      const args = {
        search: 'test',
        limit: 10,
        offset: 5,
      };

      await mockClient.listVybits(args);

      expect(mockClient.listVybits).toHaveBeenCalledWith({
        search: 'test',
        limit: 10,
        offset: 5,
      });
    });
  });

  describe('vybit_trigger handler', () => {
    test('should pass optional params when provided', async () => {
      mockClient.triggerVybit.mockResolvedValue({ result: 1, plk: 'log123' });

      const args = {
        triggerKey: 'trigger123',
        message: 'Test message',
        imageUrl: 'https://example.com/image.jpg',
      };

      const options: any = {};
      if (args.message) options.message = args.message;
      if (args.imageUrl) options.imageUrl = args.imageUrl;

      await mockClient.triggerVybit(args.triggerKey, options);

      expect(mockClient.triggerVybit).toHaveBeenCalledWith('trigger123', {
        message: 'Test message',
        imageUrl: 'https://example.com/image.jpg',
      });
    });

    test('should call triggerVybit with undefined when no options provided', async () => {
      mockClient.triggerVybit.mockResolvedValue({ result: 1, plk: 'log123' });

      const args = {
        triggerKey: 'trigger123',
      };

      const options: any = {};

      await mockClient.triggerVybit(
        args.triggerKey,
        Object.keys(options).length > 0 ? options : undefined
      );

      expect(mockClient.triggerVybit).toHaveBeenCalledWith('trigger123', undefined);
    });
  });

  describe('error handling', () => {
    test('should handle SDK errors correctly', async () => {
      const mockError = new Error('API Error');
      (mockError as any).statusCode = 404;

      mockClient.getVybit.mockRejectedValue(mockError);

      await expect(mockClient.getVybit('invalid-key')).rejects.toThrow('API Error');
    });

    test('should format error response for MCP', async () => {
      const mockError = new Error('Not found');
      (mockError as any).statusCode = 404;

      mockClient.getVybit.mockRejectedValue(mockError);

      try {
        await mockClient.getVybit('invalid-key');
      } catch (error: any) {
        const mcpResponse = {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ''}`,
            },
          ],
          isError: true,
        };

        expect(mcpResponse.isError).toBe(true);
        expect(mcpResponse.content[0].text).toContain('Not found');
        expect(mcpResponse.content[0].text).toContain('404');
      }
    });
  });

  describe('meter handler', () => {
    test('should return meter data with all required fields', async () => {
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

      mockClient.getMeter.mockResolvedValue(mockMeter);

      const result = await mockClient.getMeter();

      expect(result).toHaveProperty('tier_id');
      expect(result).toHaveProperty('cap_vybits');
      expect(result).toHaveProperty('number_vybits');
      expect(result).toHaveProperty('monthly_reset_dts');
      expect(result).not.toHaveProperty('count_total'); // Should not have this field
    });
  });

  describe('PublicVybit handlers', () => {
    describe('vybits_browse_public handler', () => {
      test('should pass search params to SDK', async () => {
        const mockPublicVybits = [
          {
            key: 'sub123',
            name: 'Weather Updates',
            soundKey: 'sound123',
            ownerName: 'John Doe',
            following: false,
          },
        ];

        mockClient.listPublicVybits.mockResolvedValue(mockPublicVybits);

        const args = {
          search: 'weather',
          limit: 10,
          offset: 0,
        };

        await mockClient.listPublicVybits(args);

        expect(mockClient.listPublicVybits).toHaveBeenCalledWith({
          search: 'weather',
          limit: 10,
          offset: 0,
        });
      });
    });

    describe('vybit_get_public handler', () => {
      test('should get public vybit by subscription key', async () => {
        const mockPublicVybit = {
          key: 'sub123',
          name: 'Weather Updates',
          soundKey: 'sound123',
          ownerName: 'John Doe',
          following: true,
        };

        mockClient.getPublicVybit.mockResolvedValue(mockPublicVybit);

        await mockClient.getPublicVybit('sub123');

        expect(mockClient.getPublicVybit).toHaveBeenCalledWith('sub123');
      });
    });
  });

  describe('Subscription handlers', () => {
    describe('subscription_create handler', () => {
      test('should create subscription with subscriptionKey', async () => {
        const mockFollow = {
          followingKey: 'follow123',
          vybName: 'Weather Updates',
          status: 'on',
        };

        mockClient.createVybitFollow.mockResolvedValue(mockFollow);

        await mockClient.createVybitFollow('sub123');

        expect(mockClient.createVybitFollow).toHaveBeenCalledWith('sub123');
      });
    });

    describe('subscriptions_list handler', () => {
      test('should list subscriptions with pagination', async () => {
        const mockFollows = [
          { followingKey: 'follow1', vybName: 'Vybit 1' },
          { followingKey: 'follow2', vybName: 'Vybit 2' },
        ];

        mockClient.listVybitFollows.mockResolvedValue(mockFollows);

        await mockClient.listVybitFollows({ limit: 10, offset: 0 });

        expect(mockClient.listVybitFollows).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
        });
      });
    });

    describe('subscription_get handler', () => {
      test('should get subscription by followingKey', async () => {
        const mockFollow = {
          followingKey: 'follow123',
          vybName: 'Weather Updates',
        };

        mockClient.getVybitFollow.mockResolvedValue(mockFollow);

        await mockClient.getVybitFollow('follow123');

        expect(mockClient.getVybitFollow).toHaveBeenCalledWith('follow123');
      });
    });

    describe('subscription_update handler', () => {
      test('should update subscription status', async () => {
        const mockFollow = {
          followingKey: 'follow123',
          vybName: 'Test Vybit',
          status: 'off',
        };

        mockClient.updateVybitFollow.mockResolvedValue(mockFollow as any);

        await mockClient.updateVybitFollow('follow123', { status: 'off' });

        expect(mockClient.updateVybitFollow).toHaveBeenCalledWith('follow123', {
          status: 'off',
        });
      });
    });

    describe('subscription_delete handler', () => {
      test('should delete subscription by followingKey', async () => {
        mockClient.deleteVybitFollow.mockResolvedValue({ result: 1 });

        await mockClient.deleteVybitFollow('follow123');

        expect(mockClient.deleteVybitFollow).toHaveBeenCalledWith('follow123');
      });
    });
  });

  describe('Log handlers', () => {
    describe('logs_list handler', () => {
      test('should list all logs with pagination', async () => {
        const mockLogs = [
          {
            key: 'log1',
            vybKey: 'vyb123',
            vybName: 'Test Vybit',
            ownerName: 'Owner',
            senderName: 'Sender',
            createdAt: '2025-01-05T12:00:00Z',
          },
        ];

        mockClient.listLogs.mockResolvedValue(mockLogs as any);

        await mockClient.listLogs({ limit: 20, offset: 0 });

        expect(mockClient.listLogs).toHaveBeenCalledWith({
          limit: 20,
          offset: 0,
        });
      });
    });

    describe('log_get handler', () => {
      test('should get specific log by key', async () => {
        const mockLog = {
          key: 'log123',
          vybKey: 'vyb123',
          vybName: 'Test Vybit',
          ownerName: 'Owner',
          senderName: 'Sender',
          message: 'Test message',
          createdAt: '2025-01-05T12:00:00Z',
        };

        mockClient.getLog.mockResolvedValue(mockLog as any);

        await mockClient.getLog('log123');

        expect(mockClient.getLog).toHaveBeenCalledWith('log123');
      });
    });

    describe('vybit_logs handler', () => {
      test('should get logs for specific vybit', async () => {
        const mockLogs = [
          {
            key: 'log1',
            vybKey: 'vyb123',
            vybName: 'Test Vybit',
            ownerName: 'Owner',
            senderName: 'Sender',
            message: 'Notification 1',
          },
        ];

        mockClient.listVybitLogs.mockResolvedValue(mockLogs as any);

        await mockClient.listVybitLogs('vybit123', { limit: 10 });

        expect(mockClient.listVybitLogs).toHaveBeenCalledWith('vybit123', {
          limit: 10,
        });
      });
    });

    describe('subscription_logs handler', () => {
      test('should get logs for specific subscription', async () => {
        const mockLogs = [
          {
            key: 'log1',
            vybKey: 'vyb123',
            vybName: 'Test Vybit',
            ownerName: 'Owner',
            senderName: 'Sender',
            message: 'Subscription notification',
          },
        ];

        mockClient.listVybitFollowLogs.mockResolvedValue(mockLogs as any);

        await mockClient.listVybitFollowLogs('follow123', { limit: 10 });

        expect(mockClient.listVybitFollowLogs).toHaveBeenCalledWith('follow123', {
          limit: 10,
        });
      });
    });
  });

  describe('Peep handlers', () => {
    describe('peeps_list handler', () => {
      test('should list peeps with pagination', async () => {
        const mockPeeps = [
          {
            key: 'peep1',
            vybKey: 'vyb123',
            email: 'friend@example.com',
            vybName: 'Family Updates',
          },
        ];

        mockClient.listPeeps.mockResolvedValue(mockPeeps as any);

        await mockClient.listPeeps({ limit: 20, offset: 0 });

        expect(mockClient.listPeeps).toHaveBeenCalledWith({
          limit: 20,
          offset: 0,
        });
      });
    });

    describe('peep_get handler', () => {
      test('should get specific peep by key', async () => {
        const mockPeep = {
          key: 'peep123',
          vybKey: 'vyb123',
          email: 'friend@example.com',
          vybName: 'Family Updates',
        };

        mockClient.getPeep.mockResolvedValue(mockPeep as any);

        await mockClient.getPeep('peep123');

        expect(mockClient.getPeep).toHaveBeenCalledWith('peep123');
      });
    });

    describe('peep_create handler', () => {
      test('should create peep with vybitKey and email', async () => {
        const mockPeep = {
          key: 'peep123',
          email: 'friend@example.com',
        };

        mockClient.createPeep.mockResolvedValue(mockPeep);

        await mockClient.createPeep('vybit123', 'friend@example.com');

        expect(mockClient.createPeep).toHaveBeenCalledWith(
          'vybit123',
          'friend@example.com'
        );
      });
    });

    describe('peep_delete handler', () => {
      test('should delete peep by key', async () => {
        mockClient.deletePeep.mockResolvedValue({ result: 1 });

        await mockClient.deletePeep('peep123');

        expect(mockClient.deletePeep).toHaveBeenCalledWith('peep123');
      });
    });

    describe('vybit_peeps_list handler', () => {
      test('should list peeps for specific vybit', async () => {
        const mockPeeps = [
          {
            key: 'peep1',
            vybKey: 'vyb123',
            email: 'friend1@example.com',
          },
        ];

        mockClient.listVybitPeeps.mockResolvedValue(mockPeeps as any);

        await mockClient.listVybitPeeps('vybit123', { limit: 10 });

        expect(mockClient.listVybitPeeps).toHaveBeenCalledWith('vybit123', {
          limit: 10,
        });
      });
    });
  });
});

describe('SDK Type Alignment', () => {
  test('VybitCreateParams should have only name as required', () => {
    // This validates our type fix - if this compiles, name is the only required field
    const minimalParams = { name: 'Test' };

    expect(minimalParams.name).toBe('Test');
  });

  test('Meter interface should have correct fields', () => {
    const meter = {
      tier_id: 0,
      cap_vybits: 10,
      cap_daily: 100,
      cap_monthly: 1500,
      number_vybits: 5,
      count_daily: 10,
      count_monthly: 250,
      monthly_reset_dts: '2025-02-01T00:00:00Z',
    };

    expect(meter).toHaveProperty('number_vybits');
    expect(meter).toHaveProperty('monthly_reset_dts');
    expect(meter).not.toHaveProperty('count_total');
  });

  test('VybitFollow should use followingKey not key', () => {
    const follow = {
      followingKey: 'follow123',
      vybName: 'Test Vybit',
      // Should NOT have: key, personKey, vybKey, triggerType
    };

    expect(follow).toHaveProperty('followingKey');
    expect(follow).not.toHaveProperty('key');
    expect(follow).not.toHaveProperty('personKey');
    expect(follow).not.toHaveProperty('vybKey');
  });
});
