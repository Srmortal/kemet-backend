import type { AwilixContainer } from "awilix";
import type { adventureController } from "#app/modules/adventure/adventure.controller.js";
import type { guideController } from "#app/modules/guide/presentation/guide.controller.js";
import type { tourismController } from "#app/modules/tourism_places/tourism.controller.js";

interface Cradle {
  adventureController: ReturnType<typeof adventureController>;
  guideController: ReturnType<typeof guideController>;
  tourismController: ReturnType<typeof tourismController>;
  [key: string]: unknown;
}

declare module "express-serve-static-core" {
  interface Request {
    container: AwilixContainer;
    cradle: Cradle;
    user?: {
      id: string;
      email?: string;
      name?: string;
      role?: "user" | "admin";
      admin?: boolean;
      [key: string]: unknown;
    };
  }
}
