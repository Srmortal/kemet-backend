/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-non-literal-regexp */
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import {globSync} from 'glob';
import logger from '../../src/utils/logger';

type Intent = {
  auth: boolean;
  role?: 'admin' | 'user';
  rateLimit?: boolean;
};

const OPENAPI_PATH = path.resolve('contracts/openapi.yaml');
const ROUTES_GLOB = 'src/routes/**/*.ts';

function fail(message: string) {
  logger.error(`❌ ${message}`);
  process.exitCode = 1;
}

interface Middleware {
  auth: boolean;
  role?: 'admin' | 'user';
  rateLimit?: boolean;
}

interface Operation {
  'x-middleware': Middleware;
  [key: string]: unknown;
}

type Methods = Record<string, Operation>;

function loadOpenApiIntents(): Map<string, Intent> {
  const raw = fs.readFileSync(OPENAPI_PATH, 'utf8');
  const doc = YAML.parse(raw);

  const intents = new Map<string, Intent>();

  const paths: Record<string, Methods> = doc.paths || {};
  for (const [apiPath, methods] of Object.entries(paths)) {
    logger.info(`[OpenAPI] Processing path: ${apiPath}`);
    let actualMethods = methods;
    // If this is a $ref, dereference it
    if (methods && typeof methods === 'object' && '$ref' in methods) {
      const refPath = (methods as Record<string, unknown>)['$ref'] as string;
      logger.info(`[OpenAPI]   $ref found: ${refPath}`);
      // Only support local file refs for now
      if (refPath.startsWith('.')) {
        const [file, fragment] = refPath.split('#');
        const absFile = path.resolve(path.dirname(OPENAPI_PATH), file);
        logger.info(`[OpenAPI]   Loading file: ${absFile}`);
        const yamlContent = YAML.parse(fs.readFileSync(absFile, 'utf8'));
        if (fragment) {
          logger.info(`[OpenAPI]   Navigating fragment: ${fragment}`);
          // Remove leading / and split by /
          const tokens = fragment.replace(/^#?\/?/, '').split('/').filter(Boolean);
          let obj: unknown = yamlContent;
          for (const t of tokens) {
            // Unescape ~1 and ~0 per JSON Pointer spec
            const key = t.replace(/~1/g, '/').replace(/~0/g, '~');
            logger.info(`[OpenAPI]     Navigating key: ${key}`);
            if (typeof obj === 'object' && obj !== null && key in obj) {
              obj = (obj as Record<string, unknown>)[key];
            } else {
              throw new Error(`Key '${key}' not found while navigating fragment in OpenAPI ref`);
            }
          }
          actualMethods = obj as Methods;
        } else {
          // If the file root is an object with a single key matching apiPath, use its value
          if (yamlContent && Object.keys(yamlContent).length === 1 && apiPath in yamlContent) {
            logger.info(`[OpenAPI]   Using single-key object for: ${apiPath}`);
            actualMethods = yamlContent[apiPath];
          } else {
            actualMethods = yamlContent;
          }
        }
      }
    }
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
    for (const [method, operation] of Object.entries(actualMethods)) {
      if (!httpMethods.includes(method.toLowerCase())) continue;
      logger.info(`[OpenAPI]   Found method: ${method.toUpperCase()} for ${apiPath}`);
      const middleware = (operation as Operation)['x-middleware'];
      if (!middleware || typeof middleware.auth !== 'boolean') {
        logger.error(`[OpenAPI]   Missing x-middleware.auth for ${method.toUpperCase()} ${apiPath}`);
        throw new Error(
          `Missing x-middleware.auth for ${method.toUpperCase()} ${apiPath}`,
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
  }

  return intents;
}

function validateRoutes() {
  const intents = loadOpenApiIntents();
  const routeFiles = globSync(ROUTES_GLOB);

  let foundAny = false;

  for (const file of routeFiles) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(file, 'utf8');

    for (const [key, intent] of intents.entries()) {
      const [method, apiPath] = key.split(' ');

      // Match router.method('path', ...)
      const regex = new RegExp(
        `router\\.${method.toLowerCase()}\\s*\\(\\s*['"\`]${apiPath}['"\`]\\s*,([^\\)]*)\\)`,
        'g',
      );

      let match;
      while ((match = regex.exec(content)) !== null) {
        foundAny = true;

        const args = match[1]
          .split(',')
          .map(a => a.trim())
          .filter(Boolean);

        const hasMiddleware = args.length > 1; // before controller
        const middlewareArgs = args.slice(0, -1).join(' ');

        const hasAuthMw = /auth/i.test(middlewareArgs);
        const hasAdminMw = /admin/i.test(middlewareArgs);
        const hasRateLimitMw = /rate/i.test(middlewareArgs);

        // --- AUTH ---
        if (intent.auth && !hasMiddleware) {
          fail(`${key} requires auth but no middleware found (${file})`);
        }

        if (!intent.auth && hasAuthMw) {
          fail(`${key} is public but auth middleware is used (${file})`);
        }

        // --- ADMIN ---
        if (intent.role === 'admin' && !hasAdminMw) {
          fail(`${key} requires admin middleware (${file})`);
        }

        // --- RATE LIMIT ---
        if (intent.rateLimit && !hasRateLimitMw) {
          fail(`${key} requires rateLimit middleware (${file})`);
        }

        if (!intent.rateLimit && hasRateLimitMw) {
          fail(`${key} uses rateLimit but OpenAPI does not declare it (${file})`);
        }
      }
    }
  }

  if (!foundAny) {
    logger.warn('⚠️ No routes matched OpenAPI paths. Check path consistency.');
  }

  if (process.exitCode === 1) {
    logger.error('\n🚫 Route ↔ OpenAPI enforcement FAILED');
    process.exit(1);
  }

  logger.info('✅ Route ↔ OpenAPI enforcement PASSED');
}

validateRoutes();
