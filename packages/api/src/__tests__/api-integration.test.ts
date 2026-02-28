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
const ACCESS_TOKEN = process.env.VYBIT_ACCESS_TOKEN;
const hasCredentials = (!!API_KEY && API_KEY !== 'your-api-key-here') || (!!ACCESS_TOKEN && ACCESS_TOKEN !== 'your-token-here');

// Skip all integration tests if no credentials
const describeWithCredentials = hasCredentials ? describe : describe.skip;

describeWithCredentials('API Client Integration Tests (Real API)', () => {
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

  // Helper to generate unique test names to avoid duplicate_name errors
  const testName = (label: string) => `API Test - ${label} ${Date.now()}`;

  // Helper to generate a future cron expression (monthsAhead from now)
  const futureCron = (monthsAhead: number, minute = 0, hour = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    const day = Math.min(d.getDate(), 28);
    return { cron: `${minute} ${hour} ${day} ${d.getMonth() + 1} *`, year: d.getFullYear() };
  };

  beforeAll(async () => {
    if (!hasCredentials) return;

    const baseUrl = process.env.VYBIT_API_URL || 'https://api.vybit.net/v1';
    const authType = API_KEY ? 'API Key' : 'Access Token';
    client = new VybitAPIClient({
      ...(API_KEY ? { apiKey: API_KEY } : { accessToken: ACCESS_TOKEN }),
      baseUrl: baseUrl
    });
    console.log(`🔑 Running API integration tests with ${authType}`);
    console.log(`🌐 API URL: ${baseUrl}`);
    console.log('⏱️  Adding delays between requests to avoid rate limiting...');

    // Wait for any rate limiting from prior test suites to clear
    await delay(2000);

    // Free up capacity by deleting old test vybits to avoid tier limits
    console.log('🧹 Pre-cleaning old test vybits to free tier capacity...');
    try {
      const existing = await client.listVybits({ limit: 50 });
      const testVybits = existing.filter((v: any) =>
        v.name.startsWith('API Test -') || v.name.startsWith('MCP Test -')
      );
      for (const v of testVybits) {
        try {
          await client.deleteVybit(v.key);
          await delay(200);
        } catch { /* ignore */ }
      }
      if (testVybits.length > 0) {
        console.log(`  ✅ Deleted ${testVybits.length} old test vybits`);
      }
    } catch { /* ignore */ }
  }, 30000);

  beforeEach(async () => {
    // Add 200ms delay before each test to avoid rate limiting (10 req/sec = 100ms minimum)
    await delay(200);
  });

  afterAll(async () => {
    if (!hasCredentials || !client) return;

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
  }, 30000);

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
      const name = testName('Minimal');
      const result = await client.createVybit({ name });

      expect(result).toHaveProperty('key');
      expect(result.name).toBe(name);
      expect(result).toHaveProperty('soundKey'); // Should have default
      expect(result).toHaveProperty('triggerType'); // Should have default
      expect(result).toHaveProperty('triggerKey');
      expect(result).toHaveProperty('subscriptionKey');

      createdResources.vybits.push(result.key);
    });

    test('createVybit with all optional fields', async () => {
      const name = testName('Full');
      const result = await client.createVybit({
        name,
        description: 'Test description',
        status: 'off',
        access: 'private',
        message: 'Test message',
      });

      expect(result.name).toBe(name);
      expect(result.description).toBe('Test description');
      expect(result.status).toBe('off');
      expect(result.access).toBe('private');
      expect(result.message).toBe('Test message');

      createdResources.vybits.push(result.key);
    });

    test('getVybit should retrieve created vybit', async () => {
      const name = testName('Get');
      const created = await client.createVybit({ name });
      createdResources.vybits.push(created.key);

      await delay(150);
      const result = await client.getVybit(created.key);

      expect(result.key).toBe(created.key);
      expect(result.name).toBe(name);
    });

    test('patchVybit should update status field', async () => {
      const created = await client.createVybit({ name: testName('Update') });
      createdResources.vybits.push(created.key);

      await delay(150);
      const result = await client.patchVybit(created.key, {
        status: 'off',
      });

      expect(result.status).toBe('off');
    });

    test('patchVybit should update multiple fields', async () => {
      const created = await client.createVybit({ name: testName('Multi') });
      createdResources.vybits.push(created.key);

      await delay(150);
      const updatedName = testName('Updated');
      const result = await client.patchVybit(created.key, {
        name: updatedName,
        status: 'off',
        message: 'Updated message',
      });

      expect(result.name).toBe(updatedName);
      expect(result.status).toBe('off');
      expect(result.message).toBe('Updated message');
    });

    test('listVybits should return array', async () => {
      const result = await client.listVybits({ limit: 5 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    test('deleteVybit should remove vybit', async () => {
      const created = await client.createVybit({ name: testName('Delete') });

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
        expect(result[0]).toHaveProperty('proxyUrl');
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
      expect(result).toHaveProperty('proxyUrl');
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
      if (!hasCredentials) return;

      testVybit = await client.createVybit({
        name: testName('Trigger'),
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

    test('triggerVybit with log should succeed', async () => {
      const result = await client.triggerVybit(testVybit.key, {
        log: 'Integration test log entry',
      });

      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk');
    });

    test('triggerVybit with runOnce should disable vybit', async () => {
      // Create a dedicated vybit for this test so we don't break other tests
      const runOnceVybit = await client.createVybit({
        name: testName('RunOnce'),
        status: 'on',
      });
      createdResources.vybits.push(runOnceVybit.key);
      await delay(200);

      const result = await client.triggerVybit(runOnceVybit.key, {
        message: 'RunOnce test',
        runOnce: true,
      });

      expect(result.result).toBe(1);

      // Give server time to process the async runOnce disable
      await delay(1000);

      const updated = await client.getVybit(runOnceVybit.key);
      expect(updated.status).toBe('off');
    }, 15000);
  });

  describe('Reminders', () => {
    let reminderVybit: any;

    beforeAll(async () => {
      if (!hasCredentials) return;

      reminderVybit = await client.createVybit({
        name: testName('Reminders'),
        triggerType: 'reminders',
        status: 'on',
      });
      createdResources.vybits.push(reminderVybit.key);
      await delay(200);
    }, 15000);

    test('createReminder should create a reminder', async () => {
      const fc = futureCron(4);
      const result = await client.createReminder(reminderVybit.key, {
        cron: fc.cron,
        timeZone: 'America/Denver',
        year: fc.year,
        message: 'Integration test reminder',
      });

      expect(result.result).toBe(1);
      expect(result.reminder).toHaveProperty('id');
      expect(result.reminder.cron).toBe(fc.cron);
      expect(result.reminder.timeZone).toBe('America/Denver');
      expect(result.reminder.message).toBe('Integration test reminder');
    });

    test('createReminder with year should include year in response', async () => {
      const fc = futureCron(6, 0, 12);

      const result = await client.createReminder(reminderVybit.key, {
        cron: fc.cron,
        timeZone: 'UTC',
        year: fc.year,
        message: 'Future year reminder',
      });

      expect(result.result).toBe(1);
      expect(result.reminder).toHaveProperty('year');
      expect(result.reminder.year).toBe(fc.year);
      expect(result.reminder.cron).toBe(fc.cron);
    });

    test('createReminder with all optional fields', async () => {
      const fc = futureCron(9, 30, 8);

      const result = await client.createReminder(reminderVybit.key, {
        cron: fc.cron,
        timeZone: 'America/New_York',
        year: fc.year,
        message: 'Full reminder test',
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: 'https://example.com/event',
        log: 'Created via integration test',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.cron).toBe(fc.cron);
      expect(result.reminder.timeZone).toBe('America/New_York');
      expect(result.reminder.year).toBe(fc.year);
      expect(result.reminder.message).toBe('Full reminder test');
      expect(result.reminder.imageUrl).toContain('example.com/image.jpg');
      expect(result.reminder.linkUrl).toContain('example.com/event');
      expect(result.reminder.log).toBe('Created via integration test');
    });

    test('listReminders should return created reminders', async () => {
      const result = await client.listReminders(reminderVybit.key);

      expect(result.result).toBe(1);
      expect(Array.isArray(result.reminders)).toBe(true);
      expect(result.reminders.length).toBeGreaterThanOrEqual(1);
      expect(result.reminders[0]).toHaveProperty('id');
      expect(result.reminders[0]).toHaveProperty('cron');
      expect(result.reminders[0]).toHaveProperty('timeZone');
    });

    test('updateReminder should update notification fields only', async () => {
      // Get current reminders to find the ID
      const list = await client.listReminders(reminderVybit.key);
      const reminderId = list.reminders[0].id;
      const originalCron = list.reminders[0].cron;

      await delay(200);
      const result = await client.updateReminder(reminderVybit.key, reminderId, {
        message: 'Updated reminder message',
        imageUrl: 'https://example.com/updated.jpg',
        linkUrl: 'https://example.com/updated',
        log: 'Updated log entry',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.id).toBe(reminderId);
      expect(result.reminder.message).toBe('Updated reminder message');
      expect(result.reminder.imageUrl).toContain('example.com/updated.jpg');
      expect(result.reminder.linkUrl).toContain('example.com/updated');
      expect(result.reminder.log).toBe('Updated log entry');
      // cron should remain unchanged
      expect(result.reminder.cron).toBe(originalCron);
    });

    test('updateReminder should update cron and recreate job', async () => {
      const list = await client.listReminders(reminderVybit.key);
      const reminderId = list.reminders[0].id;
      const fc = futureCron(5, 0, 15);

      await delay(200);
      const result = await client.updateReminder(reminderVybit.key, reminderId, {
        cron: fc.cron,
        timeZone: 'America/Chicago',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.id).toBe(reminderId);
      expect(result.reminder.cron).toBe(fc.cron);
      expect(result.reminder.timeZone).toBe('America/Chicago');
    }, 15000);

    test('deleteReminder should remove reminder', async () => {
      // Create a second reminder to delete
      const fc = futureCron(3);
      const created = await client.createReminder(reminderVybit.key, {
        cron: fc.cron,
        timeZone: 'UTC',
        year: fc.year,
        message: 'Delete me',
      });
      const reminderId = created.reminder.id;

      await delay(200);
      const result = await client.deleteReminder(reminderVybit.key, reminderId);
      expect(result.result).toBe(1);

      // Verify it's gone
      await delay(200);
      const list = await client.listReminders(reminderVybit.key);
      const found = list.reminders.find((r: any) => r.id === reminderId);
      expect(found).toBeUndefined();
    });

    test('createReminder should fail on non-reminder vybit', async () => {
      const webhookVybit = await client.createVybit({
        name: testName('Webhook Only'),
        triggerType: 'webhook',
      });
      createdResources.vybits.push(webhookVybit.key);

      await delay(200);
      const fc = futureCron(2);
      await expect(
        client.createReminder(webhookVybit.key, { cron: fc.cron, year: fc.year })
      ).rejects.toThrow();
    });

    test('createReminder should reject reminder more than one year in the future', async () => {
      // Build a date ~14 months from now — well beyond the 1-year limit
      const tooFar = new Date();
      tooFar.setMonth(tooFar.getMonth() + 14);
      const year = tooFar.getFullYear();
      const month = tooFar.getMonth() + 1;
      const day = Math.min(tooFar.getDate(), 28);
      const cron = `0 12 ${day} ${month} *`;

      await expect(
        client.createReminder(reminderVybit.key, {
          cron,
          timeZone: 'UTC',
          year,
          message: 'Should be rejected — too far in the future',
        })
      ).rejects.toThrow(/within one year/);
    });

    test('changing triggerType should clean up reminders', async () => {
      // Reuse the existing reminderVybit — first clean out all existing reminders
      const existing = await client.listReminders(reminderVybit.key);
      for (const r of existing.reminders) {
        await client.deleteReminder(reminderVybit.key, r.id);
        await delay(200);
      }

      // Ensure it's set to reminders triggerType
      await delay(200);
      await client.patchVybit(reminderVybit.key, { triggerType: 'reminders', status: 'on' });

      // Add a reminder (use future date within 1-year limit so it doesn't get garbage-collected)
      await delay(200);
      const fc = futureCron(11);
      await client.createReminder(reminderVybit.key, {
        cron: fc.cron,
        timeZone: 'UTC',
        year: fc.year,
        message: 'Should be cleaned up',
      });

      // Verify reminder exists
      await delay(200);
      const before = await client.listReminders(reminderVybit.key);
      expect(before.reminders.length).toBe(1);

      // Switch triggerType to webhook — server should clean up reminders
      await delay(200);
      await client.patchVybit(reminderVybit.key, { triggerType: 'webhook' });

      // Cleanup runs async on server — wait for it to complete
      await delay(2000);
      const after = await client.listReminders(reminderVybit.key);
      expect(after.reminders.length).toBe(0);
    }, 30000);
  });

  describe('Schedule Vybits', () => {
    let scheduleVybit: any;
    // Generate dynamic schedule crons offset from current hour to avoid immediate firing
    const baseHour = (new Date().getHours() + 3) % 24;
    const scheduleCronA = `0 ${baseHour} * * *`;
    const scheduleCronB = `0 ${(baseHour + 2) % 24} * * *`;
    const scheduleCronWeekday = `0 ${(baseHour + 1) % 24} * * 1-5`;
    const scheduleCronWeekend = `0 ${(baseHour + 3) % 24} * * 6`;

    beforeAll(async () => {
      if (!hasCredentials) return;

      // Reuse an existing webhook vybit by converting it to schedule
      // This avoids hitting the vybit creation cap
      const vybits = await client.listVybits({ limit: 1 });
      if (vybits.length === 0) {
        // Fallback: create one if none exist
        scheduleVybit = await client.createVybit({
          name: testName('Schedule'),
          triggerType: 'schedule',
          triggerSettings: {
            crons: [{ cron: scheduleCronA, timeZone: 'America/Denver' }],
          },
          status: 'on',
        });
        createdResources.vybits.push(scheduleVybit.key);
      } else {
        // Convert existing vybit to schedule type
        scheduleVybit = await client.patchVybit(vybits[0].key, {
          triggerType: 'schedule',
          triggerSettings: {
            crons: [{ cron: scheduleCronA, timeZone: 'America/Denver' }],
          },
        });
      }
      await delay(200);
    }, 15000);

    test('patchVybit should set schedule triggerType with crons', async () => {
      expect(scheduleVybit).toHaveProperty('key');
      expect(scheduleVybit.triggerType).toBe('schedule');
      expect(scheduleVybit.triggerSettings).toBeDefined();
      expect(scheduleVybit.triggerSettings.crons).toBeDefined();
      expect(scheduleVybit.triggerSettings.crons.length).toBeGreaterThanOrEqual(1);
    });

    test('patchVybit should update schedule crons', async () => {
      const result = await client.patchVybit(scheduleVybit.key, {
        triggerSettings: {
          crons: [
            { cron: scheduleCronWeekday, timeZone: 'America/New_York' },
            { cron: scheduleCronWeekend, timeZone: 'America/New_York' },
          ],
        },
      });

      expect(result.triggerSettings).toBeDefined();
      expect(result.triggerSettings.crons.length).toBe(2);
    });

    test('patchVybit should remove a cron by sending reduced array', async () => {
      // First ensure we have 2 crons
      await delay(200);
      const withTwo = await client.patchVybit(scheduleVybit.key, {
        triggerSettings: {
          crons: [
            { cron: scheduleCronA, timeZone: 'America/Denver' },
            { cron: scheduleCronB, timeZone: 'America/Denver' },
          ],
        },
      });
      expect(withTwo.triggerSettings.crons.length).toBe(2);

      // Now remove the second cron by sending only the first
      await delay(200);
      const result = await client.patchVybit(scheduleVybit.key, {
        triggerSettings: {
          crons: [
            { cron: scheduleCronA, timeZone: 'America/Denver' },
          ],
        },
      });

      expect(result.triggerSettings.crons.length).toBe(1);
      expect(result.triggerSettings.crons[0].cron).toBe(scheduleCronA);
    });

    test('patchVybit should change triggerType from schedule to webhook and back', async () => {
      // Change to webhook
      await delay(200);
      const webhookResult = await client.patchVybit(scheduleVybit.key, {
        triggerType: 'webhook',
      });
      expect(webhookResult.triggerType).toBe('webhook');

      // Change back to schedule with new crons
      await delay(200);
      const result = await client.patchVybit(scheduleVybit.key, {
        triggerType: 'schedule',
        triggerSettings: {
          crons: [
            { cron: scheduleCronA, timeZone: 'America/Denver' },
          ],
        },
      });

      expect(result.triggerType).toBe('schedule');
      expect(result.triggerSettings).toBeDefined();
      expect(result.triggerSettings.crons).toBeDefined();
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

  describe('imageUrl Validation', () => {
    let imageTestVybit: any;

    beforeAll(async () => {
      if (!hasCredentials) return;

      // Reuse an existing vybit to avoid hitting the vybit creation cap.
      // Find one or convert one to reminders triggerType.
      const vybits = await client.listVybits({ limit: 50 });
      const existing = vybits.find((v: any) => v.triggerType === 'reminders');
      if (existing) {
        imageTestVybit = existing;
      } else if (vybits.length > 0) {
        // Convert last vybit to reminders type
        imageTestVybit = await client.patchVybit(vybits[vybits.length - 1].key, {
          triggerType: 'reminders',
          status: 'on',
        });
      } else {
        imageTestVybit = await client.createVybit({
          name: testName('ImageUrl'),
          triggerType: 'reminders',
          status: 'on',
        });
        createdResources.vybits.push(imageTestVybit.key);
      }
      await delay(200);
    }, 15000);

    test('patchVybit should reject non-image imageUrl', async () => {
      await expect(
        client.patchVybit(imageTestVybit.key, {
          imageUrl: 'https://example.com/document.pdf',
        })
      ).rejects.toThrow();
    });

    test('patchVybit should accept valid .png imageUrl', async () => {
      const result = await client.patchVybit(imageTestVybit.key, {
        imageUrl: 'https://example.com/icon.png',
      });

      expect(result.imageUrl).toContain('example.com/icon.png');
    });

    test('triggerVybit should silently ignore non-image imageUrl', async () => {
      // Trigger endpoint accepts any URL but silently ignores non-image URLs
      const result = await client.triggerVybit(imageTestVybit.key, {
        message: 'Non-image URL test',
        imageUrl: 'https://example.com/page',
      });

      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk');
    });

    test('triggerVybit should accept valid .gif imageUrl', async () => {
      const result = await client.triggerVybit(imageTestVybit.key, {
        message: 'GIF test',
        imageUrl: 'https://example.com/animation.gif',
      });

      expect(result.result).toBe(1);
      expect(result).toHaveProperty('plk');
    });

    test('createReminder should reject non-image imageUrl', async () => {
      const fc = futureCron(7);
      await expect(
        client.createReminder(imageTestVybit.key, {
          cron: fc.cron,
          year: fc.year,
          imageUrl: 'https://example.com/page',
        })
      ).rejects.toThrow();
    });

    test('createReminder should accept valid .jpg imageUrl', async () => {
      const fc = futureCron(8);
      const result = await client.createReminder(imageTestVybit.key, {
        cron: fc.cron,
        year: fc.year,
        imageUrl: 'https://example.com/reminder.jpg',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.imageUrl).toContain('example.com/reminder.jpg');
    });

    test('updateReminder should reject non-image imageUrl', async () => {
      const list = await client.listReminders(imageTestVybit.key);
      const reminderId = list.reminders[0].id;

      await delay(200);
      await expect(
        client.updateReminder(imageTestVybit.key, reminderId, {
          imageUrl: 'https://example.com/spreadsheet.xlsx',
        })
      ).rejects.toThrow();
    });

    test('updateReminder should accept valid .png imageUrl', async () => {
      const list = await client.listReminders(imageTestVybit.key);
      const reminderId = list.reminders[0].id;

      await delay(200);
      const result = await client.updateReminder(imageTestVybit.key, reminderId, {
        imageUrl: 'https://example.com/updated.png',
      });

      expect(result.result).toBe(1);
      expect(result.reminder.imageUrl).toContain('example.com/updated.png');
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
if (!hasCredentials) {
  describe('API Client Integration Tests', () => {
    test.skip('Integration tests skipped - set VYBIT_API_KEY or VYBIT_ACCESS_TOKEN to run', () => {
      console.log('💡 Tip: Run with VYBIT_API_KEY=your-key npm test');
      console.log('   Or:  VYBIT_ACCESS_TOKEN=your-token npm test');
    });
  });
}
