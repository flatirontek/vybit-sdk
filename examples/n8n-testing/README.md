# n8n Local Testing Environment

This directory contains a Docker Compose setup for testing the Vybit n8n node locally.

## Quick Start

1. **Build the n8n node package:**
   ```bash
   cd /path/to/vybit-sdk/packages/n8n-nodes
   npm run build
   ```

2. **Start the test environment:**
   ```bash
   cd /path/to/vybit-sdk/examples/n8n-testing
   docker compose up -d
   ```

3. **Access n8n:**
   - Open http://localhost:5678
   - Set up your first workflow

4. **Stop the environment:**
   ```bash
   docker compose down
   ```

## What's Included

- **n8n instance** running on port 5678
- **Auto-mounted Vybit node** from your local build
- **Development configuration**:
  - Basic auth disabled for easier testing
  - Debug logging enabled
  - TLS verification disabled for local testing

## Testing the Vybit Node

1. Create a credential in n8n (Settings → Credentials)
2. Add a Vybit node to a workflow
3. Test the node operations
4. Make changes to the node source code
5. Rebuild with `npm run build` in packages/n8n-nodes
6. Restart the container: `docker compose restart`

## Troubleshooting

**Node not showing up:**
- Verify the build was successful
- Check that paths in docker-compose.yml are correct
- Restart the container

**Can't connect to Vybit API:**
- Ensure you're using a valid API key from developer.vybit.net
- For testing different environments, create separate Vybit accounts with different API keys

## Security Notes

⚠️ **WARNING**: This configuration is for **LOCAL DEVELOPMENT ONLY**

The docker-compose.yml file includes security settings that are **UNSAFE FOR PRODUCTION**:

- `NODE_TLS_REJECT_UNAUTHORIZED=0` - Disables SSL certificate verification
  - Allows testing against self-signed certificates
  - Makes you vulnerable to man-in-the-middle attacks
  - **NEVER use this in production**

- `N8N_BASIC_AUTH_ACTIVE=false` - Disables authentication
  - Anyone on your network can access the instance
  - Only appropriate for isolated development environments

**For production deployments:**
- Use valid SSL certificates (Let's Encrypt, commercial CA)
- Enable n8n authentication
- Use environment variables for secrets
- Follow n8n's security best practices

## Notes

- Data persists in a Docker volume (`n8n_data`)
- To reset completely: `docker compose down -v`
- Custom nodes are mounted read-only from your build directory
