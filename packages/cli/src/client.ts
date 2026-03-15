import { VybitAPIClient } from '@vybit/api-sdk';
import { loadConfig } from './config';
import { outputError } from './output';

export interface GlobalOpts {
  apiKey?: string;
  accessToken?: string;
  quiet?: boolean;
}

/**
 * Resolve global options from the commander program.
 * Commander stores global options on the root command, accessible via .optsWithGlobals().
 */
export function resolveGlobalOpts(cmd: any): GlobalOpts {
  const opts = cmd.optsWithGlobals ? cmd.optsWithGlobals() : cmd.opts();
  return {
    apiKey: opts.apiKey,
    accessToken: opts.accessToken,
    quiet: opts.quiet,
  };
}

/**
 * Create a VybitAPIClient using credentials from (in priority order):
 * 1. CLI flags (--api-key / --access-token)
 * 2. Environment variables (VYBIT_API_KEY / VYBIT_ACCESS_TOKEN)
 * 3. Config file (~/.config/vybit/config.json)
 *
 * Exits with code 2 if no credentials are found.
 */
export function createClient(opts: GlobalOpts = {}): VybitAPIClient {
  const apiKey = opts.apiKey || process.env.VYBIT_API_KEY;
  const accessToken = opts.accessToken || process.env.VYBIT_ACCESS_TOKEN;

  if (apiKey) {
    return new VybitAPIClient({ apiKey });
  }
  if (accessToken) {
    return new VybitAPIClient({ accessToken });
  }

  // Fall back to config file
  const config = loadConfig();
  if (config.apiKey) {
    return new VybitAPIClient({ apiKey: config.apiKey, ...(config.apiUrl && { baseUrl: config.apiUrl }) });
  }
  if (config.accessToken) {
    return new VybitAPIClient({ accessToken: config.accessToken, ...(config.apiUrl && { baseUrl: config.apiUrl }) });
  }

  outputError(
    { message: 'No credentials configured. Run "vybit auth setup --api-key <key>" or set VYBIT_API_KEY.' },
    2
  );
}
