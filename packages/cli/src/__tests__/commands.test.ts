/**
 * Command handler tests for the Vybit CLI.
 *
 * Strategy: Mock VybitAPIClient, invoke commander commands programmatically,
 * and assert the correct API methods are called with the right arguments.
 */

import { Command } from 'commander';

// --- Mock VybitAPIClient ---
const mockClient = {
  listVybits: jest.fn().mockResolvedValue([{ key: 'v1', name: 'Test' }]),
  getVybit: jest.fn().mockResolvedValue({ key: 'v1', name: 'Test' }),
  createVybit: jest.fn().mockResolvedValue({ key: 'v-new', name: 'New Vybit' }),
  patchVybit: jest.fn().mockResolvedValue({ key: 'v1', name: 'Updated' }),
  deleteVybit: jest.fn().mockResolvedValue(undefined),
  triggerVybit: jest.fn().mockResolvedValue({ result: 1, plk: 'log-123' }),
  listReminders: jest.fn().mockResolvedValue({ reminders: [{ id: 'r1', cron: '0 9 * * *' }] }),
  createReminder: jest.fn().mockResolvedValue({ result: 1, reminder: { id: 'r-new' } }),
  updateReminder: jest.fn().mockResolvedValue({ result: 1, reminder: { id: 'r1' } }),
  deleteReminder: jest.fn().mockResolvedValue(undefined),
  searchSounds: jest.fn().mockResolvedValue([{ key: 's1', name: 'Bell' }]),
  getSound: jest.fn().mockResolvedValue({ key: 's1', name: 'Bell' }),
  listVybitFollows: jest.fn().mockResolvedValue([{ followingKey: 'f1' }]),
  getVybitFollow: jest.fn().mockResolvedValue({ followingKey: 'f1' }),
  createVybitFollow: jest.fn().mockResolvedValue({ followingKey: 'f-new' }),
  updateVybitFollow: jest.fn().mockResolvedValue({ followingKey: 'f1' }),
  deleteVybitFollow: jest.fn().mockResolvedValue(undefined),
  listPublicVybits: jest.fn().mockResolvedValue([{ key: 'pub1' }]),
  getPublicVybit: jest.fn().mockResolvedValue({ key: 'pub1', name: 'Public' }),
  listLogs: jest.fn().mockResolvedValue([{ key: 'log1' }]),
  getLog: jest.fn().mockResolvedValue({ key: 'log1' }),
  listVybitLogs: jest.fn().mockResolvedValue([{ key: 'log2' }]),
  listVybitFollowLogs: jest.fn().mockResolvedValue([{ key: 'log3' }]),
  listPeeps: jest.fn().mockResolvedValue([{ key: 'p1' }]),
  getPeep: jest.fn().mockResolvedValue({ key: 'p1' }),
  createPeep: jest.fn().mockResolvedValue({ key: 'p-new' }),
  deletePeep: jest.fn().mockResolvedValue(undefined),
  listVybitPeeps: jest.fn().mockResolvedValue([{ key: 'p2' }]),
  getMeter: jest.fn().mockResolvedValue({ tier_id: 1, count_daily: 5 }),
  getStatus: jest.fn().mockResolvedValue({ status: 'up' }),
  getProfile: jest.fn().mockResolvedValue({ key: 'u1', name: 'Test User' }),
};

jest.mock('@vybit/api-sdk', () => ({
  VybitAPIClient: jest.fn().mockImplementation(() => mockClient),
}));

// Mock config to return empty (so env vars are used)
jest.mock('../config', () => ({
  loadConfig: () => ({}),
  saveConfig: jest.fn(),
  clearConfig: jest.fn(),
  getConfigDir: () => '/tmp/vybit-test',
  getConfigFile: () => '/tmp/vybit-test/config.json',
}));

// Import command registrations after mocking
import { registerVybitsCommands } from '../commands/vybits';
import { registerTriggerCommand } from '../commands/trigger';
import { registerRemindersCommands } from '../commands/reminders';
import { registerSoundsCommands } from '../commands/sounds';
import { registerSubscriptionsCommands } from '../commands/subscriptions';
import { registerBrowseCommands } from '../commands/browse';
import { registerLogsCommands } from '../commands/logs';
import { registerPeepsCommands } from '../commands/peeps';
import { registerMeterCommand } from '../commands/meter';

// Capture stdout/stderr
let stdoutData: string;
let stderrData: string;

function buildProgram(): Command {
  const program = new Command();
  program
    .name('vybit')
    .option('-q, --quiet', 'Quiet mode')
    .option('--api-key <key>', 'API key')
    .option('--access-token <token>', 'Access token')
    .exitOverride() // Throw instead of calling process.exit
    .configureOutput({
      writeOut: () => {},
      writeErr: () => {},
    });
  registerVybitsCommands(program);
  registerTriggerCommand(program);
  registerRemindersCommands(program);
  registerSoundsCommands(program);
  registerSubscriptionsCommands(program);
  registerBrowseCommands(program);
  registerLogsCommands(program);
  registerPeepsCommands(program);
  registerMeterCommand(program);
  return program;
}

async function run(args: string[]): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(['node', 'vybit', '--api-key', 'test-key', ...args]);
  // Allow async actions to complete
  await new Promise((r) => setTimeout(r, 10));
}

beforeEach(() => {
  stdoutData = '';
  stderrData = '';
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
    stdoutData += chunk;
    return true;
  });
  jest.spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
    stderrData += chunk;
    return true;
  });
  // Reset all mock call counts
  Object.values(mockClient).forEach((fn) => fn.mockClear());
  // Set env var so client creation doesn't fail
  process.env.VYBIT_API_KEY = 'test-key';
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.VYBIT_API_KEY;
});

// ==================== Vybits ====================

describe('vybits list', () => {
  it('calls listVybits with default params', async () => {
    await run(['vybits', 'list']);
    expect(mockClient.listVybits).toHaveBeenCalledWith({
      search: undefined,
      limit: 50,
      offset: 0,
    });
    expect(stdoutData).toContain('"key"');
  });

  it('passes search and pagination options', async () => {
    await run(['vybits', 'list', '--search', 'deploy', '--limit', '10', '--offset', '5']);
    expect(mockClient.listVybits).toHaveBeenCalledWith({
      search: 'deploy',
      limit: 10,
      offset: 5,
    });
  });
});

describe('vybits get', () => {
  it('calls getVybit with key', async () => {
    await run(['vybits', 'get', 'my-key']);
    expect(mockClient.getVybit).toHaveBeenCalledWith('my-key');
  });
});

describe('vybits create', () => {
  it('calls createVybit with name', async () => {
    await run(['vybits', 'create', '--name', 'Deploy Alert']);
    expect(mockClient.createVybit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Deploy Alert' })
    );
  });

  it('passes all optional fields', async () => {
    await run([
      'vybits', 'create',
      '--name', 'Full Vybit',
      '--sound-key', 'sk1',
      '--status', 'off',
      '--trigger-type', 'schedule',
      '--description', 'desc',
      '--access', 'public',
      '--message', 'hello',
      '--image-url', 'https://example.com/img.png',
      '--link-url', 'https://example.com',
    ]);
    expect(mockClient.createVybit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Full Vybit',
        soundKey: 'sk1',
        status: 'off',
        triggerType: 'schedule',
        description: 'desc',
        access: 'public',
        message: 'hello',
        imageUrl: 'https://example.com/img.png',
        linkUrl: 'https://example.com',
      })
    );
  });

  it('parses geofence JSON', async () => {
    const geo = JSON.stringify({ lat: 40.7, lon: -74.0, radius: 100, radiusUnits: 'meters', type: 'enter' });
    await run(['vybits', 'create', '--name', 'Geo', '--trigger-type', 'geofence', '--geofence', geo]);
    const call = mockClient.createVybit.mock.calls[0][0];
    expect(call.geofence.lat).toBe(40.7);
    expect(call.geofence.displayRadius).toBe('100');
    expect(call.geofence.subscribable).toBe('yes');
    expect(call.geofence.timeThrottle).toBe('0');
  });
});

describe('vybits update', () => {
  it('calls patchVybit with key and fields', async () => {
    await run(['vybits', 'update', 'v1', '--name', 'Renamed']);
    expect(mockClient.patchVybit).toHaveBeenCalledWith('v1', expect.objectContaining({ name: 'Renamed' }));
  });
});

describe('vybits delete', () => {
  it('calls deleteVybit with key', async () => {
    await run(['vybits', 'delete', 'v1']);
    expect(mockClient.deleteVybit).toHaveBeenCalledWith('v1');
    expect(stdoutData).toContain('deleted');
  });
});

// ==================== Trigger ====================

describe('trigger', () => {
  it('calls triggerVybit with key only', async () => {
    await run(['trigger', 'v1']);
    expect(mockClient.triggerVybit).toHaveBeenCalledWith('v1', undefined);
  });

  it('passes message and options', async () => {
    await run(['trigger', 'v1', '--message', 'Build passed', '--run-once']);
    expect(mockClient.triggerVybit).toHaveBeenCalledWith('v1', expect.objectContaining({
      message: 'Build passed',
      runOnce: true,
    }));
  });
});

// ==================== Reminders ====================

describe('reminders list', () => {
  it('calls listReminders with vybit key', async () => {
    await run(['reminders', 'list', 'v1']);
    expect(mockClient.listReminders).toHaveBeenCalledWith('v1');
  });
});

describe('reminders create', () => {
  it('calls createReminder with cron', async () => {
    await run(['reminders', 'create', 'v1', '--cron', '0 9 * * MON-FRI', '--time-zone', 'America/Denver']);
    expect(mockClient.createReminder).toHaveBeenCalledWith('v1', expect.objectContaining({
      cron: '0 9 * * MON-FRI',
      timeZone: 'America/Denver',
    }));
  });
});

describe('reminders update', () => {
  it('calls updateReminder with reminder id', async () => {
    await run(['reminders', 'update', 'v1', 'r1', '--message', 'Updated']);
    expect(mockClient.updateReminder).toHaveBeenCalledWith('v1', 'r1', expect.objectContaining({
      message: 'Updated',
    }));
  });
});

describe('reminders delete', () => {
  it('calls deleteReminder', async () => {
    await run(['reminders', 'delete', 'v1', 'r1']);
    expect(mockClient.deleteReminder).toHaveBeenCalledWith('v1', 'r1');
  });
});

// ==================== Sounds ====================

describe('sounds list', () => {
  it('calls searchSounds', async () => {
    await run(['sounds', 'list', '--search', 'bell']);
    expect(mockClient.searchSounds).toHaveBeenCalledWith(expect.objectContaining({
      search: 'bell',
    }));
  });
});

describe('sounds get', () => {
  it('calls getSound', async () => {
    await run(['sounds', 'get', 's1']);
    expect(mockClient.getSound).toHaveBeenCalledWith('s1');
  });
});

// ==================== Subscriptions ====================

describe('subscriptions list', () => {
  it('calls listVybitFollows', async () => {
    await run(['subscriptions', 'list']);
    expect(mockClient.listVybitFollows).toHaveBeenCalled();
  });
});

describe('subscriptions get', () => {
  it('calls getVybitFollow', async () => {
    await run(['subscriptions', 'get', 'f1']);
    expect(mockClient.getVybitFollow).toHaveBeenCalledWith('f1');
  });
});

describe('subscriptions create', () => {
  it('calls createVybitFollow', async () => {
    await run(['subscriptions', 'create', 'sub-key-1']);
    expect(mockClient.createVybitFollow).toHaveBeenCalledWith('sub-key-1');
  });
});

describe('subscriptions update', () => {
  it('calls updateVybitFollow with status', async () => {
    await run(['subscriptions', 'update', 'f1', '--status', 'off']);
    expect(mockClient.updateVybitFollow).toHaveBeenCalledWith('f1', expect.objectContaining({ status: 'off' }));
  });
});

describe('subscriptions delete', () => {
  it('calls deleteVybitFollow', async () => {
    await run(['subscriptions', 'delete', 'f1']);
    expect(mockClient.deleteVybitFollow).toHaveBeenCalledWith('f1');
  });
});

// ==================== Browse ====================

describe('browse list', () => {
  it('calls listPublicVybits', async () => {
    await run(['browse', 'list']);
    expect(mockClient.listPublicVybits).toHaveBeenCalled();
  });
});

describe('browse get', () => {
  it('calls getPublicVybit', async () => {
    await run(['browse', 'get', 'pub-key-1']);
    expect(mockClient.getPublicVybit).toHaveBeenCalledWith('pub-key-1');
  });
});

// ==================== Logs ====================

describe('logs list', () => {
  it('calls listLogs', async () => {
    await run(['logs', 'list']);
    expect(mockClient.listLogs).toHaveBeenCalled();
  });
});

describe('logs get', () => {
  it('calls getLog', async () => {
    await run(['logs', 'get', 'log-key-1']);
    expect(mockClient.getLog).toHaveBeenCalledWith('log-key-1');
  });
});

describe('logs vybit', () => {
  it('calls listVybitLogs', async () => {
    await run(['logs', 'vybit', 'v1']);
    expect(mockClient.listVybitLogs).toHaveBeenCalledWith('v1', expect.any(Object));
  });
});

describe('logs subscription', () => {
  it('calls listVybitFollowLogs', async () => {
    await run(['logs', 'subscription', 'f1']);
    expect(mockClient.listVybitFollowLogs).toHaveBeenCalledWith('f1', expect.any(Object));
  });
});

// ==================== Peeps ====================

describe('peeps list', () => {
  it('calls listPeeps', async () => {
    await run(['peeps', 'list']);
    expect(mockClient.listPeeps).toHaveBeenCalled();
  });
});

describe('peeps get', () => {
  it('calls getPeep', async () => {
    await run(['peeps', 'get', 'p1']);
    expect(mockClient.getPeep).toHaveBeenCalledWith('p1');
  });
});

describe('peeps create', () => {
  it('calls createPeep with vybit key and email', async () => {
    await run(['peeps', 'create', 'v1', '--email', 'user@example.com']);
    expect(mockClient.createPeep).toHaveBeenCalledWith('v1', 'user@example.com');
  });
});

describe('peeps delete', () => {
  it('calls deletePeep', async () => {
    await run(['peeps', 'delete', 'p1']);
    expect(mockClient.deletePeep).toHaveBeenCalledWith('p1');
  });
});

describe('peeps vybit', () => {
  it('calls listVybitPeeps', async () => {
    await run(['peeps', 'vybit', 'v1']);
    expect(mockClient.listVybitPeeps).toHaveBeenCalledWith('v1', expect.any(Object));
  });
});

// ==================== Meter / Status / Profile ====================

describe('meter', () => {
  it('calls getMeter', async () => {
    await run(['meter']);
    expect(mockClient.getMeter).toHaveBeenCalled();
  });
});

describe('status', () => {
  it('calls getStatus', async () => {
    await run(['status']);
    expect(mockClient.getStatus).toHaveBeenCalled();
  });
});

describe('profile', () => {
  it('calls getProfile', async () => {
    await run(['profile']);
    expect(mockClient.getProfile).toHaveBeenCalled();
  });
});
