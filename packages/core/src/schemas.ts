/**
 * Shared JSON Schema fragments used by MCP server and CLI.
 * These define parameter shapes for Vybit API operations.
 */

export const PAGINATION_SCHEMA = {
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

export const TRIGGER_SETTINGS_SCHEMA = {
  type: 'object',
  description: 'Configuration specific to the trigger type. For schedule: a crons array of recurring patterns, e.g. {"crons": [{"cron": "45 16 * * 1-5", "timeZone": "America/Denver"}]} for weekdays at 4:45 PM. For reminders: leave it empty and add each dated entry with reminder_create. Cron format: minute hour day month dayOfWeek (0=Sunday).',
  properties: {
    crons: {
      type: 'array',
      description: 'Recurring cron patterns for triggerType="schedule"',
      items: {
        type: 'object',
        properties: {
          cron: {
            type: 'string',
            description: 'Cron expression (5 fields): minute hour day month dayOfWeek. Uses 24-hour time. Examples: "0 7 * * *" = 7:00 AM, "0 19 * * *" = 7:00 PM, "30 14 25 12 *" = 2:30 PM on Dec 25',
          },
          timeZone: {
            type: 'string',
            description: 'IANA timezone identifier. Defaults to UTC if omitted — always set this to the user\'s local timezone. Examples: "America/New_York", "America/Denver", "America/Los_Angeles", "Europe/London"',
          },
        },
      },
    },
  },
} as const;

export const GEOFENCE_SCHEMA = {
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
      description: 'yes indicates that the geofence will be set on the subscriber\'s device. no indicates that subscribers will receive notifications when the vybit owner triggers the geofence',
    },
  },
} as const;
