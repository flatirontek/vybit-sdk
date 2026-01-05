# @vybit/api-sdk

✅ Developer API SDK for programmatic access to the Vybit notification platform.

## Overview

The **@vybit/api-sdk** provides a complete TypeScript/JavaScript SDK for the Vybit Developer API, enabling you to build custom integrations, automation workflows, and notification management tools.

Use this SDK to:
- Manage vybits (notifications) - create, update, delete
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

### 1. Get Your API Key

1. Create a [Vybit developer account](https://developer.vybit.net)
2. Generate an API key from your developer dashboard
3. Store your API key securely (use environment variables)

### 2. Initialize the Client

```typescript
import { VybitAPIClient } from '@vybit/api-sdk';

const client = new VybitAPIClient({
  apiKey: process.env.VYBIT_API_KEY
});
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

// Create a new vybit
const vybit = await client.createVybit({
  name: 'Server Alert',
  description: 'Notifications for server errors',
  soundKey: 'sound123abc',
  triggerType: 'webhook',
  access: 'private'
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
  mute: 'off'
});

// Delete vybit
await client.deleteVybit('vybit123abc');
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

// Mute a subscription
await client.updateVybitFollow(follow.key, { mute: 'on' });

// Unsubscribe
await client.deleteVybitFollow(follow.key);
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

### Monitoring & Metrics

```typescript
// Get usage metrics
const meter = await client.getMeter();
console.log(`Daily usage: ${meter.count_daily} / ${meter.cap_daily}`);
console.log(`Monthly usage: ${meter.count_monthly} / ${meter.cap_monthly}`);
console.log(`Tier: ${meter.tier_id} (Free=0, Bronze=1, Silver=2, Gold=3)`);
```

## Rate Limiting

The Developer API enforces the following rate limits per API key:
- **10 requests per second**
- **300 requests per minute**
- **5,000 requests per hour**

Rate limit errors throw a `VybitAPIError` with status code `429`. The SDK automatically includes rate limit information in error messages.

## Error Handling

```typescript
import { VybitAPIError, VybitAuthError, VybitValidationError } from '@vybit/core';

try {
  const vybit = await client.createVybit({
    name: 'Test Vybit',
    soundKey: 'sound123',
    triggerType: 'webhook'
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

For different environments (development, staging, production), create separate Vybit accounts with their own API keys. This provides better isolation and security.

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
  SearchParams
} from '@vybit/api-sdk';

// Full type safety for all API operations
const params: VybitCreateParams = {
  name: 'My Vybit',
  soundKey: 'sound123',
  triggerType: 'webhook',
  access: 'private'
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
