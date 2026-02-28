/**
 * Complete OAuth 2.0 Flow Example
 *
 * This example demonstrates the exact 6-step OAuth flow from the developer portal:
 * 1. Authorization Request
 * 2. Authorization Grant
 * 3. Access Token Request
 * 4. Verify Authorization
 * 5. API Access (Get Vybit List)
 * 6. Triggering Vybits
 *
 * The OAuth2 SDK handles steps 1-4 (the OAuth flow).
 * Once you have a token, use VybitAPIClient for steps 5-6 (API access).
 */

const { VybitOAuth2Client } = require('@vybit/oauth2-sdk');
const { VybitAPIClient } = require('@vybit/api-sdk');

async function completeOAuthFlow() {
  // Initialize the OAuth2 client for the authorization flow
  const oauth = new VybitOAuth2Client({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'https://yourapp.com/oauth/callback',
    environment: 'development' // or 'production'
  });

  try {
    console.log('=== Step 1: Authorization Request ===');

    // Generate authorization URL with random state
    const state = 'random_' + Math.random().toString(36).substring(2, 15);
    const authUrl = oauth.getAuthorizationUrl({ state });

    console.log('Direct users to:', authUrl);
    console.log('State parameter:', state);
    console.log('Note: User will be redirected back with authorization code\n');

    console.log('=== Step 2: Authorization Grant ===');
    console.log('User approves access and gets redirected to:');
    console.log('https://yourapp.com/oauth/callback?code=AUTHORIZATION_CODE&state=' + state);
    console.log('Verify state matches to prevent CSRF attacks\n');

    console.log('=== Step 3: Access Token Request ===');

    // In real implementation, you'd get this from the callback URL
    const authorizationCode = 'example-auth-code';

    console.log('Exchanging authorization code for access token...');
    // const tokenResponse = await oauth.exchangeCodeForToken(authorizationCode);
    // console.log('Token response:', tokenResponse);

    // For demo purposes, simulate having a token
    const simulatedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    oauth.setAccessToken(simulatedToken);
    console.log('Access token acquired (simulated)\n');

    console.log('=== Step 4: Verify Authorization ===');

    // const isValid = await oauth.verifyToken();
    // console.log('Token is valid:', isValid);
    console.log('Token verification would return: { "status": "ok" }\n');

    console.log('=== Step 5: API Access (Get Vybit List) ===');

    // Once you have a token, use VybitAPIClient for full API access
    // const api = new VybitAPIClient({ accessToken: tokenResponse.access_token });
    // const vybits = await api.listVybits();
    // console.log('User vybits:', vybits);

    // Simulate vybit list response
    const simulatedVybits = [
      { name: 'My Alert', triggerKey: 'abc123def456' },
      { name: 'Notification Sound', triggerKey: 'def456ghi789' },
      { name: 'Status Update', triggerKey: 'ghi789jkl012' }
    ];
    console.log('Retrieved vybits:', simulatedVybits);
    console.log('Users can now select which vybit to trigger\n');

    console.log('=== Step 6: Triggering Vybits ===');

    const selectedVybit = simulatedVybits[0];
    console.log('Selected vybit:', selectedVybit.name);

    // Example with optional parameters
    const triggerOptions = {
      message: 'Hello from SDK!',
      imageUrl: 'https://example.com/notification.jpg',
      linkUrl: 'https://example.com/redirect',
      log: 'Triggered via SDK example <a href="https://example.com">link</a>'
    };

    console.log('Trigger options:', triggerOptions);

    // const result = await api.triggerVybit(selectedVybit.triggerKey, triggerOptions);
    // console.log('Trigger result:', result);

    console.log('Expected response:', {
      result: 1,
      plk: 'bbxope6xhryminef'
    });

    console.log('\n✅ OAuth 2.0 flow completed successfully!');

  } catch (error) {
    console.error('❌ OAuth flow failed:', error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    if (error.statusCode) {
      console.error('HTTP status:', error.statusCode);
    }
  }
}

// Run the example
if (require.main === module) {
  completeOAuthFlow();
}

module.exports = { completeOAuthFlow };