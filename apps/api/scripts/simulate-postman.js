const BASE_URL = process.env.API_URL || 'http://localhost:4000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

async function runRequest(name, method, path, body = null, expectedStatus = 200) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  process.stdout.write(`  Testing [${method}] ${path.padEnd(35)} `);

  try {
    const res = await fetch(url, options);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === expectedStatus) {
      console.log(`${colors.green}[PASS] (${res.status})${colors.reset}`);
      return { pass: true, data };
    } else {
      console.log(`${colors.red}[FAIL] (Expected ${expectedStatus}, got ${res.status})${colors.reset}`);
      console.error('    Error Response:', data);
      return { pass: false, data };
    }
  } catch (err) {
    console.log(`${colors.red}[ERROR] ${err.message}${colors.reset}`);
    return { pass: false, error: err.message };
  }
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ThirdEye API Test Runner                            ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Target: ${BASE_URL}                                 ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  let total = 0;
  let passed = 0;

  async function test(name, method, path, body = null, expectedStatus = 200) {
    total++;
    const res = await runRequest(name, method, path, body, expectedStatus);
    if (res.pass) passed++;
    return res;
  }

  // 1. Healthcheck
  console.log(`${colors.yellow}1. System Health${colors.reset}`);
  await test('Health check', 'GET', '/healthz', null, 200);

  // 2. Integrations Registry
  console.log(`\n${colors.yellow}2. Integrations Registry Endpoints${colors.reset}`);
  await test('List Integrations', 'GET', '/api/integrations', null, 200);

  await test('Register Integration', 'POST', '/api/integrations', {
    id: 'crm_postman_001',
    name: 'Postman Test CRM Service',
    purpose: 'Test customer data sync',
    expectedRequestRate: 150,
    allowedEndpoints: ['/contacts', '/contacts/sync'],
    allowedMethods: ['GET', 'POST'],
    allowedData: ['contact_id', 'email'],
    forbiddenData: ['password', 'card_number'],
  }, 201);

  await test('Get Integration Detail', 'GET', '/api/integrations/crm_postman_001', null, 200);

  await test('Update Integration Settings', 'PATCH', '/api/integrations/crm_postman_001', {
    expectedRequestRate: 180,
    purpose: 'Updated test customer data sync',
  }, 200);

  await test('Manual Quarantine', 'POST', '/api/integrations/crm_postman_001/quarantine', {
    reason: 'Postman manual quarantine simulation',
  }, 200);

  await test('Release from Quarantine', 'POST', '/api/integrations/crm_postman_001/release', {}, 200);

  // 3. Dashboard Analytics
  console.log(`\n${colors.yellow}3. Dashboard Analytics Endpoints${colors.reset}`);
  await test('Get Dashboard KPI Stats', 'GET', '/api/dashboard/stats', null, 200);
  await test('Get Dashboard Activity Feed', 'GET', '/api/dashboard/activity?limit=10', null, 200);

  // 4. Security Events
  console.log(`\n${colors.yellow}4. Security Events Endpoints${colors.reset}`);
  await test('Get Security Events Log', 'GET', '/api/security-events?limit=20', null, 200);
  await test('Filter Events by Integration', 'GET', '/api/security-events?integrationId=analytics_001', null, 200);

  // 5. Core Check Request Middleware
  console.log(`\n${colors.yellow}5. Core Interceptor Middleware${colors.reset}`);
  await test('Evaluate Normal Request', 'POST', '/api/check-request', {
    integrationId: 'analytics_001',
    method: 'GET',
    endpoint: '/analytics/events',
    dataRequested: ['page', 'event'],
    requestCount: 95,
  }, 200);

  await test('Evaluate Suspicious Request', 'POST', '/api/check-request', {
    integrationId: 'analytics_001',
    method: 'GET',
    endpoint: '/customers/profile',
    dataRequested: ['anonymous_user_id'],
    requestCount: 300,
  }, 200);

  await test('Evaluate Malicious Exfiltration', 'POST', '/api/check-request', {
    integrationId: 'analytics_001',
    method: 'GET',
    endpoint: '/customers/payment-details',
    dataRequested: ['payment', 'phone', 'address'],
    requestCount: 1780,
  }, 200);

  // 6. Attack Simulator
  console.log(`\n${colors.yellow}6. Attack Simulator Endpoints${colors.reset}`);
  await test('Start Simulator Session', 'POST', '/api/simulator/start', {
    integrationId: 'analytics_001',
    attack: 'credential_compromise',
  }, 200);

  await test('Reset Simulator State', 'POST', '/api/simulator/reset', {
    integrationId: 'analytics_001',
  }, 200);

  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`  Tests Completed: ${total}`);
  console.log(`  Passed:          ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed:          ${passed === total ? colors.green + '0' : colors.red + (total - passed)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
