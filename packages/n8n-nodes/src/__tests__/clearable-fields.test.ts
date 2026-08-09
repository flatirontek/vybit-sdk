/**
 * Tests for the "Fields to Clear" mechanism on update operations
 * (same bug class as GitLab issue #1: nullable fields were uncleanable).
 *
 * Strategy: instantiate the node with a minimal IExecuteFunctions mock whose
 * helpers.httpRequestWithAuthentication captures the outgoing request.
 */

import { Vybit } from '../nodes/Vybit/Vybit.node';

type Captured = { method: string; url: string; body?: any };

function makeContext(params: Record<string, any>, captured: Captured[]) {
  return {
    getInputData: () => [{ json: {} }],
    getNodeParameter: (name: string, _i: number, fallback?: any) =>
      name in params ? params[name] : fallback,
    getCredentials: async () => ({}),
    getNode: () => ({ name: 'Vybit', type: 'vybit', typeVersion: 1 }),
    continueOnFail: () => false,
    helpers: {
      httpRequestWithAuthentication: async function (this: any, _cred: string, options: any) {
        captured.push({ method: options.method, url: options.url, body: options.body });
        return { ok: true };
      },
    },
  } as any;
}

const node = new Vybit();

describe('Fields to Clear parameters exist with correct scoping', () => {
  const clearParams = node.description.properties.filter((p) => p.name === 'fieldsToClear');

  test('one per update operation (vybits, subscriptions, reminders)', () => {
    const scopes = clearParams.map((p) => ({
      actionType: (p.displayOptions?.show?.actionType as string[])[0],
      operations: p.displayOptions?.show?.apiOperation,
    }));
    expect(scopes).toEqual(
      expect.arrayContaining([
        { actionType: 'vybits', operations: ['update'] },
        { actionType: 'subscriptions', operations: ['updateSubscription'] },
        { actionType: 'reminders', operations: ['update'] },
      ])
    );
    expect(clearParams).toHaveLength(3);
  });

  test('vybit clear options cover the nullable fields', () => {
    const vybitClear = clearParams.find(
      (p) => (p.displayOptions?.show?.actionType as string[])[0] === 'vybits'
    )!;
    const values = (vybitClear.options as any[]).map((o) => o.value).sort();
    expect(values).toEqual(['description', 'imageUrl', 'linkUrl', 'message']);
  });
});

describe('vybit update', () => {
  test('sends null for cleared fields', async () => {
    const captured: Captured[] = [];
    const ctx = makeContext(
      {
        actionType: 'vybits',
        authentication: 'apiKey',
        apiOperation: 'update',
        vybitKey: 'v1',
        updateFields: { name: 'renamed' },
        fieldsToClear: ['linkUrl', 'imageUrl'],
      },
      captured
    );
    await node.execute.call(ctx);
    expect(captured[0].method).toBe('PATCH');
    expect(captured[0].url).toContain('/vybit/v1');
    expect(captured[0].body).toEqual({ name: 'renamed', linkUrl: null, imageUrl: null });
  });

  test('clear wins when a field is both set and cleared', async () => {
    const captured: Captured[] = [];
    const ctx = makeContext(
      {
        actionType: 'vybits',
        authentication: 'apiKey',
        apiOperation: 'update',
        vybitKey: 'v1',
        updateFields: { linkUrl: 'https://example.com/x' },
        fieldsToClear: ['linkUrl'],
      },
      captured
    );
    await node.execute.call(ctx);
    expect(captured[0].body).toEqual({ linkUrl: null });
  });

  test('empty update fails client-side instead of sending an empty PATCH', async () => {
    const captured: Captured[] = [];
    const ctx = makeContext(
      {
        actionType: 'vybits',
        authentication: 'apiKey',
        apiOperation: 'update',
        vybitKey: 'v1',
        updateFields: {},
        fieldsToClear: [],
      },
      captured
    );
    await expect(node.execute.call(ctx)).rejects.toThrow('No updatable fields provided');
    expect(captured).toHaveLength(0);
  });
});

describe('subscription update', () => {
  test('sends null for cleared fields', async () => {
    const captured: Captured[] = [];
    const ctx = makeContext(
      {
        actionType: 'subscriptions',
        authentication: 'apiKey',
        apiOperation: 'updateSubscription',
        followingKey: 'f1',
        updateFields: {},
        fieldsToClear: ['message', 'linkUrl'],
      },
      captured
    );
    await node.execute.call(ctx);
    expect(captured[0].url).toContain('/subscription/following/f1');
    expect(captured[0].body).toEqual({ message: null, linkUrl: null });
  });
});

describe('reminder update', () => {
  test('sends "" (not null) for cleared fields — reminder PATCH rejects null', async () => {
    const captured: Captured[] = [];
    const ctx = makeContext(
      {
        actionType: 'reminders',
        authentication: 'apiKey',
        apiOperation: 'update',
        vybitKey: 'v1',
        reminderId: 'r1',
        optionalFields: { message: 'keep' },
        fieldsToClear: ['linkUrl', 'log'],
      },
      captured
    );
    await node.execute.call(ctx);
    expect(captured[0].url).toContain('/vybit/v1/reminders/r1');
    expect(captured[0].body).toEqual({ message: 'keep', linkUrl: '', log: '' });
  });

  test('empty update fails client-side', async () => {
    const captured: Captured[] = [];
    const ctx = makeContext(
      {
        actionType: 'reminders',
        authentication: 'apiKey',
        apiOperation: 'update',
        vybitKey: 'v1',
        reminderId: 'r1',
        optionalFields: {},
        fieldsToClear: [],
      },
      captured
    );
    await expect(node.execute.call(ctx)).rejects.toThrow('No updatable fields provided');
    expect(captured).toHaveLength(0);
  });
});
