/**
 * Complete OAuth2 Flow Example
 *
 * This example demonstrates the complete OAuth2 flow for Vybit authentication,
 * including authorization URL generation, handling the callback, and making
 * authenticated API calls using VybitAPIClient.
 */

import { VybitOAuth2Client } from '@vybit/oauth2-sdk';
import { VybitAPIClient } from '@vybit/api-sdk';
import express from 'express';

// Initialize OAuth2 client with your credentials
const oauthClient = new VybitOAuth2Client({
  clientId: process.env.VYBIT_CLIENT_ID,
  clientSecret: process.env.VYBIT_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/oauth/callback'
});

const app = express();

// Step 1: Redirect user to Vybit for authorization
app.get('/auth', (req, res) => {
  const authUrl = oauthClient.getAuthorizationUrl({
    state: 'unique-state-' + Math.random().toString(36).substring(7),
    scope: 'read write'
  });

  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
app.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`Authorization failed: ${error}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await oauthClient.exchangeCodeForToken(code);

    console.log('Token received:', {
      access_token: tokenResponse.access_token,
      token_type: tokenResponse.token_type
    });

    // Use the token with the API SDK
    await demonstrateAPIUsage(tokenResponse.access_token);

    res.send(`
      <h1>Authentication Successful!</h1>
      <p>Access token obtained and API calls completed.</p>
      <p>Check the console for details.</p>
    `);

  } catch (error) {
    console.error('Token exchange failed:', error);
    res.status(500).send('Token exchange failed: ' + error.message);
  }
});

// Step 3: Use the API SDK with the access token
async function demonstrateAPIUsage(accessToken) {
  try {
    // Verify the token is valid
    const isValid = await oauthClient.verifyToken(accessToken);
    console.log('Token is valid:', isValid);

    // Create an API client with the access token
    const apiClient = new VybitAPIClient({ accessToken });

    // Get user's vybits
    const vybits = await apiClient.listVybits();
    console.log('User vybits:', vybits.length, 'found');

    // If user has vybits, trigger the first one as a demo
    if (vybits.length > 0) {
      const firstVybit = vybits[0];
      console.log('Triggering vybit:', firstVybit.name);

      const result = await apiClient.triggerVybit(firstVybit.key, {
        message: 'Hello from the Vybit SDK demo!',
        log: 'SDK OAuth flow test'
      });

      console.log('Notification sent:', result);
    }

  } catch (error) {
    console.error('API call failed:', error.message);
  }
}

// Start the demo server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Demo server running on http://localhost:${PORT}`);
  console.log('Visit http://localhost:3000/auth to start OAuth flow');
  console.log('');
  console.log('Make sure to set these environment variables:');
  console.log('- VYBIT_CLIENT_ID=your-client-id');
  console.log('- VYBIT_CLIENT_SECRET=your-client-secret');
});
