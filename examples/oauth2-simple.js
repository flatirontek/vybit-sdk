/**
 * Simple OAuth 2.0 Example
 * 
 * This example demonstrates the most basic usage of the Vybit OAuth2 SDK
 * Perfect for getting started quickly.
 */

const { VybitOAuth2Client } = require('@vybit/oauth2-sdk');

async function simpleExample() {
  // Create client
  const client = new VybitOAuth2Client({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'https://yourapp.com/callback'
  });

  try {
    // Step 1: Get authorization URL
    const authUrl = client.getAuthorizationUrl();
    console.log('Send user to:', authUrl);

    // Step 2: After user authorizes, you get a code
    // const code = 'received-from-callback';
    
    // Step 3: Exchange for token
    // const token = await client.exchangeCodeForToken(code);
    // console.log('Got access token:', token.access_token);

    // Step 4: Get user's vybits
    // const vybits = await client.getVybitList();
    // console.log('User has', vybits.length, 'vybits');

    // Step 5: Send notification
    // const result = await client.sendVybitNotification('trigger-key', {
    //   message: 'Hello from my app!'
    // });
    // console.log('Notification sent:', result);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleExample();