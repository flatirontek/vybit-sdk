import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputList, outputError } from '../output';

export function registerSoundsCommands(program: Command): void {
  const sounds = program
    .command('sounds')
    .description('Search and view sounds');

  sounds
    .command('list')
    .description('List available sounds with optional search')
    .option('--search <query>', 'Search term to filter sounds')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.searchSounds({
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  sounds
    .command('get')
    .description('Get detailed information about a sound')
    .argument('<key>', 'Sound key')
    .action(async (key, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getSound(key);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
