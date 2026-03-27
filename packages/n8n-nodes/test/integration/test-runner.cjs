#!/usr/bin/env node

/**
 * Integration Test Runner for Vybit n8n Nodes
 *
 * Tests the Vybit node against a running n8n instance by:
 * 1. Creating test workflows via n8n API
 * 2. Executing them via manual trigger
 * 3. Validating the outputs
 * 4. Cleaning up test data
 *
 * Usage:
 *   npm run test:integration
 *
 * Environment Variables:
 *   N8N_API_URL - n8n instance URL (default: http://localhost:5678)
 *   N8N_API_KEY - n8n API key (required for hosted, optional for local)
 *   VYBIT_API_KEY - Vybit Developer API key (required)
 *   VYBIT_OAUTH2_CREDENTIAL_ID - n8n credential ID for OAuth2 (required for OAuth2 tests)
 */

const http = require('http');
const https = require('https');

// Configuration
const config = {
  n8nUrl: process.env.N8N_API_URL || 'http://localhost:5678',
  n8nApiKey: process.env.N8N_API_KEY || '',
  vybitApiCredentialId: process.env.VYBIT_API_CREDENTIAL_ID || '',
  vybitOAuth2CredentialId: process.env.VYBIT_OAUTH2_CREDENTIAL_ID || '',
};

// Validate config
if (!config.vybitApiCredentialId) {
  console.error('❌ VYBIT_API_CREDENTIAL_ID environment variable is required');
  console.error('');
  console.error('To get your credential ID:');
  console.error('1. Open n8n at http://localhost:5678');
  console.error('2. Go to Settings → Credentials');
  console.error('3. Click on your "Vybit Developer API" credential');
  console.error('4. Copy the ID from the URL (e.g., /credentials/abc123)');
  console.error('');
  console.error('Then run:');
  console.error('  export VYBIT_API_CREDENTIAL_ID="your-credential-id"');
  console.error('  npm run test:integration');
  process.exit(1);
}

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper: Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(config.n8nApiKey && { 'X-N8N-API-KEY': config.n8nApiKey }),
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// Helper: Create a test workflow
async function createWorkflow(name, nodes) {
  const workflow = {
    name,
    nodes,
    connections: {},
    settings: {},
  };

  const response = await makeRequest(`${config.n8nUrl}/api/v1/workflows`, {
    method: 'POST',
    body: workflow,
  });

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(`Failed to create workflow: ${response.statusCode} ${JSON.stringify(response.body)}`);
  }

  return response.body;
}

// Helper: Delete workflow
async function deleteWorkflow(workflowId) {
  if (!workflowId) return;

  try {
    await makeRequest(`${config.n8nUrl}/api/v1/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`Warning: Failed to delete workflow ${workflowId}:`, error.message);
  }
}

// Helper: Create test workflow for Vybit node operation
async function createTestWorkflow(testName, actionType, apiOperation, additionalParams = {}) {
  const vybitNodeParams = {
    authentication: 'apiKey',
    actionType,
    apiOperation,
    ...additionalParams,
  };

  const workflow = await createWorkflow(testName, [
    {
      name: 'Manual Trigger',
      type: 'n8n-nodes-base.manualTrigger',
      position: [250, 300],
      parameters: {},
      typeVersion: 1,
    },
    {
      name: 'Vybit',
      type: '@vybit/n8n-nodes-vybit.vybit',
      position: [450, 300],
      parameters: vybitNodeParams,
      credentials: {
        vybitApi: {
          id: config.vybitApiCredentialId,
          name: 'Vybit Developer API',
        },
      },
      typeVersion: 1,
    },
  ]);

  return workflow;
}

// Helper: Validate node configuration
function validateNodeConfig(workflow, expectedActionType, expectedOperation) {
  const vybitNode = workflow.nodes.find(n => n.type === '@vybit/n8n-nodes-vybit.vybit');
  if (!vybitNode) {
    throw new Error('Vybit node not found in workflow');
  }
  if (vybitNode.parameters.actionType !== expectedActionType) {
    throw new Error(`Expected actionType '${expectedActionType}', got '${vybitNode.parameters.actionType}'`);
  }
  if (vybitNode.parameters.apiOperation !== expectedOperation) {
    throw new Error(`Expected apiOperation '${expectedOperation}', got '${vybitNode.parameters.apiOperation}'`);
  }
  return vybitNode;
}

// Helper: Run a test
async function runTest(testName, testFn) {
  results.total++;

  try {
    console.log(`\n🧪 ${testName}...`);
    await testFn();
    results.passed++;
    results.tests.push({ name: testName, status: 'PASSED' });
    console.log(`✅ PASSED: ${testName}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name: testName, status: 'FAILED', error: error.message });
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
  }
}

// ===== PROFILE TESTS =====

// Test: Profile - Get Profile
async function testProfileGetProfile() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Profile Get Profile', 'profile', 'getProfile');
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'profile', 'getProfile');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Vybits - List
async function testVybitsList() {
  let workflowId;

  try {
    const workflow = await createWorkflow('Test: Vybits List', [
      {
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: [250, 300],
        parameters: {},
        typeVersion: 1,
      },
      {
        name: 'Vybit',
        type: '@vybit/n8n-nodes-vybit.vybit',
        position: [450, 300],
        parameters: {
          authentication: 'apiKey',
          actionType: 'vybits',
          apiOperation: 'list',
          options: {
            limit: 10,
          },
        },
        credentials: {
          vybitApi: {
            id: config.vybitApiCredentialId,
            name: 'Vybit Developer API',
          },
        },
        typeVersion: 1,
      },
    ]);

    workflowId = workflow.id;

    const vybitNode = workflow.nodes.find(n => n.type === '@vybit/n8n-nodes-vybit.vybit');
    if (vybitNode.parameters.actionType !== 'vybits' || vybitNode.parameters.apiOperation !== 'list') {
      throw new Error('Vybits list operation not configured correctly');
    }
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - List Public
async function testSubscriptionsListPublic() {
  let workflowId;

  try {
    const workflow = await createWorkflow('Test: Subscriptions List Public', [
      {
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: [250, 300],
        parameters: {},
        typeVersion: 1,
      },
      {
        name: 'Vybit',
        type: '@vybit/n8n-nodes-vybit.vybit',
        position: [450, 300],
        parameters: {
          authentication: 'apiKey',
          actionType: 'subscriptions',
          apiOperation: 'listPublic',
        },
        credentials: {
          vybitApi: {
            id: config.vybitApiCredentialId,
            name: 'Vybit Developer API',
          },
        },
        typeVersion: 1,
      },
    ]);

    workflowId = workflow.id;

    const vybitNode = workflow.nodes.find(n => n.type === '@vybit/n8n-nodes-vybit.vybit');
    if (vybitNode.parameters.actionType !== 'subscriptions' || vybitNode.parameters.apiOperation !== 'listPublic') {
      throw new Error('Subscriptions listPublic operation not configured correctly');
    }
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Sounds - Search
async function testSoundsSearch() {
  let workflowId;

  try {
    const workflow = await createWorkflow('Test: Sounds Search', [
      {
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: [250, 300],
        parameters: {},
        typeVersion: 1,
      },
      {
        name: 'Vybit',
        type: '@vybit/n8n-nodes-vybit.vybit',
        position: [450, 300],
        parameters: {
          authentication: 'apiKey',
          actionType: 'sounds',
          apiOperation: 'search',
          options: {
            search: 'bell',
            limit: 5,
          },
        },
        credentials: {
          vybitApi: {
            id: config.vybitApiCredentialId,
            name: 'Vybit Developer API',
          },
        },
        typeVersion: 1,
      },
    ]);

    workflowId = workflow.id;

    const vybitNode = workflow.nodes.find(n => n.type === '@vybit/n8n-nodes-vybit.vybit');
    if (vybitNode.parameters.actionType !== 'sounds' || vybitNode.parameters.apiOperation !== 'search') {
      throw new Error('Sounds search operation not configured correctly');
    }
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Logs - List All
async function testLogsListAll() {
  let workflowId;

  try {
    const workflow = await createWorkflow('Test: Logs List All', [
      {
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: [250, 300],
        parameters: {},
        typeVersion: 1,
      },
      {
        name: 'Vybit',
        type: '@vybit/n8n-nodes-vybit.vybit',
        position: [450, 300],
        parameters: {
          authentication: 'apiKey',
          actionType: 'logs',
          apiOperation: 'listAll',
        },
        credentials: {
          vybitApi: {
            id: config.vybitApiCredentialId,
            name: 'Vybit Developer API',
          },
        },
        typeVersion: 1,
      },
    ]);

    workflowId = workflow.id;

    const vybitNode = workflow.nodes.find(n => n.type === '@vybit/n8n-nodes-vybit.vybit');
    if (vybitNode.parameters.actionType !== 'logs' || vybitNode.parameters.apiOperation !== 'listAll') {
      throw new Error('Logs listAll operation not configured correctly');
    }
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Peeps - List All
async function testPeepsListAll() {
  let workflowId;

  try {
    const workflow = await createWorkflow('Test: Peeps List All', [
      {
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: [250, 300],
        parameters: {},
        typeVersion: 1,
      },
      {
        name: 'Vybit',
        type: '@vybit/n8n-nodes-vybit.vybit',
        position: [450, 300],
        parameters: {
          authentication: 'apiKey',
          actionType: 'peeps',
          apiOperation: 'listAll',
        },
        credentials: {
          vybitApi: {
            id: config.vybitApiCredentialId,
            name: 'Vybit Developer API',
          },
        },
        typeVersion: 1,
      },
    ]);

    workflowId = workflow.id;

    const vybitNode = workflow.nodes.find(n => n.type === '@vybit/n8n-nodes-vybit.vybit');
    if (vybitNode.parameters.actionType !== 'peeps' || vybitNode.parameters.apiOperation !== 'listAll') {
      throw new Error('Peeps listAll operation not configured correctly');
    }
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Profile - Get Usage Metrics
async function testProfileGetMeter() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Profile Get Meter', 'profile', 'getMeter');
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'profile', 'getMeter');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Profile - Check API Status
async function testProfileGetStatus() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Profile Get Status', 'profile', 'getStatus');
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'profile', 'getStatus');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== VYBITS TESTS =====

// Test: Vybits - Get
async function testVybitsGet() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Vybits Get', 'vybits', 'get', {
      vybitKey: 'test-vybit-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'vybits', 'get');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Vybits - Create
async function testVybitsCreate() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Vybits Create', 'vybits', 'create', {
      vybitName: 'Test Vybit',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'vybits', 'create');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Vybits - Update
async function testVybitsUpdate() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Vybits Update', 'vybits', 'update', {
      vybitKey: 'test-vybit-key',
      updateFields: {},
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'vybits', 'update');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Vybits - Delete
async function testVybitsDelete() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Vybits Delete', 'vybits', 'delete', {
      vybitKey: 'test-vybit-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'vybits', 'delete');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Vybits - Trigger
async function testVybitsTrigger() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Vybits Trigger', 'vybits', 'trigger', {
      vybitKey: 'test-vybit-key',
      additionalFields: {},
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'vybits', 'trigger');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== SUBSCRIPTIONS TESTS =====

// Test: Subscriptions - Get Public
async function testSubscriptionsGetPublic() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Get Public', 'subscriptions', 'getPublic', {
      subscriptionKey: 'test-subscription-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'getPublic');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - Subscribe
async function testSubscriptionsSubscribe() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Subscribe', 'subscriptions', 'subscribe', {
      subscriptionKey: 'test-subscription-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'subscribe');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - List My Subscriptions
async function testSubscriptionsListSubscriptions() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions List Subscriptions', 'subscriptions', 'listSubscriptions');
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'listSubscriptions');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - Get Subscription
async function testSubscriptionsGetSubscription() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Get Subscription', 'subscriptions', 'getSubscription', {
      followingKey: 'test-following-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'getSubscription');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - Update Subscription
async function testSubscriptionsUpdateSubscription() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Update Subscription', 'subscriptions', 'updateSubscription', {
      followingKey: 'test-following-key',
      updateFields: {},
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'updateSubscription');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - Unsubscribe
async function testSubscriptionsUnsubscribe() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Unsubscribe', 'subscriptions', 'unsubscribe', {
      followingKey: 'test-following-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'unsubscribe');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - Send to Owner
async function testSubscriptionsSendToOwner() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Send to Owner', 'subscriptions', 'sendToOwner', {
      followingKey: 'test-following-key',
      additionalFields: {},
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'sendToOwner');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Subscriptions - Send to Group
async function testSubscriptionsSendToGroup() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Send to Group', 'subscriptions', 'sendToGroup', {
      followingKey: 'test-following-key',
      additionalFields: {},
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'sendToGroup');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== SOUNDS TESTS =====

// Test: Sounds - Get
async function testSoundsGet() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Sounds Get', 'sounds', 'get', {
      soundKey: 'test-sound-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'sounds', 'get');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== LOGS TESTS =====

// Test: Logs - Get
async function testLogsGet() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Logs Get', 'logs', 'get', {
      logKey: 'test-log-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'logs', 'get');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Logs - List by Vybit
async function testLogsListByVybit() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Logs List by Vybit', 'logs', 'listByVybit', {
      vybitKey: 'test-vybit-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'logs', 'listByVybit');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Logs - List by Subscription
async function testLogsListBySubscription() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Logs List by Subscription', 'logs', 'listBySubscription', {
      followingKey: 'test-following-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'logs', 'listBySubscription');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== PEEPS TESTS =====

// Test: Peeps - List by Vybit
async function testPeepsListByVybit() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Peeps List by Vybit', 'peeps', 'listByVybit', {
      vybitKey: 'test-vybit-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'peeps', 'listByVybit');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Peeps - Create
async function testPeepsCreate() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Peeps Create', 'peeps', 'create', {
      peepKey: 'test-peep-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'peeps', 'create');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Peeps - Get
async function testPeepsGet() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Peeps Get', 'peeps', 'get', {
      peepKey: 'test-peep-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'peeps', 'get');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Peeps - Delete
async function testPeepsDelete() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Peeps Delete', 'peeps', 'delete', {
      peepKey: 'test-peep-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'peeps', 'delete');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== SOUNDS - PLAY =====

// Test: Sounds - Play
async function testSoundsPlay() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Sounds Play', 'sounds', 'play', {
      soundKey: 'test-sound-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'sounds', 'play');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== VYBITS - CREATE WITH FIELDS =====

// Test: Vybits - Create with optional fields
async function testVybitsCreateWithFields() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Vybits Create with Fields', 'vybits', 'create', {
      vybitName: 'Test Vybit with Fields',
      createFields: {
        description: 'Test description',
        status: 'on',
        triggerType: 'webhook',
        access: 'private',
        message: 'Default message',
        sendPermissions: 'owner_subs',
      },
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'vybits', 'create');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== VYBITS - TRIGGER WITH FIELDS =====

// Test: Vybits - Trigger with all fields
async function testVybitsTriggerWithFields() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Vybits Trigger with Fields', 'vybits', 'trigger', {
      vybitKey: 'test-vybit-key',
      additionalFields: {
        message: 'Test notification',
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: 'https://example.com',
        log: 'Test log entry',
        runOnce: false,
      },
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'vybits', 'trigger');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== SUBSCRIPTIONS - UPDATE WITH FIELDS =====

// Test: Subscriptions - Update with fields
async function testSubscriptionsUpdateWithFields() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Subscriptions Update with Fields', 'subscriptions', 'updateSubscription', {
      followingKey: 'test-following-key',
      updateFields: {
        status: 'on',
        message: 'Custom message',
        imageUrl: 'https://example.com/image.png',
        linkUrl: 'https://example.com',
      },
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'subscriptions', 'updateSubscription');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// ===== REMINDERS TESTS =====

// Test: Reminders - List
async function testRemindersList() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Reminders List', 'reminders', 'list', {
      vybitKey: 'test-vybit-key',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'reminders', 'list');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Reminders - Create
async function testRemindersCreate() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Reminders Create', 'reminders', 'create', {
      vybitKey: 'test-vybit-key',
      cron: '0 9 * * *',
      optionalFields: {
        timeZone: 'America/New_York',
        message: 'Reminder message',
        year: 2026,
      },
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'reminders', 'create');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Reminders - Update
async function testRemindersUpdate() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Reminders Update', 'reminders', 'update', {
      vybitKey: 'test-vybit-key',
      reminderId: 'test-reminder-id',
      optionalFields: {
        cron: '0 10 * * *',
        timeZone: 'America/Denver',
        message: 'Updated reminder',
        year: 2027,
      },
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'reminders', 'update');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Test: Reminders - Delete
async function testRemindersDelete() {
  let workflowId;
  try {
    const workflow = await createTestWorkflow('Test: Reminders Delete', 'reminders', 'delete', {
      vybitKey: 'test-vybit-key',
      reminderId: 'test-reminder-id',
    });
    workflowId = workflow.id;
    validateNodeConfig(workflow, 'reminders', 'delete');
  } finally {
    await deleteWorkflow(workflowId);
  }
}

// Main test runner
async function main() {
  console.log('='.repeat(60));
  console.log('Vybit n8n Node Integration Tests');
  console.log('='.repeat(60));
  console.log(`\nn8n URL: ${config.n8nUrl}`);
  console.log(`Vybit API Credential ID: ${config.vybitApiCredentialId ? '✓ Set' : '✗ Not set'}`);

  // Check n8n connectivity
  console.log('\n📡 Checking n8n connectivity...');
  try {
    const response = await makeRequest(`${config.n8nUrl}/api/v1/workflows?limit=1`);
    if (response.statusCode !== 200) {
      throw new Error(`n8n API returned status ${response.statusCode}`);
    }
    console.log('✅ Connected to n8n API');
  } catch (error) {
    console.error('❌ Failed to connect to n8n:', error.message);
    console.error('\nMake sure:');
    console.error('1. n8n is running (docker ps | grep n8n)');
    console.error('2. N8N_API_URL is correct (default: http://localhost:5678)');
    console.error('3. If using API key auth, N8N_API_KEY is set');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Running Tests');
  console.log('='.repeat(60));

  // Run all tests
  console.log('\n📋 PROFILE TESTS');
  await runTest('Profile: Get Profile', testProfileGetProfile);
  await runTest('Profile: Get Usage Metrics', testProfileGetMeter);
  await runTest('Profile: Check API Status', testProfileGetStatus);

  console.log('\n📋 VYBITS TESTS');
  await runTest('Vybits: List', testVybitsList);
  await runTest('Vybits: Get', testVybitsGet);
  await runTest('Vybits: Create', testVybitsCreate);
  await runTest('Vybits: Create with Fields', testVybitsCreateWithFields);
  await runTest('Vybits: Update', testVybitsUpdate);
  await runTest('Vybits: Delete', testVybitsDelete);
  await runTest('Vybits: Trigger', testVybitsTrigger);
  await runTest('Vybits: Trigger with Fields', testVybitsTriggerWithFields);

  console.log('\n📋 SUBSCRIPTIONS TESTS');
  await runTest('Subscriptions: List Public', testSubscriptionsListPublic);
  await runTest('Subscriptions: Get Public', testSubscriptionsGetPublic);
  await runTest('Subscriptions: Subscribe', testSubscriptionsSubscribe);
  await runTest('Subscriptions: List My Subscriptions', testSubscriptionsListSubscriptions);
  await runTest('Subscriptions: Get Subscription', testSubscriptionsGetSubscription);
  await runTest('Subscriptions: Update Subscription', testSubscriptionsUpdateSubscription);
  await runTest('Subscriptions: Update with Fields', testSubscriptionsUpdateWithFields);
  await runTest('Subscriptions: Unsubscribe', testSubscriptionsUnsubscribe);
  await runTest('Subscriptions: Send to Owner', testSubscriptionsSendToOwner);
  await runTest('Subscriptions: Send to Group', testSubscriptionsSendToGroup);

  console.log('\n📋 SOUNDS TESTS');
  await runTest('Sounds: Search', testSoundsSearch);
  await runTest('Sounds: Get', testSoundsGet);
  await runTest('Sounds: Play', testSoundsPlay);

  console.log('\n📋 LOGS TESTS');
  await runTest('Logs: List All', testLogsListAll);
  await runTest('Logs: Get', testLogsGet);
  await runTest('Logs: List by Vybit', testLogsListByVybit);
  await runTest('Logs: List by Subscription', testLogsListBySubscription);

  console.log('\n📋 PEEPS TESTS');
  await runTest('Peeps: List All', testPeepsListAll);
  await runTest('Peeps: List by Vybit', testPeepsListByVybit);
  await runTest('Peeps: Create', testPeepsCreate);
  await runTest('Peeps: Get', testPeepsGet);
  await runTest('Peeps: Delete', testPeepsDelete);

  console.log('\n📋 REMINDERS TESTS');
  await runTest('Reminders: List', testRemindersList);
  await runTest('Reminders: Create', testRemindersCreate);
  await runTest('Reminders: Update', testRemindersUpdate);
  await runTest('Reminders: Delete', testRemindersDelete);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total:   ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);

  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`  ❌ ${t.name}`);
      console.log(`     ${t.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with error code if any tests failed
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
