import fs from "node:fs/promises";
import path from "node:path";
import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import type { NextFunction, Request, Response } from "express";
import { OpenAPIBackend } from "openapi-backend";

type ControllerMethod = (
  req: Request,
  res: Response,
  next?: NextFunction
) => unknown;

// changed: keep DI boundary broad
type ControllerBag = Record<string, unknown>;
type ResolveControllerByFeature = (feature: string) => ControllerBag;

interface FeatureApi {
  api: OpenAPIBackend;
  feature: string;
}

const OPENAPI_FILE_NAME = "openapi.yaml";
const API_PREFIX = "/api";

const getFeatureRelativePath = (
  requestPath: string,
  feature: string
): string | null => {
  const featureBasePath = `${API_PREFIX}/${feature}`;

  if (requestPath === featureBasePath) {
    return "/";
  }

  if (requestPath.startsWith(`${featureBasePath}/`)) {
    const relativePath = requestPath.slice(featureBasePath.length);
    return relativePath.length > 0 ? relativePath : "/";
  }

  return null;
};

const toOpenApiRequest = (req: Request) => {
  const headers: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = value;
    }
  }

  const query: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (value !== undefined) {
      query[key] = value as string | string[];
    }
  }

  return {
    method: req.method,
    path: req.path,
    query,
    body: req.body,
    headers,
  };
};

const loadFeatureApis = async (
  contractsRoot: string,
  resolveControllerByFeature: ResolveControllerByFeature
): Promise<FeatureApi[]> => {
  const entries = await fs.readdir(contractsRoot, { withFileTypes: true });
  const apis: FeatureApi[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const feature = entry.name;
    const definitionPath = path.join(contractsRoot, feature, OPENAPI_FILE_NAME);

    try {
      await fs.access(definitionPath);
    } catch {
      continue;
    }

    let controller: ControllerBag;
    try {
      controller = resolveControllerByFeature(feature);
    } catch {
      continue;
    }

    const ajv = new Ajv({
      strict: false,
      validateFormats: true,
    });
    addFormats.default(ajv);

    const api = new OpenAPIBackend({
      definition: definitionPath,
      validate: true,
      ajvOpts: {
        strict: false,
        validateFormats: true,
      },
      customizeAjv: (originalAjv) => {
        addFormats.default(originalAjv);
        return originalAjv;
      },
    });

    await api.init();

    const operations = api.getOperations();
    for (const operation of operations) {
      const operationId = operation.operationId;
      if (!operationId) {
        throw new Error(`Missing operationId in ${definitionPath}`);
      }

      const handlerCandidate = controller[operationId];
      if (typeof handlerCandidate !== "function") {
        throw new Error(
          `Controller for feature "${feature}" is missing method "${operationId}"`
        );
      }

      const handler = handlerCandidate as ControllerMethod;

      api.register(operationId, async (_context, req, res) => {
        await handler(req as Request, res as Response);
      });
    }

    api.register("validationFail", (context, _req, res) => {
      return res.status(400).json({
        message: "Request validation failed",
        errors: context.validation.errors,
      });
    });

    apis.push({ feature, api });
  }

  return apis;
};

export const createOpenApiRouter = async (
  contractsRoot: string,
  resolveControllerByFeature: ResolveControllerByFeature
) => {
  const apis = await loadFeatureApis(contractsRoot, resolveControllerByFeature);

  return async (req: Request, res: Response, next: NextFunction) => {
    for (const { api, feature } of apis) {
      const featureRelativePath = getFeatureRelativePath(req.path, feature);
      if (!featureRelativePath) {
        continue;
      }

      const openApiRequest = {
        ...toOpenApiRequest(req),
        path: featureRelativePath,
      };

      const match = api.matchOperation(openApiRequest);
      if (!match) {
        continue;
      }

      await api.handleRequest(openApiRequest, req, res);
      return;
    }

    next();
  };
};
