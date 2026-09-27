#!/usr/bin/env node

import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth';
import { registerVybitsCommands } from './commands/vybits';
import { registerTriggerCommand } from './commands/trigger';
import { registerRemindersCommands } from './commands/reminders';
import { registerSoundsCommands } from './commands/sounds';
import { registerSubscriptionsCommands } from './commands/subscriptions';
import { registerBrowseCommands } from './commands/browse';
import { registerLogsCommands } from './commands/logs';
import { registerPeepsCommands } from './commands/peeps';
import { registerMeterCommand } from './commands/meter';

// Resolved at runtime from dist/ so --version always reports the published version
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

const program = new Command();

program
  .name('vybit')
  .version(version)
  .description('Vybit CLI — manage notifications from the command line')
  .option('-q, --quiet', 'Output only essential values (keys/IDs)')
  .option('--api-key <key>', 'API key (overrides env and config)')
  .option('--access-token <token>', 'OAuth2 access token (overrides env and config)');

// Register all command groups
registerAuthCommands(program);
registerVybitsCommands(program);
registerTriggerCommand(program);
registerRemindersCommands(program);
registerSoundsCommands(program);
registerSubscriptionsCommands(program);
registerBrowseCommands(program);
registerLogsCommands(program);
registerPeepsCommands(program);
registerMeterCommand(program);

program.parse();
