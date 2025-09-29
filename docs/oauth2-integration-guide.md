# Vybit OAuth 2.0 Integration Guide

This guide provides comprehensive documentation for integrating with Vybit's OAuth 2.0 API using the `@vybit/oauth2-sdk`. The implementation mirrors the exact functionality demonstrated in the Vybit developer portal.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Developer Portal Setup](#developer-portal-setup)
4. [SDK Installation and Setup](#sdk-installation-and-setup)
5. [Complete Implementation Walkthrough](#complete-implementation-walkthrough)
6. [Testing Your Integration](#testing-your-integration)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

Vybit's OAuth 2.0 implementation allows your users to connect their Vybit accounts to your service. Once connected, your application can:

- Access their vybit list
- Send personalized notifications on their behalf
- Trigger specific vybits with custom content

The authentication flow follows the standard OAuth 2.0 authorization code grant pattern with 6 distinct steps, exactly as demonstrated in the developer portal.

## Prerequisites

Before starting your integration:

1. **Vybit Account**: You need a Vybit account to access the developer portal
2. **Node.js Environment**: Node.js 16+ and npm for SDK installation
3. **HTTPS Endpoints**: Your redirect URI must use HTTPS in production
4. **Web Server**: Ability to handle OAuth callbacks and store user sessions

## Developer Portal Setup

### Step 1: Access the Developer Portal

1. Log into your Vybit account at https://developer.vybit.net
2. Navigate to the Developer page **</>**
3. Toggle open the OAUTH CONFIGURATION section

### Step 2: Configure Your Service

Fill in the required fields in the developer portal:

```
Service Name: Your Application Name
Redirect URI: https://yourapp.com/oauth/callback
```

**Important Notes:**
- The redirect URI must exactly match what you'll use in your application
- Use HTTPS for production redirects
- Create separate Vybit accounts for non-production environments

### Step 3: Get Your Credentials

Once configured, the developer portal will generate:
- **Client ID**: Public identifier for your application
- **Client Secret**: Private key for server-side authentication

**Security**: Never expose your client secret in client-side code or version control.

## SDK Installation and Setup

### Installation

```bash
npm install @vybit/oauth2-sdk
```

### Basic Setup

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

const client = new VybitOAuth2Client({
  clientId: process.env.VYBIT_CLIENT_ID,
  clientSecret: process.env.VYBIT_CLIENT_SECRET,
  redirectUri: process.env.VYBIT_REDIRECT_URI
});
```

### Environment Variables

Create a `.env` file:

```env
VYBIT_CLIENT_ID=your_client_id_here
VYBIT_CLIENT_SECRET=your_client_secret_here
VYBIT_REDIRECT_URI=https://yourapp.com/oauth/callback
```

## Complete Implementation Walkthrough

### Step 1: Initiate Authorization

Create an endpoint to start the OAuth flow:

```typescript
// Express.js example
app.get('/auth/vybit', (req, res) => {
  // Generate a unique state parameter for CSRF protection
  const state = generateSecureRandomString();
  
  // Store state in session for later verification
  req.session.oauthState = state;
  
  // Generate authorization URL
  const authUrl = client.getAuthorizationUrl({ state });
  
  // Redirect user to Vybit
  res.redirect(authUrl);
});

function generateSecureRandomString() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
```

### Step 2: Handle Authorization Callback

Create an endpoint to handle the OAuth callback:

```typescript
app.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  // Handle authorization denial
  if (error) {
    return res.status(400).send(`Authorization denied: ${error}`);
  }
  
  // Validate required parameters
  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state');
  }
  
  // Verify state parameter for CSRF protection
  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state parameter - possible CSRF attack');
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await client.exchangeCodeForToken(code);
    
    // Store the access token securely
    req.session.accessToken = tokenResponse.access_token;
    
    // Verify the token works
    const isValid = await client.verifyToken(tokenResponse.access_token);
    
    if (isValid) {
      // Redirect to your application dashboard
      res.redirect('/dashboard');
    } else {
      res.status(500).send('Token verification failed');
    }
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});
```

### Step 3: Access User's Vybits

Create an endpoint to display the user's available vybits:

```typescript
app.get('/api/vybits', async (req, res) => {
  const accessToken = req.session.accessToken;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const vybits = await client.getVybitList(accessToken);
    res.json({ vybits });
  } catch (error) {
    console.error('Failed to fetch vybits:', error);
    res.status(500).json({ error: 'Failed to fetch vybits' });
  }
});
```

### Step 4: Trigger Vybit Notifications

Create an endpoint to send notifications:

```typescript
app.post('/api/trigger', async (req, res) => {
  const accessToken = req.session.accessToken;
  const { triggerKey, message, imageUrl, linkUrl, log } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!triggerKey) {
    return res.status(400).json({ error: 'Trigger key is required' });
  }
  
  try {
    const result = await client.sendVybitNotification(triggerKey, {
      message,
      imageUrl,
      linkUrl,
      log
    }, accessToken);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to trigger vybit:', error);
    res.status(500).json({ 
      error: 'Failed to send notification',
      details: error.message 
    });
  }
});
```

## Testing Your Integration

### Using the Developer Portal Test Buttons

The developer portal provides interactive test buttons that mirror your SDK implementation:

1. **Test Authorization**: Opens a popup to test the authorization flow
2. **Test Token Request**: Exchanges a test code for an access token
3. **Test Authorization Verification**: Verifies the token works
4. **Test Vybit List Request**: Retrieves the user's vybits
5. **Test Vybit Trigger**: Sends a test notification

Use these to validate your API credentials and understand the expected responses.

### Local Development Testing

1. Start your development server
2. Navigate to your authorization endpoint (e.g., `http://localhost:3000/auth/vybit`)
3. Complete the OAuth flow
4. Test API endpoints using tools like Postman or curl

Example curl commands:

```bash
# Get user's vybits
curl -H "Cookie: session=your_session_cookie" \
     http://localhost:3000/api/vybits

# Trigger a vybit
curl -X POST \
     -H "Cookie: session=your_session_cookie" \
     -H "Content-Type: application/json" \
     -d '{"triggerKey":"abc123","message":"Test notification"}' \
     http://localhost:3000/api/trigger
```

### Unit Testing

The SDK includes comprehensive test coverage. Add your own integration tests:

```typescript
import { VybitOAuth2Client } from '@vybit/oauth2-sdk';

describe('Vybit Integration', () => {
  let client;
  
  beforeEach(() => {
    client = new VybitOAuth2Client({
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      redirectUri: 'http://localhost:3000/callback'
    });
  });
  
  it('should generate valid authorization URL', () => {
    const authUrl = client.getAuthorizationUrl({ state: 'test-state' });
    expect(authUrl).toContain('client_id=test-client-id');
    expect(authUrl).toContain('state=test-state');
  });
  
  // Add more tests for your specific use cases
});
```

## Production Deployment

### Security Checklist

- [ ] Use HTTPS for all endpoints
- [ ] Store client secret in environment variables, not code
- [ ] Implement proper session management
- [ ] Validate state parameter to prevent CSRF
- [ ] Use secure session cookies
- [ ] Implement rate limiting on OAuth endpoints
- [ ] Log authentication events for security monitoring

### Environment Configuration

```javascript
// production.js
module.exports = {
  vybit: {
    clientId: process.env.VYBIT_CLIENT_ID,
    clientSecret: process.env.VYBIT_CLIENT_SECRET,
    redirectUri: 'https://yourapp.com/oauth/callback'
  },
  session: {
    secret: process.env.SESSION_SECRET,
    secure: true, // HTTPS only
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};
```

### Monitoring and Logging

Implement logging for OAuth events:

```typescript
const logger = require('your-logger');

// Log successful authentications
logger.info('OAuth success', {
  userId: user.id,
  clientId: config.clientId,
  timestamp: new Date(),
  ip: req.ip
});

// Log authentication failures
logger.warn('OAuth failure', {
  error: error.message,
  clientId: config.clientId,
  ip: req.ip
});
```

## Troubleshooting

### Common Issues

#### 1. "Invalid redirect URI"
- Ensure the redirect URI in your code exactly matches the one configured in the developer portal
- Check for trailing slashes or protocol mismatches (http vs https)

#### 2. "Invalid client credentials"
- Verify your client ID and secret are correct
- Ensure you're using credentials from the correct Vybit account

#### 3. "Authorization code expired"
- Exchange authorization codes immediately after receiving them
- Don't reuse authorization codes (they're single-use)

#### 4. "Token verification failed"
- Check that you're using the correct base URL (app.vybit.net for auth, vybit.net for API)
- Ensure the access token hasn't expired
- Verify network connectivity to Vybit's API

#### 5. "CSRF attack detected"
- Implement proper state parameter validation
- Ensure session storage is working correctly
- Check for session timeout issues

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Enable detailed logging
const client = new VybitOAuth2Client({
  // ... config
});

// Log all API calls
client.on('request', (url, options) => {
  console.log('API Request:', url, options);
});

client.on('response', (data) => {
  console.log('API Response:', data);
});
```

### Getting Help

1. **Developer Portal**: Use the test buttons to validate your configuration
2. **SDK Tests**: Run the test suite to verify your environment
3. **Documentation**: Check this guide and the API reference
4. **Support**: Contact Vybit support with specific error messages and request details

## Advanced Topics

### Custom Token Storage

For production applications, consider using a database or Redis for token storage:

```typescript
class DatabaseTokenStore {
  async storeToken(userId, accessToken) {
    await db.tokens.create({
      userId,
      accessToken,
      createdAt: new Date()
    });
  }
  
  async getToken(userId) {
    const token = await db.tokens.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    return token?.accessToken;
  }
}
```

This completes the comprehensive OAuth 2.0 integration guide. The implementation exactly mirrors the functionality demonstrated in the Vybit developer portal, ensuring consistency and reliability for your integration.