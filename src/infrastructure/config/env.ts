import fs from "node:fs";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";

const nodeEnv = process.env.NODE_ENV ?? "development";

// Get directory name compatible with CommonJS
const currentDir = import.meta.dirname;

// Candidate roots for both src and dist runtimes
const roots = [process.cwd(), path.resolve(currentDir, "../../")];

// Dotenv priority (higher first)
const fileNames = [
  `.env.${nodeEnv}.local`,
  ".env.local",
  `.env.${nodeEnv}`,
  ".env",
];

// Resolve and dedupe files
const envFiles = Array.from(
  new Set(
    roots.flatMap((root) => fileNames.map((name) => path.resolve(root, name)))
  )
);

// Load only existing files in order
for (const file of envFiles) {
  if (fs.existsSync(file)) {
    dotenvConfig({ path: file });
  }
}

export { nodeEnv, envFiles };
