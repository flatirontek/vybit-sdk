# Vybit n8n Example Workflows

This directory contains example n8n workflows demonstrating common Vybit integration patterns.

## Quick Start

1. **Import Workflow into n8n:**
   - Open n8n
   - Click **Workflows → Import from File**
   - Select one of the JSON files from this directory
   - Click **Import**

2. **Configure Credentials:**
   - Each workflow will show missing credentials
   - Click on the credential warning
   - Create or select your Vybit credentials (API Key or OAuth2)

3. **Customize & Activate:**
   - Update vybit keys, messages, and parameters as needed
   - Click **Save**
   - Click **Active** to enable the workflow

## Available Examples

### 1. `server-monitoring.json`
**Purpose:** Monitor server health and send alerts

**Trigger:** Schedule (every 5 minutes)

**Flow:**
```
Schedule → HTTP Request (health check)
  → IF (status != 200)
    → Vybit Trigger (send alert)
    → Email (notify team)
```

**Setup:**
1. Update the HTTP Request URL to your server endpoint
2. Configure your "Server Alert" vybit key
3. Set up email credentials for notifications

**Use Cases:**
- Server uptime monitoring
- API health checks
- Service status alerts

---

### 2. `daily-summary.json`
**Purpose:** Send daily summary notifications

**Trigger:** Schedule (daily at 9:00 AM)

**Flow:**
```
Schedule → Function (get date range)
  → Database Query (get metrics)
  → Function (format message)
  → Vybit Trigger (send summary)
```

**Setup:**
1. Configure database credentials
2. Update SQL query for your metrics
3. Set your "Daily Summary" vybit key
4. Customize message format

**Use Cases:**
- Daily reports
- Sales summaries
- User activity digests

---

### 3. `airtable-integration.json`
**Purpose:** Auto-create vybits from Airtable records

**Trigger:** Airtable (new record)

**Flow:**
```
Airtable Trigger → Vybit Create
  → Set (extract trigger URL)
  → Airtable Update (save URL)
  → Vybit Trigger (test notification)
```

**Setup:**
1. Configure Airtable credentials
2. Select your base and table
3. Map Airtable fields to Vybit parameters
4. Set up Vybit API Key credentials

**Use Cases:**
- CMS to notification system
- Dynamic vybit creation
- Database-driven notifications

---

### 4. `webhook-to-notification.json`
**Purpose:** Convert webhook events to push notifications

**Trigger:** Webhook

**Flow:**
```
Webhook → Function (parse payload)
  → Switch (route by event type)
    ├─ error → Vybit Trigger (Error Alert)
    ├─ warning → Vybit Trigger (Warning Alert)
    └─ info → Vybit Trigger (Info Alert)
```

**Setup:**
1. Copy the webhook URL from n8n
2. Configure webhook source to send to URL
3. Set up vybit keys for each alert type
4. Customize message mapping

**Use Cases:**
- GitHub/GitLab notifications
- Payment processor alerts
- Third-party service events

---

## Creating Your Own Workflows

### Basic Pattern

```
Trigger (schedule, webhook, etc.)
  ↓
Get/Transform Data
  ↓
Vybit Node
  - Resource: vybits
  - Operation: trigger
  - Vybit Key: your-vybit-key
  - Message: {{ $json.message }}
  ↓
Follow-up Actions (email, slack, etc.)
```

### Using Expressions

n8n supports JavaScript expressions for dynamic content:

**Dynamic Vybit Selection:**
```javascript
{{ $json.severity === 'critical' ? 'critical-vybit-key' : 'normal-vybit-key' }}
```

**Dynamic Messages:**
```javascript
Server: {{ $json.server }}
CPU: {{ $json.cpu }}%
Memory: {{ $json.memory }}%
Status: {{ $json.status }}
```

**Conditional Execution:**
```javascript
{{ $json.temperature > 85 && $json.alerts_enabled }}
```

### Error Handling

Always add error handling:

```
Vybit Node
  ├─ On Success → Continue
  └─ On Error
       ↓
     IF (status code == 429)
       → Wait (60s)
       → Retry
     ELSE
       → Log Error
       → Email Admin
```

## Tips & Best Practices

### 1. Use Test Vybits
Create separate test vybits for development:
- Production: `my-alert-prod`
- Testing: `my-alert-test`

### 2. Add Delays for Rate Limiting
```
Loop Over Items
  → Vybit Trigger
  → Wait (1 second)
```

### 3. Validate Data First
```
IF (data exists AND data is valid)
  → Vybit Trigger
ELSE
  → No Operation
```

### 4. Use Batch Processing
```
Split In Batches (size: 10)
  → Process Batch
  → Wait (5 seconds)
```

### 5. Log Important Events
```
Vybit Trigger
  → Google Sheets (log event)
  → Slack (notify team)
```

## Common Issues

### "Vybit key not found"
- Verify the vybit key exists in your Vybit account
- Use "Vybits → List" to see all your vybit keys

### "Rate limit exceeded"
- Check usage: "Profile → Get Usage Metrics"
- Add delays between requests
- Consider upgrading your Vybit tier

### "Authentication failed"
- Verify API key at [developer.vybit.net](https://developer.vybit.net)
- For OAuth2: Reconnect and re-authorize
- Check Base URL is set correctly (default: https://api.vybit.net/v1)

## Resources

- **Integration Guide:** [../../docs/n8n-integration-guide.md](../../docs/n8n-integration-guide.md)
- **Node Documentation:** [../../packages/n8n-nodes/README.md](../../packages/n8n-nodes/README.md)
- **API Reference:** [developer.vybit.net/api-reference](https://developer.vybit.net/api-reference)
- **n8n Documentation:** [docs.n8n.io](https://docs.n8n.io)

## Contributing

Have a great workflow example? Submit a PR to add it to this collection!

Requirements:
- Remove any sensitive credentials
- Use generic placeholder values
- Include clear documentation in this README
- Test the import/export process

---

## License

MIT © Flatirontek LLC
