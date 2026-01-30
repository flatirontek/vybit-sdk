# @vybit/oauth2-sdk

OAuth 2.0 authentication SDK for Vybit.

## Overview

Complete OAuth2 implementation for Vybit authentication, including authorization URL generation, token exchange, and authenticated API calls.

## Setup

1. Create a [Vybit developer account](https://developer.vybit.net)
2. Navigate to OAUTH CONFIGURATION and specify a service name
3. Store your VYBIT_CLIENT_ID and VYBIT_CLIENT_SECRET (use environment variables)

## Installation

```bash
npm install @vybit/oauth2-sdk
```

## Quick Start

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

// Create client with your OAuth2 credentials
const client = new VybitOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/oauth/callback'
});

// Step 1: Generate authorization URL
const authUrl = client.getAuthorizationUrl({
  state: 'unique-state-value',
  scope: 'read write'
});

// Redirect user to authUrl...

// Step 2: Exchange authorization code for token
const token = await client.exchangeCodeForToken('auth-code-from-callback');

// Step 3: Make authenticated API calls
const vybits = await client.getVybitList();
await client.sendVybitNotification('trigger-key', {
  message: 'Hello from your app!'
});
```

## Environment Management

The SDK always uses production Vybit endpoints:
- **Authentication**: `https://app.vybit.net`
- **API**: `https://vybit.net`

For different environments (dev/staging/prod), create separate Vybit accounts with their own OAuth credentials.

## API Reference

### VybitOAuth2Client

#### Constructor
```typescript
new VybitOAuth2Client(config: OAuth2Config)
```

#### Methods

**`getAuthorizationUrl(options?: AuthorizationUrlOptions): string`**
- Generates OAuth2 authorization URL for user redirection
- Returns complete URL including all required parameters

**`exchangeCodeForToken(code: string): Promise<TokenResponse>`**
- Exchanges authorization code for access token
- Automatically stores token for subsequent API calls

**`verifyToken(accessToken?: string): Promise<boolean>`**
- Verifies if an access token is valid
- Uses stored token if none provided

**`getVybitList(accessToken?: string): Promise<Vybit[]>`**
- Fetches user's vybit notifications
- Requires valid access token

**`sendVybitNotification(triggerKey: string, options?: TriggerOptions, accessToken?: string): Promise<TriggerResponse>`**
- Triggers a vybit notification
- Supports custom message, images, and links

**`setAccessToken(token: string): void`**
- Manually set access token

**`getAccessToken(): string | undefined`**
- Get currently stored access token

## Error Handling

```typescript
import { VybitAuthError, VybitAPIError, VybitValidationError } from '@vybit/oauth2-sdk';

try {
  const token = await client.exchangeCodeForToken(code);
} catch (error) {
  if (error instanceof VybitAuthError) {
    // Handle authentication errors
  } else if (error instanceof VybitAPIError) {
    // Handle API errors
  } else if (error instanceof VybitValidationError) {
    // Handle validation errors
  }
}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface TriggerOptions {
  message?: string;
  imageUrl?: string;
  linkUrl?: string;
  log?: string;
}
```

## License

MIT