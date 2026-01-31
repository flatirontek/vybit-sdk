# @vybit/n8n-nodes

Official n8n community nodes for [Vybit](https://vybit.net) - the personalized audio notification platform.

[![npm version](https://badge.fury.io/js/%40vybit%2Fn8n-nodes.svg)](https://www.npmjs.com/package/@vybit/n8n-nodes)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔐 **Dual Authentication**: OAuth2 for multi-user services or API Key for personal automation
- 🔔 **Push Notifications**: Send personalized audio notifications from your workflows
- 📋 **Manage Vybits**: Create, update, and delete vybits programmatically
- 📊 **View Logs**: Access notification history and analytics
- 🎵 **Sound Management**: Search and manage custom audio files
- 👥 **Subscription Management**: Subscribe to and share vybits
- 🔐 **Peeps Management**: Invite users to follow your vybits and and control access
- ✅ **Zero Dependencies**: Built with zero runtime dependencies

---

## Installation

### Self-Hosted n8n

```bash
npm install @vybit/n8n-nodes
```

Then restart your n8n instance.

<!-- n8n Cloud support coming soon -->

### For Multi-User Deployments

See [DEPLOYMENT.md](./DEPLOYMENT.md) for configuring credential sharing in multi-user n8n instances to centrally manage OAuth2 Client Secrets.

---

## Which Authentication Method Should I Use?

### Use **Developer API** (API Key) if:
- ✅ You're automating your own Vybit account
- ✅ Building personal workflows (e.g., "alert me when server is down")
- ✅ Integrating Vybit into your backend service
- ✅ You need full API access (create vybits, manage sounds, view logs)

**Example**: DevOps engineer using n8n to trigger their personal Vybit when monitoring detects issues

### Use **OAuth2** if:
- ✅ You're building a service where users connect their accounts
- ✅ Each user needs to authorize their own Vybit account
- ✅ Multi-tenant scenarios (agency managing client notifications)
- ✅ Similar to how Zapier/IFTTT integrates with Vybit

**Example**: Agency building n8n workflows that send notifications to client Vybit accounts

---

## Quick Start

### Developer API Setup (Personal Automation)

1. Go to [developer.vybit.net](https://developer.vybit.net)
2. Generate an API key
3. In n8n:
   - Add Vybit node
   - Authentication: "Developer API (For Personal Automation)"
   - Create new credential and paste your API key
4. You now have full access to YOUR Vybit account

### OAuth2 Setup (Multi-User Service)

1. Go to [developer.vybit.net](https://developer.vybit.net)
2. Configure OAuth2 settings (client ID, redirect URI)
3. In n8n:
   - Add Vybit node
   - Authentication: "OAuth2 (For Multi-User Services)"
   - Create OAuth2 credential with your client ID/secret
4. Users authorize their Vybit accounts to connect

---

## Available Operations

### Profile Resource (API Key Only)

| Operation | Description |
|-----------|-------------|
| **Get Profile** | View account information |
| **Get Usage Metrics** | View current usage and tier limits |
| **Check API Status** | Check API service health |

### Vybits Resource

| Operation | OAuth2 | API Key | Description |
|-----------|--------|---------|-------------|
| **List** | ✅ | ✅ | Get all vybits |
| **Get** | ❌ | ✅ | Get vybit details |
| **Create** | ❌ | ✅ | Create a new vybit |
| **Update** | ❌ | ✅ | Update vybit settings |
| **Delete** | ❌ | ✅ | Delete a vybit |
| **Trigger** | ✅ | ✅ | Send a notification |

### Logs Resource (API Key Only)

| Operation | Description |
|-----------|-------------|
| **List All** | View all notification logs |
| **Get** | Get specific log entry details |
| **List by Vybit** | View logs for a specific vybit |
| **List by Subscription** | View logs for a subscription |

### Sounds Resource (API Key Only)

| Operation | Description |
|-----------|-------------|
| **Search** | Search available sounds |
| **Get** | Get sound details |

### Peeps Resource (API Key Only)

| Operation | Description |
|-----------|-------------|
| **List All** | View all peep invitations |
| **List by Vybit** | View peeps for a specific vybit |
| **Invite** | Invite a user to a vybit |
| **Get** | Get peep details |
| **Delete** | Remove a peep invitation |

### Subscriptions Resource (API Key Only)

| Operation | Description |
|-----------|-------------|
| **List Public Vybits** | Browse publicly available vybits |
| **Get Public Vybit** | Get details of a public vybit |
| **Subscribe** | Subscribe to a vybit |
| **List My Subscriptions** | Get your subscriptions |
| **Get Subscription** | Get subscription details |
| **Update Subscription** | Update subscription settings |
| **Unsubscribe** | Unsubscribe from a vybit |
| **Send to Owner** | Send notification to vybit owner |
| **Send to Group** | Send notification to all subscribers |

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

This package bundles `@vybit/api-sdk` and `@vybit/oauth2-sdk` to meet n8n's verified node requirements (zero runtime dependencies).

### Building

```bash
npm run build
```

### Testing Locally

```bash
npm link
cd /path/to/n8n
npm link @vybit/n8n-nodes
n8n start
```

---

## Resources

- 📖 [Developer API Documentation](https://developer.vybit.net/api-reference)
- 🔐 [OAuth2 Documentation](https://developer.vybit.net/oauth-reference)
- 💬 [Support](mailto:developer@vybit.net)
- 🐛 [Report Issues](https://gitlab.com/flatirontek/vybit-sdk/-/issues)

---

## Related Packages

Part of the Vybit SDK monorepo:

- [@vybit/api-sdk](https://www.npmjs.com/package/@vybit/api-sdk) - Developer API client
- [@vybit/oauth2-sdk](https://www.npmjs.com/package/@vybit/oauth2-sdk) - OAuth2 client
- [@vybit/mcp-server](https://www.npmjs.com/package/@vybit/mcp-server) - MCP server for AI assistants

---

## License

MIT © Flatirontek LLC
