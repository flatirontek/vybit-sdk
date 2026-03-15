# Vybit SDK

Official TypeScript/JavaScript SDKs for integrating with the Vybit notification platform.

[Vybit](https://www.vybit.net) is a push notification service with personalized sounds that can be recorded or chosen from a library of thousands of searchable sounds (via [freesound.org](https://freesound.org)).

[![npm version](https://badge.fury.io/js/%40vybit%2Fapi-sdk.svg)](https://www.npmjs.com/package/@vybit/api-sdk)
[![npm version](https://badge.fury.io/js/%40vybit%2Foauth2-sdk.svg)](https://www.npmjs.com/package/@vybit/oauth2-sdk)
[![npm version](https://badge.fury.io/js/%40vybit%2Fcli.svg)](https://www.npmjs.com/package/@vybit/cli)
[![npm version](https://badge.fury.io/js/%40vybit%2Fmcp-server.svg)](https://www.npmjs.com/package/@vybit/mcp-server)
[![npm version](https://badge.fury.io/js/%40vybit%2Fn8n-nodes-vybit.svg)](https://www.npmjs.com/package/@vybit/n8n-nodes-vybit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Vybit provides multiple integration options for different use cases:

| Package | Use Case | Authentication | Best For |
|---------|----------|----------------|----------|
| **[@vybit/api-sdk](./packages/api)** | Backend/automation | API Key or OAuth2 Token | Server-to-server integrations, automation, monitoring systems |
| **[@vybit/oauth2-sdk](./packages/oauth2)** | User-facing applications | OAuth 2.0 (user authorization) | Web apps where users connect their Vybit accounts (auth flow only) |
| **[@vybit/cli](./packages/cli)** | Command line | API Key or OAuth2 Token | Shell scripting, CI/CD, agent tooling, quick operations |
| **[@vybit/mcp-server](./packages/mcp-server)** | AI assistants | API Key or OAuth2 Token | Claude Desktop, Claude Code, and other MCP-compatible AI tools |
| **[@vybit/n8n-nodes-vybit](./packages/n8n-nodes)** | Workflow automation | API Key or OAuth2 | n8n workflows, no-code/low-code automation, integration platforms |

All packages share common utilities from **[@vybit/core](./packages/core)**.

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

// With API key
const client = new VybitAPIClient({
  apiKey: 'your-api-key-from-developer-portal'
});

// Or with an OAuth2 access token
const client = new VybitAPIClient({
  accessToken: 'your-oauth2-access-token'
});
```

### Common Operations

#### Create and Manage Vybits

```typescript
// Create a vybit (only name is required)
const vybit = await client.createVybit({
  name: 'Server Alert'
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
  status: 'on'
});

// Delete a vybit
await client.deleteVybit('vybit-id');
```

#### Trigger Notifications

```typescript
// Simple trigger
await client.triggerVybit('vybit-key');

// Trigger with custom content
await client.triggerVybit('vybit-key', {
  message: 'Server CPU usage at 95%',
  imageUrl: 'https://example.com/graph.png',  // Must be a direct link to a JPG, PNG, or GIF image
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

#### Discover and Subscribe to Public Vybits

```typescript
// Browse public vybits (returns PublicVybit[])
const publicVybits = await client.listPublicVybits({
  search: 'weather',
  limit: 10
});

// Get details about a public vybit before subscribing
const vybitDetails = await client.getPublicVybit('subscription-key-abc123');

// Subscribe to a public vybit using its subscription key
const follow = await client.createVybitFollow({
  subscriptionKey: vybitDetails.key
});

// List your subscriptions
const subscriptions = await client.listVybitFollows();

// Unsubscribe from a vybit
await client.deleteVybitFollow(follow.followingKey);
```

#### Monitor Usage

```typescript
// Get current usage and limits
const meter = await client.getMeter();
console.log(`Daily: ${meter.count_daily} / ${meter.cap_daily}`);
console.log(`Monthly: ${meter.count_monthly} / ${meter.cap_monthly}`);
console.log(`Tier: ${meter.tier_id}`);
```

### API Reference

- **📖 Interactive Documentation**: [developer.vybit.net/api-reference](https://developer.vybit.net/api-reference)
- **📋 OpenAPI Spec**: [docs/openapi/developer-api.yaml](./docs/openapi/developer-api.yaml)

---

## OAuth2 SDK

**For user-facing applications that need to access Vybit on behalf of users**

The OAuth2 SDK handles the authorization flow only. Once you have an access token, use `VybitAPIClient` from `@vybit/api-sdk` for all API operations.

### Installation

```bash
npm install @vybit/oauth2-sdk @vybit/api-sdk
```

### Getting Started

1. **Register Your Application**
   - Sign up at [developer.vybit.net](https://developer.vybit.net)
   - Navigate to the OAuth Configuration section
   - Enter your OAuth Client ID and Redirect URI
   - Copy your Client ID and Client Secret

2. **Initialize the OAuth2 Client**

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

const oauthClient = new VybitOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/oauth/callback'
});
```

### OAuth Flow

#### Step 1: Redirect User to Authorization

```typescript
const authUrl = oauthClient.getAuthorizationUrl({
  state: 'random-state-string'
});

// Redirect user to authUrl
// They will authorize your app and be redirected back to your redirectUri
```

#### Step 2: Exchange Authorization Code for Token

```typescript
// After redirect, extract the code from query params
const code = urlParams.get('code');

// Exchange code for access token
const token = await oauthClient.exchangeCodeForToken(code);

// Store token.access_token securely for future requests
```

#### Step 3: Use the Token with the API SDK

```typescript
import { VybitAPIClient } from '@vybit/api-sdk';

// Create an API client with the OAuth2 access token
const apiClient = new VybitAPIClient({
  accessToken: token.access_token
});

// Now use the full Developer API on behalf of the user
const vybits = await apiClient.listVybits();
await apiClient.triggerVybit('vybit-key', {
  message: 'Hello from your app!'
});
```

### Token Management

```typescript
// Verify a token is still valid
const isValid = await oauthClient.verifyToken(token.access_token);

// Store and retrieve tokens
oauthClient.setAccessToken('existing-token');
const currentToken = oauthClient.getAccessToken();
```

### API Reference

- **📖 Interactive Documentation**: [developer.vybit.net/oauth-reference](https://developer.vybit.net/oauth-reference)
- **📋 OpenAPI Spec**: [docs/openapi/oauth2.yaml](./docs/openapi/oauth2.yaml)

---

## CLI

**For command-line access, shell scripting, CI/CD pipelines, and AI agent tooling**

The Vybit CLI provides full parity with the MCP server — every operation available to AI assistants is also available from the command line. All output is structured JSON to stdout, making it equally useful for humans, shell scripts, and AI agents.

### Installation

```bash
npm install -g @vybit/cli
```

### Authentication

```bash
# Option 1: Environment variable (recommended for CI/CD and agents)
export VYBIT_API_KEY='your-api-key'

# Option 2: Config file
vybit auth setup --api-key 'your-api-key'

# Option 3: Per-command flag
vybit --api-key 'your-api-key' vybits list
```

Credentials are resolved in order: CLI flags > environment variables > config file (`~/.config/vybit/config.json`).

### Common Operations

```bash
# List your vybits
vybit vybits list

# Create a vybit
vybit vybits create --name "Deploy Alert" --trigger-type webhook

# Trigger a notification
vybit trigger <vybit-key> --message "Build passed"

# Trigger in CI/CD (quiet mode returns just the key/ID)
vybit trigger <vybit-key> --message "$(git log -1 --oneline)" -q

# Search sounds
vybit sounds list --search "bell"

# Check usage
vybit meter
```

### Available Commands

| Command | Operations |
|---------|-----------|
| `vybit vybits` | `list`, `get`, `create`, `update`, `delete` |
| `vybit trigger` | Trigger a vybit notification |
| `vybit reminders` | `list`, `create`, `update`, `delete` |
| `vybit sounds` | `list`, `get` |
| `vybit subscriptions` | `list`, `get`, `create`, `update`, `delete` |
| `vybit browse` | `list`, `get` (public vybits) |
| `vybit logs` | `list`, `get`, `vybit`, `subscription` |
| `vybit peeps` | `list`, `get`, `create`, `delete`, `vybit` |
| `vybit meter` | API usage metrics |
| `vybit status` | API health check |
| `vybit profile` | User profile info |
| `vybit auth` | `setup`, `status`, `logout` |

### Agent-Friendly Design

- **JSON to stdout** — all data output is parseable JSON
- **Errors to stderr** — structured `{"error":"...","statusCode":404}` format
- **Exit codes** — 0 success, 1 error, 2 auth error
- **`--quiet` / `-q`** — output only keys/IDs for chaining commands
- **Never prompts** — all input via flags, safe for non-interactive use

---

## MCP Server

**For AI assistants like Claude to interact with your Vybit notifications**

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server enables AI assistants to manage your Vybit notifications through natural conversation. It provides **full parity** with the Developer API, giving AI assistants access to all Vybit features.

### Installation

```bash
npm install -g @vybit/mcp-server
```

### Configuration

Add to your MCP client configuration (use either `VYBIT_API_KEY` or `VYBIT_ACCESS_TOKEN`):

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "vybit": {
      "command": "npx",
      "args": ["-y", "@vybit/mcp-server"],
      "env": {
        "VYBIT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Claude Code** (`.claude/mcp.json` in your project):
```json
{
  "mcpServers": {
    "vybit": {
      "command": "npx",
      "args": ["-y", "@vybit/mcp-server"],
      "env": {
        "VYBIT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

> **nvm users:** Claude Desktop doesn't source your shell profile, so `node`/`npx` may resolve to the wrong version. Use `which node` and `npm root -g` to find your paths, then use `node` directly instead of `npx`. See the [MCP Server README](./packages/mcp-server/README.md#troubleshooting-nvm-users) for details.

### What You Can Do

Once configured, you can ask your AI assistant to:

- **Manage Vybits**: Create, update, delete, and list your notification vybits
- **Send Notifications**: Trigger notifications with custom messages and content
- **Discover Public Vybits**: Browse and search public vybits created by others
- **Manage Subscriptions**: Subscribe to public vybits and manage your subscriptions
- **Browse Sounds**: Search available notification sounds
- **View Logs**: See notification history for your vybits and subscriptions
- **Manage Access**: Invite people to private vybits and control permissions
- **Manage Reminders**: Create, update, and delete scheduled reminders on vybits
- **Monitor Usage**: Check your API usage and quota limits

### Example Conversations

```
You: Create a vybit called "Server Alert" for webhooks with an alarm sound
Claude: [Creates the vybit and shows details including trigger URL]

You: Trigger my Server Alert vybit with message "CPU at 95%"
Claude: [Sends the notification]

You: What public vybits are available about weather?
Claude: [Shows matching public vybits]

You: Subscribe me to the "Daily Weather" vybit
Claude: [Subscribes and confirms]

You: Show me recent notifications for my Server Alert
Claude: [Lists notification logs]
```

### Features

The MCP server provides **30 tools** across all Vybit API features:
- Vybit management (6 tools)
- Reminder management (4 tools)
- Public vybit discovery (2 tools)
- Subscription management (5 tools)
- Sound browsing (2 tools)
- Notification logs (4 tools)
- Access control / peeps (5 tools)
- Usage monitoring (1 tool)

### Compatibility

Works with any MCP-compatible client:
- ✅ Claude Desktop
- ✅ Claude Code
- ✅ Cline (VS Code extension)
- ✅ Zed Editor
- ✅ Continue.dev
- ✅ Any other MCP-compatible AI tool

### Documentation

See the [MCP Server README](./packages/mcp-server/README.md) for complete documentation.

---

## n8n Community Nodes

**For workflow automation and no-code/low-code integrations**

### Installation

**Self-Hosted n8n:**
```bash
npm install @vybit/n8n-nodes-vybit
```
Then restart your n8n instance.

<!-- n8n Cloud support coming soon -->

### Getting Started

The Vybit n8n node supports both authentication methods:

**Option 1: API Key (Recommended for Personal Automation)**
1. Get your API key from [developer.vybit.net](https://developer.vybit.net)
2. In n8n, add a Vybit node
3. Select "API Key" authentication
4. Create a new credential and paste your API key

**Option 2: OAuth2 (For Multi-User Services)**
1. Configure OAuth2 at [developer.vybit.net](https://developer.vybit.net)
2. In n8n, select "OAuth2 Token" authentication
3. Connect and authorize your Vybit account

### Available Operations

The n8n node provides access to **33 operations** across 7 resources:

**Profile** (3 operations)
- Get Profile
- Get Usage Metrics
- Check API Status

**Vybits** (6 operations)
- List, Get, Create, Update, Delete, Trigger

**Logs** (4 operations)
- List All, Get, List by Vybit, List by Subscription

**Sounds** (2 operations)
- Search, Get

**Peeps** (5 operations)
- List All, List by Vybit, Invite, Get, Delete

**Subscriptions** (9 operations)
- List Public, Get Public, Subscribe, List My Subscriptions, Get Subscription, Update Subscription, Unsubscribe, Send to Owner, Send to Group

**Reminders** (4 operations)
- List, Create, Update, Delete

### Example Workflows

**Alert on Server Error:**
```
HTTP Request (check API)
  → IF (status != 200)
  → Vybit (Trigger notification)
  → Email (alert team)
```

**Daily Report:**
```
Schedule (daily 9am)
  → Database Query (get metrics)
  → Vybit (Trigger with summary)
  → Slack (post to channel)
```

**Automated Vybit Creation:**
```
Airtable Trigger (new record)
  → Vybit (Create vybit)
  → Airtable (update record with trigger URL)
```

### Documentation

- **📖 Node Documentation**: [packages/n8n-nodes/README.md](./packages/n8n-nodes/README.md)
- **🚀 Deployment Guide**: [packages/n8n-nodes/DEPLOYMENT.md](./packages/n8n-nodes/DEPLOYMENT.md)
- **📋 Integration Guide**: [docs/n8n-integration-guide.md](./docs/n8n-integration-guide.md)
- **💡 Example Workflows**: [examples/n8n/](./examples/n8n/)

---

## Environment Management

Both SDKs connect to Vybit production endpoints:
- **OAuth Authorization**: `https://app.vybit.net`
- **API Endpoints**: `https://api.vybit.net/v1`

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

### OAuth2 Examples
- **oauth2-simple.js** - Basic OAuth 2.0 flow
- **oauth2-complete-flow.js** - Complete OAuth implementation with error handling
- **oauth2-express-server.js** - Full Express.js integration with session management

### n8n Workflow Examples
- **n8n/server-monitoring.json** - Monitor server health and alert on errors
- **n8n/daily-summary.json** - Send daily summary notifications
- **n8n/airtable-integration.json** - Create vybits from Airtable records
- **n8n/webhook-to-notification.json** - Convert webhook events to notifications

---

## TypeScript Support

All packages are written in TypeScript and include full type definitions:

```typescript
import {
  VybitAPIClient,
  Vybit,
  PublicVybit,
  VybitCreateParams,
  VybitFollow,
  Reminder
} from '@vybit/api-sdk';
import { VybitOAuth2Client, TokenResponse } from '@vybit/oauth2-sdk';

// Full IntelliSense and type checking
const client: VybitAPIClient = new VybitAPIClient({ apiKey: 'key' });

// Owned vybits return full Vybit type with triggerKey, etc.
const vybit: Vybit = await client.getVybit('id');

// Public discovery returns simplified PublicVybit type
const publicVybits: PublicVybit[] = await client.listPublicVybits();
```

---

## Contributing

Interested in contributing? Check out our [Contributing Guide](./CONTRIBUTING.md) for:
- Development setup and testing
- Code style guidelines
- Pull request process
- How to report issues

---

## Support

- **Documentation**: [developer.vybit.net](https://developer.vybit.net)
- **Issues**: [GitLab Issues](https://gitlab.com/flatirontek/vybit-sdk/-/issues)
- **Email**: developer@vybit.net

---

## License

MIT
