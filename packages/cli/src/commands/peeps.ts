import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputList, outputSuccess, outputError } from '../output';

export function registerPeepsCommands(program: Command): void {
  const peeps = program
    .command('peeps')
    .description('Manage peeps (access control / invitations)');

  peeps
    .command('list')
    .description('List all peeps across your vybits')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listPeeps({
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  peeps
    .command('get')
    .description('Get details about a specific peep')
    .argument('<key>', 'Peep key')
    .action(async (key, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getPeep(key);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  peeps
    .command('create')
    .description('Invite someone to subscribe to your vybit')
    .argument('<vybit-key>', 'Vybit key to share')
    .requiredOption('--email <email>', 'Email address of the person to invite')
    .action(async (vybitKey, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.createPeep(vybitKey, opts.email);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  peeps
    .command('delete')
    .description('Revoke subscription access for a peep')
    .argument('<key>', 'Peep key')
    .action(async (key, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        await client.deletePeep(key);
        outputSuccess('Peep removed', globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  peeps
    .command('vybit')
    .description('List peeps for a specific vybit')
    .argument('<vybit-key>', 'Vybit key')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (vybitKey, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listVybitPeeps(vybitKey, {
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
