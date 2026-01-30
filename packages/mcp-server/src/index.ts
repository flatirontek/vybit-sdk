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

// Get API key and optional base URL from environment
const API_KEY = process.env.VYBIT_API_KEY;
const API_URL = process.env.VYBIT_API_URL;

if (!API_KEY) {
  console.error('Error: VYBIT_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Vybit API client
const vybitClient = new VybitAPIClient({
  apiKey: API_KEY,
  ...(API_URL && { baseUrl: API_URL })
});

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'vybit_list',
    description: 'List vybits with optional search and pagination. Returns a list of vybits owned by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter vybits by name',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of vybits to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of vybits to skip for pagination (default: 0)',
          default: 0,
        },
      },
    },
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
          enum: ['webhook', 'schedule', 'geofence', 'integration'],
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
          description: 'Default image URL for notifications',
        },
        linkUrl: {
          type: 'string',
          description: 'Default URL to open when notification is tapped',
        },
      },
      required: ['name'],
    },
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
        access: {
          type: 'string',
          description: 'Vybit visibility and access control',
          enum: ['public', 'private', 'unlisted'],
        },
        message: {
          type: 'string',
          description: 'Default message displayed with notifications',
        },
      },
      required: ['vybitId'],
    },
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
          description: 'Optional image URL to attach to the notification',
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
  },
  {
    name: 'sounds_list',
    description: 'List available sounds with optional search and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter sounds',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of sounds to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of sounds to skip for pagination (default: 0)',
          default: 0,
        },
      },
    },
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
  },
  {
    name: 'meter_get',
    description: 'Get current API usage and limits. Shows daily and monthly usage counts, caps, and tier information.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Public Vybit Discovery
  {
    name: 'vybits_browse_public',
    description: 'Browse public vybits available for subscription. Returns simplified PublicVybit objects.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter public vybits',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of vybits to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of vybits to skip for pagination (default: 0)',
          default: 0,
        },
      },
    },
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
  },
  {
    name: 'subscriptions_list',
    description: 'List all vybits you are subscribed to (following)',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter subscriptions',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of subscriptions to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of subscriptions to skip for pagination (default: 0)',
          default: 0,
        },
      },
    },
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
          description: 'Custom image URL (only if subscribers can send)',
        },
        linkUrl: {
          type: 'string',
          description: 'Custom link URL (only if subscribers can send)',
        },
      },
      required: ['followingKey'],
    },
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
  },

  // Logs
  {
    name: 'logs_list',
    description: 'List all notification logs with optional search and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter logs',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of logs to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of logs to skip for pagination (default: 0)',
          default: 0,
        },
      },
    },
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
        search: {
          type: 'string',
          description: 'Search term to filter logs',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of logs to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of logs to skip for pagination (default: 0)',
          default: 0,
        },
      },
      required: ['vybitKey'],
    },
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
        search: {
          type: 'string',
          description: 'Search term to filter logs',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of logs to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of logs to skip for pagination (default: 0)',
          default: 0,
        },
      },
      required: ['followingKey'],
    },
  },

  // Peeps (Access Control)
  {
    name: 'peeps_list',
    description: 'List all peeps (people you have shared vybits with)',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter peeps',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of peeps to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of peeps to skip for pagination (default: 0)',
          default: 0,
        },
      },
    },
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
        search: {
          type: 'string',
          description: 'Search term to filter peeps',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of peeps to return (default: 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of peeps to skip for pagination (default: 0)',
          default: 0,
        },
      },
      required: ['vybitKey'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'vybit-mcp-server',
    version: '1.0.0',
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
      case 'vybit_list': {
        const result = await vybitClient.listVybits({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'vybit_get': {
        const result = await vybitClient.getVybit(args.vybitId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

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

        const result = await vybitClient.createVybit(createData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'vybit_update': {
        const updateData: any = {};
        if (args.name) updateData.name = args.name;
        if (args.description) updateData.description = args.description;
        if (args.soundKey) updateData.soundKey = args.soundKey;
        if (args.status) updateData.status = args.status;
        if (args.access) updateData.access = args.access;
        if (args.message !== undefined) updateData.message = args.message;

        const result = await vybitClient.patchVybit(
          args.vybitId as string,
          updateData
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'vybit_delete': {
        await vybitClient.deleteVybit(args.vybitId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Vybit deleted successfully' }),
            },
          ],
        };
      }

      case 'vybit_trigger': {
        const options: any = {};
        if (args.message) options.message = args.message;
        if (args.imageUrl) options.imageUrl = args.imageUrl;
        if (args.linkUrl) options.linkUrl = args.linkUrl;
        if (args.log) options.log = args.log;

        const result = await vybitClient.triggerVybit(
          args.triggerKey as string,
          Object.keys(options).length > 0 ? options : undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'sounds_list': {
        const result = await vybitClient.searchSounds({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'sound_get': {
        const result = await vybitClient.getSound(args.soundKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'meter_get': {
        const result = await vybitClient.getMeter();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      // Public Vybit Discovery
      case 'vybits_browse_public': {
        const result = await vybitClient.listPublicVybits({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'vybit_get_public': {
        const result = await vybitClient.getPublicVybit(args.subscriptionKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      // Subscription Management
      case 'subscription_create': {
        const result = await vybitClient.createVybitFollow(
          args.subscriptionKey as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'subscriptions_list': {
        const result = await vybitClient.listVybitFollows({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'subscription_get': {
        const result = await vybitClient.getVybitFollow(args.followingKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'subscription_update': {
        const updateData: any = {};
        if (args.status) updateData.status = args.status;
        if (args.accessStatus) updateData.accessStatus = args.accessStatus;
        if (args.message !== undefined) updateData.message = args.message;
        if (args.imageUrl) updateData.imageUrl = args.imageUrl;
        if (args.linkUrl) updateData.linkUrl = args.linkUrl;

        const result = await vybitClient.updateVybitFollow(
          args.followingKey as string,
          updateData
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'subscription_delete': {
        await vybitClient.deleteVybitFollow(args.followingKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Unsubscribed successfully' }),
            },
          ],
        };
      }

      // Logs
      case 'logs_list': {
        const result = await vybitClient.listLogs({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'log_get': {
        const result = await vybitClient.getLog(args.logKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'vybit_logs': {
        const result = await vybitClient.listVybitLogs(args.vybitKey as string, {
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'subscription_logs': {
        const result = await vybitClient.listVybitFollowLogs(args.followingKey as string, {
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      // Peeps
      case 'peeps_list': {
        const result = await vybitClient.listPeeps({
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'peep_get': {
        const result = await vybitClient.getPeep(args.peepKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'peep_create': {
        const result = await vybitClient.createPeep(
          args.vybitKey as string,
          args.email as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'peep_delete': {
        await vybitClient.deletePeep(args.peepKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Peep removed successfully' }),
            },
          ],
        };
      }

      case 'vybit_peeps_list': {
        const result = await vybitClient.listVybitPeeps(args.vybitKey as string, {
          search: args.search as string | undefined,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

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
