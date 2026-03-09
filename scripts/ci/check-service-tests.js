const fs = require("node:fs");
const path = require("node:path");

const featuresDir = path.join(import.meta.dirname, "../../src/features");
const testsDir = path.join(import.meta.dirname, "../../tests");

function fail(msg) {
  console.error(`\n[SERVICE TEST ENFORCEMENT ERROR]\n${msg}\n`);
  process.exit(1);
}

function getAllServiceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getAllServiceFiles(fullPath);
    }

    if (entry.isFile() && entry.name.endsWith(".service.ts")) {
      return [fullPath];
    }

    return [];
  });
}

const serviceFiles = getAllServiceFiles(featuresDir);

for (const servicePath of serviceFiles) {
  const serviceName = path.basename(servicePath).replace(".ts", "");
  const expectedTest = `${serviceName}.test.ts`;

  const testExists = fs.existsSync(path.join(testsDir, expectedTest));

  if (!testExists) {
    fail(`No test found for service: ${servicePath}`);
  }
}

console.log("All services have matching tests.");
