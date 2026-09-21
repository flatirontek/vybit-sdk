/**
 * jsonResponse(rawResult) must validate against every tool's outputSchema under
 * the MCP SDK's own AJV validator (the one Client.callTool uses). Samples mirror
 * real API responses, including the variants the hosted MCP (vybitapp
 * lib/mcp.js) passes through: nullable fields, missing optional fields, the
 * "vybit is off" trigger response, and differing delete shapes.
 */

process.env.VYBIT_MCP_NO_STDIO = 'true';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv-provider.js';
import { TOOLS, jsonResponse } from '../index';

const vybit = {
  key: 'vyb123abc',
  name: 'Server Alert',
  description: null,
  soundKey: 'snd123abc',
  status: 'on',
  triggerKey: 'trg123abc',
  subscriptionKey: 'sub123abc',
  access: 'private',
  numberFollowers: 3,
  imageUrl: null,
  linkUrl: 'https://status.example.com',
  message: 'Server is down!',
  geofence: null,
  triggerType: 'webhook',
  triggerSettings: null,
  sendPermissions: 'owner_subs',
  createdAt: '2026-01-15T10:30:00.000Z',
  updatedAt: '2026-01-20T14:45:00.000Z',
};

const scheduledVybit = {
  ...vybit,
  key: 'vyb456def',
  triggerType: 'schedule',
  triggerSettings: { crons: [{ cron: '0 9 * * *', timeZone: 'America/Denver' }] },
};

const geofenceVybit = {
  ...vybit,
  key: 'vyb789ghi',
  triggerType: 'geofence',
  soundKey: null,
  access: null,
  geofence: {
    id: '6nq1h6h4lj8elimg',
    lat: 40.0458744,
    lon: '-105.2654336',
    radius: 100,
    radiusUnits: 'meters',
    displayRadius: '100',
    type: 'enter',
    timeThrottle: '0',
    subscribable: 'yes',
  },
};

const reminder = {
  id: 'a3f2b1c9d0e4',
  cron: '30 14 20 2 *',
  timeZone: 'America/Denver',
  year: 2027,
  message: "Don't forget the meeting",
  imageUrl: null,
  linkUrl: null,
  log: null,
};

const sound = {
  key: 'snd123abc',
  name: 'Notification Bell',
  description: 'Clean notification sound',
  type: 'mp3',
  status: 'public',
  proxyUrl: 'https://api.vybit.net/v1/sound/snd123abc/play',
  vybitKey: null,
  meta: null,
  createdAt: '2025-06-01T00:00:00.000Z',
  updatedAt: '2025-06-01T00:00:00.000Z',
};

const freesoundSound = {
  key: 'fs:12345',
  name: 'Chime',
  description: '',
  type: 'mp3',
  status: 'public',
  proxyUrl: 'https://api.vybit.net/v1/sound/fs:12345/play',
  vybitKey: null,
  meta: { source: 'freesound', freesoundId: 12345, license: 'CC0', username: 'someone', tags: ['bell'] },
};

const publicVybit = {
  key: 'sub123abc',
  name: 'Daily Weather',
  description: 'Morning forecast',
  soundKey: 'snd123abc',
  soundType: 'mp3',
  imageUrl: null,
  linkUrl: null,
  ownerName: 'Jane Smith',
  createdAt: '2026-01-15T10:30:00.000Z',
  updatedAt: '2026-01-20T14:45:00.000Z',
  following: false,
};

const subscription = {
  followingKey: 'fol123abc',
  vybName: 'Daily Weather',
  description: null,
  soundKey: 'snd123abc',
  soundType: 'mp3',
  ownerName: null,
  status: 'on',
  accessStatus: 'public',
  subscriptionKey: 'sub123abc',
  access: 'public',
  geofence: null,
  message: null,
  imageUrl: null,
  linkUrl: null,
  sendPermissions: 'owner_subs',
  createdAt: '2026-01-15T10:30:00.000Z',
  updatedAt: null,
};

const log = {
  key: 'log123abc',
  vybKey: 'vyb123abc',
  createdAt: '2026-02-01T08:00:00.000Z',
  vybfollowKey: null,
  senderName: 'John Doe',
  notification: 'CPU at 95%',
  log: null,
  imageUrl: null,
  linkUrl: null,
  vybName: 'Server Alert',
  vybDescription: 'CPU alerts',
  soundKey: 'snd123abc',
  ownerName: 'John Doe',
};

// Log entries built from diagnostics can omit the vybit fields entirely.
const sparseLog = {
  key: 'log456def',
  vybKey: null,
  createdAt: '2026-02-01T08:05:00.000Z',
  vybfollowKey: 'fol123abc',
  senderName: null,
  notification: null,
  log: null,
  imageUrl: null,
  linkUrl: null,
};

const peep = {
  key: 'pep123abc',
  vybKey: 'vyb123abc',
  name: null,
  accessStatus: 'invited',
  createdAt: '2026-01-15T10:30:00.000Z',
  updatedAt: '2026-01-15T10:30:00.000Z',
};

/** Realistic successful raw results per tool; the first entry is the typical case. */
const SAMPLES: Record<string, unknown[]> = {
  vybit_list: [[vybit, scheduledVybit, geofenceVybit], []],
  vybit_get: [vybit, geofenceVybit],
  vybit_create: [scheduledVybit],
  // The hosted API currently returns send_permissions from update; extra fields must be accepted.
  vybit_update: [{ ...vybit, sendPermissions: undefined, send_permissions: 'owner_subs' }],
  vybit_delete: [{ success: true, message: 'Vybit deleted successfully' }, { result: 1, message: 'Vybit deleted' }],
  vybit_trigger: [{ result: 1, plk: 'log123abc' }, { result: 0, warn: 'Vybit is off and will not be triggered' }],
  reminder_create: [{ result: 1, reminder }],
  reminder_list: [{ result: 1, reminders: [reminder] }, { result: 1, reminders: [] }],
  reminder_update: [{ result: 1, reminder: { ...reminder, message: '' } }],
  reminder_delete: [{ success: true, message: 'Reminder deleted successfully' }, { result: 1, message: 'Reminder deleted' }],
  sounds_list: [[sound, freesoundSound], []],
  sound_get: [sound, freesoundSound],
  profile_get: [{ key: 'abc123def456ghij', name: 'Pat Example', email: 'pat@example.com', tier_id: 1, tier: 'Free' }],
  meter_get: [
    {
      tier_id: 1,
      tier: 'Free',
      cap_vybits: 50,
      cap_daily: 500,
      cap_monthly: 7500,
      number_vybits: 12,
      count_daily: 127,
      count_monthly: 3421,
      monthly_reset_dts: '2026-10-01T00:00:00.000Z',
    },
    {
      tier_id: 0,
      tier: null,
      cap_vybits: 10,
      cap_daily: 100,
      cap_monthly: 1500,
      number_vybits: 0,
      count_daily: 0,
      count_monthly: 0,
      monthly_reset_dts: null,
    },
  ],
  get_current_time: [{ utc: '2026-09-14T16:00:00.000Z', local: '9/14/2026, 10:00:00 AM', timeZone: 'America/Denver' }],
  vybits_browse_public: [[publicVybit], []],
  vybit_get_public: [{ ...publicVybit, following: true, soundType: null }],
  subscription_create: [
    { result: 1, message: 'subscribed', logKey: 'log789xyz', key: 'fol123abc' },
    { result: 1, message: 'already subscribed' },
    { result: 0, message: 'not authorized' },
  ],
  subscriptions_list: [[subscription], []],
  subscription_get: [subscription],
  subscription_update: [
    {
      status: 'off',
      soundKey: null,
      createdAt: '2026-01-15T10:30:00.000Z',
      updatedAt: '2026-09-14T16:00:00.000Z',
      accessStatus: 'granted',
      message: null,
      imageUrl: null,
      linkUrl: null,
      followingKey: 'fol123abc',
    },
  ],
  subscription_delete: [{ success: true, message: 'Unsubscribed successfully' }, { message: 'subscription deleted' }],
  logs_list: [[log, sparseLog], []],
  log_get: [log, sparseLog],
  vybit_logs: [[log]],
  subscription_logs: [[sparseLog]],
  peeps_list: [[peep], []],
  peep_get: [peep],
  peep_create: [{ result: 1, message: 'invitation', logKey: 'log789xyz', key: 'pep123abc' }],
  peep_delete: [{ success: true, message: 'Peep removed successfully' }, { message: 'deleted' }],
  vybit_peeps_list: [[peep]],
};

const validator = new AjvJsonSchemaValidator();

function validate(toolName: string, structuredContent: unknown) {
  const tool = TOOLS.find((t) => t.name === toolName);
  if (!tool?.outputSchema) throw new Error(`Tool ${toolName} has no outputSchema`);
  return validator.getValidator(tool.outputSchema)(structuredContent);
}

describe('jsonResponse', () => {
  test('wraps a list as { items } and keeps the unmodified JSON in the text block', () => {
    const response = jsonResponse([vybit]);
    expect(response.content).toEqual([{ type: 'text', text: JSON.stringify([vybit]) }]);
    expect(response.structuredContent).toEqual({ items: [vybit] });
  });

  test('passes an object result through as structuredContent', () => {
    const response = jsonResponse(vybit);
    expect(response.structuredContent).toBe(vybit);
    expect(JSON.parse(response.content[0].text)).toEqual(vybit);
  });

  test('maps an empty reply (hosted reply.close) to {}', () => {
    expect(jsonResponse(null).structuredContent).toEqual({});
    expect(jsonResponse(undefined)).toEqual({ content: [{ type: 'text', text: 'null' }], structuredContent: {} });
  });
});

describe('Tool outputSchema declarations', () => {
  test('every tool declares an object outputSchema', () => {
    for (const tool of TOOLS) {
      expect(tool.outputSchema).toBeDefined();
      expect(tool.outputSchema!.type).toBe('object');
    }
  });

  test('samples cover exactly the tools in TOOLS', () => {
    expect(Object.keys(SAMPLES).sort()).toEqual(TOOLS.map((t) => t.name).sort());
  });

  test('outputSchemas are plain JSON (serializable without loss)', () => {
    for (const tool of TOOLS) {
      expect(JSON.parse(JSON.stringify(tool.outputSchema))).toEqual(tool.outputSchema);
    }
  });

  test.each(Object.entries(SAMPLES).flatMap(([name, samples]) => samples.map((sample, i) => [name, i, sample] as const)))(
    '%s sample %i validates against its outputSchema',
    (name, _i, sample) => {
      // Round-trip through JSON so the check sees what a client receives (undefined fields dropped).
      const { structuredContent } = JSON.parse(JSON.stringify(jsonResponse(sample)));
      const result = validate(name, structuredContent);
      expect(result.errorMessage).toBeUndefined();
      expect(result.valid).toBe(true);
    }
  );

  test('validation rejects results with the wrong shape', () => {
    expect(validate('vybit_get', { key: 123 }).valid).toBe(false);
    expect(validate('vybit_list', { items: 'not-an-array' }).valid).toBe(false);
    expect(validate('meter_get', { cap_daily: 'lots' }).valid).toBe(false);
  });
});

describe('End-to-end with the MCP SDK Client', () => {
  let client: Client;
  let server: Server;

  beforeAll(async () => {
    server = new Server({ name: 'vybit-mcp-server-test', version: '0.0.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const index = Number(request.params.arguments?.sampleIndex ?? 0);
      return jsonResponse(SAMPLES[request.params.name][index]);
    });

    client = new Client({ name: 'test-client', version: '0.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
    // Client.callTool validates against outputSchemas cached by listTools.
    await client.listTools();
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  test('client accepts structuredContent for every tool and sample', async () => {
    for (const [name, samples] of Object.entries(SAMPLES)) {
      for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
        const result = await client.callTool({ name, arguments: { sampleIndex } });
        expect(result.isError).toBeFalsy();
        expect(result.structuredContent).toBeDefined();
      }
    }
  });

  test('client rejects structuredContent that violates the outputSchema', async () => {
    server.setRequestHandler(CallToolRequestSchema, async () => jsonResponse({ key: 42 }));
    await expect(client.callTool({ name: 'vybit_get', arguments: {} })).rejects.toThrow();
  });
});
