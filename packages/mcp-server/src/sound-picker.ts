/**
 * Sound picker MCP App: sounds_list links this UI resource, and hosts that render
 * MCP Apps show the result as cards with in-place play buttons. The stdio server and
 * the hosted server both answer resources/list and resources/read from here, each
 * passing the origin its sound URLs use.
 */

import { SOUND_PICKER_HTML } from './generated/sound-picker-html.js';

export const SOUND_PICKER_URI = 'ui://vybit/sound-picker';
const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app';

// Freesound sounds (fs:<id>) play through a redirect to Freesound's CDN
const FREESOUND_CDN = 'https://cdn.freesound.org';

// Hosts read both: the nested key is current, the flat one is the deprecated form
export const SOUND_PICKER_TOOL_META = {
  ui: { resourceUri: SOUND_PICKER_URI },
  'ui/resourceUri': SOUND_PICKER_URI,
};

// The host sandbox blocks media from any origin the resource does not declare
function resourceMeta(apiOrigin: string) {
  return { ui: { csp: { resourceDomains: [apiOrigin, FREESOUND_CDN] } } };
}

export function listUiResources(apiOrigin: string) {
  return {
    resources: [{
      uri: SOUND_PICKER_URI,
      name: 'Sound picker',
      description: 'Interactive list of sounds with play buttons, shown for sounds_list results',
      mimeType: MCP_APP_MIME_TYPE,
      _meta: resourceMeta(apiOrigin),
    }],
  };
}

export function readUiResource(uri: string, apiOrigin: string) {
  if (uri !== SOUND_PICKER_URI) throw new Error(`Unknown resource: ${uri}`);
  return {
    contents: [{
      uri: SOUND_PICKER_URI,
      mimeType: MCP_APP_MIME_TYPE,
      text: SOUND_PICKER_HTML,
      _meta: resourceMeta(apiOrigin),
    }],
  };
}
