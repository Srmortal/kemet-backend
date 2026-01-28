#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../../src/services');
const testsDir = path.join(__dirname, '../../tests');

function fail(msg) {
  console.error(`\n[SERVICE TEST ENFORCEMENT ERROR]\n${msg}\n`);
  process.exit(1);
}

const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
const testFiles = fs.readdirSync(testsDir);

for (const service of serviceFiles) {
  const base = service.replace('.ts', '');
  const testMatch = testFiles.find(f => f.includes(base));
  if (!testMatch) {
    fail(`No test found for service: ${service}`);
  }
}
console.log('All services have matching tests.');