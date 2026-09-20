# Vybit n8n Node Deployment Guide

This guide covers different deployment scenarios for the Vybit n8n community node.

## Deployment Scenarios

### 1. Personal / Single-User n8n (Community Edition)

**Best for:** Individual users running their own n8n instance

**n8n Plan:** Community (Free)

**Setup:**
1. Install the node: `npm install @vybit/n8n-nodes-vybit`
2. Create an OAuth2 app at [developer.vybit.net](https://developer.vybit.net)
3. Add a redirect URI: `http://your-n8n-url/rest/oauth2-credential/callback` (up to three redirect URIs may be registered, e.g. production plus `http://localhost` for local development)
4. In n8n, add Vybit OAuth2 credential with your Client ID and Secret
5. Connect and authorize your Vybit account

**Security:** You manage your own credentials - perfect for personal use.

---

### 2. Multi-User Self-Hosted n8n (Paid Plans)

**Best for:** Organizations running n8n for multiple team members

**n8n Plan:** Self-Hosted Business or Enterprise (supports user management)

**Setup:**

1. **Admin Creates OAuth2 App** (one-time setup)
   - Go to [developer.vybit.net](https://developer.vybit.net)
   - Create an OAuth2 application
   - Set redirect URL: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
   - Note your Client ID and Client Secret

2. **Admin Creates Credential in n8n** (one-time setup)
   - In n8n, create a new Vybit OAuth2 credential
   - Enter Client ID and Client Secret
   - Save the credential

3. **Admin Shares Credential with Team**
   - Open the credential settings
   - Use n8n's credential sharing feature
   - Share with specific users or teams

4. **Team Members Use Shared Credential**
   - Add Vybit node to workflow
   - Select the shared credential
   - Click "Connect my account"
   - Authorize with **their own** Vybit account
   - Each user gets their own access token

**User Experience:**
- ✅ Users click "Connect" without entering Client ID/Secret
- ✅ Each user authorizes with their own Vybit account
- ✅ Users cannot view or edit the Client Secret
- ✅ Only credential owner/admin can see sensitive details

**Security:**
- ✅ Client Secret hidden from non-admin users
- ✅ Each user authorizes their own Vybit account
- ✅ Centralized credential management
- ✅ n8n's built-in credential sharing security

---

### 3. n8n Cloud (Managed OAuth)

**Best for:** n8n Cloud users

**n8n Plan:** Any n8n Cloud plan

**Setup:**
1. Search for "Vybit" in the nodes panel and install the verified node
2. Add a Vybit node, Authentication: "OAuth2"
3. Create a Vybit OAuth2 credential and click "Connect my account"
4. Sign in to Vybit and approve access

**How it works:** n8n Cloud holds a Vybit OAuth app registered by Flatirontek and injects its client ID and secret into the credential through n8n's Managed OAuth credential overwrite. The credential form therefore shows no client fields. Each user still authorizes with their own Vybit account and receives their own access token.

**User Experience:**
- ✅ One-click "Connect my account" button
- ✅ No OAuth app registration or client secret handling
- ✅ Each user connects their own Vybit account
- ✅ Bring-your-own OAuth app remains possible for users who want it

---

## Authentication Methods

### OAuth2 (Recommended for Most Users)
- **Use case:** Connecting user's personal Vybit account
- **Operations:** List vybits, Trigger notifications
- **Setup:** Requires OAuth2 app creation at developer.vybit.net
- **Security:** Users authorize access to their account via OAuth flow
- **Multi-user:** Supports credential sharing in paid n8n plans

### Developer API Key (Advanced Users)
- **Use case:** Full programmatic access, backend automation
- **Operations:** Full CRUD operations on vybits, sounds, subscriptions, logs
- **Setup:** Get API key from [developer.vybit.net](https://developer.vybit.net)
- **Security:** API key provides full account access
- **Multi-user:** Each user needs their own API key

---

## n8n Plan Requirements

| Feature | Community (Free) | Paid Plans |
|---------|-----------------|------------|
| Single user | ✅ | ✅ |
| Multiple users | ❌ | ✅ |
| Credential sharing | ❌ | ✅ |

**Note:** Multi-user credential sharing requires n8n paid plans (Self-Hosted Business/Enterprise).

---

## Testing

### Local Testing with Docker

See `docker-compose.test.yml` for local testing setup:

```bash
# Build the node
npm run build

# Start test environment
docker compose -f docker-compose.test.yml up -d

# Access n8n at http://localhost:5678
```

**Note:** The test environment includes additional configuration for local development:
- SSL certificate validation disabled (`NODE_TLS_REJECT_UNAUTHORIZED=0`)
- Debug logging enabled

For testing different environments, create separate production Vybit accounts with different API keys.

---

## Security Best Practices

### For Personal Use (Scenario 1)
- ✅ Create your own OAuth app at developer.vybit.net
- ✅ Keep your Client Secret private
- ✅ Use HTTPS for production instances

### For Multi-User Self-Hosted (Scenario 2)
- ✅ Admin creates one OAuth app for the organization
- ✅ Use n8n's credential sharing (requires paid plan)
- ✅ Regularly review who has access to shared credentials
- ✅ Use HTTPS for production n8n instances
- ✅ Rotate OAuth2 credentials periodically
- ⚠️ Never commit credentials to version control

### For n8n Cloud (Scenario 3)
- ✅ n8n stores the shared OAuth client secret in its vault
- ✅ Users never see or handle a Client Secret
- ✅ Each user's access token is scoped to their own Vybit account

---

## Credential Sharing Deep Dive

### How n8n Credential Sharing Works:

**Credential Owner/Admin:**
- Can create and edit credentials
- Can see all credential fields including Client Secret
- Can share credentials with specific users or teams

**Users with Shared Credential Access:**
- Can use the credential in their workflows
- Can connect their own account (OAuth authorization)
- **Cannot see the Client Secret**
- Cannot edit the credential
- Each user gets their own OAuth access token

**Instance Owners/Admins:**
- Can view all credentials on the instance
- Can manage credential sharing globally

### Example Workflow:

1. **Admin creates Vybit OAuth2 credential**
   ```
   Client ID: abc123
   Client Secret: secret456
   ```

2. **Admin shares with "Marketing Team"**

3. **Marketing team member Sarah:**
   - Adds Vybit node to her workflow
   - Selects the shared credential
   - Clicks "Connect my account"
   - OAuth popup opens
   - Sarah logs in with her Vybit account
   - Sarah authorizes access
   - Workflow can now trigger Sarah's vybits

4. **Marketing team member John:**
   - Same process, but authorizes with his own Vybit account
   - Gets his own access token
   - Can trigger his own vybits

**Result:** One OAuth app, multiple users, each with their own authorization.

---

## Troubleshooting

### OAuth2 Connection Issues

**Problem:** "Connection refused" or SSL errors
- **Solution:** Ensure redirect URL matches exactly (http vs https)
- **Solution:** Check firewall/network settings

**Problem:** "Invalid state parameter" or state too long
- **Solution:** Ensure Vybit server OAuth state parameter limit is set to 512 characters minimum

**Problem:** Can't share credentials
- **Solution:** Credential sharing requires n8n paid plans with user management

### API Key Connection Issues

**Problem:** "Service refused connection"
- **Solution:** Verify API key is valid at [developer.vybit.net](https://developer.vybit.net)
- **Solution:** Check Base URL is set correctly (default: https://api.vybit.net/v1)

---

## Support

- **Node Issues:** [GitLab Issues](https://gitlab.com/flatirontek/vybit-sdk/-/issues)
- **Vybit API:** [developer.vybit.net](https://developer.vybit.net)
- **n8n Community:** [community.n8n.io](https://community.n8n.io)
- **n8n Documentation:** [docs.n8n.io](https://docs.n8n.io)
