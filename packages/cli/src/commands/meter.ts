import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputError } from '../output';

export function registerMeterCommand(program: Command): void {
  program
    .command('meter')
    .description('Get API usage metrics and tier limits')
    .action(async (_opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getMeter();
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  program
    .command('status')
    .description('Check API health status')
    .action(async (_opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getStatus();
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  program
    .command('profile')
    .description('Get user profile information')
    .action(async (_opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getProfile();
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
