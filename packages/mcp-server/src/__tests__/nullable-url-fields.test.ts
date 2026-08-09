/**
 * Regression tests for GitLab issue #1 — nullable URL fields.
 *
 * Three defects, all in the MCP layer (API verified correct):
 *  1. vybit_create must forward linkUrl/imageUrl to the API and return the
 *     API's stored representation, not echo the request input.
 *  2. vybit_update with linkUrl: "" was silently dropped by a truthy check,
 *     producing an empty PATCH body that the API rejects with a 500.
 *  3. The tool schemas typed clearable fields as plain strings, so JSON null
 *     could not be expressed and clients stringified it to "null".
 */

// Must be set before the module under test is loaded so the stdio server
// does not start.
process.env.VYBIT_MCP_NO_STDIO = 'true';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TOOLS, handleToolCall } = require('../index');

function mockClient() {
  return {
    createVybit: jest.fn().mockResolvedValue({ key: 'k1', linkUrl: 'https://api.example/stored' }),
    patchVybit: jest.fn().mockResolvedValue({ key: 'k1', linkUrl: null }),
    updateVybitFollow: jest.fn().mockResolvedValue({ followingKey: 'f1' }),
    createReminder: jest.fn().mockResolvedValue({ result: 1 }),
    updateReminder: jest.fn().mockResolvedValue({ result: 1 }),
  } as any;
}

const toolsByName: Record<string, any> = Object.fromEntries(
  TOOLS.map((t: any) => [t.name, t])
);

describe('clearable fields accept null in tool schemas (bug 3)', () => {
  const cases: Array<[string, string[]]> = [
    ['vybit_create', ['message', 'imageUrl', 'linkUrl']],
    ['vybit_update', ['description', 'message', 'imageUrl', 'linkUrl']],
    ['subscription_update', ['message', 'imageUrl', 'linkUrl']],
    ['reminder_create', ['message', 'imageUrl', 'linkUrl', 'log']],
    ['reminder_update', ['message', 'imageUrl', 'linkUrl', 'log']],
  ];

  test.each(cases)('%s schema types allow null', (toolName, fields) => {
    for (const field of fields) {
      const prop = toolsByName[toolName].inputSchema.properties[field];
      expect(prop.type).toEqual(['string', 'null']);
    }
  });
});

describe('vybit_create forwards linkUrl and returns the API response (bug 1)', () => {
  test('linkUrl is sent to the API', async () => {
    const client = mockClient();
    await handleToolCall(
      'vybit_create',
      { name: 'test', linkUrl: 'https://example.com/original' },
      client
    );
    expect(client.createVybit).toHaveBeenCalledWith({
      name: 'test',
      linkUrl: 'https://example.com/original',
    });
  });

  test('response reflects what the API returned, not the request input', async () => {
    const client = mockClient();
    const res = await handleToolCall(
      'vybit_create',
      { name: 'test', linkUrl: 'https://example.com/requested' },
      client
    );
    const body = JSON.parse(res.content[0].text);
    expect(body.linkUrl).toBe('https://api.example/stored');
  });
});

describe('vybit_update clearing semantics (bugs 2 & 3)', () => {
  test('empty string is forwarded, not dropped into an empty PATCH body', async () => {
    const client = mockClient();
    await handleToolCall('vybit_update', { key: 'k1', linkUrl: '' }, client);
    expect(client.patchVybit).toHaveBeenCalledWith('k1', { linkUrl: '' });
  });

  test('null is forwarded as real JSON null', async () => {
    const client = mockClient();
    await handleToolCall(
      'vybit_update',
      { key: 'k1', linkUrl: null, imageUrl: null, message: null, description: null },
      client
    );
    expect(client.patchVybit).toHaveBeenCalledWith('k1', {
      linkUrl: null,
      imageUrl: null,
      message: null,
      description: null,
    });
  });

  test('omitted fields stay omitted', async () => {
    const client = mockClient();
    await handleToolCall('vybit_update', { key: 'k1', name: 'renamed' }, client);
    expect(client.patchVybit).toHaveBeenCalledWith('k1', { name: 'renamed' });
  });

  test('update with no fields fails client-side instead of sending an empty PATCH', async () => {
    const client = mockClient();
    await expect(
      handleToolCall('vybit_update', { key: 'k1' }, client)
    ).rejects.toThrow('No updatable fields provided');
    expect(client.patchVybit).not.toHaveBeenCalled();
  });
});

describe('subscription_update clearing semantics', () => {
  test('empty string and null are forwarded', async () => {
    const client = mockClient();
    await handleToolCall(
      'subscription_update',
      { followingKey: 'f1', linkUrl: '', imageUrl: null },
      client
    );
    expect(client.updateVybitFollow).toHaveBeenCalledWith('f1', {
      linkUrl: '',
      imageUrl: null,
    });
  });

  test('update with no fields fails client-side', async () => {
    const client = mockClient();
    await expect(
      handleToolCall('subscription_update', { followingKey: 'f1' }, client)
    ).rejects.toThrow('No updatable fields provided');
    expect(client.updateVybitFollow).not.toHaveBeenCalled();
  });
});

describe('reminder clearing semantics', () => {
  test('reminder_create forwards null and empty-string fields', async () => {
    const client = mockClient();
    await handleToolCall(
      'reminder_create',
      { key: 'k1', cron: '0 7 * * *', linkUrl: null, imageUrl: '' },
      client
    );
    expect(client.createReminder).toHaveBeenCalledWith('k1', {
      cron: '0 7 * * *',
      linkUrl: null,
      imageUrl: '',
    });
  });

  test('reminder_update coerces null to "" (reminder PATCH 500s on JSON null)', async () => {
    const client = mockClient();
    await handleToolCall(
      'reminder_update',
      { key: 'k1', reminderId: 'r1', linkUrl: null, message: 'still here' },
      client
    );
    expect(client.updateReminder).toHaveBeenCalledWith('k1', 'r1', {
      linkUrl: '',
      message: 'still here',
    });
  });

  test('reminder_update with no fields fails client-side', async () => {
    const client = mockClient();
    await expect(
      handleToolCall('reminder_update', { key: 'k1', reminderId: 'r1' }, client)
    ).rejects.toThrow('No updatable fields provided');
    expect(client.updateReminder).not.toHaveBeenCalled();
  });
});
