import { Command } from 'commander';
import { loadConfig, saveConfig, clearConfig, getConfigFile } from '../config';
import { output, outputSuccess, outputError } from '../output';
import { resolveGlobalOpts } from '../client';

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage authentication credentials');

  auth
    .command('setup')
    .description('Store API key or access token in config file')
    .option('--api-key <key>', 'Vybit Developer API key')
    .option('--access-token <token>', 'OAuth2 access token')
    .option('--api-url <url>', 'Custom API base URL')
    .action((opts) => {
      if (!opts.apiKey && !opts.accessToken) {
        outputError({ message: 'Provide --api-key <key> or --access-token <token>' }, 2);
      }

      const config: Record<string, string> = {};
      if (opts.apiKey) config.apiKey = opts.apiKey;
      if (opts.accessToken) config.accessToken = opts.accessToken;
      if (opts.apiUrl) config.apiUrl = opts.apiUrl;

      saveConfig(config);

      const { quiet } = resolveGlobalOpts(auth);
      outputSuccess(`Credentials saved to ${getConfigFile()}`, quiet);
    });

  auth
    .command('status')
    .description('Show current authentication source and config file path')
    .action(() => {
      const { quiet } = resolveGlobalOpts(auth);
      const envKey = process.env.VYBIT_API_KEY;
      const envToken = process.env.VYBIT_ACCESS_TOKEN;
      const config = loadConfig();

      const info: Record<string, any> = {
        configFile: getConfigFile(),
        source: 'none',
      };

      if (envKey) {
        info.source = 'env:VYBIT_API_KEY';
        info.authType = 'apiKey';
        info.keyPrefix = envKey.substring(0, 8) + '...';
      } else if (envToken) {
        info.source = 'env:VYBIT_ACCESS_TOKEN';
        info.authType = 'accessToken';
      } else if (config.apiKey) {
        info.source = 'config';
        info.authType = 'apiKey';
        info.keyPrefix = config.apiKey.substring(0, 8) + '...';
      } else if (config.accessToken) {
        info.source = 'config';
        info.authType = 'accessToken';
      }

      output(info, quiet);
    });

  auth
    .command('logout')
    .description('Remove stored credentials from config file')
    .action(() => {
      const { quiet } = resolveGlobalOpts(auth);
      clearConfig();
      outputSuccess('Credentials removed', quiet);
    });
}
