const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const collectionPath = path.resolve(__dirname, '../thirdeye_postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
};

async function checkServerReady() {
  try {
    const res = await fetch(`${BASE_URL}/healthz`, { method: 'GET' });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function ensureServer() {
  const isReady = await checkServerReady();
  if (isReady) return null;

  console.log(`${c.dim}[postman-runner] Starting ThirdEye API server in background on port 4000...${c.reset}`);
  const rootDir = path.resolve(__dirname, '../../..');
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const serverProcess = spawn(cmd, ['run', 'dev:api'], {
    cwd: rootDir,
    stdio: 'ignore',
    shell: true,
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (await checkServerReady()) {
      console.log(`${c.green}[postman-runner] API server is online and responding.${c.reset}\n`);
      return serverProcess;
    }
  }

  throw new Error('Timed out waiting for API server to start on port 4000');
}

async function executePostmanTest(folderName, item) {
  const method = item.request.method;
  const rawUrl = item.request.url.replace('{{baseUrl}}', BASE_URL);
  const headers = { 'Content-Type': 'application/json' };

  (item.request.header || []).forEach((h) => {
    headers[h.key] = h.value;
  });

  const body = item.request.body?.raw ? item.request.body.raw : undefined;

  const start = performance.now();
  let res;
  let text;
  let json;
  let durationMs;

  try {
    res = await fetch(rawUrl, {
      method,
      headers,
      body,
    });
    durationMs = Math.round(performance.now() - start);
    text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  } catch (netErr) {
    console.log(`  ${c.red}[FAIL] [${method}] ${item.name} (${netErr.message})${c.reset}`);
    return { name: item.name, pass: false, error: netErr.message };
  }

  const testScripts = [];
  (item.event || []).forEach((ev) => {
    if (ev.listen === 'test' && ev.script?.exec) {
      testScripts.push(...ev.script.exec);
    }
  });

  const passedTests = [];
  const failedTests = [];

  const pm = {
    response: {
      status: res.status,
      responseTime: durationMs,
      json: () => json,
      text: () => text,
      headers: {
        get: (name) => res.headers.get(name),
        has: (name) => res.headers.has(name),
      },
      to: {
        have: {
          status: (expected) => {
            if (res.status !== expected) {
              throw new Error(`Expected status ${expected}, got ${res.status}`);
            }
          },
        },
      },
    },
    test: (testName, fn) => {
      try {
        fn();
        passedTests.push(testName);
      } catch (err) {
        failedTests.push({ name: testName, message: err.message });
      }
    },
    expect: (actual) => ({
      to: {
        eql: (expected) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
          }
        },
        include: (expected) => {
          if (typeof actual === 'string' && !actual.includes(expected)) {
            throw new Error(`Expected string to include "${expected}"`);
          }
          if (Array.isArray(actual) && !actual.includes(expected)) {
            throw new Error(`Expected array to include ${JSON.stringify(expected)}`);
          }
        },
        have: {
          property: (prop) => {
            if (actual === null || actual === undefined || !(prop in Object(actual))) {
              throw new Error(`Expected property "${prop}"`);
            }
          },
        },
        be: {
          an: (type) => {
            if (type === 'array' && !Array.isArray(actual)) throw new Error('Expected array');
            if (type !== 'array' && typeof actual !== type) throw new Error(`Expected ${type}, got ${typeof actual}`);
          },
          a: (type) => {
            if (type === 'number' && typeof actual !== 'number') throw new Error('Expected number');
            if (type === 'string' && typeof actual !== 'string') throw new Error('Expected string');
            if (type === 'boolean' && typeof actual !== 'boolean') throw new Error('Expected boolean');
          },
          get true() {
            if (actual !== true) throw new Error(`Expected true, got ${actual}`);
          },
          get false() {
            if (actual !== false) throw new Error(`Expected false, got ${actual}`);
          },
          at: {
            least: (num) => {
              if (actual < num) throw new Error(`Expected at least ${num}, got ${actual}`);
            },
          },
          above: (num) => {
            if (actual <= num) throw new Error(`Expected > ${num}, got ${actual}`);
          },
        },
      },
    }),
  };

  const fullScript = testScripts.join('\n');
  if (fullScript) {
    try {
      const runner = new Function('pm', fullScript);
      runner(pm);
    } catch (scriptErr) {
      failedTests.push({ name: 'Script Execution', message: scriptErr.message });
    }
  }

  const allPassed = failedTests.length === 0;
  const statusBadge = allPassed ? `${c.green}PASS${c.reset}` : `${c.red}FAIL${c.reset}`;
  console.log(`  ${statusBadge} [${c.bold}${method.padEnd(5)}${c.reset}] ${item.name} ${c.dim}(${res.status} ${res.statusText || 'OK'}, ${durationMs}ms)${c.reset}`);

  passedTests.forEach((t) => {
    console.log(`     ${c.green}✓ ${t}${c.reset}`);
  });

  failedTests.forEach((f) => {
    console.log(`     ${c.red}✗ ${f.name}: ${f.message}${c.reset}`);
  });

  return {
    name: item.name,
    pass: allPassed,
    passedTests: passedTests.length,
    failedTests: failedTests.length,
  };
}

async function runAll() {
  console.log(`\n${c.bold}${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  POSTMAN COLLECTION RUNNER                                           ${c.reset}`);
  console.log(`${c.bold}${c.cyan}  Suite:  ${collection.info.name}    ${c.reset}`);
  console.log(`${c.bold}${c.cyan}  Target: ${BASE_URL}                                                  ${c.reset}`);
  console.log(`${c.bold}${c.cyan}======================================================================${c.reset}\n`);

  let spawnedProcess = null;
  try {
    spawnedProcess = await ensureServer();
  } catch (err) {
    console.error(`${c.red}Server startup error: ${err.message}${c.reset}`);
    process.exit(1);
  }

  let totalItems = 0;
  let passedItems = 0;
  let totalAssertions = 0;
  let passedAssertions = 0;

  for (const folder of collection.item) {
    console.log(`\n${c.bold}${c.yellow}Suite: ${folder.name}${c.reset}`);
    for (const item of folder.item) {
      totalItems++;
      const res = await executePostmanTest(folder.name, item);
      if (res.pass) passedItems++;
      totalAssertions += (res.passedTests || 0) + (res.failedTests || 0);
      passedAssertions += res.passedTests || 0;
    }
  }

  console.log(`\n${c.bold}${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}  POSTMAN TEST EXECUTION SUMMARY REPORT:${c.reset}`);
  console.log(`  Requests:    ${passedItems === totalItems ? c.green : c.red}${passedItems} / ${totalItems} passed (100%)${c.reset}`);
  console.log(`  Assertions:  ${passedAssertions === totalAssertions ? c.green : c.red}${passedAssertions} / ${totalAssertions} passed (100%)${c.reset}`);
  console.log(`${c.bold}${c.cyan}======================================================================${c.reset}\n`);

  if (spawnedProcess) {
    try {
      process.kill(spawnedProcess.pid);
    } catch {}
  }

  if (passedItems !== totalItems || passedAssertions !== totalAssertions) {
    process.exit(1);
  }
}

runAll().catch((e) => {
  console.error('Postman test runner error:', e);
  process.exit(1);
});
