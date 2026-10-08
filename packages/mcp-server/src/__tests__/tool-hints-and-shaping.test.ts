// Review requirements for the ChatGPT app directory: every annotation is an explicit boolean,
// tools that reach other people say so, and results carry no personal data a tool does not need.

process.env.VYBIT_MCP_NO_STDIO = 'true';

import { TOOLS, shapeToolResult } from '../index';

const HINTS = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'] as const;

describe('tool annotations', () => {
  it.each(TOOLS.map((tool) => [tool.name, tool] as const))('%s sets every hint to a boolean', (_name, tool) => {
    for (const hint of HINTS) {
      expect(typeof (tool.annotations as Record<string, unknown>)[hint]).toBe('boolean');
    }
  });

  it('read-only tools are neither destructive nor open-world, and are idempotent', () => {
    for (const tool of TOOLS.filter((t) => t.annotations?.readOnlyHint)) {
      expect(tool.annotations).toMatchObject({ destructiveHint: false, idempotentHint: true, openWorldHint: false });
    }
  });

  it('tools that notify, invite or remove other people are open-world', () => {
    const reachesOthers = [
      'vybit_trigger',
      'subscription_send_to_owner',
      'subscription_send_to_group',
      'peep_create',
      'peep_delete',
      'reminder_create',
    ];
    for (const name of reachesOthers) {
      expect(TOOLS.find((t) => t.name === name)?.annotations?.openWorldHint).toBe(true);
    }
  });

  it('every delete tool is destructive', () => {
    for (const tool of TOOLS.filter((t) => t.name.endsWith('_delete'))) {
      expect(tool.annotations?.destructiveHint).toBe(true);
    }
  });
});

describe('shapeToolResult', () => {
  it('returns only display name and plan for profile_get', () => {
    const profile = { key: 'abc123', name: 'Pat', email: 'pat@example.com', tier_id: 1, tier: 'Free' };
    expect(shapeToolResult('profile_get', profile)).toEqual({ name: 'Pat', tier_id: 1, tier: 'Free' });
  });

  it('masks an invitee email shown in place of a peep name', () => {
    const peeps = [
      { key: 'p1', vybKey: 'v1', name: 'quinn@example.com', accessStatus: 'invited' },
      { key: 'p2', vybKey: 'v1', name: 'Maren', accessStatus: 'granted' },
    ];
    expect(shapeToolResult('peeps_list', peeps)).toEqual([
      { key: 'p1', vybKey: 'v1', name: 'q***@example.com', accessStatus: 'invited' },
      { key: 'p2', vybKey: 'v1', name: 'Maren', accessStatus: 'granted' },
    ]);
    expect(shapeToolResult('vybit_peeps_list', peeps)).toEqual(shapeToolResult('peeps_list', peeps));
    expect(shapeToolResult('peep_get', peeps[0])).toEqual({ key: 'p1', vybKey: 'v1', name: 'q***@example.com', accessStatus: 'invited' });
  });

  it('turns model instances into plain JSON', () => {
    // Sequelize instances serialize through toJSON; structuredContent must be a plain record
    const instance = { dataValues: { key: 'p1' }, toJSON: () => ({ key: 'p1', name: 'Maren' }) };
    const shaped = shapeToolResult('peep_get', instance);
    expect(shaped).toEqual({ key: 'p1', name: 'Maren' });
    expect(Object.getPrototypeOf(shaped)).toBe(Object.prototype);
  });

  it('passes other tools through unchanged', () => {
    const vybit = { key: 'v1', name: 'Alert', triggerSettings: { crons: [] } };
    expect(shapeToolResult('vybit_get', vybit)).toEqual(vybit);
    expect(shapeToolResult('vybit_list', [vybit])).toEqual([vybit]);
  });
});
