# Vybit SDK

Official TypeScript/JavaScript SDKs for integrating with the Vybit notification platform.

[![npm version](https://badge.fury.io/js/%40vybit%2Foauth2-sdk.svg)](https://www.npmjs.com/package/@vybit/oauth2-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

- **[@vybit/core](./packages/core)** - Core utilities and types shared across all SDKs
- **[@vybit/oauth2-sdk](./packages/oauth2)** - OAuth 2.0 authentication and authorization
- **[@vybit/api-sdk](./packages/api)** - *Placeholder package - full implementation coming in future release*

## Installation

Install the OAuth2 SDK (currently available):

```bash
npm install @vybit/oauth2-sdk
```

> **Note**: `@vybit/api-sdk` is currently a placeholder package. Full API implementation will be available in a future release.

## Quick Start

### 1. Get OAuth2 Credentials

1. Create a [Vybit developer account](https://developer.vybit.net)
2. Register your application to get client credentials
3. Configure your redirect URI

### 2. OAuth 2.0 Authentication

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

const client = new VybitOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/oauth/callback'
});

// Step 1: Get authorization URL
const authUrl = client.getAuthorizationUrl({ state: 'random-state' });

// Step 2: Exchange code for token (after user authorizes)
const token = await client.exchangeCodeForToken('authorization-code');

// Step 3: Use the token to make authenticated API calls
const vybits = await client.getVybitList();
const result = await client.sendVybitNotification('trigger-key', {
  message: 'Hello from SDK!',
  imageUrl: 'https://example.com/image.jpg'
});

// For different environments (dev/staging/prod), create separate
// Vybit accounts with their own OAuth credentials
```

### API Client

> **Coming Soon**: The API SDK is currently a placeholder. Full implementation will be available in a future release once the main Vybit application API is finalized.

```typescript
// This will be available in a future release:
// import { VybitAPIClient } from '@vybit/api-sdk';
```

## Environment Management

The Vybit SDK always connects to the production Vybit endpoints:
- **Authentication**: `https://app.vybit.net` 
- **API**: `https://vybit.net`

To manage different environments (development, staging, production), create separate Vybit accounts for each environment, each with their own:
- OAuth client credentials (client ID and secret)
- Vybit configurations and triggers
- User accounts and permissions

This approach provides better isolation and security compared to using different API endpoints.

## API Documentation

### OpenAPI Specification
Complete OpenAPI 3.0.3 specification for OAuth2 endpoints:
- **📋 Spec**: [docs/openapi/oauth2.yaml](./docs/openapi/oauth2.yaml)
- **📖 Interactive Docs**: Open [docs/openapi/index.html](./docs/openapi/index.html) in browser
- **🔧 Swagger Editor**: Copy spec to [editor.swagger.io](https://editor.swagger.io)

The OpenAPI spec provides:
- Complete endpoint documentation with examples
- Request/response schemas
- Code generation for multiple languages
- Postman/Insomnia collection import
- Interactive testing interface

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## License

MIT