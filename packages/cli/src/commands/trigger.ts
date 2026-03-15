import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputError } from '../output';

export function registerTriggerCommand(program: Command): void {
  program
    .command('trigger')
    .description('Trigger a vybit notification')
    .argument('<key>', 'Vybit key')
    .option('--message <text>', 'Notification message')
    .option('--image-url <url>', 'Image URL (must end in .jpg/.png/.gif)')
    .option('--link-url <url>', 'URL to open when notification is tapped')
    .option('--log <text>', 'Log entry to append')
    .option('--run-once', 'Auto-disable vybit after this trigger')
    .action(async (key, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const params: any = {};
        if (opts.message) params.message = opts.message;
        if (opts.imageUrl) params.imageUrl = opts.imageUrl;
        if (opts.linkUrl) params.linkUrl = opts.linkUrl;
        if (opts.log) params.log = opts.log;
        if (opts.runOnce) params.runOnce = true;

        const result = await client.triggerVybit(
          key,
          Object.keys(params).length > 0 ? params : undefined
        );
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
