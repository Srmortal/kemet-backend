import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const contractsDir = path.resolve("contracts");
const modulesDir = path.resolve("src/modules");

const modules = fs.readdirSync(contractsDir);

for (const module of modules) {
  const specPath = path.join(contractsDir, module, "openapi.yaml");

  if (!fs.existsSync(specPath)) {
    continue;
  }

  const outputDir = path.join(modulesDir, module, "dtos");
  const outputFile = path.join(outputDir, "generated.ts");

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Generating types for ${module}...`);

  execSync(`npx openapi-typescript "${specPath}" -o "${outputFile}"`, {
    stdio: "inherit",
  });
}

console.log("✅ Contract generation complete");
