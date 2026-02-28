/**
 * Simple OAuth 2.0 Example
 *
 * This example demonstrates the most basic usage of the Vybit OAuth2 SDK
 * to authenticate, then use the API client with the obtained token.
 */

const { VybitOAuth2Client } = require('@vybit/oauth2-sdk');
const { VybitAPIClient } = require('@vybit/api-sdk');

async function simpleExample() {
  // Create OAuth2 client for the authorization flow
  const oauth = new VybitOAuth2Client({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'https://yourapp.com/callback'
  });

  try {
    // Step 1: Get authorization URL
    const authUrl = oauth.getAuthorizationUrl();
    console.log('Send user to:', authUrl);

    // Step 2: After user authorizes, you get a code in the callback
    // const code = 'received-from-callback';

    // Step 3: Exchange for token
    // const token = await oauth.exchangeCodeForToken(code);
    // console.log('Got access token:', token.access_token);

    // Step 4: Use the token with the API client for full API access
    // const api = new VybitAPIClient({ accessToken: token.access_token });
    // const vybits = await api.listVybits();
    // console.log('User has', vybits.length, 'vybits');

    // Step 5: Trigger a notification via the API client
    // const result = await api.triggerVybit('vybit-key', {
    //   message: 'Hello from my app!'
    // });
    // console.log('Notification sent:', result);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleExample();
