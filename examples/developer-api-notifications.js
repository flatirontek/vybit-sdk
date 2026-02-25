/**
 * Developer API Notification Examples
 *
 * This example demonstrates how to use the Developer API SDK to:
 * - Manage vybits programmatically
 * - Trigger notifications as the owner
 * - Send notifications as a subscriber
 * - Work with subscriptions and followers
 */

const { VybitAPIClient } = require('@vybit/api-sdk');

// Initialize the client with your API key from https://developer.vybit.net
const client = new VybitAPIClient({
  apiKey: process.env.VYBIT_API_KEY || 'your-api-key-here'
});

async function main() {
  try {
    console.log('🚀 Vybit Developer API Examples\n');

    // ========== Example 1: Check API Status ==========
    console.log('1. Checking API status...');
    const status = await client.getStatus();
    console.log(`   ✅ API Status: ${status.status}\n`);

    // ========== Example 2: Get Usage Metrics ==========
    console.log('2. Getting usage metrics...');
    const meter = await client.getMeter();
    console.log(`   📊 Tier: ${meter.tier_id}`);
    console.log(`   📈 Usage: ${meter.count_daily}/${meter.cap_daily} daily`);
    console.log(`   📈 Monthly: ${meter.count_monthly}/${meter.cap_monthly}\n`);

    // ========== Example 3: List Sounds ==========
    console.log('3. Getting available sounds...');
    const sounds = await client.searchSounds({ limit: 5 });
    console.log(`   🔊 Found ${sounds.length} sounds`);
    if (sounds.length > 0) {
      console.log(`   First sound: "${sounds[0].name}" (${sounds[0].key})\n`);
    }

    // ========== Example 4: Create a Vybit ==========
    console.log('4. Creating a new vybit...');
    const vybit = await client.createVybit({
      name: 'API Demo Notification',
      soundKey: sounds[0].key,
      triggerType: 'webhook',
      access: 'private',
      message: 'This is a test notification from the Developer API'
    });
    console.log(`   ✅ Created vybit: "${vybit.name}" (${vybit.key})`);
    console.log(`   🔑 Trigger Key: ${vybit.triggerKey}\n`);

    // ========== Example 5: Trigger Vybit Notification (New!) ==========
    console.log('5. Triggering vybit notification as owner...');
    const triggerResult = await client.triggerVybit(vybit.key, {
      message: 'Hello from the Developer API SDK!',
      imageUrl: 'https://example.com/alert.jpg',  // Must be a direct link to a JPG, PNG, or GIF image
      linkUrl: 'https://vybit.net'
    });
    console.log(`   ✅ Notification sent! Log key: ${triggerResult.plk}\n`);

    // ========== Example 6: List Your Vybits ==========
    console.log('6. Listing all vybits...');
    const vybits = await client.listVybits({ limit: 10 });
    console.log(`   📋 You have ${vybits.length} vybits\n`);

    // ========== Example 7: Update Vybit ==========
    console.log('7. Updating vybit settings...');
    const updated = await client.patchVybit(vybit.key, {
      message: 'Updated notification message',
      access: 'public' // Make it public so others can subscribe
    });
    console.log(`   ✅ Updated vybit access to: ${updated.access}\n`);

    // ========== Example 8: Get Public Vybits ==========
    console.log('8. Discovering public vybits...');
    const publicVybits = await client.listPublicVybits({ limit: 5 });
    console.log(`   🔍 Found ${publicVybits.length} public vybits\n`);

    // ========== Example 9: Subscribe to a Vybit ==========
    if (publicVybits.length > 0) {
      const targetVybit = publicVybits[0];
      console.log(`9. Subscribing to "${targetVybit.name}"...`);

      const subscription = await client.createVybitFollow({
        subscriptionKey: targetVybit.key
      });
      const followKey = subscription.followingKey || subscription.key;
      console.log(`   ✅ Subscribed! Following key: ${followKey}\n`);

      // ========== Example 10: Send to Owner as Subscriber (New!) ==========
      // Note: This only works if the vybit has sendPermissions = 'subs_owner'
      console.log('10. Attempting to send notification to owner as subscriber...');
      try {
        const sendResult = await client.sendToOwner(followKey, {
          message: 'Thanks for the awesome vybit! 🎉',
          linkUrl: 'https://example.com/feedback'
        });
        console.log(`    ✅ Notification sent to owner! Log key: ${sendResult.plk}\n`);
      } catch (error) {
        if (error.statusCode === 403) {
          console.log(`    ⚠️  This vybit doesn't allow subscriber-to-owner messages\n`);
        } else {
          throw error;
        }
      }

      // ========== Example 11: Send to Group as Subscriber (New!) ==========
      // Note: This only works if the vybit has sendPermissions = 'subs_group'
      console.log('11. Attempting to send notification to group as subscriber...');
      try {
        const groupResult = await client.sendToGroup(followKey, {
          message: 'Group announcement: Check out this update!',
          imageUrl: 'https://example.com/update.png'  // Must be a direct link to a JPG, PNG, or GIF image
        });
        console.log(`    ✅ Notification sent to group! Log key: ${groupResult.plk}\n`);
      } catch (error) {
        if (error.statusCode === 403) {
          console.log(`    ⚠️  This vybit doesn't allow subscriber-to-group messages\n`);
        } else {
          throw error;
        }
      }

      // Clean up: unsubscribe
      console.log('12. Unsubscribing from vybit...');
      await client.deleteVybitFollow(followKey);
      console.log(`    ✅ Unsubscribed\n`);
    }

    // ========== Example 12: View Notification Logs ==========
    console.log('13. Viewing notification logs...');
    const logs = await client.listVybitLogs(vybit.key, { limit: 5 });
    console.log(`   📜 Found ${logs.length} log entries for this vybit`);
    if (logs.length > 0) {
      console.log(`   Latest: ${logs[0].key} at ${logs[0].createdAt}\n`);
    }

    // ========== Example 13: Manage Peeps (Subscribers) ==========
    console.log('14. Managing subscribers (peeps)...');
    const peeps = await client.listVybitPeeps(vybit.key);
    console.log(`   👥 Current subscribers: ${peeps.length}\n`);

    // Optionally invite someone
    // const invite = await client.createPeep(vybit.key, 'friend@example.com');
    // console.log(`   ✅ Invitation sent to friend@example.com\n`);

    // ========== Cleanup: Delete Test Vybit ==========
    console.log('15. Cleaning up - deleting test vybit...');
    await client.deleteVybit(vybit.key);
    console.log(`   ✅ Deleted vybit: ${vybit.key}\n`);

    console.log('✨ All examples completed successfully!\n');

    // ========== Summary of New Features ==========
    console.log('📌 NEW in v1.1.0:');
    console.log('   • client.triggerVybit(key, params) - Trigger notifications as owner');
    console.log('   • client.sendToOwner(followingKey, params) - Send to owner as subscriber');
    console.log('   • client.sendToGroup(followingKey, params) - Send to group as subscriber\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.statusCode) {
      console.error(`   HTTP ${error.statusCode}`);
    }
    process.exit(1);
  }
}

// Run the examples
if (require.main === module) {
  main();
}

module.exports = { main };
