import { Command } from 'commander';
import { createClient, resolveGlobalOpts } from '../client';
import { output, outputList, outputSuccess, outputError } from '../output';

export function registerRemindersCommands(program: Command): void {
  const reminders = program
    .command('reminders')
    .description('Manage reminders on vybits');

  reminders
    .command('list')
    .description('List all reminders on a vybit')
    .argument('<vybit-key>', 'Vybit key')
    .action(async (vybitKey, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const result = await client.listReminders(vybitKey);
        const items = result.reminders ?? result;
        outputList(Array.isArray(items) ? items : [items], globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  reminders
    .command('create')
    .description('Create a reminder on a vybit (requires triggerType=reminders)')
    .argument('<vybit-key>', 'Vybit key')
    .requiredOption('--cron <expr>', 'Cron expression (5 fields: minute hour day month dayOfWeek)')
    .option('--time-zone <tz>', 'IANA timezone (e.g. America/New_York)')
    .option('--year <year>', 'Year for one-time reminders')
    .option('--message <text>', 'Notification message')
    .option('--image-url <url>', 'Image URL (must end in .jpg/.png/.gif)')
    .option('--link-url <url>', 'URL to open when notification is tapped')
    .option('--log <text>', 'Log content for the notification')
    .action(async (vybitKey, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const params: any = { cron: opts.cron };
        if (opts.timeZone) params.timeZone = opts.timeZone;
        if (opts.year) params.year = parseInt(opts.year);
        if (opts.message !== undefined) params.message = opts.message;
        if (opts.imageUrl) params.imageUrl = opts.imageUrl;
        if (opts.linkUrl) params.linkUrl = opts.linkUrl;
        if (opts.log) params.log = opts.log;

        const result = await client.createReminder(vybitKey, params);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  reminders
    .command('update')
    .description('Update an existing reminder')
    .argument('<vybit-key>', 'Vybit key')
    .argument('<reminder-id>', 'Reminder ID')
    .option('--cron <expr>', 'New cron expression')
    .option('--time-zone <tz>', 'New IANA timezone')
    .option('--message <text>', 'New notification message')
    .option('--image-url <url>', 'New image URL')
    .option('--link-url <url>', 'New link URL')
    .option('--log <text>', 'New log content')
    .action(async (vybitKey, reminderId, opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        const params: any = {};
        if (opts.cron) params.cron = opts.cron;
        if (opts.timeZone) params.timeZone = opts.timeZone;
        if (opts.message !== undefined) params.message = opts.message;
        if (opts.imageUrl !== undefined) params.imageUrl = opts.imageUrl;
        if (opts.linkUrl !== undefined) params.linkUrl = opts.linkUrl;
        if (opts.log !== undefined) params.log = opts.log;

        const result = await client.updateReminder(vybitKey, reminderId, params);
        output(result, globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });

  reminders
    .command('delete')
    .description('Delete a reminder from a vybit')
    .argument('<vybit-key>', 'Vybit key')
    .argument('<reminder-id>', 'Reminder ID')
    .action(async (vybitKey, reminderId, _opts, cmd) => {
      const globals = resolveGlobalOpts(cmd);
      try {
        const client = createClient(globals);
        await client.deleteReminder(vybitKey, reminderId);
        outputSuccess('Reminder deleted', globals.quiet);
      } catch (err) {
        outputError(err);
      }
    });
}
