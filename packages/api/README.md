# @vybit/api-sdk

✅ Developer API SDK for programmatic access to the Vybit notification platform.

## Overview

The **@vybit/api-sdk** provides a complete TypeScript/JavaScript SDK for the Vybit Developer API, enabling you to build custom integrations, automation workflows, and notification management tools.

Use this SDK to:
- **Trigger notifications** - send push notifications with custom messages, images, and links
- Manage vybits (notifications) - create, update, delete
- Manage scheduled reminders on vybits
- Handle vybit subscriptions (follows)
- Search and manage sounds
- Retrieve notification logs
- Manage access permissions (peeps)
- Monitor API usage and metrics

## Installation

```bash
npm install @vybit/api-sdk
```

## Quick Start

### 1. Get Your Credentials

**Option A: API Key** (for server-to-server integrations)
1. Create a [Vybit developer account](https://developer.vybit.net)
2. Generate an API key from your developer dashboard

**Option B: OAuth2 Access Token** (for user-facing apps)
1. Use `@vybit/oauth2-sdk` to complete the OAuth2 authorization flow
2. Use the resulting access token with this SDK

### 2. Initialize the Client

```typescript
import { VybitAPIClient } from '@vybit/api-sdk';

// With API key
const client = new VybitAPIClient({
  apiKey: process.env.VYBIT_API_KEY
});

// Or with OAuth2 access token
const client = new VybitAPIClient({
  accessToken: 'token-from-oauth2-flow'
});

// Or use environment variables (VYBIT_API_KEY or VYBIT_ACCESS_TOKEN)
const client = new VybitAPIClient();
```

### 3. Make API Calls

```typescript
// Check API status
const status = await client.getStatus();
console.log('API Status:', status.status);

// Get your profile
const profile = await client.getProfile();
console.log('Account:', profile.name, profile.email);

// List your vybits
const vybits = await client.listVybits({ limit: 10 });
console.log(`You have ${vybits.length} vybits`);

// Create a new vybit (only name is required)
const vybit = await client.createVybit({
  name: 'Server Alert',
  description: 'Notifications for server errors',
  soundKey: 'sound123abc',  // Optional - defaults to system sound
  triggerType: 'webhook',     // Optional - defaults to 'webhook'
  access: 'private'           // Optional - defaults to 'private'
});
console.log('Created vybit:', vybit.key);

// Search for sounds
const sounds = await client.searchSounds({ search: 'notification', limit: 5 });
sounds.forEach(sound => {
  console.log(`${sound.name} - ${sound.key}`);
});
```

## Core Features

### Vybit Management

```typescript
// List vybits with pagination and search
const vybits = await client.listVybits({
  offset: 0,
  limit: 20,
  search: 'alert'
});

// Get specific vybit
const vybit = await client.getVybit('vybit123abc');

// Update vybit
await client.updateVybit('vybit123abc', {
  name: 'Updated Alert Name',
  status: 'on'
});

// Delete vybit
await client.deleteVybit('vybit123abc');
```

### Triggering Notifications

```typescript
// Simple trigger — sends notification with the vybit's default sound
await client.triggerVybit('vybit123abc');

// Trigger with a custom message
await client.triggerVybit('vybit123abc', {
  message: 'Build completed successfully!'
});

// Trigger with image and link
await client.triggerVybit('vybit123abc', {
  message: 'New order received!',
  imageUrl: 'https://example.com/order-icon.png',  // Must be a direct link to a JPG, PNG, or GIF
  linkUrl: 'https://yourapp.com/orders/12345'
});

// Trigger with a log entry (viewable in notification history)
await client.triggerVybit('vybit123abc', {
  message: 'Server CPU at 95%',
  log: 'alert-cpu-spike'
});

// One-time trigger — automatically disables the vybit after firing
await client.triggerVybit('vybit123abc', {
  message: 'One-time setup complete',
  runOnce: true
});
```

### Sound Search

```typescript
// Search for sounds
const sounds = await client.searchSounds({
  search: 'bell',
  limit: 10
});

// Get sound details
const sound = await client.getSound('sound123abc');

// Get playback URL (unauthenticated endpoint)
const playUrl = client.getSoundPlayUrl('sound123abc');
console.log('Play sound at:', playUrl);
```

### Notification Logs

```typescript
// List all logs
const logs = await client.listLogs({ limit: 50 });

// Get specific log
const log = await client.getLog('log123abc');

// List logs for a specific vybit
const vybitLogs = await client.listVybitLogs('vybit123abc', {
  search: 'error',
  limit: 20
});

// List logs for a subscription
const followLogs = await client.listVybitFollowLogs('follow123abc');
```

### Access Control (Peeps)

```typescript
// Invite someone to a private vybit
const peep = await client.createPeep({
  vybKey: 'vybit123abc',
  email: 'friend@example.com'
});

// List peeps for a vybit
const peeps = await client.listVybitPeeps('vybit123abc');

// Accept a peep invitation
await client.acceptPeep('peep123abc');

// Remove access
await client.deletePeep('peep123abc');
```

### Reminders

```typescript
// Create a vybit with reminders trigger type
const vybit = await client.createVybit({
  name: 'Daily Standup',
  triggerType: 'reminders'
});

// Add a reminder (cron: every weekday at 9am Denver time)
const result = await client.createReminder(vybit.key, {
  cron: '0 9 * * 1-5',
  timeZone: 'America/Denver',
  message: 'Time for standup!'
});
console.log('Reminder ID:', result.reminder.id);

// List all reminders on a vybit
const { reminders } = await client.listReminders(vybit.key);

// Update a reminder
await client.updateReminder(vybit.key, result.reminder.id, {
  cron: '30 9 * * 1-5',
  message: 'Updated standup time!'
});

// Delete a reminder
await client.deleteReminder(vybit.key, result.reminder.id);
```

### Subscription Management

```typescript
// Browse public vybits
const publicVybits = await client.listPublicVybits({ limit: 10 });

// Subscribe to a vybit
const follow = await client.createVybitFollow({
  subscriptionKey: 'sub123abc456'
});

// List your subscriptions
const follows = await client.listVybitFollows();

// Disable a subscription
await client.updateVybitFollow(follow.followingKey, { status: 'off' });

// Unsubscribe
await client.deleteVybitFollow(follow.followingKey);
```

### Monitoring & Metrics

```typescript
// Get usage metrics
const meter = await client.getMeter();
console.log(`Daily usage: ${meter.count_daily} / ${meter.cap_daily}`);
console.log(`Monthly usage: ${meter.count_monthly} / ${meter.cap_monthly}`);
console.log(`Tier: ${meter.tier_id} (Free=0, Bronze=1, Silver=2, Gold=3)`);
```

## Rate Limiting

The Developer API enforces the following rate limits per credential:
- **10 requests per second**
- **300 requests per minute**
- **5,000 requests per hour**

Rate limit errors throw a `VybitAPIError` with status code `429`. The SDK automatically includes rate limit information in error messages.

## Error Handling

```typescript
import { VybitAPIError, VybitAuthError, VybitValidationError } from '@vybit/core';

try {
  const vybit = await client.createVybit({
    name: 'Test Vybit'  // Only name is required
  });
} catch (error) {
  if (error instanceof VybitAuthError) {
    console.error('Authentication failed - check your API key');
  } else if (error instanceof VybitValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof VybitAPIError) {
    console.error(`API error (${error.statusCode}):`, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Environment Management

The SDK connects to the production Vybit API at `https://api.vybit.net/v1`.

For different environments (development, staging, production), create separate Vybit accounts with their own credentials. This provides better isolation and security.

```typescript
// Development
const devClient = new VybitAPIClient({
  apiKey: process.env.VYBIT_DEV_API_KEY
});

// Production
const prodClient = new VybitAPIClient({
  apiKey: process.env.VYBIT_PROD_API_KEY
});
```

## TypeScript Support

The SDK is written in TypeScript and includes comprehensive type definitions:

```typescript
import {
  VybitAPIClient,
  Vybit,
  VybitCreateParams,
  VybitFollow,
  Sound,
  Log,
  Peep,
  Reminder,
  ReminderCreateParams,
  SearchParams
} from '@vybit/api-sdk';

// Full type safety for all API operations
const params: VybitCreateParams = {
  name: 'My Vybit'  // Only name is required, all other fields are optional
};

const vybit: Vybit = await client.createVybit(params);
```

## API Documentation

Complete OpenAPI 3.0 specification available:
- **📋 Spec**: [docs/openapi/developer-api.yaml](../../docs/openapi/developer-api.yaml)
- **📖 Interactive Docs**: Open [docs/openapi/index.html](../../docs/openapi/index.html) in browser

The OpenAPI spec provides:
- Complete endpoint documentation with examples
- Request/response schemas
- Code generation for multiple languages
- Postman/Insomnia collection import

## Complete API Reference

### Status & Utility
- `getStatus()` - Check API health
- `getMeter()` - Get usage metrics

### Profile
- `getProfile()` - Get user profile

### Vybits
- `listVybits(params?)` - List vybits
- `getVybit(key)` - Get vybit
- `createVybit(params)` - Create vybit
- `updateVybit(key, params)` - Update vybit (PUT)
- `patchVybit(key, params)` - Update vybit (PATCH)
- `deleteVybit(key)` - Delete vybit
- `triggerVybit(key, params?)` - Trigger a vybit notification

### Subscriptions
- `listPublicVybits(params?)` - Browse public vybits
- `getPublicVybit(key)` - Get public vybit by subscription key

### Vybit Follows
- `listVybitFollows(params?)` - List subscriptions
- `getVybitFollow(key)` - Get subscription
- `createVybitFollow(params)` - Subscribe to vybit
- `updateVybitFollow(key, params)` - Update subscription
- `deleteVybitFollow(key)` - Unsubscribe

### Sounds
- `searchSounds(params?)` - Search sounds
- `getSound(key)` - Get sound details
- `getSoundPlayUrl(key)` - Get sound playback URL

### Logs
- `listLogs(params?)` - List all logs
- `getLog(logKey)` - Get log entry
- `listVybitLogs(vybKey, params?)` - List logs for vybit
- `listVybitFollowLogs(vybFollowKey, params?)` - List logs for subscription

### Peeps
- `listPeeps(params?)` - List peeps
- `getPeep(key)` - Get peep
- `createPeep(params)` - Create peep invitation
- `acceptPeep(key)` - Accept invitation
- `deletePeep(key)` - Remove peep

### Reminders
- `createReminder(vybKey, params)` - Create a scheduled reminder on a vybit
- `listReminders(vybKey)` - List all reminders on a vybit
- `updateReminder(vybKey, reminderId, params)` - Update a reminder
- `deleteReminder(vybKey, reminderId)` - Delete a reminder

### Vybit Peeps (Nested)
- `listVybitPeeps(vybKey)` - List peeps for vybit
- `createVybitPeep(vybKey, params)` - Add peep to vybit
- `updateVybitPeep(vybKey, key, params)` - Update vybit peep
- `deleteVybitPeep(vybKey, key)` - Remove peep from vybit

## Related Packages

- **[@vybit/oauth2-sdk](../oauth2)** - OAuth 2.0 authentication for user-facing apps
- **[@vybit/core](../core)** - Shared utilities and types

## License

MIT
