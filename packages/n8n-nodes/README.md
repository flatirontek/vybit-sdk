# @vybit/n8n-nodes-vybit

Official n8n community nodes for [Vybit](https://vybit.net) - the personalized audio notification platform.

[![npm version](https://badge.fury.io/js/%40vybit%2Fn8n-nodes-vybit.svg)](https://www.npmjs.com/package/@vybit/n8n-nodes-vybit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Dual Authentication**: API Key for personal automation or OAuth2 for multi-user services
- **Push Notifications**: Send personalized audio notifications from your workflows
- **Full API Access**: 34 operations across 7 resources, available with either auth method
- **Manage Vybits**: Create, update, trigger, and delete vybits programmatically
- **Subscriptions & Peeps**: Subscribe to vybits and manage access invitations
- **Reminders**: Create and manage scheduled reminders on vybits
- **Sounds & Logs**: Search sounds and view notification history
- **Zero Dependencies**: Built with zero runtime dependencies

---

## Installation

### Self-Hosted n8n

```bash
npm install @vybit/n8n-nodes-vybit
```

Then restart your n8n instance.

### n8n Cloud

Once verified, search for "Vybit" in the n8n nodes panel to install. Verification is currently under review.

### For Multi-User Deployments

See [DEPLOYMENT.md](./DEPLOYMENT.md) for configuring credential sharing in multi-user n8n instances to centrally manage OAuth2 Client Secrets.

---

## Which Authentication Method Should I Use?

Both methods provide full access to all operations. Choose based on your use case:

### Use **API Key** if:
- You're automating your own Vybit account
- Building personal workflows (e.g., "alert me when server is down")
- Integrating Vybit into your backend service

**Example**: DevOps engineer using n8n to trigger their personal Vybit when monitoring detects issues

### Use **OAuth2** if:
- You're building a service where users connect their own accounts
- Each user needs to authorize their own Vybit account
- Multi-tenant scenarios (agency managing client notifications)

**Example**: Agency building n8n workflows that send notifications to client Vybit accounts

---

## Quick Start

### API Key Setup

1. Go to [developer.vybit.net](https://developer.vybit.net)
2. Generate an API key
3. In n8n:
   - Add Vybit node
   - Authentication: "API Key"
   - Create new credential and paste your API key

### OAuth2 Setup

1. Go to [developer.vybit.net](https://developer.vybit.net)
2. Configure OAuth2 settings (client ID, redirect URI)
3. In n8n:
   - Add Vybit node
   - Authentication: "OAuth2"
   - Create OAuth2 credential with your client ID/secret
4. Users authorize their Vybit accounts to connect

---

## Available Operations

All 34 operations are available with both API Key and OAuth2 authentication.

### Profile

| Operation | Description |
|-----------|-------------|
| Get Profile | View account information |
| Get Usage Metrics | View current usage and tier limits |
| Check API Status | Check API service health |

### Vybits

| Operation | Description |
|-----------|-------------|
| List | Get all vybits |
| Get | Get vybit details |
| Create | Create a new vybit |
| Update | Update vybit settings |
| Delete | Delete a vybit |
| Trigger | Send a push notification |

### Subscriptions

| Operation | Description |
|-----------|-------------|
| List Public Vybits | Browse publicly available vybits |
| Get Public Vybit | Get details of a public vybit |
| Subscribe | Subscribe to a vybit |
| List My Subscriptions | Get your subscriptions |
| Get Subscription | Get subscription details |
| Update Subscription | Update subscription settings |
| Unsubscribe | Unsubscribe from a vybit |
| Send to Owner | Send notification to vybit owner |
| Send to Group | Send notification to all subscribers |

### Sounds

| Operation | Description |
|-----------|-------------|
| Search | Search available sounds |
| Get | Get sound details |
| Play | Get the playback URL for a sound |

### Logs

| Operation | Description |
|-----------|-------------|
| List All | View all notification logs |
| Get | Get specific log entry details |
| List by Vybit | View logs for a specific vybit |
| List by Subscription | View logs for a subscription |

### Peeps

| Operation | Description |
|-----------|-------------|
| List All | View all peep invitations |
| List by Vybit | View peeps for a specific vybit |
| Invite | Invite a user to a vybit |
| Get | Get peep details |
| Delete | Remove a peep invitation |

### Reminders

| Operation | Description |
|-----------|-------------|
| List | List all reminders on a vybit |
| Create | Create a new scheduled reminder |
| Update | Update an existing reminder |
| Delete | Delete a reminder |

---

## Example Workflows

### Trigger Alert on Server Error

```
Webhook (error event)
  → Vybit (Trigger)
```

### Daily Summary Notification

```
Schedule (daily at 9am)
  → HTTP Request (fetch metrics)
  → Vybit (Trigger with summary)
```

### Create Vybit from Airtable

```
Airtable Trigger (new record)
  → Vybit (Create vybit)
  → Vybit (Trigger, send notification)
```

---

## Development

This package uses n8n's built-in `httpRequestWithAuthentication` helper for all API calls (no bundled SDK). API endpoint paths are maintained in `Vybit.node.ts` and must be kept in sync with `@vybit/api-sdk` when the API changes.

### Building

```bash
npm run build
```

### Testing Locally

Using Docker (recommended):

```bash
# See docker-compose.yml in the project root's my-n8n directory
# The dist is volume-mounted into the container via N8N_CUSTOM_EXTENSIONS
docker compose up -d
```

Using npm link:

```bash
npm link
cd /path/to/n8n
npm link @vybit/n8n-nodes-vybit
n8n start
```

### Integration Tests

```bash
# Requires a running n8n instance with a configured Vybit API Key credential
export N8N_API_KEY="your-n8n-api-key"
export VYBIT_API_CREDENTIAL_ID="your-credential-id"
node test/integration/test-runner.js
```

---

## Resources

- [Developer API Documentation](https://developer.vybit.net/api-reference)
- [OAuth2 Documentation](https://developer.vybit.net/oauth-reference)
- [Support](mailto:developer@vybit.net)
- [Report Issues](https://github.com/flatirontek/vybit-sdk/issues)

---

## Related Packages

Part of the Vybit SDK monorepo:

- [@vybit/api-sdk](https://www.npmjs.com/package/@vybit/api-sdk) - Developer API client
- [@vybit/oauth2-sdk](https://www.npmjs.com/package/@vybit/oauth2-sdk) - OAuth2 client
- [@vybit/mcp-server](https://www.npmjs.com/package/@vybit/mcp-server) - MCP server for AI assistants

---

## License

MIT © Flatirontek LLC
