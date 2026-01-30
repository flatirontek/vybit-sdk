# Integration Tests for Vybit n8n Nodes

Automated integration tests that validate the Vybit n8n node against a running n8n instance.

## Overview

These are **structural/configuration tests** that:
- Create test workflows via n8n's REST API
- Validate that all node parameters are configured correctly
- Test all 28 operations across 6 resources: Profile, Vybits, Subscriptions, Sounds, Logs, Peeps
- Clean up test workflows after completion

**Important:** These tests validate node configuration but do NOT execute the workflows or make actual API calls to Vybit. This is because n8n's public API doesn't support workflow execution. For actual execution testing, use the n8n UI to manually test workflows.

### What These Tests Validate:
✅ Node can be added to workflows
✅ All parameters are correctly defined
✅ Credentials are properly linked
✅ Operation names and types are correct
✅ Required fields are properly marked

### What These Tests Don't Validate:
❌ Actual API calls to Vybit
❌ Response data from Vybit API
❌ Error handling during execution
❌ Runtime behavior

For comprehensive testing, combine these automated structural tests with manual execution testing in the n8n UI.

## Prerequisites

1. **Running n8n instance** (Docker or local)
   ```bash
   docker ps | grep n8n  # Should show running container
   ```

2. **Vybit Developer API Credential in n8n**
   - Create a "Vybit Developer API" credential in n8n
   - Settings → Credentials → Add Credential → Vybit Developer API
   - Get your API key from https://developer.vybit.net
   - **Important**: Use a test/development API key, not production
   - Note the credential ID from the URL when editing the credential

3. **OAuth2 Credential** (optional, for OAuth2 tests)
   - Set up OAuth2 connection in n8n UI first
   - Note the credential ID from n8n

## Setup

### Environment Variables

Create a `.env` file in the `packages/n8n-nodes` directory:

```bash
# n8n instance URL (default: http://localhost:5678)
N8N_API_URL=http://localhost:5678

# n8n API key (required if your n8n instance has API authentication enabled)
# Get this from: Settings → API → Create API Key
# N8N_API_KEY=your-n8n-api-key

# Vybit API credential ID from n8n (required)
# Get this from: Settings → Credentials → Click your Vybit API credential → Copy ID from URL
VYBIT_API_CREDENTIAL_ID=your-credential-id-from-n8n

# OAuth2 credential ID from n8n (optional, for OAuth2 tests)
# VYBIT_OAUTH2_CREDENTIAL_ID=credential-id-from-n8n
```

### How to Get Your n8n API Key (if required)

1. Open n8n at http://localhost:5678
2. Go to **Settings → API**
3. Click **Create API Key**
4. Copy the generated API key
5. Set it as an environment variable:

```bash
export N8N_API_KEY="your-api-key-here"
```

### How to Get Your Credential ID

1. Open n8n at http://localhost:5678
2. Go to **Settings → Credentials**
3. Click on your **Vybit Developer API** credential
4. Look at the URL - it will be something like: `http://localhost:5678/credentials/MwvVrgf7zQLarWnZ`
5. Copy the ID part: `MwvVrgf7zQLarWnZ`

Then set it:

```bash
export VYBIT_API_CREDENTIAL_ID="MwvVrgf7zQLarWnZ"
export N8N_API_URL="http://localhost:5678"
```

## Running Tests

```bash
# From the n8n-nodes package directory
npm run test:integration

# Or with inline environment variables
VYBIT_API_KEY=xxx npm run test:integration
```

## Test Coverage

### Profile Resource
- ✅ Get Profile
- ⏭️ Get Usage Metrics (skipped - similar structure)

### Vybits Resource
- ✅ List

### Subscriptions Resource
- ✅ List Public

### Sounds Resource
- ✅ Search

### Logs Resource
- ✅ List All

### Peeps Resource
- ✅ List All

## How It Works

1. **Workflow Creation**: Tests create n8n workflows via the REST API
2. **Node Configuration**: Each workflow contains a Vybit node with specific parameters
3. **Validation**: Tests verify the node is configured correctly
4. **Cleanup**: Workflows are automatically deleted after testing

## Limitations

- Tests validate workflow configuration, not actual execution
- n8n's public API doesn't support direct workflow execution
- For full end-to-end testing, use manual testing in the n8n UI

## Troubleshooting

### "Failed to connect to n8n"
- Check n8n is running: `docker ps | grep n8n`
- Verify N8N_API_URL is correct
- Check firewall/network settings

### "VYBIT_API_KEY environment variable is required"
- Set the environment variable before running tests
- Get API key from https://developer.vybit.net

### Tests fail with 401/403
- Check your Vybit API key is valid
- Verify n8n API key if using hosted instance

## Future Enhancements

Potential improvements:
- Add actual workflow execution tests (requires webhook approach)
- Add OAuth2 flow tests
- Add more comprehensive operation tests
- Add performance/load testing
- Integrate with CI/CD pipeline
