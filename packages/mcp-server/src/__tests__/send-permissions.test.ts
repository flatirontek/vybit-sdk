/**
 * sendPermissions on vybit_create / vybit_update, and the subscriber send tools
 * (subscription_send_to_owner / subscription_send_to_group).
 */

// Must be set before the module under test is loaded so the stdio server
// does not start.
process.env.VYBIT_MCP_NO_STDIO = 'true';

// Names are prefixed because this file shares a global scope with the other
// script-style test files when tsc type-checks the package.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sendTestMcp = require('../index');

function sendMockClient() {
  return {
    createVybit: jest.fn().mockResolvedValue({ key: 'k1' }),
    patchVybit: jest.fn().mockResolvedValue({ key: 'k1' }),
    sendToOwner: jest.fn().mockResolvedValue({ result: 1, plk: 'log1' }),
    sendToGroup: jest.fn().mockResolvedValue({ result: 1, plk: 'log2' }),
  } as any;
}

const sendTestTools: Record<string, any> = Object.fromEntries(
  sendTestMcp.TOOLS.map((t: any) => [t.name, t])
);

describe('sendPermissions', () => {
  test.each(['vybit_create', 'vybit_update'])('%s schema offers the three send permissions', (toolName) => {
    expect(sendTestTools[toolName].inputSchema.properties.sendPermissions.enum)
      .toEqual(['owner_subs', 'subs_owner', 'subs_group']);
  });

  test('vybit_create forwards sendPermissions', async () => {
    const client = sendMockClient();
    await sendTestMcp.handleToolCall('vybit_create', { name: 'Two-way', sendPermissions: 'subs_owner' }, client);
    expect(client.createVybit).toHaveBeenCalledWith({ name: 'Two-way', sendPermissions: 'subs_owner' });
  });

  test('vybit_update accepts sendPermissions as its only field', async () => {
    const client = sendMockClient();
    await sendTestMcp.handleToolCall('vybit_update', { key: 'k1', sendPermissions: 'subs_group' }, client);
    expect(client.patchVybit).toHaveBeenCalledWith('k1', { sendPermissions: 'subs_group' });
  });
});

describe('subscriber send tools', () => {
  test.each(['subscription_send_to_owner', 'subscription_send_to_group'])('%s requires only followingKey', (toolName) => {
    expect(sendTestTools[toolName].inputSchema.required).toEqual(['followingKey']);
  });

  test('subscription_send_to_owner sends the content to the owner', async () => {
    const client = sendMockClient();
    const res = await sendTestMcp.handleToolCall(
      'subscription_send_to_owner',
      { followingKey: 'f1', message: 'Back online', imageUrl: 'https://example.com/ok.png', linkUrl: 'https://example.com' },
      client
    );
    expect(client.sendToOwner).toHaveBeenCalledWith('f1', {
      message: 'Back online',
      imageUrl: 'https://example.com/ok.png',
      linkUrl: 'https://example.com',
    });
    expect(client.sendToGroup).not.toHaveBeenCalled();
    expect(res.structuredContent).toEqual({ result: 1, plk: 'log1' });
  });

  test('subscription_send_to_group sends no body when no content is given', async () => {
    const client = sendMockClient();
    await sendTestMcp.handleToolCall('subscription_send_to_group', { followingKey: 'f1' }, client);
    expect(client.sendToGroup).toHaveBeenCalledWith('f1', undefined);
    expect(client.sendToOwner).not.toHaveBeenCalled();
  });
});
