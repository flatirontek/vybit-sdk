/**
 * MCP outputSchema definitions for Vybit Developer API responses, kept in sync
 * by hand with components.schemas in docs/openapi/developer-api.yaml. MCP
 * clients reject a tool result that fails its outputSchema, so these stay
 * tolerant of API drift:
 *
 * - `required` lists only fields that are always present.
 * - additionalProperties is never restricted, so new API fields are accepted.
 * - Enumerated values and formats (uri, date-time) are documented in
 *   descriptions rather than enforced with `enum` or `format`.
 * - Nullable fields use a type union with "null" (JSON Schema has no
 *   OpenAPI-style `nullable` keyword).
 */

/**
 * A JSON Schema whose root is an object, as MCP requires for outputSchema.
 */
export interface ObjectOutputSchema {
  type: 'object';
  description?: string;
  properties: Record<string, object>;
  required?: string[];
  [keyword: string]: unknown;
}

const nullable = (type: string): string[] => [type, 'null'];

const TIMESTAMP_FIELDS = {
  createdAt: {
    type: nullable('string'),
    description: 'When the record was created (ISO 8601 date-time)',
  },
  updatedAt: {
    type: nullable('string'),
    description: 'When the record was last updated (ISO 8601 date-time)',
  },
} as const;

export const REMINDER_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'A one-off scheduled reminder on a vybit',
  properties: {
    id: { type: 'string', description: 'Unique reminder identifier (12-char hex)' },
    cron: {
      type: 'string',
      description: 'Cron expression for when the reminder fires (minute hour day month dayOfWeek)',
    },
    timeZone: { type: 'string', description: 'IANA timezone identifier' },
    year: {
      type: ['number', 'string', 'null'],
      description: 'Year the reminder fires in (a number for reminders created through the reminder endpoints)',
    },
    message: { type: nullable('string'), description: 'Notification message sent when the reminder fires' },
    imageUrl: { type: nullable('string'), description: 'Image URL for the reminder notification' },
    linkUrl: { type: nullable('string'), description: 'Link URL for the reminder notification' },
    log: { type: nullable('string'), description: 'Log content for the reminder notification' },
  },
};

const GEOFENCE_OUTPUT_PROPERTY = {
  type: nullable('object'),
  description: 'Geofence configuration (set when triggerType is "geofence", otherwise null)',
  properties: {
    id: { type: 'string', description: 'Unique identifier for the geofence' },
    lat: { type: ['number', 'string'], description: 'Latitude of geofence center' },
    lon: { type: ['number', 'string'], description: 'Longitude of geofence center' },
    radius: { type: ['number', 'string'], description: 'Geofence radius value' },
    radiusUnits: { type: 'string', description: 'Units for the radius: meters, kilometers, or miles' },
    displayRadius: { type: ['string', 'number'], description: 'Formatted radius for display' },
    type: { type: 'string', description: 'Trigger on "enter" or "exit" of the geofence' },
    timeThrottle: {
      type: ['string', 'number'],
      description: 'Minimum seconds between triggers ("0" = no throttle)',
    },
    subscribable: {
      type: 'string',
      description: '"yes" if the geofence is set on subscriber devices, "no" if only the owner triggers it',
    },
  },
} as const;

// Stored as free-form JSON, so the root type is left open; the documented
// properties only apply when the value is an object.
const TRIGGER_SETTINGS_OUTPUT_PROPERTY = {
  description:
    'Configuration specific to the trigger type: an object with crons (schedule) or reminders (reminders), otherwise usually null',
  properties: {
    crons: {
      type: 'array',
      description: 'Cron schedule definitions (triggerType "schedule")',
      items: {
        type: 'object',
        properties: {
          cron: { type: 'string', description: 'Cron expression (minute hour day month dayOfWeek)' },
          timeZone: { type: 'string', description: 'IANA timezone for the cron schedule' },
        },
      },
    },
    reminders: {
      type: 'array',
      description: 'One-off scheduled reminders (triggerType "reminders")',
      items: REMINDER_OUTPUT_SCHEMA,
    },
  },
} as const;

export const VYBIT_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'A vybit (notification endpoint) owned by the authenticated user',
  properties: {
    key: { type: 'string', description: 'Unique vybit identifier' },
    name: { type: 'string', description: 'Vybit display name' },
    description: { type: nullable('string'), description: 'Detailed vybit description' },
    soundKey: { type: nullable('string'), description: 'Key of the sound to play' },
    status: { type: 'string', description: 'Vybit status: "on" (active) or "off" (disabled)' },
    triggerKey: { type: 'string', description: 'Unique key for triggering this vybit via webhook' },
    subscriptionKey: { type: 'string', description: 'Unique key for subscribing to this vybit' },
    triggerType: {
      type: 'string',
      description: 'How this vybit is triggered: webhook, schedule, geofence, integration, or reminders',
    },
    triggerSettings: TRIGGER_SETTINGS_OUTPUT_PROPERTY,
    access: { type: nullable('string'), description: 'Visibility and access control: public, private, or unlisted' },
    message: { type: nullable('string'), description: 'Default message displayed with notifications' },
    imageUrl: { type: nullable('string'), description: 'Default image URL for notifications' },
    linkUrl: { type: nullable('string'), description: 'Default URL to open when a notification is tapped' },
    geofence: GEOFENCE_OUTPUT_PROPERTY,
    numberFollowers: { type: 'integer', description: 'Count of users subscribed to this vybit' },
    sendPermissions: {
      type: 'string',
      description: 'Who can trigger this vybit: owner_subs, subs_owner, or subs_group',
    },
    ...TIMESTAMP_FIELDS,
  },
  required: ['key'],
};

export const PUBLIC_VYBIT_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'A public vybit available for subscription',
  properties: {
    key: { type: 'string', description: 'Subscription key for this public vybit' },
    name: { type: 'string', description: 'Vybit display name' },
    description: { type: nullable('string'), description: 'Detailed vybit description' },
    soundKey: { type: nullable('string'), description: 'Key of the sound to play' },
    soundType: { type: nullable('string'), description: 'Type of sound file' },
    imageUrl: { type: nullable('string'), description: 'Default image URL for notifications' },
    linkUrl: { type: nullable('string'), description: 'Default URL to open when a notification is tapped' },
    ownerName: { type: nullable('string'), description: 'Name of the vybit owner' },
    following: { type: 'boolean', description: 'Whether the authenticated user is following this vybit' },
    ...TIMESTAMP_FIELDS,
  },
  required: ['key'],
};

export const SUBSCRIPTION_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'A subscription (follow) to a vybit',
  properties: {
    followingKey: { type: 'string', description: 'Unique subscription identifier' },
    vybName: { type: 'string', description: 'Name of the vybit being followed' },
    description: { type: nullable('string'), description: 'Description of the vybit' },
    soundKey: { type: nullable('string'), description: 'Sound key for this vybit' },
    soundType: { type: nullable('string'), description: 'Type of sound file' },
    ownerName: { type: nullable('string'), description: 'Name of the vybit owner' },
    status: { type: 'string', description: 'Subscription status: "on" (active) or "off" (disabled)' },
    accessStatus: {
      type: nullable('string'),
      description: 'Access status: denied, public, invited (not yet accepted), or granted',
    },
    subscriptionKey: { type: 'string', description: 'Subscription key used to create this follow' },
    access: { type: nullable('string'), description: 'Access level of the vybit: public, private, or unlisted' },
    geofence: GEOFENCE_OUTPUT_PROPERTY,
    message: { type: nullable('string'), description: 'Default message for this vybit' },
    imageUrl: { type: nullable('string'), description: 'Default image URL' },
    linkUrl: { type: nullable('string'), description: 'Default link URL' },
    sendPermissions: {
      type: 'string',
      description: 'Send permissions for this vybit: owner_subs, subs_owner, or subs_group',
    },
    ...TIMESTAMP_FIELDS,
  },
  required: ['followingKey'],
};

export const SOUND_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'A sound that can be used for vybit notifications',
  properties: {
    key: { type: 'string', description: 'Unique sound identifier' },
    name: { type: 'string', description: 'Sound name' },
    description: { type: nullable('string'), description: 'Sound description' },
    type: { type: nullable('string'), description: 'Audio file type' },
    status: { type: 'string', description: 'Sound status' },
    proxyUrl: { type: 'string', description: 'URL to play or download the sound via the Vybit proxy' },
    vybitKey: { type: nullable('string'), description: 'Key of the first vybit using this sound (null if unused)' },
    meta: { description: 'Additional metadata about the sound (license, attribution, etc.), or null' },
    ...TIMESTAMP_FIELDS,
  },
  required: ['key'],
};

export const LOG_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'A notification log entry',
  properties: {
    key: { type: 'string', description: 'Unique log entry identifier' },
    vybKey: { type: nullable('string'), description: 'Key of the triggered vybit (null if the user does not own it)' },
    vybName: { type: nullable('string'), description: 'Name of the vybit' },
    vybDescription: { type: nullable('string'), description: 'Description of the vybit' },
    soundKey: { type: nullable('string'), description: 'Key of the sound that was played' },
    vybfollowKey: { type: nullable('string'), description: 'Key of the subscription (null if owner-triggered)' },
    ownerName: { type: nullable('string'), description: 'Name of the user who owns or received the notification' },
    senderName: { type: nullable('string'), description: 'Name of the user who sent or triggered the notification' },
    notification: { type: nullable('string'), description: 'The notification message that was displayed' },
    log: { type: nullable('string'), description: 'Custom log message' },
    imageUrl: { type: nullable('string'), description: 'Custom image URL included in the notification' },
    linkUrl: { type: nullable('string'), description: 'Custom link URL included in the notification' },
    createdAt: TIMESTAMP_FIELDS.createdAt,
  },
  required: ['key'],
};

export const PEEP_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'A peep: a person invited to or subscribed to one of your vybits',
  properties: {
    key: { type: 'string', description: 'Unique peep identifier' },
    vybKey: { type: 'string', description: 'Key of the vybit this person is subscribed to' },
    name: { type: nullable('string'), description: 'Name of the subscriber' },
    accessStatus: {
      type: nullable('string'),
      description: 'Access status: denied, public, invited (not yet accepted), or granted',
    },
    ...TIMESTAMP_FIELDS,
  },
  required: ['key'],
};

export const METER_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'Current usage counts and tier limits',
  properties: {
    tier_id: { type: 'integer', description: 'Current subscription tier ID' },
    tier: { type: nullable('string'), description: 'Subscription tier name (Free, Bronze, Silver, Gold, Pro, Team, Business)' },
    cap_vybits: { type: 'integer', description: 'Maximum vybits allowed for this tier' },
    cap_daily: { type: 'integer', description: 'Maximum daily notifications for this tier' },
    cap_monthly: { type: 'integer', description: 'Maximum monthly notifications for this tier' },
    number_vybits: { type: 'integer', description: 'Current number of vybits created' },
    count_daily: { type: 'integer', description: 'Notifications triggered today' },
    count_monthly: { type: 'integer', description: 'Notifications triggered this month' },
    monthly_reset_dts: { type: nullable('string'), description: 'When the monthly count resets (ISO 8601 date-time)' },
  },
};

export const PROFILE_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'The authenticated user profile',
  properties: {
    key: { type: 'string', description: 'Unique user identifier' },
    name: { type: 'string', description: "User's display name" },
    email: { type: 'string', description: "User's email address" },
    tier_id: { type: 'integer', description: 'Subscription tier ID' },
    tier: { type: nullable('string'), description: 'Subscription tier name (Free, Bronze, Silver, Gold, Pro, Team, Business)' },
  },
};

const RESULT_CODE = { type: 'integer', description: 'Result code (1 = success, 0 = not performed)' } as const;

export const DELETE_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'Confirmation that a resource was deleted',
  properties: {
    success: { type: 'boolean', description: 'True when the delete succeeded' },
    result: RESULT_CODE,
    message: { type: 'string', description: 'Human-readable confirmation message' },
  },
};

export const TRIGGER_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'Result of triggering a notification',
  properties: {
    result: RESULT_CODE,
    plk: { type: 'string', description: 'Primary log key for the triggered notification' },
    warn: { type: 'string', description: 'Warning when the notification was not sent (for example, the vybit is off)' },
  },
};

export const REMINDER_RESULT_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'The created or updated reminder',
  properties: {
    result: RESULT_CODE,
    reminder: REMINDER_OUTPUT_SCHEMA,
  },
};

export const REMINDER_LIST_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'Reminders on a vybit',
  properties: {
    result: RESULT_CODE,
    reminders: { type: 'array', description: 'Reminders on the vybit', items: REMINDER_OUTPUT_SCHEMA },
  },
};

export const SUBSCRIPTION_CREATE_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'Result of subscribing to a vybit',
  properties: {
    result: RESULT_CODE,
    message: { type: 'string', description: 'Human-readable result message' },
    key: { type: 'string', description: 'Key (followingKey) of the new subscription, when one was created' },
    logKey: { type: 'string', description: 'Key of the log entry recording the subscription, when one was created' },
    followingKey: { type: 'string', description: 'Key of the new subscription (alternate field name)' },
  },
};

export const PEEP_CREATE_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'Result of inviting a person to a vybit',
  properties: {
    result: RESULT_CODE,
    message: { type: 'string', description: 'Human-readable result message' },
    key: { type: 'string', description: 'Key of the new peep' },
    logKey: { type: 'string', description: 'Key of the log entry recording the invitation' },
  },
};

export const CURRENT_TIME_OUTPUT_SCHEMA: ObjectOutputSchema = {
  type: 'object',
  description: 'The current time',
  properties: {
    utc: { type: 'string', description: 'Current time in UTC (ISO 8601)' },
    local: { type: 'string', description: 'Current time formatted in the server locale and timezone' },
    timeZone: { type: 'string', description: 'IANA timezone of the server' },
  },
};

/**
 * outputSchema for a list tool: the array is wrapped as { items } because MCP
 * structuredContent must be a JSON object (jsonResponse in @vybit/mcp-server
 * does the wrapping).
 */
export function listOutputSchema(itemSchema: object): ObjectOutputSchema {
  return {
    type: 'object',
    properties: {
      items: { type: 'array', items: itemSchema },
    },
    required: ['items'],
  };
}
