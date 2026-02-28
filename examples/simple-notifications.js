/**
 * Simple Notification Sending Example
 *
 * This example shows how to send vybit notifications with different options
 * using an API key or an access token from the OAuth2 flow.
 */

import { VybitAPIClient } from '@vybit/api-sdk';

// Create client with API key or access token
const client = new VybitAPIClient({
  apiKey: process.env.VYBIT_API_KEY
  // Or use: accessToken: 'your-access-token-from-oauth2-flow'
});

async function sendNotifications() {
  try {
    // Get your vybits
    const vybits = await client.listVybits();
    console.log(`Found ${vybits.length} vybits`);

    if (vybits.length === 0) {
      console.log('No vybits found. Create some at https://app.vybit.net');
      return;
    }

    const vybitKey = vybits[0].key;
    console.log(`Using vybit: ${vybits[0].name}`);

    // Example 1: Simple text message
    console.log('\n1. Sending simple text notification...');
    await client.triggerVybit(vybitKey, {
      message: 'Hello from Vybit SDK!'
    });

    // Example 2: Notification with image
    console.log('2. Sending notification with image...');
    await client.triggerVybit(vybitKey, {
      message: 'Check out this awesome image!',
      imageUrl: 'https://example.com/awesome-image.jpg'  // Must be a direct link to a JPG, PNG, or GIF image
    });

    // Example 3: Notification with clickable link
    console.log('3. Sending notification with link...');
    await client.triggerVybit(vybitKey, {
      message: 'Click to visit our website',
      linkUrl: 'https://vybit.net'
    });

    // Example 4: Full notification with all options
    console.log('4. Sending full-featured notification...');
    await client.triggerVybit(vybitKey, {
      message: 'Important update with image and link!',
      imageUrl: 'https://example.com/update.png',  // Must be a direct link to a JPG, PNG, or GIF image
      linkUrl: 'https://vybit.net/features',
      log: 'SDK demo - full notification'
    });

    // Example 5: Notification for different use cases
    console.log('5. Sending contextual notifications...');

    // Order confirmation
    await client.triggerVybit(vybitKey, {
      message: 'Order #12345 confirmed! Your items will ship tomorrow.',
      log: 'order-confirmation'
    });

    // System alert
    await client.triggerVybit(vybitKey, {
      message: 'Server maintenance scheduled for tonight at 2 AM EST',
      linkUrl: 'https://status.yourapp.com',
      log: 'maintenance-alert'
    });

    console.log('\nAll notifications sent successfully!');

  } catch (error) {
    console.error('Error sending notifications:', error.message);

    if (error.statusCode === 401) {
      console.log('Hint: Your credentials may be invalid. Check your API key or access token.');
    }
  }
}

// Run the example
sendNotifications();
