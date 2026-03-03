# @vybit/oauth2-sdk

OAuth 2.0 authentication SDK for Vybit.

## Overview

The OAuth2 SDK handles the authorization flow for user-facing applications. It provides authorization URL generation, token exchange, and token verification.

Once you have an access token, use `VybitAPIClient` from `@vybit/api-sdk` with `{ accessToken }` to make API calls on behalf of the user.

## Setup

1. Create a [Vybit developer account](https://developer.vybit.net)
2. Navigate to OAUTH CONFIGURATION and specify a service name
3. Store your VYBIT_CLIENT_ID and VYBIT_CLIENT_SECRET (use environment variables)

## Installation

```bash
npm install @vybit/oauth2-sdk @vybit/api-sdk
```

## Quick Start

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';
import { VybitAPIClient } from '@vybit/api-sdk';

// Create client with your OAuth2 credentials
const oauthClient = new VybitOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/oauth/callback'
});

// Step 1: Generate authorization URL
const authUrl = oauthClient.getAuthorizationUrl({
  state: 'unique-state-value',
  scope: 'read write'
});

// Redirect user to authUrl...

// Step 2: Exchange authorization code for token
const token = await oauthClient.exchangeCodeForToken('auth-code-from-callback');

// Step 3: Use the token with the API SDK
const apiClient = new VybitAPIClient({
  accessToken: token.access_token
});

const vybits = await apiClient.listVybits();
await apiClient.triggerVybit('vybit-key', {
  message: 'Hello from your app!'
});
```

## PKCE Flow (Public Clients)

For native apps, SPAs, MCP clients, and other public clients that cannot store a client secret:

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';
import { generateCodeVerifier, generateCodeChallenge } from '@vybit/core';

// No clientSecret needed
const oauthClient = new VybitOAuth2Client({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/oauth/callback'
});

// Step 1: Generate PKCE verifier and challenge
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

// Step 2: Generate authorization URL with code_challenge
const authUrl = oauthClient.getAuthorizationUrl({
  state: 'unique-state-value',
  codeChallenge
});

// Redirect user to authUrl, store codeVerifier in session...

// Step 3: Exchange code with code_verifier (no client_secret needed)
const token = await oauthClient.exchangeCodeForToken(
  'auth-code-from-callback',
  codeVerifier
);

// Step 4: Use the token with the API SDK
const apiClient = new VybitAPIClient({
  accessToken: token.access_token
});
```

## Environment Management

The SDK uses production Vybit endpoints:
- **Authentication**: `https://app.vybit.net`
- **API** (via `@vybit/api-sdk`): `https://api.vybit.net/v1`

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

**`exchangeCodeForToken(code: string, codeVerifier?: string): Promise<TokenResponse>`**
- Exchanges authorization code for access token
- Pass `codeVerifier` for PKCE flow (omits `client_secret` if not configured)
- Automatically stores token for subsequent `verifyToken()` calls

**`verifyToken(accessToken?: string): Promise<boolean>`**
- Verifies if an access token is valid
- Uses stored token if none provided

**`setAccessToken(token: string): void`**
- Manually set access token

**`getAccessToken(): string | undefined`**
- Get currently stored access token

## Error Handling

```typescript
import { VybitAuthError, VybitAPIError, VybitValidationError } from '@vybit/oauth2-sdk';

try {
  const token = await oauthClient.exchangeCodeForToken(code);
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
  clientSecret?: string;  // Optional for PKCE-only public clients
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}
```

## License

MIT
