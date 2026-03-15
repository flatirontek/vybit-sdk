import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputList, outputError } from '../output';

export function registerLogsCommands(program: Command): void {
  const logs = program
    .command('logs')
    .description('View notification logs');

  logs
    .command('list')
    .description('List all notification logs')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listLogs({
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  logs
    .command('get')
    .description('Get details about a specific log entry')
    .argument('<key>', 'Log entry key')
    .action(async (key, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getLog(key);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  logs
    .command('vybit')
    .description('List logs for a specific vybit you own')
    .argument('<vybit-key>', 'Vybit key')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (vybitKey, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listVybitLogs(vybitKey, {
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  logs
    .command('subscription')
    .description('List logs for a subscription')
    .argument('<following-key>', 'Following key of the subscription')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (followingKey, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listVybitFollowLogs(followingKey, {
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
