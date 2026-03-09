/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-non-literal-regexp */
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import YAML from "yaml";
import logger from "../../src/shared/utils/metrics/logger";

interface Intent {
  auth: boolean;
  rateLimit?: boolean;
  role?: "admin" | "user";
}

const OPENAPI_PATH = path.resolve("contracts/openapi.yaml");
const ROUTES_GLOB = "src/routes/**/*.ts";

function fail(message: string) {
  logger.error(`❌ ${message}`);
  process.exitCode = 1;
}

interface Middleware {
  auth: boolean;
  rateLimit?: boolean;
  role?: "admin" | "user";
}

interface Operation {
  "x-middleware": Middleware;
  [key: string]: unknown;
}

type Methods = Record<string, Operation>;

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
  "trace",
] as const;

const FRAGMENT_CLEANUP_REGEX = /^#?\/?/;
const TILDE_1_REGEX = /~1/g;
const TILDE_0_REGEX = /~0/g;
const AUTH_REGEX = /auth/i;
const ADMIN_REGEX = /admin/i;
const RATE_LIMIT_REGEX = /rate/i;

function dereferenceOpenApiRef(
  refPath: string,
  apiPath: string
): Methods | null {
  if (!refPath.startsWith(".")) {
    return null;
  }

  const [file, fragment] = refPath.split("#");
  const absFile = path.resolve(path.dirname(OPENAPI_PATH), file);
  logger.info(`[OpenAPI]   Loading file: ${absFile}`);
  const yamlContent = YAML.parse(fs.readFileSync(absFile, "utf8"));

  if (fragment) {
    logger.info(`[OpenAPI]   Navigating fragment: ${fragment}`);
    const tokens = fragment
      .replace(FRAGMENT_CLEANUP_REGEX, "")
      .split("/")
      .filter(Boolean);
    let obj: unknown = yamlContent;

    for (const token of tokens) {
      if (typeof obj === "object" && obj !== null && token in obj) {
        const cleanedKey = token
          .replace(TILDE_1_REGEX, "/")
          .replace(TILDE_0_REGEX, "~");
        obj = (obj as Record<string, unknown>)[cleanedKey];
      } else {
        throw new Error(
          `Key '${token}' not found while navigating fragment in OpenAPI ref`
        );
      }
    }
    return obj as Methods;
  }

  const isSingleKeyMatchingPath =
    yamlContent &&
    Object.keys(yamlContent).length === 1 &&
    apiPath in yamlContent;

  if (isSingleKeyMatchingPath) {
    logger.info(`[OpenAPI]   Using single-key object for: ${apiPath}`);
    return yamlContent[apiPath];
  }

  return yamlContent;
}

function resolveMethodsForPath(methods: unknown, apiPath: string): Methods {
  if (!(methods && typeof methods === "object" && "$ref" in methods)) {
    return methods as Methods;
  }

  const refPath = (methods as Record<string, unknown>).$ref as string;
  logger.info(`[OpenAPI]   $ref found: ${refPath}`);

  const dereferenced = dereferenceOpenApiRef(refPath, apiPath);
  return dereferenced || (methods as Methods);
}

function registerIntentForOperation(
  intents: Map<string, Intent>,
  method: string,
  apiPath: string,
  operation: Operation
): void {
  if (
    !HTTP_METHODS.includes(
      method.toLowerCase() as (typeof HTTP_METHODS)[number]
    )
  ) {
    return;
  }

  logger.info(
    `[OpenAPI]   Found method: ${method.toUpperCase()} for ${apiPath}`
  );

  const middleware = operation["x-middleware"];
  if (!middleware || typeof middleware.auth !== "boolean") {
    logger.error(
      `[OpenAPI]   Missing x-middleware.auth for ${method.toUpperCase()} ${apiPath}`
    );
    throw new Error(
      `Missing x-middleware.auth for ${method.toUpperCase()} ${apiPath}`
    );
  }

  const key = `${method.toUpperCase()} ${apiPath}`;
  logger.info(`[OpenAPI]   Registered intent: ${key}`);
  intents.set(key, {
    auth: middleware.auth,
    role: middleware.role,
    rateLimit: middleware.rateLimit,
  });
}

function loadOpenApiIntents(): Map<string, Intent> {
  const raw = fs.readFileSync(OPENAPI_PATH, "utf8");
  const doc = YAML.parse(raw);

  const intents = new Map<string, Intent>();
  const paths: Record<string, Methods> = doc.paths || {};

  for (const [apiPath, methods] of Object.entries(paths)) {
    logger.info(`[OpenAPI] Processing path: ${apiPath}`);
    const actualMethods = resolveMethodsForPath(methods, apiPath);

    for (const [method, operation] of Object.entries(actualMethods)) {
      registerIntentForOperation(
        intents,
        method,
        apiPath,
        operation as Operation
      );
    }
  }

  return intents;
}

interface MiddlewarePresence {
  hasAdminMw: boolean;
  hasAuthMw: boolean;
  hasMiddleware: boolean;
  hasRateLimitMw: boolean;
}

function extractMiddlewarePresence(matchArgs: string[]): MiddlewarePresence {
  const hasMiddleware = matchArgs.length > 1;
  const middlewareArgs = matchArgs.slice(0, -1).join(" ");

  return {
    hasMiddleware,
    hasAuthMw: AUTH_REGEX.test(middlewareArgs),
    hasAdminMw: ADMIN_REGEX.test(middlewareArgs),
    hasRateLimitMw: RATE_LIMIT_REGEX.test(middlewareArgs),
  };
}

function validateAuthMiddleware(
  key: string,
  intent: Intent,
  middleware: MiddlewarePresence,
  file: string
): void {
  if (intent.auth && !middleware.hasMiddleware) {
    fail(`${key} requires auth but no middleware found (${file})`);
  }

  if (!intent.auth && middleware.hasAuthMw) {
    fail(`${key} is public but auth middleware is used (${file})`);
  }
}

function validateAdminMiddleware(
  key: string,
  intent: Intent,
  middleware: MiddlewarePresence,
  file: string
): void {
  if (intent.role === "admin" && !middleware.hasAdminMw) {
    fail(`${key} requires admin middleware (${file})`);
  }
}

function validateRateLimitMiddleware(
  key: string,
  intent: Intent,
  middleware: MiddlewarePresence,
  file: string
): void {
  if (intent.rateLimit && !middleware.hasRateLimitMw) {
    fail(`${key} requires rateLimit middleware (${file})`);
  }

  if (!intent.rateLimit && middleware.hasRateLimitMw) {
    fail(`${key} uses rateLimit but OpenAPI does not declare it (${file})`);
  }
}

function validateRouteMatch(
  key: string,
  intent: Intent,
  matchArgs: string[],
  file: string
): void {
  const middleware = extractMiddlewarePresence(matchArgs);
  validateAuthMiddleware(key, intent, middleware, file);
  validateAdminMiddleware(key, intent, middleware, file);
  validateRateLimitMiddleware(key, intent, middleware, file);
}

function validateRoutes() {
  const intents = loadOpenApiIntents();
  const routeFiles = globSync(ROUTES_GLOB);

  let foundAny = false;

  for (const file of routeFiles) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(file, "utf8");

    for (const [key, intent] of intents.entries()) {
      const [method, apiPath] = key.split(" ");

      // Match router.method('path', ...)
      const regex = new RegExp(
        `router\\.${method.toLowerCase()}\\s*\\(\\s*['"\`]${apiPath}['"\`]\\s*,([^\\)]*)\\)`,
        "g"
      );

      let match: RegExpExecArray | null = regex.exec(content);
      while (match !== null) {
        foundAny = true;

        const args = match[1]
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);

        validateRouteMatch(key, intent, args, file);
        match = regex.exec(content);
      }
    }
  }

  if (!foundAny) {
    logger.warn("⚠️ No routes matched OpenAPI paths. Check path consistency.");
  }

  if (process.exitCode === 1) {
    logger.error("\n🚫 Route ↔ OpenAPI enforcement FAILED");
    process.exit(1);
  }

  logger.info("✅ Route ↔ OpenAPI enforcement PASSED");
}

validateRoutes();
