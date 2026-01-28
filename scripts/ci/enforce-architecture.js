#!/usr/bin/env node
const { execSync } = require('child_process');

function fail(msg) {
  console.error(`\n[ARCHITECTURE ENFORCEMENT ERROR]\n${msg}\n`);
  process.exit(1);
}

try {
  // Forbidden imports (example: controllers importing services, etc.)
  execSync('eslint --max-warnings=0 --rule "no-restricted-imports:error"', { stdio: 'inherit' });
  // Add more static checks as needed (e.g., grep for forbidden patterns)
} catch (e) {
  fail('Architecture enforcement failed.');
}