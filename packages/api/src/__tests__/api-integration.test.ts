/**
 * API Client Integration Tests
 *
 * These tests run against the real Vybit API when VYBIT_API_KEY is provided.
 * They are skipped in CI when no API key is available.
 *
 * To run:
 *   VYBIT_API_KEY=your-key npm test -w @vybit/api-sdk
 */

import { VybitAPIClient } from '../api-client';

const API_KEY = process.env.VYBIT_API_KEY;
const hasApiKey = !!API_KEY && API_KEY !== 'your-api-key-here';

// Skip all integration tests if no API key
const describeWithApiKey = hasApiKey ? describe : describe.skip;

describeWithApiKey('API Client Integration Tests (Real API)', () => {
  let client: VybitAPIClient;
  const createdResources: {
    vybits: string[];
    follows: string[];
    peeps: string[];
  } = {
    vybits: [],
    follows: [],
    peeps: [],
  };

  // Helper to add delay between API calls to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  beforeAll(() => {
    if (!hasApiKey) return;

    const baseUrl = process.env.VYBIT_API_URL || 'https://api.vybit.net/v1';
    client = new VybitAPIClient({
      apiKey: API_KEY,
      baseUrl: baseUrl
    });
    console.log('🔑 Running API integration tests with real API key');
    console.log(`🌐 API URL: ${baseUrl}`);
    console.log('⏱️  Adding delays between requests to avoid rate limiting...');
  });

  beforeEach(async () => {
    // Add 200ms delay before each test to avoid rate limiting (10 req/sec = 100ms minimum)
    await delay(200);
  });

  afterAll(async () => {
    if (!hasApiKey || !client) return;

    // Cleanup any created resources
    console.log('🧹 Cleaning up test resources...');

    for (const followKey of createdResources.follows) {
      try {
        await client.deleteVybitFollow(followKey);
        await delay(150);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    for (const vybitKey of createdResources.vybits) {
      try {
        await client.deleteVybit(vybitKey);
        await delay(150);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Basic Endpoints', () => {
    test('getStatus should return up', async () => {
      const result = await client.getStatus();
      expect(result.status).toBe('up');
    });

    test('getProfile should return user profile', async () => {
      const result = await client.getProfile();
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('tier_id');
    });

    test('getMeter should return correct meter fields', async () => {
      const result = await client.getMeter();

      expect(result).toHaveProperty('tier_id');
      expect(result).toHaveProperty('cap_vybits');
      expect(result).toHaveProperty('cap_daily');
      expect(result).toHaveProperty('cap_monthly');
      expect(result).toHaveProperty('number_vybits');
      expect(result).toHaveProperty('count_daily');
      expect(result).toHaveProperty('count_monthly');
      expect(result).toHaveProperty('monthly_reset_dts');

      // Should NOT have this field
      expect(result).not.toHaveProperty('count_total');
    });
  });

  describe('Vybit CRUD Operations', () => {
    test('createVybit with minimal params (name only)', async () => {
      const result = await client.createVybit({
        name: 'API Test - Minimal',
      });

      expect(result).toHaveProperty('key');
      expect(result.name).toBe('API Test - Minimal');
      expect(result).toHaveProperty('soundKey'); // Should have default
      expect(result).toHaveProperty('triggerType'); // Should have default
      expect(result).toHaveProperty('triggerKey');
      expect(result).toHaveProperty('subscriptionKey');

      createdResources.vybits.push(result.key);
    });

    test('createVybit with all optional fields', async () => {
      const result = await client.createVybit({
        name: 'API Test - Full',
        description: 'Test description',
        status: 'off',
        access: 'private',
        message: 'Test message',
      });

      expect(result.name).toBe('API Test - Full');
      expect(result.description).toBe('Test description');
      expect(result.status).toBe('off');
      expect(result.access).toBe('private');
      expect(result.message).toBe('Test message');

      createdResources.vybits.push(result.key);
    });

    test('getVybit should retrieve created vybit', async () => {
      const created = await client.createVybit({ name: 'API Test - Get' });
      createdResources.vybits.push(created.key);

      await delay(150);
      const result = await client.getVybit(created.key);

      expect(result.key).toBe(created.key);
      expect(result.name).toBe('API Test - Get');
    });

    test('patchVybit should update status field', async () => {
      const created = await client.createVybit({ name: 'API Test - Update' });
      createdResources.vybits.push(created.key);

      await delay(150);
      const result = await client.patchVybit(created.key, {
        status: 'off',
      });

      expect(result.status).toBe('off');
    });

    test('patchVybit should update multiple fields', async () => {
      const created = await client.createVybit({ name: 'API Test - Multi' });
      createdResources.vybits.push(created.key);

      await delay(150);
      const result = await client.patchVybit(created.key, {
        name: 'Updated Name',
        status: 'off',
        message: 'Updated message',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('off');
      expect(result.message).toBe('Updated message');
    });

    test('listVybits should return array', async () => {
      const result = await client.listVybits({ limit: 5 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    test('deleteVybit should remove vybit', async () => {
      const created = await client.createVybit({ name: 'API Test - Delete' });

      await delay(150);
      const result = await client.deleteVybit(created.key);

      expect(result.result).toBe(1);

      // Remove from cleanup list since already deleted
      const index = createdResources.vybits.indexOf(created.key);
      if (index > -1) {
        createdResources.vybits.splice(index, 1);
      }
    });
  });

  describe('Vybit Follows', () => {
    test('listVybitFollows should use followingKey field', async () => {
      const result = await client.listVybitFollows({ limit: 1 });

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('followingKey');
        expect(result[0]).not.toHaveProperty('key');
        expect(result[0]).not.toHaveProperty('personKey');
        expect(result[0]).not.toHaveProperty('vybKey');
      }
    });
  });

  describe('Sounds', () => {
    test('searchSounds should return results', async () => {
      const result = await client.searchSounds({
        search: 'notification',
        limit: 5,
      });

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('status');
        expect(result[0]).toHaveProperty('url');
      }
    });

    test('getSound should return sound details', async () => {
      const sounds = await client.searchSounds({ limit: 1 });
      if (sounds.length === 0) {
        console.log('No sounds available, skipping test');
        return;
      }

      await delay(150);
      const result = await client.getSound(sounds[0].key);

      expect(result.key).toBe(sounds[0].key);
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('url');
    });

    test('getSoundPlayUrl should return correct URL', () => {
      const baseUrl = process.env.VYBIT_API_URL || 'https://api.vybit.net/v1';
      const url = client.getSoundPlayUrl('test-sound-key');
      expect(url).toBe(`${baseUrl}/sound/test-sound-key/play`);
    });
  });

  describe('Vybit Trigger', () => {
    let testVybit: any;

    beforeAll(async () => {
      if (!hasApiKey) return;

      testVybit = await client.createVybit({
        name: 'API Test - Trigger',
        status: 'on',
      });
      createdResources.vybits.push(testVybit.key);
      await delay(200);
    });

    test('triggerVybit without params should work', async () => {
      const result = await client.triggerVybit(testVybit.key);

      expect(result).toHaveProperty('result');
      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk');
    });

    test('triggerVybit with custom message should work', async () => {
      const result = await client.triggerVybit(testVybit.key, {
        message: 'Integration test notification',
      });

      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for non-existent vybit', async () => {
      await expect(
        client.getVybit('invalid-key-12345')
      ).rejects.toThrow();
    });

    test('should throw error for non-existent sound', async () => {
      await expect(
        client.getSound('invalid-sound-key')
      ).rejects.toThrow();
    });
  });

  describe('Logs', () => {
    test('listLogs should return array', async () => {
      const result = await client.listLogs({ limit: 5 });

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('vybKey');
        expect(result[0]).toHaveProperty('ownerName');
        expect(result[0]).toHaveProperty('senderName');
      }
    });
  });
});

// Show message when tests are skipped
if (!hasApiKey) {
  describe('API Client Integration Tests', () => {
    test.skip('Integration tests skipped - set VYBIT_API_KEY to run', () => {
      console.log('💡 Tip: Run with VYBIT_API_KEY=your-key npm test -w @vybit/api-sdk');
    });
  });
}
