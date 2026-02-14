# Vybit n8n Integration Guide

Comprehensive guide for integrating Vybit with n8n workflow automation platform.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Authentication Setup](#authentication-setup)
4. [Available Operations](#available-operations)
5. [Common Workflows](#common-workflows)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The Vybit n8n community node enables you to integrate personalized audio notifications into your n8n workflows. With support for both API Key and OAuth2 authentication, you can automate notification delivery based on any trigger or data source n8n supports.

### Key Features

- 🔐 **Dual Authentication**: Choose between API Key (personal) or OAuth2 (multi-user)
- 🔔 **29 Operations**: Full API coverage across 6 resource types
- 📊 **Rich Data**: Access profiles, usage metrics, logs, and more
- 🎵 **Sound Management**: Search and integrate custom audio
- 👥 **Subscription System**: Discover, subscribe, and share vybits
- ✅ **Zero Dependencies**: Built with zero runtime dependencies

## Installation

### Self-Hosted n8n

```bash
npm install @vybit/n8n-nodes-vybit
```

Then restart your n8n instance:

```bash
# Docker
docker restart n8n

# PM2
pm2 restart n8n

# systemd
sudo systemctl restart n8n
```

<!-- n8n Cloud support coming soon -->

## Authentication Setup

### Option 1: API Key (Recommended for Personal Use)

**Best for:** Personal automation, backend workflows, server monitoring

1. **Get Your API Key**
   - Visit [developer.vybit.net](https://developer.vybit.net)
   - Navigate to the Developer API section
   - Click "Generate API Key"
   - Copy your API key

2. **Configure in n8n**
   - Add a Vybit node to your workflow
   - Click "Credential to connect with"
   - Select "Create New"
   - Choose **"API Key"** as the credential type
   - Name: `Vybit API Key` (or your preference)
   - API Key: Paste your API key
   - Base URL: Use default `https://api.vybit.net/v1` (or custom if needed)
   - Click "Save"

3. **Verify Connection**
   - Set Operation to "Profile" → "Get Profile"
   - Click "Execute Node"
   - You should see your profile information

### Option 2: OAuth2 Token (For Multi-User Services)

**Best for:** Team workflows, multi-user scenarios, agency clients

1. **Register OAuth Application**
   - Visit [developer.vybit.net](https://developer.vybit.net)
   - Navigate to OAuth Configuration
   - Enter your OAuth Client ID
   - Set Redirect URI: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
   - Save and copy your Client ID and Client Secret

2. **Configure in n8n**
   - Add a Vybit node to your workflow
   - Click "Credential to connect with"
   - Select "Create New"
   - Choose **"OAuth2 Token"** as the credential type
   - Name: `Vybit OAuth2` (or your preference)
   - Client ID: Paste your Client ID
   - Client Secret: Paste your Client Secret
   - Click "Connect my account"
   - Authorize access in the popup window
   - Click "Save"
   - Back on the node, click the **refresh icon** (circular arrow) next to the "Vybit" dropdown to load your vybits

3. **Verify Connection**
   - Set Operation to "Vybits" → "List"
   - Click "Execute Node"
   - You should see your vybits

## Available Operations

### Profile Resource (API Key Only)

| Operation | Description | Use Case |
|-----------|-------------|----------|
| **Get Profile** | Retrieve account information | Display user details, verify account |
| **Get Usage Metrics** | View current usage and tier limits | Monitor quota, check tier status |
| **Check API Status** | Verify API service health | Health checks, uptime monitoring |

**Example: Monitor Usage**
```
Profile → Get Usage Metrics
→ IF (daily usage > 80% of limit)
→ Email (send warning to admin)
```

### Vybits Resource

| Operation | Auth Types | Description |
|-----------|-----------|-------------|
| **List** | API Key, OAuth2 | Get all your vybits |
| **Get** | API Key | Get specific vybit details |
| **Create** | API Key | Create a new vybit |
| **Update** | API Key | Modify vybit settings |
| **Delete** | API Key | Remove a vybit |
| **Trigger** | API Key, OAuth2 | Send a notification |

**Example: Create and Trigger**
```
Airtable (new record)
→ Vybit Create (name from record)
→ Set (save vybit triggerKey)
→ Vybit Trigger (send test notification)
→ Airtable Update (save triggerKey to record)
```

### Logs Resource (API Key Only)

| Operation | Description | Parameters |
|-----------|-------------|------------|
| **List All** | View all notification logs | search, limit, offset |
| **Get** | Get specific log entry | logKey |
| **List by Vybit** | View logs for a vybit | vybitKey, search, limit, offset |
| **List by Subscription** | View logs for a subscription | followingKey, search, limit, offset |

**Example: Monitor Failed Notifications**
```
Schedule (every hour)
→ Logs List All (search: "failed")
→ IF (count > 0)
→ Slack (alert team)
```

### Sounds Resource (API Key Only)

| Operation | Description | Parameters |
|-----------|-------------|------------|
| **Search** | Find available sounds | search, limit, offset |
| **Get** | Get sound details | soundKey |

**Example: Find and Use Sound**
```
Vybit Sounds Search (search: "alert")
→ Set (extract first sound key)
→ Vybit Create (use sound key)
```

### Peeps Resource (API Key Only)

| Operation | Description | Use Case |
|-----------|-------------|----------|
| **List All** | View all invitations | See all peeps across vybits |
| **List by Vybit** | View peeps for a vybit | Check who has access |
| **Invite** | Invite user to a vybit | Grant access to private vybit |
| **Get** | Get peep details | View invitation status |
| **Delete** | Remove invitation | Revoke access |

**Example: Auto-Invite Team**
```
Google Sheets (new team member)
→ Vybit Peeps Invite (invite to team vybit)
→ Slack (notify new member)
```

### Subscriptions Resource (API Key Only)

| Operation | Description | Use Case |
|-----------|-------------|----------|
| **List Public Vybits** | Browse public vybits | Discover available vybits |
| **Get Public Vybit** | Get public vybit details | Preview before subscribing |
| **Subscribe** | Subscribe to a vybit | Follow public notification |
| **List My Subscriptions** | View your subscriptions | See what you're following |
| **Get Subscription** | Get subscription details | Check subscription status |
| **Update Subscription** | Modify settings | Change preferences |
| **Unsubscribe** | Cancel subscription | Stop following |
| **Send to Owner** | Message vybit owner | Two-way communication |
| **Send to Group** | Message all subscribers | Group broadcast |

**Example: Auto-Subscribe to Weather Alerts**
```
HTTP Request (fetch weather vybits API)
→ Split In Batches
→ Vybit Subscribe (to each weather vybit)
```

## Common Workflows

### 1. Server Monitoring Alert

**Trigger:** Schedule (every 5 minutes)
**Goal:** Check server health and alert on issues

```
Schedule Trigger (every 5 minutes)
  ↓
HTTP Request (check server endpoint)
  ↓
IF (status != 200)
  ↓
Vybit Trigger
  - Vybit: "Server Alert"
  - Message: "Server down!"
  - Link URL: "https://dashboard.example.com"
  ↓
Email (notify ops team)
```

### 2. Daily Summary Report

**Trigger:** Schedule (daily at 9am)
**Goal:** Send daily metrics as notification

```
Schedule Trigger (daily 9am)
  ↓
Database Query (get yesterday's metrics)
  ↓
Function (format summary message)
  ↓
Vybit Trigger
  - Vybit: "Daily Summary"
  - Message: "Sales: ${{sales}}, Users: {{users}}"
  - Image URL: "{{chart_url}}"
  ↓
Slack (post to #daily-reports)
```

### 3. Airtable to Vybit Sync

**Trigger:** Airtable (new record)
**Goal:** Auto-create vybits from database

```
Airtable Trigger (new record)
  ↓
Vybit Create
  - Name: {{record.name}}
  - Description: {{record.description}}
  - Trigger Type: "webhook"
  ↓
Set (extract triggerKey and triggerUrl)
  ↓
Airtable Update Record
  - Trigger URL: {{triggerUrl}}
  ↓
Vybit Trigger (send test notification)
```

### 4. Webhook to Notification

**Trigger:** Webhook (external system)
**Goal:** Convert webhooks to push notifications

```
Webhook Trigger
  ↓
Function (parse webhook payload)
  ↓
Switch (route by event type)
  ├─ Case "error" → Vybit Trigger (Error Alert)
  ├─ Case "warning" → Vybit Trigger (Warning Alert)
  └─ Case "info" → Vybit Trigger (Info Alert)
  ↓
HTTP Request (acknowledge webhook)
```

### 5. Subscription Discovery

**Trigger:** Manual
**Goal:** Find and subscribe to public vybits

```
Manual Trigger
  ↓
Vybit Subscriptions List Public
  - Search: "weather"
  - Limit: 10
  ↓
Split In Batches
  ↓
Code (filter by criteria)
  ↓
Vybit Subscribe
  ↓
Google Sheets (log new subscriptions)
```

## Best Practices

### 1. Error Handling

Always add error handling to prevent workflow failures:

```
Vybit Node
  ├─ On Success → Continue workflow
  └─ On Error → Error handler
       ↓
     IF (error code == 429)
       → Wait (60 seconds)
       → Retry Vybit Node
     ELSE
       → Log error
       → Send alert to admin
```

### 2. Rate Limiting

Respect API rate limits based on your tier:

```
Split In Batches
  - Batch Size: 10
  ↓
Loop Over Items
  ↓
Vybit Trigger
  ↓
Wait (1 second) // Prevent rate limiting
```

### 3. Data Validation

Validate data before triggering notifications:

```
HTTP Request (get data)
  ↓
IF (data exists AND data.value > threshold)
  ↓
Vybit Trigger
ELSE
  ↓
No Operation
```

### 4. Credential Security

- **Never** hardcode API keys in workflows
- Use n8n's credential system
- For OAuth2: Share credentials (paid plans) instead of Client Secrets
- Rotate API keys periodically

### 5. Testing

Create separate vybits for testing:

```
IF (environment == "production")
  → Vybit Trigger (Production Alert)
ELSE
  → Vybit Trigger (Test Alert)
```

## Troubleshooting

### Connection Issues

**Problem:** "Failed to connect to Vybit API"

**Solutions:**
- Verify API key is correct at [developer.vybit.net](https://developer.vybit.net)
- Check Environment setting matches your API key
- Ensure n8n can reach `vybit.net` (firewall/proxy)
- Try "Check API Status" operation to verify connectivity

### OAuth2 Issues

**Problem:** "OAuth connection failed" or "Invalid state parameter"

**Solutions:**
- Verify Redirect URI matches exactly (http vs https)
- Check Client ID and Client Secret are correct
- Ensure OAuth app is active at developer.vybit.net
- Clear browser cache and retry authorization

### Rate Limiting

**Problem:** "429 Too Many Requests"

**Solutions:**
- Check your tier limits: Profile → Get Usage Metrics
- Add delays between requests (see Best Practices)
- Upgrade your Vybit tier if needed
- Batch operations where possible

### Missing Operations

**Problem:** "Can't find operation X"

**Solutions:**
- Check authentication type (some operations require API Key)
- Verify you're using latest version: `npm update @vybit/n8n-nodes-vybit`
- OAuth2 only supports: List Vybits, Trigger Vybit

### Execution Errors

**Problem:** "Vybit key not found" or "Invalid parameters"

**Solutions:**
- Verify vybitKey/soundKey/logKey exists
- Check field names match exactly (case-sensitive)
- Use "Get" operation to verify resource exists first
- Review parameter requirements in node UI

## Advanced Usage

### Dynamic Vybit Selection

Use expressions to dynamically select which vybit to trigger:

```javascript
// In Vybit Key field
{{ $json.eventType === 'error' ? 'error-vybit-key' : 'info-vybit-key' }}
```

### Conditional Notifications

Only send notifications when conditions are met:

```javascript
// In IF node
{{ $json.temperature > 85 && $json.humidity > 70 }}
```

### Message Templating

Build dynamic messages with data:

```javascript
// In Message field
CPU: {{ $json.cpu }}%
Memory: {{ $json.memory }}%
Status: {{ $json.status }}
```

### Image Generation

Create dynamic charts before triggering:

```
Function (generate chart data)
  ↓
QuickChart (create chart image)
  ↓
Vybit Trigger
  - Image URL: {{ $json.chartUrl }}
```

## Support

- **Node Issues:** [GitLab Issues](https://gitlab.com/flatirontek/vybit-sdk/-/issues)
- **Vybit API:** [developer.vybit.net](https://developer.vybit.net)
- **n8n Community:** [community.n8n.io](https://community.n8n.io)
- **Email:** developer@vybit.net

## Additional Resources

- **Node README:** [packages/n8n-nodes/README.md](../packages/n8n-nodes/README.md)
- **Deployment Guide:** [packages/n8n-nodes/DEPLOYMENT.md](../packages/n8n-nodes/DEPLOYMENT.md)
- **API Reference:** [developer.vybit.net/api-reference](https://developer.vybit.net/api-reference)
- **Example Workflows:** [examples/n8n/](../examples/n8n/)
