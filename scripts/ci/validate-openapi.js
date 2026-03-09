require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { default: $RefParser } = require("json-schema-ref-parser");

const openapiRoot = path.join(
  import.meta.dirname,
  "../../contracts/openapi.yaml"
);

function fail(msg) {
  console.error(`\n[OPENAPI ENFORCEMENT ERROR]\n${msg}\n`);
  process.exit(1);
}

// 1. No inline path definitions (each path must be a $ref)
const openapi = yaml.load(fs.readFileSync(openapiRoot, "utf8"));
if (openapi.paths && Object.keys(openapi.paths).length > 0) {
  for (const [pathKey, pathValue] of Object.entries(openapi.paths)) {
    // Allow only $ref at the path level
    if (!pathValue || typeof pathValue !== "object" || !pathValue.$ref) {
      fail(
        `Inline path definition detected for '${pathKey}' in openapi.yaml. Each path must be a $ref to a file in /contracts/paths/.`
      );
    }
  }
}

// 2. $ref resolution

$RefParser
  .dereference(openapiRoot)
  .then((api) => {
    // 3. operationId exists for every operation (HTTP methods only)
    const httpMethods = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "options",
      "head",
      "trace",
    ];
    for (const [p, methods] of Object.entries(api.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (!httpMethods.includes(method.toLowerCase())) {
          continue;
        }
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
    console.log("OpenAPI validation passed.");
  })
  .catch((err) => {
    fail(`OpenAPI $ref resolution failed: ${err.message}`);
  });
