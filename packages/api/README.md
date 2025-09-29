# @vybit/api-sdk

  **PLACEHOLDER PACKAGE** - Full implementation coming in future release.

## Overview

This package is currently a placeholder for the Vybit REST API SDK. The full implementation will be available in a future release once the main Vybit application API is finalized.

## Current Status

-  **@vybit/oauth2-sdk** - Fully functional OAuth2 authentication
- ó **@vybit/api-sdk** - Placeholder (this package)

## Installation

```bash
npm install @vybit/api-sdk
```

> **Note**: This package currently only provides placeholder functionality. For authentication, use `@vybit/oauth2-sdk`.

## What's Coming

The full API SDK will include:

- **Vybit Management**: Create, update, delete vybits
- **Subscription Management**: Handle vybit subscriptions
- **User Profile**: Manage user account settings
- **Analytics**: Access usage statistics and metrics
- **Media Management**: Upload and manage audio files
- **Webhook Management**: Configure webhook endpoints

## Current Usage (Placeholder)

```typescript
import { VybitAPIClient } from '@vybit/api-sdk';

// This currently shows a placeholder warning
const client = new VybitAPIClient();
const result = await client.placeholder();
// Returns: { message: 'API SDK implementation coming soon' }
```

## Migration Path

When the full API SDK is released:

1. Update to the latest version: `npm update @vybit/api-sdk`
2. Replace placeholder usage with real API methods
3. No breaking changes to OAuth2 authentication

## Using OAuth2 SDK Now

For current projects, use the OAuth2 SDK for authentication:

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

const client = new VybitOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/callback'
});

// Full OAuth2 functionality available
const authUrl = client.getAuthorizationUrl();
const token = await client.exchangeCodeForToken(code);
const vybits = await client.getVybitList();
```

## License

MIT