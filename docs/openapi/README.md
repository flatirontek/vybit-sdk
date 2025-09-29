# Vybit OAuth2 API Specification

This directory contains the OpenAPI specification for Vybit's OAuth2 authentication endpoints.

## Files

- **`oauth2.yaml`** - Complete OpenAPI 3.0.3 specification for OAuth2 endpoints
- **`README.md`** - This documentation file


## API Overview

The specification covers three main endpoints:

### 1. Authorization Endpoint
- **URL**: `GET https://app.vybit.net`
- **Purpose**: Initiate OAuth2 authorization flow
- **Parameters**: `client_id`, `redirect_uri`, `response_type`, `state`, `scope`

### 2. Token Exchange Endpoint  
- **URL**: `POST https://app.vybit.net/service/token`
- **Purpose**: Exchange authorization code for access token
- **Body**: Form data with `grant_type`, `code`, `client_id`, `client_secret`

### 3. Token Validation Endpoint
- **URL**: `GET https://app.vybit.net/service/test`  
- **Purpose**: Validate access token
- **Authorization**: Bearer token required

## Code Generation

Generate client code in various languages using the OpenAPI spec:

**JavaScript/TypeScript**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i oauth2.yaml \
  -g typescript-fetch \
  -o ./generated/typescript
```

**Python**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i oauth2.yaml \
  -g python \
  -o ./generated/python
```

**cURL Examples**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i oauth2.yaml \
  -g curl \
  -o ./generated/curl
```

## Testing with the Spec

**Postman Collection**
1. Import `oauth2.yaml` into Postman
2. Set up environment variables for `client_id`, `client_secret`, etc.
3. Test the OAuth2 flow interactively

**Insomnia**
1. Create new request collection
2. Import OpenAPI spec from `oauth2.yaml`
3. Configure authentication and test endpoints

## Integration with Vybit SDK

This OpenAPI spec matches exactly with the [@vybit/oauth2-sdk](https://www.npmjs.com/package/@vybit/oauth2-sdk) implementation:

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

// The SDK implements these exact endpoints
const client = new VybitOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret', 
  redirectUri: 'https://yourapp.com/callback'
});
```

## Validation

The spec has been validated against:
- ✅ OpenAPI 3.0.3 schema
- ✅ OAuth2 RFC 6749 compliance  
- ✅ Vybit SDK implementation
- ✅ Real endpoint behavior



- **SDK Documentation**: [npm @vybit/oauth2-sdk](https://www.npmjs.com/package/@vybit/oauth2-sdk)
- **Developer Portal**: [developer.vybit.net](https://developer.vybit.net)

---

**License**: MIT  
**Last Updated**: September 2024