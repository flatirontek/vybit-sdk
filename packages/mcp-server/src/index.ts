#!/usr/bin/env node

/**
 * Vybit MCP Server
 *
 * Model Context Protocol server for the Vybit Developer API.
 * Provides tools for managing vybits, sounds, and monitoring usage.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { VybitAPIClient } from '@vybit/api-sdk';

// Get credentials and optional base URL from environment
const API_KEY = process.env.VYBIT_API_KEY;
const ACCESS_TOKEN = process.env.VYBIT_ACCESS_TOKEN;
const API_URL = process.env.VYBIT_API_URL;

if (!API_KEY && !ACCESS_TOKEN) {
  console.error('Error: VYBIT_API_KEY or VYBIT_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Vybit API client with API key or OAuth2 access token
const vybitClient = new VybitAPIClient({
  ...(API_KEY ? { apiKey: API_KEY } : { accessToken: ACCESS_TOKEN }),
  ...(API_URL && { baseUrl: API_URL })
});

// Shared schema fragments
const PAGINATION_SCHEMA = {
  search: {
    type: 'string',
    description: 'Search term to filter results',
  },
  limit: {
    type: 'number',
    description: 'Maximum number of results to return (default: 50)',
    default: 50,
  },
  offset: {
    type: 'number',
    description: 'Number of results to skip for pagination (default: 0)',
    default: 0,
  },
} as const;

const TRIGGER_SETTINGS_SCHEMA = {
  type: 'object',
  description: 'Configuration specific to the trigger type. For schedule triggers, contains crons array. Example: {"crons": [{"cron": "5 14 * * 0", "timeZone": "America/Denver"}]}. Cron format: minute hour day month dayOfWeek (0=Sunday).',
  properties: {
    crons: {
      type: 'array',
      description: 'Array of cron schedule definitions (for triggerType="schedule")',
      items: {
        type: 'object',
        properties: {
          cron: {
            type: 'string',
            description: 'Cron expression: minute hour day month dayOfWeek. Example: "0 9 * * *" = every day at 9:00 AM',
          },
          timeZone: {
            type: 'string',
            description: 'IANA timezone identifier. Example: "America/Denver"',
          },
        },
      },
    },
  },
} as const;

const GEOFENCE_SCHEMA = {
  type: 'object',
  description: 'Geofence configuration. Required when triggerType is "geofence", null otherwise.',
  properties: {
    lat: {
      type: 'number',
      description: 'Latitude of geofence center in decimal format',
    },
    lon: {
      type: 'number',
      description: 'Longitude of geofence center in decimal format',
    },
    radius: {
      type: 'number',
      description: 'Geofence radius value',
    },
    radiusUnits: {
      type: 'string',
      enum: ['meters', 'kilometers', 'miles'],
      description: 'Units for the radius measurement',
    },
    type: {
      type: 'string',
      enum: ['enter', 'exit'],
      description: 'Trigger on entry or exit from geofence',
    },
    timeThrottle: {
      type: 'string',
      description: 'Minimum seconds between triggers (default "0" = no throttle)',
    },
    subscribable: {
      type: 'string',
      enum: ['yes', 'no'],
      description: 'Whether others can subscribe to this geofenced vybit',
    },
  },
} as const;

// Apply defaults for geofence configuration
function normalizeGeofence(geofence: any): any {
  if (geofence.radius !== undefined && !geofence.displayRadius) {
    geofence.displayRadius = String(geofence.radius);
  }
  if (!geofence.subscribable) geofence.subscribable = 'yes';
  if (!geofence.timeThrottle) geofence.timeThrottle = '0';
  return geofence;
}

// Wrap a result as an MCP JSON text response
function jsonResponse(result: any) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result),
      },
    ],
  };
}

// Tool annotation constants
const READ_ONLY_ANNOTATIONS = { readOnlyHint: true } as const;
const MUTATING_ANNOTATIONS = { readOnlyHint: false, destructiveHint: true } as const;

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'vybit_list',
    description: 'List vybits with optional search and pagination. Returns a list of vybits owned by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: { ...PAGINATION_SCHEMA },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'vybit_get',
    description: 'Get detailed information about a specific vybit by ID',
    inputSchema: {
      type: 'object',
      properties: {
        vybitId: {
          type: 'string',
          description: 'The unique identifier of the vybit',
        },
      },
      required: ['vybitId'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'vybit_create',
    description: 'Create a new vybit notification',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the vybit',
        },
        soundKey: {
          type: 'string',
          description: 'Sound key to use for the notification (defaults to a system sound if not provided)',
        },
        status: {
          type: 'string',
          description: 'Vybit status (on = active, off = disabled, defaults to "on")',
          enum: ['on', 'off'],
        },
        triggerType: {
          type: 'string',
          description: 'Type of trigger (defaults to "webhook" if not provided)',
          enum: ['webhook', 'schedule', 'geofence', 'integration', 'reminders'],
        },
        description: {
          type: 'string',
          description: 'Detailed description of the vybit',
        },
        access: {
          type: 'string',
          description: 'Vybit visibility (defaults to "private")',
          enum: ['public', 'private', 'unlisted'],
        },
        message: {
          type: 'string',
          description: 'Default message displayed with notifications',
        },
        imageUrl: {
          type: 'string',
          description: 'Default image URL for notifications (must be a direct link to a JPG, PNG, or GIF image)',
        },
        linkUrl: {
          type: 'string',
          description: 'Default URL to open when notification is tapped',
        },
        triggerSettings: TRIGGER_SETTINGS_SCHEMA,
        geofence: GEOFENCE_SCHEMA,
      },
      required: ['name'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'vybit_update',
    description: 'Update an existing vybit',
    inputSchema: {
      type: 'object',
      properties: {
        vybitId: {
          type: 'string',
          description: 'The unique identifier of the vybit to update',
        },
        name: {
          type: 'string',
          description: 'New name for the vybit',
        },
        description: {
          type: 'string',
          description: 'New description for the vybit',
        },
        soundKey: {
          type: 'string',
          description: 'New sound key for the vybit',
        },
        status: {
          type: 'string',
          description: 'Vybit status (on = active, off = disabled)',
          enum: ['on', 'off'],
        },
        triggerType: {
          type: 'string',
          description: 'Type of trigger',
          enum: ['webhook', 'schedule', 'geofence', 'integration', 'reminders'],
        },
        access: {
          type: 'string',
          description: 'Vybit visibility and access control',
          enum: ['public', 'private', 'unlisted'],
        },
        message: {
          type: 'string',
          description: 'Default message displayed with notifications',
        },
        triggerSettings: TRIGGER_SETTINGS_SCHEMA,
        geofence: GEOFENCE_SCHEMA,
      },
      required: ['vybitId'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'vybit_delete',
    description: 'Delete a vybit',
    inputSchema: {
      type: 'object',
      properties: {
        vybitId: {
          type: 'string',
          description: 'The unique identifier of the vybit to delete',
        },
      },
      required: ['vybitId'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'vybit_trigger',
    description: 'Trigger a vybit notification using its vybit key',
    inputSchema: {
      type: 'object',
      properties: {
        triggerKey: {
          type: 'string',
          description: 'The vybit key (not the trigger key)',
        },
        message: {
          type: 'string',
          description: 'Optional message to include with the notification',
        },
        imageUrl: {
          type: 'string',
          description: 'Optional image URL to attach to the notification (must be a direct link to a JPG, PNG, or GIF image)',
        },
        runOnce: {
          type: 'boolean',
          description: 'If true, the vybit is automatically disabled after this trigger fires',
        },
        linkUrl: {
          type: 'string',
          description: 'Optional URL to open when notification is tapped',
        },
        log: {
          type: 'string',
          description: 'Optional log entry to append to the vybit log',
        },
      },
      required: ['triggerKey'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  // Reminders
  {
    name: 'reminder_create',
    description: 'Create a reminder on a vybit (the vybit must have triggerType=reminders). Each reminder gets its own cron schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        vybitKey: {
          type: 'string',
          description: 'The key of the vybit to add a reminder to',
        },
        cron: {
          type: 'string',
          description: 'Cron expression (5 fields): minute hour day month dayOfWeek. Example: "0 9 * * *" = every day at 9:00 AM',
        },
        timeZone: {
          type: 'string',
          description: 'IANA timezone identifier (defaults to UTC). Example: "America/Denver"',
        },
        year: {
          type: 'number',
          description: 'Year for the reminder (defaults to current year). Used for one-time reminders.',
        },
        message: {
          type: 'string',
          description: 'Notification message for this reminder (max 256 characters)',
        },
        imageUrl: {
          type: 'string',
          description: 'Image URL for the notification (must be a direct link to a JPG, PNG, or GIF image, max 512 characters)',
        },
        linkUrl: {
          type: 'string',
          description: 'URL to open when notification is tapped (max 512 characters, must be a valid URL)',
        },
        log: {
          type: 'string',
          description: 'Log content for the notification (max 1024 characters)',
        },
      },
      required: ['vybitKey', 'cron'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'reminder_list',
    description: 'List all reminders on a vybit',
    inputSchema: {
      type: 'object',
      properties: {
        vybitKey: {
          type: 'string',
          description: 'The key of the vybit',
        },
      },
      required: ['vybitKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'reminder_update',
    description: 'Update an existing reminder on a vybit',
    inputSchema: {
      type: 'object',
      properties: {
        vybitKey: {
          type: 'string',
          description: 'The key of the vybit',
        },
        reminderId: {
          type: 'string',
          description: 'The unique identifier of the reminder to update',
        },
        cron: {
          type: 'string',
          description: 'Cron expression (5 fields): minute hour day month dayOfWeek. Example: "0 9 * * *" = every day at 9:00 AM',
        },
        timeZone: {
          type: 'string',
          description: 'IANA timezone identifier. Example: "America/Denver"',
        },
        message: {
          type: 'string',
          description: 'Notification message for this reminder (max 256 characters)',
        },
        imageUrl: {
          type: 'string',
          description: 'Image URL for the notification (must be a direct link to a JPG, PNG, or GIF image, max 512 characters)',
        },
        linkUrl: {
          type: 'string',
          description: 'URL to open when notification is tapped (max 512 characters, must be a valid URL)',
        },
        log: {
          type: 'string',
          description: 'Log content for the notification (max 1024 characters)',
        },
      },
      required: ['vybitKey', 'reminderId'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'reminder_delete',
    description: 'Delete a reminder from a vybit',
    inputSchema: {
      type: 'object',
      properties: {
        vybitKey: {
          type: 'string',
          description: 'The key of the vybit',
        },
        reminderId: {
          type: 'string',
          description: 'The unique identifier of the reminder to delete',
        },
      },
      required: ['vybitKey', 'reminderId'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },

  {
    name: 'sounds_list',
    description: 'List available sounds with optional search and pagination',
    inputSchema: {
      type: 'object',
      properties: { ...PAGINATION_SCHEMA },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'sound_get',
    description: 'Get detailed information about a specific sound',
    inputSchema: {
      type: 'object',
      properties: {
        soundKey: {
          type: 'string',
          description: 'The unique key of the sound',
        },
      },
      required: ['soundKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'meter_get',
    description: 'Get current API usage and limits. Shows daily and monthly usage counts, caps, and tier information.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },

  // Public Vybit Discovery
  {
    name: 'vybits_browse_public',
    description: 'Browse public vybits available for subscription. Returns simplified PublicVybit objects.',
    inputSchema: {
      type: 'object',
      properties: { ...PAGINATION_SCHEMA },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'vybit_get_public',
    description: 'Get details about a public vybit by subscription key before subscribing',
    inputSchema: {
      type: 'object',
      properties: {
        subscriptionKey: {
          type: 'string',
          description: 'The subscription key of the public vybit',
        },
      },
      required: ['subscriptionKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },

  // Subscription Management
  {
    name: 'subscription_create',
    description: 'Subscribe to a public vybit using its subscription key',
    inputSchema: {
      type: 'object',
      properties: {
        subscriptionKey: {
          type: 'string',
          description: 'The subscription key of the vybit to subscribe to',
        },
      },
      required: ['subscriptionKey'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'subscriptions_list',
    description: 'List all vybits you are subscribed to (following)',
    inputSchema: {
      type: 'object',
      properties: { ...PAGINATION_SCHEMA },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'subscription_get',
    description: 'Get details about a specific subscription',
    inputSchema: {
      type: 'object',
      properties: {
        followingKey: {
          type: 'string',
          description: 'The unique followingKey of the subscription',
        },
      },
      required: ['followingKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'subscription_update',
    description: 'Update a subscription (enable/disable, update permissions)',
    inputSchema: {
      type: 'object',
      properties: {
        followingKey: {
          type: 'string',
          description: 'The unique followingKey of the subscription',
        },
        status: {
          type: 'string',
          description: 'Enable or disable notifications for this subscription',
          enum: ['on', 'off'],
        },
        accessStatus: {
          type: 'string',
          description: 'Accept or decline invitation (only when current status is invited)',
          enum: ['granted', 'declined'],
        },
        message: {
          type: 'string',
          description: 'Custom notification message (only if subscribers can send)',
        },
        imageUrl: {
          type: 'string',
          description: 'Custom image URL (must be a direct link to a JPG, PNG, or GIF image, only if subscribers can send)',
        },
        linkUrl: {
          type: 'string',
          description: 'Custom link URL (only if subscribers can send)',
        },
      },
      required: ['followingKey'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'subscription_delete',
    description: 'Unsubscribe from a vybit',
    inputSchema: {
      type: 'object',
      properties: {
        followingKey: {
          type: 'string',
          description: 'The unique followingKey of the subscription to delete',
        },
      },
      required: ['followingKey'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },

  // Logs
  {
    name: 'logs_list',
    description: 'List all notification logs with optional search and pagination',
    inputSchema: {
      type: 'object',
      properties: { ...PAGINATION_SCHEMA },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'log_get',
    description: 'Get details about a specific log entry',
    inputSchema: {
      type: 'object',
      properties: {
        logKey: {
          type: 'string',
          description: 'The unique key of the log entry',
        },
      },
      required: ['logKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'vybit_logs',
    description: 'List logs for a specific vybit you own',
    inputSchema: {
      type: 'object',
      properties: {
        vybitKey: {
          type: 'string',
          description: 'The key of the vybit',
        },
        ...PAGINATION_SCHEMA,
      },
      required: ['vybitKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'subscription_logs',
    description: 'List logs for a specific subscription',
    inputSchema: {
      type: 'object',
      properties: {
        followingKey: {
          type: 'string',
          description: 'The followingKey of the subscription',
        },
        ...PAGINATION_SCHEMA,
      },
      required: ['followingKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },

  // Peeps (Access Control)
  {
    name: 'peeps_list',
    description: 'List all peeps (people you have shared vybits with)',
    inputSchema: {
      type: 'object',
      properties: { ...PAGINATION_SCHEMA },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'peep_get',
    description: 'Get details about a specific peep',
    inputSchema: {
      type: 'object',
      properties: {
        peepKey: {
          type: 'string',
          description: 'The unique key of the peep',
        },
      },
      required: ['peepKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'peep_create',
    description: 'Invite someone to a private vybit by email',
    inputSchema: {
      type: 'object',
      properties: {
        vybitKey: {
          type: 'string',
          description: 'The key of the vybit to share',
        },
        email: {
          type: 'string',
          description: 'Email address of the person to invite',
        },
      },
      required: ['vybitKey', 'email'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'peep_delete',
    description: 'Remove a peep (revoke access)',
    inputSchema: {
      type: 'object',
      properties: {
        peepKey: {
          type: 'string',
          description: 'The unique key of the peep to delete',
        },
      },
      required: ['peepKey'],
    },
    annotations: MUTATING_ANNOTATIONS,
  },
  {
    name: 'vybit_peeps_list',
    description: 'List all peeps for a specific vybit',
    inputSchema: {
      type: 'object',
      properties: {
        vybitKey: {
          type: 'string',
          description: 'The key of the vybit',
        },
        ...PAGINATION_SCHEMA,
      },
      required: ['vybitKey'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
];

// Vybit logo (64x64 PNG, base64-encoded)
const VYBIT_ICON = 'data:image/png;base64,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';

// Create MCP server
const server = new Server(
  {
    name: 'vybit-mcp-server',
    version: '1.2.5',
    icons: [
      {
        src: VYBIT_ICON,
        mimeType: 'image/png',
        sizes: ['64x64'],
      },
    ],
    websiteUrl: 'https://developer.vybit.net',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Missing arguments',
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'vybit_list':
        return jsonResponse(await vybitClient.listVybits({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      case 'vybit_get':
        return jsonResponse(await vybitClient.getVybit(args.vybitId as string));

      case 'vybit_create': {
        const createData: any = {
          name: args.name as string,
        };
        if (args.description) createData.description = args.description;
        if (args.soundKey) createData.soundKey = args.soundKey;
        if (args.status) createData.status = args.status;
        if (args.triggerType) createData.triggerType = args.triggerType;
        if (args.access) createData.access = args.access;
        if (args.message !== undefined) createData.message = args.message;
        if (args.imageUrl) createData.imageUrl = args.imageUrl;
        if (args.linkUrl) createData.linkUrl = args.linkUrl;
        if (args.triggerSettings) createData.triggerSettings = args.triggerSettings;
        if (args.geofence) createData.geofence = normalizeGeofence(args.geofence);

        return jsonResponse(await vybitClient.createVybit(createData));
      }

      case 'vybit_update': {
        const updateData: any = {};
        if (args.name) updateData.name = args.name;
        if (args.description) updateData.description = args.description;
        if (args.soundKey) updateData.soundKey = args.soundKey;
        if (args.status) updateData.status = args.status;
        if (args.triggerType) updateData.triggerType = args.triggerType;
        if (args.access) updateData.access = args.access;
        if (args.message !== undefined) updateData.message = args.message;
        if (args.triggerSettings) updateData.triggerSettings = args.triggerSettings;
        if (args.geofence) updateData.geofence = normalizeGeofence(args.geofence);

        return jsonResponse(await vybitClient.patchVybit(
          args.vybitId as string,
          updateData
        ));
      }

      case 'vybit_delete':
        await vybitClient.deleteVybit(args.vybitId as string);
        return jsonResponse({ success: true, message: 'Vybit deleted successfully' });

      case 'vybit_trigger': {
        const options: any = {};
        if (args.message) options.message = args.message;
        if (args.imageUrl) options.imageUrl = args.imageUrl;
        if (args.linkUrl) options.linkUrl = args.linkUrl;
        if (args.log) options.log = args.log;
        if (args.runOnce !== undefined) options.runOnce = args.runOnce;

        return jsonResponse(await vybitClient.triggerVybit(
          args.triggerKey as string,
          Object.keys(options).length > 0 ? options : undefined
        ));
      }

      // Reminders
      case 'reminder_create': {
        const params: any = {
          cron: args.cron as string,
        };
        if (args.timeZone) params.timeZone = args.timeZone;
        if (args.year !== undefined) params.year = args.year;
        if (args.message !== undefined) params.message = args.message;
        if (args.imageUrl) params.imageUrl = args.imageUrl;
        if (args.linkUrl) params.linkUrl = args.linkUrl;
        if (args.log) params.log = args.log;

        return jsonResponse(await vybitClient.createReminder(
          args.vybitKey as string,
          params
        ));
      }

      case 'reminder_list':
        return jsonResponse(await vybitClient.listReminders(args.vybitKey as string));

      case 'reminder_update': {
        const params: any = {};
        if (args.cron) params.cron = args.cron;
        if (args.timeZone) params.timeZone = args.timeZone;
        if (args.message !== undefined) params.message = args.message;
        if (args.imageUrl !== undefined) params.imageUrl = args.imageUrl;
        if (args.linkUrl !== undefined) params.linkUrl = args.linkUrl;
        if (args.log !== undefined) params.log = args.log;

        return jsonResponse(await vybitClient.updateReminder(
          args.vybitKey as string,
          args.reminderId as string,
          params
        ));
      }

      case 'reminder_delete':
        await vybitClient.deleteReminder(
          args.vybitKey as string,
          args.reminderId as string
        );
        return jsonResponse({ success: true, message: 'Reminder deleted successfully' });

      case 'sounds_list':
        return jsonResponse(await vybitClient.searchSounds({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      case 'sound_get':
        return jsonResponse(await vybitClient.getSound(args.soundKey as string));

      case 'meter_get':
        return jsonResponse(await vybitClient.getMeter());

      // Public Vybit Discovery
      case 'vybits_browse_public':
        return jsonResponse(await vybitClient.listPublicVybits({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      case 'vybit_get_public':
        return jsonResponse(await vybitClient.getPublicVybit(args.subscriptionKey as string));

      // Subscription Management
      case 'subscription_create':
        return jsonResponse(await vybitClient.createVybitFollow(
          args.subscriptionKey as string
        ));

      case 'subscriptions_list':
        return jsonResponse(await vybitClient.listVybitFollows({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      case 'subscription_get':
        return jsonResponse(await vybitClient.getVybitFollow(args.followingKey as string));

      case 'subscription_update': {
        const updateData: any = {};
        if (args.status) updateData.status = args.status;
        if (args.accessStatus) updateData.accessStatus = args.accessStatus;
        if (args.message !== undefined) updateData.message = args.message;
        if (args.imageUrl) updateData.imageUrl = args.imageUrl;
        if (args.linkUrl) updateData.linkUrl = args.linkUrl;

        return jsonResponse(await vybitClient.updateVybitFollow(
          args.followingKey as string,
          updateData
        ));
      }

      case 'subscription_delete':
        await vybitClient.deleteVybitFollow(args.followingKey as string);
        return jsonResponse({ success: true, message: 'Unsubscribed successfully' });

      // Logs
      case 'logs_list':
        return jsonResponse(await vybitClient.listLogs({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      case 'log_get':
        return jsonResponse(await vybitClient.getLog(args.logKey as string));

      case 'vybit_logs':
        return jsonResponse(await vybitClient.listVybitLogs(args.vybitKey as string, {
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      case 'subscription_logs':
        return jsonResponse(await vybitClient.listVybitFollowLogs(args.followingKey as string, {
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      // Peeps
      case 'peeps_list':
        return jsonResponse(await vybitClient.listPeeps({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      case 'peep_get':
        return jsonResponse(await vybitClient.getPeep(args.peepKey as string));

      case 'peep_create':
        return jsonResponse(await vybitClient.createPeep(
          args.vybitKey as string,
          args.email as string
        ));

      case 'peep_delete':
        await vybitClient.deletePeep(args.peepKey as string);
        return jsonResponse({ success: true, message: 'Peep removed successfully' });

      case 'vybit_peeps_list':
        return jsonResponse(await vybitClient.listVybitPeeps(args.vybitKey as string, {
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        }));

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode ? ` (Status: ${error.statusCode})` : '';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}${statusCode}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vybit MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
