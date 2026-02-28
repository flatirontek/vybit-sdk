# Vybit OpenAPI Specifications

This directory contains OpenAPI specifications and interactive API reference pages for the Vybit platform.

## Files

### Specifications
- **`developer-api.yaml`** - OpenAPI 3.0.3 spec for the Developer API (full REST API)
- **`oauth2.yaml`** - OpenAPI 3.0.3 spec for OAuth2 authentication endpoints

### Interactive Reference Pages
- **`api-reference.html`** - Interactive docs for the Developer API (powered by [Scalar](https://scalar.com))
- **`oauth-reference.html`** - Interactive docs for the OAuth2 API (powered by [Scalar](https://scalar.com))

## Developer API (`developer-api.yaml`)

The Developer API at `https://api.vybit.net/v1` provides full programmatic access to the Vybit platform.

**Authentication**: API Key (`X-API-Key` header) or OAuth2 Bearer Token (`Authorization: Bearer <token>`)

**Resources**:
- Profile & Status
- Vybits (create, update, delete, trigger)
- Subscriptions (follows, public vybits)
- Sounds (search, details, playback)
- Logs (notification history)
- Peeps (access invitations)
- Reminders (scheduled notifications)

## OAuth2 API (`oauth2.yaml`)

The OAuth2 API at `https://app.vybit.net` handles user authorization for third-party applications.

**Endpoints**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Initiate OAuth2 authorization flow |
| `/service/token` | POST | Exchange authorization code for access token |
| `/service/test` | GET | Validate an access token |

The spec also documents legacy endpoints (`/rest/vybit_list`, `/fire/{triggerKey}`) which are deprecated in favor of the Developer API with Bearer token authentication.

## Viewing the Interactive Docs

Open the HTML files in a browser. When served locally they load the YAML specs from this directory; in production they load from the GitLab repository.

## Code Generation

Generate client code from either spec:

```bash
# Developer API client
npx @openapitools/openapi-generator-cli generate \
  -i developer-api.yaml \
  -g typescript-fetch \
  -o ./generated/typescript

# OAuth2 client
npx @openapitools/openapi-generator-cli generate \
  -i oauth2.yaml \
  -g typescript-fetch \
  -o ./generated/typescript-oauth2
```

## Integration with Vybit SDKs

These specs correspond to the published SDK packages:

- **Developer API** -> [@vybit/api-sdk](https://www.npmjs.com/package/@vybit/api-sdk) (supports both API Key and OAuth2 token auth)
- **OAuth2 API** -> [@vybit/oauth2-sdk](https://www.npmjs.com/package/@vybit/oauth2-sdk) (auth flow only; use `@vybit/api-sdk` with the token for API calls)

## Resources

- **Developer Portal**: [developer.vybit.net](https://developer.vybit.net)
- **API Reference**: [developer.vybit.net/api-reference](https://developer.vybit.net/api-reference)
- **OAuth2 Reference**: [developer.vybit.net/oauth-reference](https://developer.vybit.net/oauth-reference)

---

**License**: MIT
