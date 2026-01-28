const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { default: $RefParser } = require('json-schema-ref-parser');

const openapiRoot = path.join(__dirname, '../../contracts/openapi.yaml');
const pathsDir = path.join(__dirname, '../../contracts/paths');

function fail(msg) {
  console.error(`\n[OPENAPI ENFORCEMENT ERROR]\n${msg}\n`);
  process.exit(1);
}

// 1. No inline paths, only split files
const openapi = yaml.load(fs.readFileSync(openapiRoot, 'utf8'));
if (openapi.paths && Object.keys(openapi.paths).length > 0) {
  fail('Inline paths detected in openapi.yaml. All paths must be $ref to files in /contracts/paths/.');
}

// 2. $ref resolution
$RefParser.dereference(openapiRoot)
  .then((api) => {
    // 3. operationId exists for every operation
    for (const [p, methods] of Object.entries(api.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (!op.operationId) {
          fail(`Missing operationId for ${method.toUpperCase()} ${p}`);
        }
        // 4. request/response schemas exist
        if (!op.responses || Object.keys(op.responses).length === 0) {
          fail(`No responses defined for ${method.toUpperCase()} ${p}`);
        }
        if (op.requestBody && !op.requestBody.content) {
          fail(`No requestBody content for ${method.toUpperCase()} ${p}`);
        }
      }
    }
    console.log('OpenAPI validation passed.');
  })
  .catch((err) => {
    fail(`OpenAPI $ref resolution failed: ${err.message}`);
  });