const BASE_URL = process.env.API_URL || 'http://localhost:4000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

async function testEndpoint({ title, method, path, body = null, expectedStatus = 200 }) {
  console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}[${method}] ${path}${colors.reset} - ${colors.bold}${title}${colors.reset}`);
  if (body) {
    console.log(`${colors.dim}Request Body:${colors.reset}\n${JSON.stringify(body, null, 2)}`);
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    const passed = res.status === expectedStatus;
    const statusColor = passed ? colors.green : colors.red;

    console.log(`${statusColor}HTTP Status: ${res.status} ${passed ? '[OK]' : '[FAILED]'}${colors.reset}`);
    console.log(`${colors.dim}Response Payload:${colors.reset}`);
    console.log(JSON.stringify(data, null, 2));

    return passed;
  } catch (err) {
    console.log(`${colors.red}HTTP Request Error: ${err.message}${colors.reset}`);
    return false;
  }
}

async function run() {
  console.log(`\n${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}  THIRDEYE ENDPOINT TESTING & PAYLOAD INSPECTION                      ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}`);

  const results = [];

  results.push(await testEndpoint({
    title: 'Server Health Check',
    method: 'GET',
    path: '/healthz',
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'List All Registered Integrations',
    method: 'GET',
    path: '/api/integrations',
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Register New Third-Party Integration',
    method: 'POST',
    path: '/api/integrations',
    body: {
      id: 'crm_live_001',
      name: 'HubSpot Sync Connector',
      purpose: 'Synchronize customer contact records',
      expectedRequestRate: 120,
      allowedEndpoints: ['/contacts', '/contacts/sync'],
      allowedMethods: ['GET', 'POST'],
      allowedData: ['contact_id', 'email', 'name'],
      forbiddenData: ['credit_card', 'password', 'ssn'],
    },
    expectedStatus: 201,
  }));

  results.push(await testEndpoint({
    title: 'Get Single Integration Profile & Behavior Stats',
    method: 'GET',
    path: '/api/integrations/crm_live_001',
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Update Integration Settings & Rates',
    method: 'PATCH',
    path: '/api/integrations/crm_live_001',
    body: {
      expectedRequestRate: 160,
      purpose: 'Enterprise customer contact synchronization service',
    },
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Manually Quarantine an Integration',
    method: 'POST',
    path: '/api/integrations/crm_live_001/quarantine',
    body: {
      reason: 'Security team detected suspicious anomalous activity',
    },
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Release Integration from Quarantine Back to Active',
    method: 'POST',
    path: '/api/integrations/crm_live_001/release',
    body: {},
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Dashboard KPI Stat Cards',
    method: 'GET',
    path: '/api/dashboard/stats',
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Dashboard Recent Activity Timeline Feed',
    method: 'GET',
    path: '/api/dashboard/activity?limit=5',
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Query Security Events Audit Log',
    method: 'GET',
    path: '/api/security-events?limit=10',
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Filter Security Events by Integration ID',
    method: 'GET',
    path: '/api/security-events?integrationId=analytics_001',
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Core Middleware Request Interception',
    method: 'POST',
    path: '/api/check-request',
    body: {
      integrationId: 'analytics_001',
      method: 'GET',
      endpoint: '/analytics/events',
      dataRequested: ['page', 'event'],
      requestCount: 95,
      timestamp: new Date().toISOString(),
      contextEvent: 'none',
    },
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Trigger Attack Simulator',
    method: 'POST',
    path: '/api/simulator/start',
    body: {
      integrationId: 'analytics_001',
      attack: 'credential_compromise',
      speed: 'demo',
    },
    expectedStatus: 200,
  }));

  results.push(await testEndpoint({
    title: 'Reset Demo State to Baseline',
    method: 'POST',
    path: '/api/simulator/reset',
    body: {
      integrationId: 'analytics_001',
    },
    expectedStatus: 200,
  }));

  console.log(`\n${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  const passedCount = results.filter(Boolean).length;
  console.log(`${colors.bold}SUMMARY: ${passedCount} / ${results.length} tests passed.${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}\n`);

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
