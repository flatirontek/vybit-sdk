# Vybit SDK

Official TypeScript/JavaScript SDKs for integrating with the Vybit notification platform.

[![npm version](https://badge.fury.io/js/%40vybit%2Foauth2-sdk.svg)](https://www.npmjs.com/package/@vybit/oauth2-sdk)
[![npm version](https://badge.fury.io/js/%40vybit%2Fapi-sdk.svg)](https://www.npmjs.com/package/@vybit/api-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Vybit provides two distinct SDKs for different integration scenarios:

| SDK | Use Case | Authentication | Best For |
|-----|----------|----------------|----------|
| **[@vybit/api-sdk](./packages/api)** | Backend/automation | API Key | Server-to-server integrations, automation, monitoring systems |
| **[@vybit/oauth2-sdk](./packages/oauth2)** | User-facing applications | OAuth 2.0 (user authorization) | Web apps, mobile apps where users connect their Vybit accounts |

Both SDKs share common utilities from **[@vybit/core](./packages/core)**.

---

## Developer API SDK

**For backend services, automation, and server-to-server integrations**

### Installation

```bash
npm install @vybit/api-sdk
```

### Getting Started

1. **Get Your API Key**
   - Sign up at [developer.vybit.net](https://developer.vybit.net)
   - Navigate to the Developer API section
   - Copy your API key

2. **Initialize the Client**

```typescript
import { VybitAPIClient } from '@vybit/api-sdk';

const client = new VybitAPIClient({
  apiKey: 'your-api-key-from-developer-portal'
});
```

### Common Operations

#### Create and Manage Vybits

```typescript
// Create a vybit
const vybit = await client.createVybit({
  name: 'Server Alert',
  soundKey: 'sound123abc',
  triggerType: 'webhook'
});

// List vybits with search and pagination
const vybits = await client.listVybits({
  search: 'alert',
  limit: 10,
  offset: 0
});

// Get a specific vybit
const details = await client.getVybit('vybit-id');

// Update a vybit
await client.updateVybit('vybit-id', {
  name: 'Updated Server Alert',
  enabled: true
});

// Delete a vybit
await client.deleteVybit('vybit-id');
```

#### Trigger Notifications

```typescript
// Simple trigger
await client.triggerVybit('trigger-key');

// Trigger with custom content
await client.triggerVybit('trigger-key', {
  message: 'Server CPU usage at 95%',
  imageUrl: 'https://example.com/graph.png',
  linkUrl: 'https://dashboard.example.com',
  log: 'CPU spike detected on web-server-01'
});
```

#### Manage Sounds

```typescript
// List available sounds
const sounds = await client.listSounds({
  search: 'alert',
  limit: 20
});

// Get sound details
const sound = await client.getSound('sound-key');
```

#### Monitor Usage

```typescript
// Get current usage and limits
const meter = await client.getMeter();
console.log(`Daily: ${meter.count_daily} / ${meter.cap_daily}`);
console.log(`Monthly: ${meter.count_monthly} / ${meter.cap_monthly}`);
console.log(`Tier: ${meter.tier_name}`);
```

### API Reference

- **📖 Interactive Documentation**: [developer.vybit.net/api-reference](https://developer.vybit.net/api-reference)
- **📋 OpenAPI Spec**: [docs/openapi/developer-api.yaml](./docs/openapi/developer-api.yaml)

---

## OAuth2 SDK

**For user-facing applications that need to access Vybit on behalf of users**

### Installation

```bash
npm install @vybit/oauth2-sdk
```

### Getting Started

1. **Register Your Application**
   - Sign up at [developer.vybit.net](https://developer.vybit.net)
   - Navigate to the OAuth Configuration section
   - Enter your OAuth Client ID and Redirect URI
   - Copy your Client ID and Client Secret

2. **Initialize the Client**

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

const client = new VybitOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/oauth/callback'
});
```

### OAuth Flow

#### Step 1: Redirect User to Authorization

```typescript
const authUrl = client.getAuthorizationUrl({
  state: 'random-state-string'
});

// Redirect user to authUrl
// They will authorize your app and be redirected back to your redirectUri
```

#### Step 2: Exchange Authorization Code for Token

```typescript
// After redirect, extract the code from query params
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Verify state matches what you sent
// Then exchange code for access token
const token = await client.exchangeCodeForToken(code);

// Store token.access_token securely for future requests
```

#### Step 3: Make Authenticated API Calls

```typescript
// Get user's vybits
const vybits = await client.getVybitList();

// Trigger a vybit on behalf of the user
const result = await client.sendVybitNotification('trigger-key', {
  message: 'Hello from your app!',
  imageUrl: 'https://example.com/image.jpg',
  linkUrl: 'https://example.com/details'
});
```

### Token Management

```typescript
// Validate a token
const isValid = await client.validateToken();

// Manually set token for subsequent requests
client.setAccessToken('existing-token');
```

### API Reference

- **📖 Interactive Documentation**: [developer.vybit.net/oauth-reference](https://developer.vybit.net/oauth-reference)
- **📋 OpenAPI Spec**: [docs/openapi/oauth2.yaml](./docs/openapi/oauth2.yaml)

---

## Environment Management

Both SDKs connect to Vybit production endpoints:
- **OAuth Authorization**: `https://app.vybit.net`
- **API Endpoints**: `https://vybit.net`

### Managing Multiple Environments

For development, staging, and production environments, create separate Vybit developer accounts:

**Developer API Approach:**
- Each environment gets its own API key
- Configure different keys per environment in your app

```typescript
const apiKey = process.env.NODE_ENV === 'production'
  ? process.env.VYBIT_PROD_API_KEY
  : process.env.VYBIT_DEV_API_KEY;

const client = new VybitAPIClient({ apiKey });
```

**OAuth2 Approach:**
- Each environment gets its own OAuth client credentials
- Configure different redirect URIs per environment

```typescript
const config = process.env.NODE_ENV === 'production'
  ? {
      clientId: process.env.VYBIT_PROD_CLIENT_ID,
      clientSecret: process.env.VYBIT_PROD_CLIENT_SECRET,
      redirectUri: 'https://yourapp.com/oauth/callback'
    }
  : {
      clientId: process.env.VYBIT_DEV_CLIENT_ID,
      clientSecret: process.env.VYBIT_DEV_CLIENT_SECRET,
      redirectUri: 'http://localhost:3000/oauth/callback'
    };

const client = new VybitOAuth2Client(config);
```

---

## Error Handling

Both SDKs use consistent error classes from `@vybit/core`:

```typescript
import {
  VybitAPIError,      // API request failures
  VybitAuthError,     // Authentication/authorization failures
  VybitValidationError // Invalid parameters
} from '@vybit/core';

try {
  await client.triggerVybit('invalid-key');
} catch (error) {
  if (error instanceof VybitAPIError) {
    console.error(`API Error: ${error.message} (${error.statusCode})`);
  } else if (error instanceof VybitAuthError) {
    console.error(`Auth Error: ${error.message}`);
  } else if (error instanceof VybitValidationError) {
    console.error(`Validation Error: ${error.message}`);
  }
}
```

---

## Examples

The `examples/` directory contains complete working examples:

### Developer API Examples
- **developer-api-notifications.js** - Creating and triggering vybits
- **simple-notifications.js** - Sending notifications with various options
- **usage-monitoring.js** - Tracking API usage and limits

### OAuth2 Examples
- **oauth2-simple.js** - Basic OAuth 2.0 flow
- **oauth2-complete-flow.js** - Complete OAuth implementation with error handling
- **oauth2-express-server.js** - Full Express.js integration with session management

---

## Development

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run unit tests
npm run test

# Run API integration tests
node tests/test-api-complete-coverage.js

# Lint code
npm run lint
```

### Publishing

```bash
# Publish all packages to npm
npm run publish:all
```

---

## TypeScript Support

All packages are written in TypeScript and include full type definitions:

```typescript
import { VybitAPIClient, Vybit, CreateVybitRequest } from '@vybit/api-sdk';
import { VybitOAuth2Client, TokenResponse } from '@vybit/oauth2-sdk';

// Full IntelliSense and type checking
const client: VybitAPIClient = new VybitAPIClient({ apiKey: 'key' });
const vybit: Vybit = await client.getVybit('id');
```

---

## Support

- **Documentation**: [developer.vybit.net](https://developer.vybit.net)
- **Issues**: [GitLab Issues](https://gitlab.com/flatirontek/vybit-sdk/-/issues)
- **Email**: developer@vybit.net

---

## License

MIT
