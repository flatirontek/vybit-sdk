# @vybit/core

Core utilities, types, and error classes for Vybit SDKs.

## Overview

This package is the shared foundation used across all Vybit SDK packages. It is automatically installed as a dependency — you don't need to install it directly.

**Install the SDK you need instead:**

- **[@vybit/api-sdk](https://www.npmjs.com/package/@vybit/api-sdk)** - Developer API SDK for server-to-server integrations
- **[@vybit/oauth2-sdk](https://www.npmjs.com/package/@vybit/oauth2-sdk)** - OAuth2 authentication for user-facing apps
- **[@vybit/mcp-server](https://www.npmjs.com/package/@vybit/mcp-server)** - MCP server for AI assistants

All types and error classes from this package are re-exported by `@vybit/api-sdk` and `@vybit/oauth2-sdk`, so you can import them directly from whichever SDK you're using.

```typescript
// Import types and errors from your SDK — no need to import from @vybit/core
import { VybitAPIClient, Vybit, VybitAPIError } from '@vybit/api-sdk';
```

## What's Included

### Utilities

- `isValidUrl(url)` - Validates HTTP/HTTPS URLs
- `generateRandomState(length?)` - Generates secure random strings for OAuth2
- `buildQueryString(params)` - Builds URL query strings
- `getApiBaseUrl()` - Returns Developer API base URL (`https://api.vybit.net/v1`)
- `getAuthDomain()` - Returns OAuth2 auth domain (`https://app.vybit.net`)

### Error Classes

- `VybitSDKError` - Base error class
- `VybitAuthError` - Authentication errors (includes `statusCode`)
- `VybitAPIError` - API request errors (includes `statusCode`)
- `VybitValidationError` - Input validation errors

### Types

All TypeScript interfaces for the Vybit platform are defined here as the single source of truth:

**Configuration:** `VybitAPIConfig`, `OAuth2Config`

**OAuth2:** `TokenResponse`, `AuthorizationUrlOptions`

**Pagination:** `PaginationParams`, `SearchParams`

**API Responses:** `StatusResponse`, `Profile`, `Meter`

**Vybits:** `Vybit`, `VybitCreateParams`, `VybitUpdateParams`, `VybitTriggerParams`, `VybitTriggerResponse`

**Subscriptions:** `VybitFollow`, `VybitFollowCreateParams`, `VybitFollowUpdateParams`, `PublicVybit`, `SubscriberSendParams`, `SubscriberSendResponse`

**Resources:** `Sound`, `Log`, `Peep`, `PeepCreateParams`, `Reminder`, `ReminderCreateParams`, `ReminderUpdateParams`, `ReminderResponse`, `RemindersListResponse`

**Common:** `ErrorResponse`, `DeleteResponse`

## License

MIT
