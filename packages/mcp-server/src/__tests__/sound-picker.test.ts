// sounds_list renders as an MCP App sound picker in hosts that support it, and the
// schedule vs reminders guidance steers recurring alerts away from reminder_create.

process.env.VYBIT_MCP_NO_STDIO = 'true';

import { TOOLS, SOUND_PICKER_URI, listUiResources, readUiResource } from '../index';
import { licenseLabel, soundsFromToolResult } from '../sound-picker-data';

const tool = (name: string) => TOOLS.find((t) => t.name === name)!;

describe('sound picker resource', () => {
  it('sounds_list links the picker in both the current and the legacy meta key', () => {
    expect(tool('sounds_list')._meta).toEqual({
      ui: { resourceUri: SOUND_PICKER_URI },
      'ui/resourceUri': SOUND_PICKER_URI,
    });
  });

  it('serves a self-contained MCP App page', () => {
    const { contents } = readUiResource(SOUND_PICKER_URI, 'https://api.vybit.net');
    expect(contents).toHaveLength(1);
    expect(contents[0].uri).toBe(SOUND_PICKER_URI);
    expect(contents[0].mimeType).toBe('text/html;profile=mcp-app');
    expect(contents[0].text).toMatch(/^<!doctype html>/);
    expect(contents[0].text).toContain('<script>');
    expect(contents[0].text).not.toMatch(/<script[^>]+src=/);
    expect(contents[0].text).not.toContain('<!-- APP_SCRIPT -->');
  });

  it('lets audio load from the API host and the Freesound CDN it redirects to', () => {
    const csp = { ui: { csp: { resourceDomains: ['https://api.example.test', 'https://cdn.freesound.org'] } } };
    const { resources } = listUiResources('https://api.example.test');
    expect(resources.map((r) => [r.uri, r._meta])).toEqual([[SOUND_PICKER_URI, csp]]);
    expect(readUiResource(SOUND_PICKER_URI, 'https://api.example.test').contents[0]._meta).toEqual(csp);
  });

  it('refuses an unknown resource', () => {
    expect(() => readUiResource('ui://vybit/nope', 'https://api.vybit.net')).toThrow(/Unknown resource/);
  });
});

describe('soundsFromToolResult', () => {
  const freesoundImport = {
    key: 'abc123',
    name: 'Bell ding',
    description: 'A clear bell',
    proxyUrl: 'https://api.vybit.net/v1/sound/abc123/play',
    meta: {
      source: 'freesound',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      username: 'ringer',
      freesoundUrl: 'https://freesound.org/people/ringer/sounds/1/',
    },
  };

  it('reads structuredContent items', () => {
    expect(soundsFromToolResult({ structuredContent: { items: [freesoundImport] } })).toEqual([{
      key: 'abc123',
      name: 'Bell ding',
      description: 'A clear bell',
      playUrl: 'https://api.vybit.net/v1/sound/abc123/play',
      author: 'ringer',
      license: 'CC BY 4.0',
      sourceUrl: 'https://freesound.org/people/ringer/sounds/1/',
    }]);
  });

  it('falls back to the JSON text block when there is no structuredContent', () => {
    const sounds = soundsFromToolResult({ content: [{ type: 'text', text: JSON.stringify([freesoundImport]) }] });
    expect(sounds.map((s) => s.key)).toEqual(['abc123']);
  });

  it('uses the Freesound page kept in source by older imports', () => {
    const [sound] = soundsFromToolResult({ structuredContent: { items: [{
      key: 'k1',
      meta: { source: 'https://freesound.org/people/Dnab55/sounds/128138/', license: 'http://creativecommons.org/publicdomain/zero/1.0/' },
    }] } });
    expect(sound).toMatchObject({ name: 'k1', license: 'CC0', sourceUrl: 'https://freesound.org/people/Dnab55/sounds/128138/', author: null });
  });

  it('drops entries without a key and refuses non-https play and source URLs', () => {
    const sounds = soundsFromToolResult({ structuredContent: { items: [
      null,
      { name: 'no key' },
      { key: 'k2', proxyUrl: 'javascript:alert(1)', meta: { freesoundUrl: 'http://freesound.org/x' } },
    ] } });
    expect(sounds).toEqual([{ key: 'k2', name: 'k2', description: '', playUrl: null, author: null, license: null, sourceUrl: null }]);
  });

  it('shows Freesound HTML descriptions as plain text', () => {
    const [sound] = soundsFromToolResult({ structuredContent: { items: [{
      key: 'k3',
      description: 'Support me on <a href="https://www.patreon.com/x" rel="nofollow">Patreon</a> &amp; it&#8217;s free',
    }] } });
    expect(sound.description).toBe('Support me on Patreon & it\u2019s free');
  });

  it('returns nothing for an unreadable result', () => {
    expect(soundsFromToolResult(undefined)).toEqual([]);
    expect(soundsFromToolResult({ content: [{ type: 'text', text: 'Error: nope' }] })).toEqual([]);
  });
});

describe('licenseLabel', () => {
  it.each([
    ['http://creativecommons.org/publicdomain/zero/1.0/', 'CC0'],
    ['https://creativecommons.org/licenses/by/4.0/', 'CC BY 4.0'],
    ['https://creativecommons.org/licenses/by-nc/4.0/', 'CC BY-NC 4.0'],
    ['http://creativecommons.org/licenses/by/3.0/', 'CC BY 3.0'],
    ['Attribution', 'Attribution'],
    ['https://example.com/some/license', null],
    ['', null],
    [undefined, null],
  ])('%s -> %s', (input, label) => {
    expect(licenseLabel(input)).toBe(label);
  });
});

describe('schedule vs reminders guidance', () => {
  const description = (name: string, prop?: string) => {
    const t = tool(name);
    return prop ? (t.inputSchema.properties as Record<string, { description: string }>)[prop].description : t.description!;
  };

  it('triggerType sends anything recurring to schedule, on create and update', () => {
    for (const name of ['vybit_create', 'vybit_update']) {
      expect(description(name, 'triggerType')).toMatch(/schedule: fires on a repeating pattern/);
      expect(description(name, 'triggerType')).toMatch(/reminders: one-off/);
    }
  });

  it('reminder_create is for one-off dates and points recurring alerts at schedule', () => {
    expect(description('reminder_create')).toMatch(/one-off dated reminder/);
    expect(description('reminder_create')).toMatch(/triggerType=schedule/);
    expect(description('reminder_create', 'year')).toMatch(/one-off/);
  });

  it('sounds_list says not to build a separate audio widget', () => {
    expect(description('sounds_list')).toMatch(/separate audio widget/);
  });
});
