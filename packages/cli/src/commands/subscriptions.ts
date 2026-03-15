import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputList, outputSuccess, outputError } from '../output';

export function registerSubscriptionsCommands(program: Command): void {
  const subs = program
    .command('subscriptions')
    .alias('subs')
    .description('Manage vybit subscriptions (follows)');

  subs
    .command('list')
    .description('List all vybits you are subscribed to')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listVybitFollows({
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  subs
    .command('get')
    .description('Get details about a subscription')
    .argument('<following-key>', 'Following key of the subscription')
    .action(async (followingKey, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getVybitFollow(followingKey);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  subs
    .command('create')
    .description('Subscribe to a public vybit')
    .argument('<subscription-key>', 'Subscription key of the public vybit')
    .action(async (subscriptionKey, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.createVybitFollow(subscriptionKey);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  subs
    .command('update')
    .description('Update a subscription (enable/disable, accept/decline invitation)')
    .argument('<following-key>', 'Following key of the subscription')
    .option('--status <status>', 'Enable or disable notifications (on/off)')
    .option('--access-status <status>', 'Accept or decline invitation (granted/declined)')
    .option('--message <text>', 'Custom notification message')
    .option('--image-url <url>', 'Custom image URL (must end in .jpg/.png/.gif)')
    .option('--link-url <url>', 'Custom link URL')
    .action(async (followingKey, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const params: any = {};
        if (opts.status) params.status = opts.status;
        if (opts.accessStatus) params.accessStatus = opts.accessStatus;
        if (opts.message !== undefined) params.message = opts.message;
        if (opts.imageUrl) params.imageUrl = opts.imageUrl;
        if (opts.linkUrl) params.linkUrl = opts.linkUrl;

        const result = await client.updateVybitFollow(followingKey, params);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  subs
    .command('delete')
    .description('Unsubscribe from a vybit')
    .argument('<following-key>', 'Following key of the subscription')
    .action(async (followingKey, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        await client.deleteVybitFollow(followingKey);
        outputSuccess('Unsubscribed', globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
