#!/usr/bin/env node

/**
 * Advanced Node.js Security Testing Tool
 * Tests: Authentication, Authorization, Input Validation, CORS, Rate Limiting, etc.
 */

const http = require('http');
const https = require('https');
const url = require('url');

const TARGET = process.argv[2] || 'http://localhost:3000';
const IS_HTTPS = TARGET.startsWith('https');

// Color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Make HTTP request
 */
async function makeRequest(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(endpoint, TARGET);
    const protocol = fullUrl.protocol === 'https:' ? https : http;
    
    const options = {
      method,
      hostname: fullUrl.hostname,
      port: fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      headers: {
        'User-Agent': 'Security-Scanner/1.0',
        ...headers,
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Test helper
 */
async function runTest(description, method, endpoint, headers, body, expectedStatus) {
  testsRun++;
  console.log(`\n${colors.yellow}[Test ${testsRun}] ${description}${colors.reset}`);

  try {
    const response = await makeRequest(method, endpoint, headers, body);
    console.log(`Status: ${response.status} (Expected: ${expectedStatus})`);

    if (response.status === expectedStatus) {
      console.log(`${colors.green}✓ PASSED${colors.reset}`);
      testsPassed++;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      console.log(`Response: ${response.body.substring(0, 200)}`);
      testsFailed++;
    }

    return response;
  } catch (error) {
    console.log(`${colors.red}✗ ERROR: ${error.message}${colors.reset}`);
    testsFailed++;
  }
}

/**
 * Main test suite
 */
async function runSecurityTests() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}BACKEND SECURITY HACKER TESTING${colors.reset}`);
  console.log(`${colors.blue}Target: ${TARGET}${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);

  // ============= 1. AUTHENTICATION TESTS =============
  console.log(
    `\n${colors.blue}========== 1. AUTHENTICATION TESTS ==========${colors.reset}`
  );

  await runTest(
    'No Authorization header',
    'GET',
    '/api/users/profile',
    {},
    null,
    401
  );

  await runTest(
    'Invalid Bearer token',
    'GET',
    '/api/users/profile',
    { Authorization: 'Bearer invalid.token.here' },
    null,
    401
  );

  await runTest(
    'Empty Bearer token',
    'GET',
    '/api/users/profile',
    { Authorization: 'Bearer ' },
    null,
    401
  );

  await runTest(
    'Basic auth instead of Bearer',
    'GET',
    '/api/users/profile',
    { Authorization: 'Basic dXNlcjpwYXNz' },
    null,
    401
  );

  await runTest(
    'Token with extra spaces',
    'GET',
    '/api/users/profile',
    { Authorization: 'Bearer   token' },
    null,
    401
  );

  // ============= 2. INJECTION ATTACKS =============
  console.log(
    `\n${colors.blue}========== 2. INJECTION ATTACK TESTS ==========${colors.reset}`
  );

  await runTest(
    'NoSQL Injection in query',
    'GET',
    '/api/hotels?hotelId={"$ne":null}',
    {},
    null,
    200 // Should be safe
  );

  await runTest(
    'SQL-like injection in name',
    'GET',
    "/api/hotels?name=1' OR '1'='1",
    {},
    null,
    200 // Should be safe
  );

  await runTest(
    'XSS payload in booking request',
    'POST',
    '/api/bookings',
    {
      Authorization: 'Bearer test',
      'Content-Type': 'application/json',
    },
    { hotelName: '<script>alert("xss")</script>' },
    400 // Should reject
  );

  await runTest(
    'Command injection attempt',
    'GET',
    '/api/hotels?name=test; rm -rf /',
    {},
    null,
    200 // Should be safe
  );

  await runTest(
    'Template injection attempt',
    'POST',
    '/api/bookings',
    { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
    { description: '{{7*7}}' },
    400 // Should handle safely
  );

  // ============= 3. AUTHORIZATION TESTS =============
  console.log(
    `\n${colors.blue}========== 3. AUTHORIZATION & IDOR TESTS ==========${colors.reset}`
  );

  await runTest(
    'IDOR - Access other user data',
    'GET',
    '/api/users/999999/bookings',
    { Authorization: 'Bearer test' },
    null,
    403
  );

  await runTest(
    'Access admin endpoint without permission',
    'GET',
    '/api/admin/users',
    { Authorization: 'Bearer test' },
    null,
    403
  );

  await runTest(
    'Privilege escalation - update user role',
    'PUT',
    '/api/users/profile',
    { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
    { role: 'admin' },
    403
  );

  await runTest(
    'Delete other user resource',
    'DELETE',
    '/api/users/999999',
    { Authorization: 'Bearer test' },
    null,
    403
  );

  // ============= 4. RATE LIMITING TEST =============
  console.log(
    `\n${colors.blue}========== 4. RATE LIMITING TEST ==========${colors.reset}`
  );

  console.log(`${colors.yellow}[Test ${++testsRun}] Brute force attack (20 rapid requests)${colors.reset}`);
  let rateLimitHit = false;
  for (let i = 0; i < 20; i++) {
    try {
      const response = await makeRequest('GET', '/api/users/profile', {
        Authorization: 'Bearer test',
      });
      if (response.status === 429) {
        rateLimitHit = true;
        console.log(
          `${colors.green}✓ Rate limit hit at request ${i + 1}${colors.reset}`
        );
        testsPassed++;
        break;
      }
    } catch (error) {
      // Continue
    }
  }
  if (!rateLimitHit) {
    console.log(`${colors.yellow}⚠ No rate limit detected (might be configured differently)${colors.reset}`);
  }

  // ============= 5. CORS TESTS =============
  console.log(
    `\n${colors.blue}========== 5. CORS & HEADER TESTS ==========${colors.reset}`
  );

  const corsResponse = await runTest(
    'CORS with malicious origin',
    'GET',
    '/',
    { Origin: 'http://evil.com' },
    null,
    200
  );

  if (corsResponse) {
    const corsHeader = corsResponse.headers['access-control-allow-origin'];
    if (corsHeader === '*') {
      console.log(`${colors.red}⚠ WARNING: CORS allows all origins (*)${colors.reset}`);
    } else if (corsHeader && corsHeader.includes('evil.com')) {
      console.log(`${colors.red}⚠ WARNING: CORS allows malicious origin${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ CORS properly restricted${colors.reset}`);
    }
  }

  // ============= 6. SECURITY HEADERS =============
  console.log(`${colors.yellow}\n[Test ${++testsRun}] Security Headers${colors.reset}`);
  const headerResponse = await makeRequest('GET', '/');
  
  const requiredHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
  ];

  const missingHeaders = requiredHeaders.filter(
    (h) => !headerResponse.headers[h]
  );

  if (missingHeaders.length === 0) {
    console.log(`${colors.green}✓ All security headers present${colors.reset}`);
    testsPassed++;
  } else {
    console.log(
      `${colors.red}✗ Missing security headers: ${missingHeaders.join(', ')}${colors.reset}`
    );
    testsFailed++;
  }

  // ============= 7. INPUT VALIDATION =============
  console.log(
    `\n${colors.blue}========== 7. INPUT VALIDATION TESTS ==========${colors.reset}`
  );

  await runTest(
    'Negative booking amount',
    'POST',
    '/api/bookings',
    { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
    { amount: -100 },
    400
  );

  await runTest(
    'Zero booking amount',
    'POST',
    '/api/bookings',
    { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
    { amount: 0 },
    400
  );

  await runTest(
    'Missing required field',
    'POST',
    '/api/bookings',
    { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
    { hotelId: '123' },
    400
  );

  // ============= 8. SENSITIVE DATA =============
  console.log(`${colors.yellow}\n[Test ${++testsRun}] Sensitive Data Leakage${colors.reset}`);
  const serverResponse = await makeRequest('GET', '/');
  
  const server = serverResponse.headers['server'] || '';
  if (server && server.toLowerCase().includes('node')) {
    console.log(`${colors.red}⚠ WARNING: Server header exposes Node.js${colors.reset}`);
  }

  // ============= SUMMARY =============
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}SECURITY TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`Total Tests: ${testsRun}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}✓ All security tests passed!${colors.reset}`);
  } else {
    console.log(
      `\n${colors.red}✗ ${testsFailed} test(s) failed - Review security issues${colors.reset}`
    );
  }
}

// Run tests
runSecurityTests().catch(console.error);
