# @vybit/mcp-server

Model Context Protocol (MCP) server for the Vybit Developer API. Enables AI assistants like Claude to interact with your Vybit notifications programmatically.

[![npm version](https://badge.fury.io/js/%40vybit%2Fmcp-server.svg)](https://www.npmjs.com/package/@vybit/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open protocol that standardizes how AI applications integrate with external data sources and tools. Think of it as a universal connector between AI assistants and your services.

## Features

This MCP server provides AI assistants with **full parity** with the Vybit Developer API:

- **Manage Vybits**: Create, read, update, delete, and list owned vybits
- **Trigger Notifications**: Send notifications with custom messages, images, and links
- **Browse Sounds**: Search and explore available notification sounds
- **View Notification Logs**: See notification history for vybits and subscriptions
- **Manage Access (Peeps)**: Invite people to private vybits and manage permissions
- **Monitor Usage**: Check API usage and limits
- **Discover Public Vybits**: Browse and search public vybits created by others
- **Manage Subscriptions**: Subscribe to public vybits, view subscriptions, and unsubscribe

## Installation

```bash
npm install -g @vybit/mcp-server
```

```

## Setup

### 1. Get Your API Key

1. Sign up at [developer.vybit.net](https://developer.vybit.net)
2. Navigate to the Developer API section, click "</> DEV" then "API Configuration
3. Copy your API key

### 2. Configure Your MCP Client

#### Claude Desktop

Add to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

For development/testing environments create separate Vybit accounts and use different API keys:

```json
{
  "mcpServers": {
    "vybit": {
      "command": "npx",
      "args": ["-y", "@vybit/mcp-server"],
      "env": {
        "VYBIT_API_KEY": "your-dev-api-key",
        "VYBIT_API_URL": "https://api.vybit.net/v1"
      }
    }
  }
}
```

#### Claude Code / Cline

Add to `.claude/mcp.json` in your project:

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

### 3. Restart Your MCP Client

After configuration, restart Claude Desktop or your editor to load the server.

## Usage

Once configured, you can ask your AI assistant to interact with Vybit:

### Example Conversations

**Manage Your Vybits:**
```
You: Show me all my vybits
Claude: [Lists all your vybits with details]

You: Create a vybit called "Server Alert" with an alarm sound for webhooks
Claude: [Creates the vybit and shows the configuration]

You: Trigger my "Server Alert" vybit with message "CPU usage at 95%"
Claude: [Sends the notification]
```

**View Notification History:**
```
You: Show me recent notifications for my Server Alert vybit
Claude: [Lists notification logs for that vybit]

You: What notifications have I received from my subscriptions?
Claude: [Shows logs from subscribed vybits]
```

**Manage Access:**
```
You: Invite friend@example.com to my "Family Updates" vybit
Claude: [Sends invitation to the email]

You: Who has access to my "Family Updates" vybit?
Claude: [Lists all peeps for that vybit]
```

**Browse Sounds and Check Usage:**
```
You: What alert sounds are available?
Claude: [Lists sounds matching "alert"]

You: How much of my API quota have I used today?
Claude: [Shows current usage and limits]
```
**Discover and Subscribe:**
```
You: What public vybits are available about weather?
Claude: [Shows public vybits matching "weather"]

You: Subscribe me to the "Daily Weather Updates" vybit
Claude: [Subscribes and shows subscription details]

You: What am I subscribed to?
Claude: [Lists all your subscriptions]

You: Unsubscribe me from "Daily Weather Updates"
Claude: [Unsubscribes successfully]
```

## Available Tools

The MCP server exposes **26 tools** to AI assistants, providing full parity with the Vybit Developer API:

### Vybit Management (6 tools)

- `vybit_list` - List owned vybits with search and pagination
- `vybit_get` - Get details about a specific owned vybit
- `vybit_create` - Create a new vybit
- `vybit_update` - Update an existing vybit (name, description, status, etc.)
- `vybit_delete` - Delete a vybit
- `vybit_trigger` - Trigger a notification with optional custom content

### Sound Management (2 tools)

- `sounds_list` - List and search available notification sounds
- `sound_get` - Get details about a specific sound

### Notification Logs (4 tools)

- `logs_list` - List all notification logs with search and pagination
- `log_get` - Get details about a specific log entry
- `vybit_logs` - List notification logs for a specific owned vybit
- `subscription_logs` - List notification logs for a specific subscription

### Access Control / Peeps (5 tools)

- `peeps_list` - List all peeps (people you have shared vybits with)
- `peep_get` - Get details about a specific peep
- `peep_create` - Invite someone to a private vybit by email
- `peep_delete` - Remove a peep (revoke access to a vybit)
- `vybit_peeps_list` - List all peeps for a specific vybit

### Monitoring (1 tool)

- `meter_get` - Get API usage and limits (daily/monthly counts and caps)

### Public Vybit Discovery (2 tools)

- `vybits_browse_public` - Browse and search public vybits available for subscription
- `vybit_get_public` - Get details about a public vybit by subscription key

### Subscription Management (6 tools)

- `subscription_create` - Subscribe to a public vybit using its subscription key
- `subscriptions_list` - List all vybits you are subscribed to (following)
- `subscription_get` - Get details about a specific subscription
- `subscription_update` - Update subscription settings (enable/disable, permissions)
- `subscription_delete` - Unsubscribe from a vybit
- `subscription_get_public` - Get public vybit details before subscribing


## Environment Variables

- `VYBIT_API_KEY` (required) - Your Vybit Developer API key
- `VYBIT_API_URL` (optional) - Custom API base URL (defaults to `https://api.vybit.net/v1`).

## Development

### Testing with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run the server with inspector
VYBIT_API_KEY=your-key npx @modelcontextprotocol/inspector node dist/index.js
```

## Security Best Practices

1. **Never commit API keys** - Always use environment variables
2. **Use separate keys** - Create different API keys for development and production
3. **Rotate regularly** - Rotate your API keys periodically
4. **Monitor usage** - Use the `meter_get` tool to track API usage

## Compatibility

This MCP server works with any MCP-compatible client:

- ✅ Claude Desktop
- ✅ Claude Code
- ✅ Cline (VS Code extension)
- ✅ Zed Editor
- ✅ Continue.dev
- ✅ Any other MCP-compatible AI tool

## Support

- **Documentation**: [developer.vybit.net](https://developer.vybit.net)
- **Issues**: [GitLab Issues](https://gitlab.com/flatirontek/vybit-sdk/-/issues)
- **Email**: developer@vybit.net

## Related Packages

- [@vybit/api-sdk](../api) - Developer API SDK (used internally by this MCP server)
- [@vybit/oauth2-sdk](../oauth2) - OAuth 2.0 SDK for user-facing apps
- [@vybit/core](../core) - Core utilities and types

## License

MIT
