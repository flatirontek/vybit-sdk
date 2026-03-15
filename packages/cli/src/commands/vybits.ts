import { Command } from 'commander';
import { normalizeGeofence } from '@vybit/core';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputList, outputSuccess, outputError } from '../output';

export function registerVybitsCommands(program: Command): void {
  const vybits = program
    .command('vybits')
    .description('Manage vybits');

  vybits
    .command('list')
    .description('List vybits with optional search and pagination')
    .option('--search <query>', 'Search term to filter results')
    .option('--limit <n>', 'Maximum results to return', '50')
    .option('--offset <n>', 'Number of results to skip', '0')
    .action(async (opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listVybits({
          search: opts.search,
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        });
        outputList(Array.isArray(result) ? result : [result], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  vybits
    .command('get')
    .description('Get detailed information about a vybit')
    .argument('<key>', 'Vybit key')
    .action(async (key, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.getVybit(key);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  vybits
    .command('create')
    .description('Create a new vybit')
    .requiredOption('--name <name>', 'Vybit name')
    .option('--sound-key <key>', 'Sound key for notifications')
    .option('--status <status>', 'Vybit status (on/off)', 'on')
    .option('--trigger-type <type>', 'Trigger type (webhook/schedule/geofence/integration/reminders)', 'webhook')
    .option('--description <text>', 'Vybit description')
    .option('--access <access>', 'Visibility (public/private/unlisted)', 'private')
    .option('--message <text>', 'Default notification message')
    .option('--image-url <url>', 'Default image URL (must end in .jpg/.png/.gif)')
    .option('--link-url <url>', 'Default link URL')
    .option('--trigger-settings <json>', 'Trigger settings as JSON')
    .option('--geofence <json>', 'Geofence config as JSON')
    .option('--send-permissions <perm>', 'Send permissions (owner_subs/subs_owner/subs_group)')
    .action(async (opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const params: any = { name: opts.name };
        if (opts.soundKey) params.soundKey = opts.soundKey;
        if (opts.status) params.status = opts.status;
        if (opts.triggerType) params.triggerType = opts.triggerType;
        if (opts.description) params.description = opts.description;
        if (opts.access) params.access = opts.access;
        if (opts.message !== undefined) params.message = opts.message;
        if (opts.imageUrl) params.imageUrl = opts.imageUrl;
        if (opts.linkUrl) params.linkUrl = opts.linkUrl;
        if (opts.sendPermissions) params.sendPermissions = opts.sendPermissions;
        if (opts.triggerSettings) params.triggerSettings = JSON.parse(opts.triggerSettings);
        if (opts.geofence) params.geofence = normalizeGeofence(JSON.parse(opts.geofence));

        const result = await client.createVybit(params);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  vybits
    .command('update')
    .description('Update an existing vybit')
    .argument('<key>', 'Vybit key')
    .option('--name <name>', 'New name')
    .option('--sound-key <key>', 'New sound key')
    .option('--status <status>', 'Status (on/off)')
    .option('--trigger-type <type>', 'Trigger type')
    .option('--description <text>', 'New description')
    .option('--access <access>', 'Visibility (public/private/unlisted)')
    .option('--message <text>', 'Default notification message')
    .option('--image-url <url>', 'Default image URL (must end in .jpg/.png/.gif)')
    .option('--link-url <url>', 'Default link URL')
    .option('--trigger-settings <json>', 'Trigger settings as JSON')
    .option('--geofence <json>', 'Geofence config as JSON')
    .option('--send-permissions <perm>', 'Send permissions (owner_subs/subs_owner/subs_group)')
    .action(async (key, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const params: any = {};
        if (opts.name) params.name = opts.name;
        if (opts.soundKey) params.soundKey = opts.soundKey;
        if (opts.status) params.status = opts.status;
        if (opts.triggerType) params.triggerType = opts.triggerType;
        if (opts.description) params.description = opts.description;
        if (opts.access) params.access = opts.access;
        if (opts.message !== undefined) params.message = opts.message;
        if (opts.imageUrl) params.imageUrl = opts.imageUrl;
        if (opts.linkUrl) params.linkUrl = opts.linkUrl;
        if (opts.sendPermissions) params.sendPermissions = opts.sendPermissions;
        if (opts.triggerSettings) params.triggerSettings = JSON.parse(opts.triggerSettings);
        if (opts.geofence) params.geofence = normalizeGeofence(JSON.parse(opts.geofence));

        const result = await client.patchVybit(key, params);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  vybits
    .command('delete')
    .description('Delete a vybit')
    .argument('<key>', 'Vybit key')
    .action(async (key, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        await client.deleteVybit(key);
        outputSuccess('Vybit deleted', globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
