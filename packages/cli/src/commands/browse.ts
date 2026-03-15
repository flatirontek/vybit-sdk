import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputList, outputError } from '../output';

export function registerBrowseCommands(program: Command): void {
  const browse = program
    .command('browse')
    .description('Browse and discover public vybits');

  browse
    .command('list')
    .description('Browse public vybits available for subscription')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listPublicVybits({
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  browse
    .command('get')
    .description('Get details about a public vybit before subscribing')
    .argument('<subscription-key>', 'Subscription key of the public vybit')
    .action(async (subscriptionKey, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getPublicVybit(subscriptionKey);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
