/**
 * MCP Server Integration Tests
 *
 * These tests run against the real Vybit API when VYBIT_API_KEY is provided.
 * They are skipped in CI when no API key is available.
 *
 * To run:
 *   VYBIT_API_KEY=your-key npm test -w @vybit/mcp-server
 */

import { VybitAPIClient } from '@vybit/api-sdk';

const API_KEY = process.env.VYBIT_API_KEY;
const hasApiKey = !!API_KEY && API_KEY !== 'your-api-key-here';

// Skip all integration tests if no API key
const describeWithApiKey = hasApiKey ? describe : describe.skip;

describeWithApiKey('MCP Server Integration Tests (Real API)', () => {
  let client: VybitAPIClient;
  const createdResources: string[] = [];

  // Helper to add delay between API calls to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  beforeAll(() => {
    if (!hasApiKey) return;

    const baseUrl = process.env.VYBIT_API_URL || 'https://api.vybit.net/v1';
    client = new VybitAPIClient({
      apiKey: API_KEY,
      baseUrl: baseUrl
    });
    console.log('🔑 Running integration tests with real API key');
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
    for (const vybitKey of createdResources) {
      try {
        await client.deleteVybit(vybitKey);
        console.log(`  ✅ Deleted vybit: ${vybitKey}`);
      } catch (error) {
        console.log(`  ⚠️  Failed to delete vybit ${vybitKey}`);
      }
    }
  });

  describe('vybit_create with minimal params', () => {
    test('should create vybit with only name', async () => {
      const result = await client.createVybit({
        name: 'MCP Test - Minimal Params',
      });

      expect(result).toHaveProperty('key');
      expect(result.name).toBe('MCP Test - Minimal Params');
      expect(result).toHaveProperty('soundKey'); // Should have default
      expect(result).toHaveProperty('triggerType'); // Should have default
      expect(result).toHaveProperty('triggerKey');

      createdResources.push(result.key);
    });

    test('should create vybit with all optional fields', async () => {
      const result = await client.createVybit({
        name: 'MCP Test - Full Params',
        description: 'Test description',
        status: 'off',
        access: 'private',
        message: 'Test message',
      });

      expect(result.name).toBe('MCP Test - Full Params');
      expect(result.description).toBe('Test description');
      expect(result.status).toBe('off');
      expect(result.access).toBe('private');
      expect(result.message).toBe('Test message');

      createdResources.push(result.key);
    });
  });

  describe('vybit_update with status field', () => {
    let testVybitKey: string;

    beforeAll(async () => {
      if (!hasApiKey) return;

      const vybit = await client.createVybit({
        name: 'MCP Test - Update Status',
      });
      testVybitKey = vybit.key;
      createdResources.push(testVybitKey);
    });

    test('should update vybit status to off', async () => {
      const result = await client.patchVybit(testVybitKey, {
        status: 'off',
      });

      expect(result.status).toBe('off');
    });

    test('should update vybit status to on', async () => {
      const result = await client.patchVybit(testVybitKey, {
        status: 'on',
      });

      expect(result.status).toBe('on');
    });

    test('should update multiple fields including status', async () => {
      const result = await client.patchVybit(testVybitKey, {
        name: 'Updated Name',
        status: 'off',
        message: 'Updated message',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('off');
      expect(result.message).toBe('Updated message');
    });
  });

  describe('meter endpoint', () => {
    test('should return meter with all required fields', async () => {
      const meter = await client.getMeter();

      // Check all fields from our fixed Meter interface
      expect(meter).toHaveProperty('tier_id');
      expect(meter).toHaveProperty('cap_vybits');
      expect(meter).toHaveProperty('cap_daily');
      expect(meter).toHaveProperty('cap_monthly');
      expect(meter).toHaveProperty('number_vybits');
      expect(meter).toHaveProperty('count_daily');
      expect(meter).toHaveProperty('count_monthly');
      expect(meter).toHaveProperty('monthly_reset_dts');

      // Verify it does NOT have the old incorrect field
      expect(meter).not.toHaveProperty('count_total');

      // Validate types
      expect(typeof meter.tier_id).toBe('number');
      expect(typeof meter.number_vybits).toBe('number');
      expect(typeof meter.monthly_reset_dts).toBe('string');
    });
  });

  describe('vybit_list with pagination', () => {
    test('should list vybits with limit param', async () => {
      const vybits = await client.listVybits({ limit: 5 });

      expect(Array.isArray(vybits)).toBe(true);
      expect(vybits.length).toBeLessThanOrEqual(5);
    });

    test('should search vybits', async () => {
      const vybits = await client.listVybits({
        search: 'MCP Test',
        limit: 10,
      });

      expect(Array.isArray(vybits)).toBe(true);
      // Should only return vybits matching search
      vybits.forEach(vybit => {
        expect(vybit.name.toLowerCase()).toContain('mcp test');
      });
    });
  });

  describe('sounds endpoints', () => {
    test('should search sounds', async () => {
      const sounds = await client.searchSounds({
        search: 'notification',
        limit: 5,
      });

      expect(Array.isArray(sounds)).toBe(true);
      expect(sounds.length).toBeGreaterThan(0);
      expect(sounds[0]).toHaveProperty('key');
      expect(sounds[0]).toHaveProperty('name');
      expect(sounds[0]).toHaveProperty('url');
    });

    test('should get specific sound', async () => {
      // First get a sound key
      const sounds = await client.searchSounds({ limit: 1 });
      if (sounds.length === 0) {
        console.log('No sounds available, skipping test');
        return;
      }

      const sound = await client.getSound(sounds[0].key);

      expect(sound.key).toBe(sounds[0].key);
      expect(sound).toHaveProperty('name');
      expect(sound).toHaveProperty('type');
      expect(sound).toHaveProperty('status');
      expect(sound).toHaveProperty('url');
    });
  });

  describe('vybit_trigger', () => {
    let testVybit: any;

    beforeAll(async () => {
      if (!hasApiKey) return;

      testVybit = await client.createVybit({
        name: 'MCP Test - Trigger',
        status: 'on',
      });
      createdResources.push(testVybit.key);
    });

    test('should trigger vybit without params', async () => {
      const result = await client.triggerVybit(testVybit.key);

      expect(result).toHaveProperty('result');
      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk'); // primary log key
    });

    test('should trigger vybit with custom message', async () => {
      const result = await client.triggerVybit(testVybit.key, {
        message: 'Integration test notification',
      });

      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk');
    });

    test('should trigger vybit with message, imageUrl, and linkUrl', async () => {
      const result = await client.triggerVybit(testVybit.key, {
        message: 'Full params test',
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: 'https://example.com',
      });

      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk');
    });
  });

  describe('PublicVybit discovery', () => {
    test('should browse public vybits', async () => {
      const publicVybits = await client.listPublicVybits({
        limit: 5,
      });

      expect(Array.isArray(publicVybits)).toBe(true);
      if (publicVybits.length > 0) {
        expect(publicVybits[0]).toHaveProperty('key');
        expect(publicVybits[0]).toHaveProperty('name');
        expect(publicVybits[0]).toHaveProperty('ownerName');
        expect(publicVybits[0]).toHaveProperty('following');
        expect(publicVybits[0]).toHaveProperty('soundKey');
      }
    });

    test('should search public vybits', async () => {
      const publicVybits = await client.listPublicVybits({
        search: 'test',
        limit: 5,
      });

      expect(Array.isArray(publicVybits)).toBe(true);
      // Search may return empty results if no matching public vybits exist
      // Backend now correctly returns 200 with [] instead of 404
    });

    test('should get public vybit details', async () => {
      // First get a public vybit to test with
      const publicVybits = await client.listPublicVybits({ limit: 1 });
      if (publicVybits.length === 0) {
        console.log('No public vybits available, skipping test');
        return;
      }

      const details = await client.getPublicVybit(publicVybits[0].key);

      expect(details).toHaveProperty('key');
      expect(details).toHaveProperty('name');
      expect(details).toHaveProperty('ownerName');
      expect(details).toHaveProperty('following');
    });
  });

  describe('Subscription management', () => {
    let testSubscriptionKey: string;
    let createdFollowKey: string | null = null;

    beforeAll(async () => {
      if (!hasApiKey) return;

      // Try to find a public vybit to subscribe to
      const publicVybits = await client.listPublicVybits({ limit: 1 });
      if (publicVybits.length > 0 && !publicVybits[0].following) {
        testSubscriptionKey = publicVybits[0].key;
      }
    });

    afterAll(async () => {
      if (!hasApiKey || !client || !createdFollowKey) return;

      try {
        await client.deleteVybitFollow(createdFollowKey);
        console.log(`  ✅ Unsubscribed from test subscription`);
      } catch (error) {
        console.log(`  ⚠️  Failed to unsubscribe`);
      }
    });

    test('should create subscription', async () => {
      if (!testSubscriptionKey) {
        console.log('No public vybit available for subscription, skipping test');
        return;
      }

      const follow = await client.createVybitFollow(testSubscriptionKey);

      expect(follow).toHaveProperty('followingKey');
      expect(follow).toHaveProperty('vybName');
      createdFollowKey = follow.followingKey;
    });

    test('should list subscriptions', async () => {
      const follows = await client.listVybitFollows({
        limit: 10,
      });

      expect(Array.isArray(follows)).toBe(true);
      if (follows.length > 0) {
        expect(follows[0]).toHaveProperty('followingKey');
        expect(follows[0]).toHaveProperty('vybName');
      }
    });

    test('should get subscription details', async () => {
      if (!createdFollowKey) {
        console.log('No subscription created, skipping test');
        return;
      }

      const follow = await client.getVybitFollow(createdFollowKey);

      expect(follow.followingKey).toBe(createdFollowKey);
      expect(follow).toHaveProperty('vybName');
    });

    test('should update subscription', async () => {
      if (!createdFollowKey) {
        console.log('No subscription created, skipping test');
        return;
      }

      const updated = await client.updateVybitFollow(createdFollowKey, {
        status: 'off',
      });

      expect(updated.status).toBe('off');

      // Turn it back on
      await client.updateVybitFollow(createdFollowKey, { status: 'on' });
    });
  });

  describe('Notification logs', () => {
    let testVybitForLogs: any;

    beforeAll(async () => {
      if (!hasApiKey) return;

      // Create a test vybit and trigger it to generate logs
      testVybitForLogs = await client.createVybit({
        name: 'MCP Test - Logs',
        status: 'on',
      });
      createdResources.push(testVybitForLogs.key);

      // Trigger to create a log
      await client.triggerVybit(testVybitForLogs.key, {
        message: 'Test log message',
      });

      // Wait a bit for log to be created
      await delay(500);
    });

    test('should list all logs', async () => {
      const logs = await client.listLogs({
        limit: 10,
      });

      expect(Array.isArray(logs)).toBe(true);
      if (logs.length > 0) {
        expect(logs[0]).toHaveProperty('key');
        expect(logs[0]).toHaveProperty('vybName');
        expect(logs[0]).toHaveProperty('createdAt');
      }
    });

    test('should get specific log', async () => {
      const logs = await client.listLogs({ limit: 1 });
      if (logs.length === 0) {
        console.log('No logs available, skipping test');
        return;
      }

      const log = await client.getLog(logs[0].key);

      expect(log.key).toBe(logs[0].key);
      expect(log).toHaveProperty('vybName');
      expect(log).toHaveProperty('createdAt');
    });

    test('should list logs for specific vybit', async () => {
      const logs = await client.listVybitLogs(testVybitForLogs.key, {
        limit: 10,
      });

      expect(Array.isArray(logs)).toBe(true);
      // Should have at least the log we just created
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toHaveProperty('key');
    });

    test('should list logs for subscription', async () => {
      // Get subscriptions first
      const follows = await client.listVybitFollows({ limit: 1 });
      if (follows.length === 0) {
        console.log('No subscriptions available, skipping test');
        return;
      }

      const logs = await client.listVybitFollowLogs(follows[0].followingKey, {
        limit: 10,
      });

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('Peep management', () => {
    let testVybitForPeeps: any;
    let createdPeepKey: string | null = null;

    beforeAll(async () => {
      if (!hasApiKey) return;

      testVybitForPeeps = await client.createVybit({
        name: 'MCP Test - Peeps',
        access: 'private',
      });
      createdResources.push(testVybitForPeeps.key);
    });

    afterAll(async () => {
      if (!hasApiKey || !client || !createdPeepKey) return;

      try {
        await client.deletePeep(createdPeepKey);
        console.log(`  ✅ Deleted test peep`);
      } catch (error) {
        console.log(`  ⚠️  Failed to delete peep`);
      }
    });

    test('should create peep invitation', async () => {
      const peep = await client.createPeep(
        testVybitForPeeps.key,
        'test-peep@example.com'
      );

      // createPeep returns a simple result: {key, logKey, message, result}
      // Not a full Peep object. Use getPeep() or listPeeps() to get full details
      expect(peep).toHaveProperty('key');
      expect(peep).toHaveProperty('result');
      expect(peep.result).toBe(1);
      createdPeepKey = peep.key;
    });

    test('should list all peeps', async () => {
      const peeps = await client.listPeeps({
        limit: 10,
      });

      expect(Array.isArray(peeps)).toBe(true);
      if (peeps.length > 0) {
        expect(peeps[0]).toHaveProperty('key');
        expect(peeps[0]).toHaveProperty('vybKey');
        expect(peeps[0]).toHaveProperty('name'); // API returns 'name' field, not 'email'
      }
    });

    test('should get specific peep', async () => {
      if (!createdPeepKey) {
        console.log('No peep created, skipping test');
        return;
      }

      const peep = await client.getPeep(createdPeepKey);

      expect(peep.key).toBe(createdPeepKey);
      expect(peep).toHaveProperty('vybKey');
      expect(peep).toHaveProperty('name');
    });

    test('should list peeps for specific vybit', async () => {
      const peeps = await client.listVybitPeeps(testVybitForPeeps.key, {
        limit: 10,
      });

      expect(Array.isArray(peeps)).toBe(true);
      // Should have at least the peep we just created
      expect(peeps.length).toBeGreaterThan(0);
    });
  });

  describe('error scenarios', () => {
    test('should handle 404 for non-existent vybit', async () => {
      await expect(
        client.getVybit('invalid-key-12345')
      ).rejects.toThrow();
    });

    test('should handle 404 for non-existent sound', async () => {
      await expect(
        client.getSound('invalid-sound-key')
      ).rejects.toThrow();
    });

    test('should handle 404 for non-existent public vybit', async () => {
      await expect(
        client.getPublicVybit('invalid-subscription-key')
      ).rejects.toThrow();
    });

    test('should handle 404 for non-existent log', async () => {
      await expect(
        client.getLog('invalid-log-key')
      ).rejects.toThrow();
    });

    test('should handle 404 for non-existent peep', async () => {
      await expect(
        client.getPeep('invalid-peep-key')
      ).rejects.toThrow();
    });
  });
});

// Show message when tests are skipped
if (!hasApiKey) {
  describe('MCP Server Integration Tests', () => {
    test.skip('Integration tests skipped - set VYBIT_API_KEY to run', () => {
      console.log('💡 Tip: Run with VYBIT_API_KEY=your-key npm test -w @vybit/mcp-server');
    });
  });
}
