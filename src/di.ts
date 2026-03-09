import {
  aliasTo,
  asClass,
  asFunction,
  asValue,
  createContainer,
  InjectionMode,
} from "awilix";
import { prisma } from "#app/infrastructure/config/index.js";
import { AuthController } from "#app/modules/auth/auth.controller.js";
import { AuthService } from "#app/modules/auth/auth.service.js";
import { UserAuthRepository } from "#app/modules/auth/infrastructure/userAuth.repository.js";
import { GuideRepositoryInMemory } from "#app/modules/guides/infrastructure/guide.repository.inmemory.js";
import { TourPackageRepository } from "#app/modules/tour_packages/infrastructure/tourPackage.repository.js";
import { TourPackageController } from "#app/modules/tour_packages/tourPackage.controller.js";
import { TourismRepositoryMock } from "#app/modules/tourism_places/infrastructure/tourism.repository.mock.js";
import { UserRepository } from "#app/modules/user/infrastructure/user.repository.js";
import { UserController } from "#app/modules/user/user.controller.js";
import { adventureController } from "./modules/adventures/adventure.controller.js";
import { AdventureRepositoryInMemory } from "./modules/adventures/infrastructure/adventure.repository.inmemory.js";
import { AdventureBookingService } from "./modules/adventures/services/adventure.booking.service.js";
import { AdventureService } from "./modules/adventures/services/adventure.service.js";
import { analyticsController } from "./modules/analytics/analytics.controller.js";
import { AnalyticsService } from "./modules/analytics/analytics.service.js";
import { PrismaAnalyticsRepository } from "./modules/analytics/prisma-analytics.repository.js";
import { guideController } from "./modules/guides/guide.controller.js";
import { GuideService } from "./modules/guides/guide.service.js";
import { TourPackageService } from "./modules/tour_packages/services/tourPackage.service.js";
import { TourPackageBookingService } from "./modules/tour_packages/services/tourPackageBooking.service.js";
import { BookingService } from "./modules/tourism_places/services/booking.service.js";
import { TourismService } from "./modules/tourism_places/services/tourism.service.js";
import { tourismController } from "./modules/tourism_places/tourism.controller.js";
import { UserService } from "./modules/user/user.service.js";

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  prisma: asValue(prisma),
});

const registerAdventureModule = () => {
  container.register({
    adventureRepository: asClass(AdventureRepositoryInMemory).singleton(),
    adventureRepo: aliasTo("adventureRepository"),
    adventureService: asClass(AdventureService).singleton(),
    adventureBookingService: asClass(AdventureBookingService).singleton(),
    adventureController: asFunction(adventureController).singleton(),
  });
};

const registerAnalyticsModule = () => {
  container.register({
    analyticsRepository: asClass(PrismaAnalyticsRepository).singleton(),
    analyticsService: asClass(AnalyticsService).singleton(),
    analyticsController: asFunction(analyticsController).singleton(),
  });
};

const registerAuthModule = () => {
  container.register({
    userAuthRepository: asClass(UserAuthRepository).singleton(),
    authRepo: aliasTo("userAuthRepository"),
    authService: asClass(AuthService).singleton(),
    authController: asClass(AuthController).singleton(),
  });
};

const registerGuideModule = () => {
  container.register({
    guideRepository: asClass(GuideRepositoryInMemory).singleton(),
    guideService: asClass(GuideService).singleton(),
    guideController: asFunction(guideController).singleton(),
  });
};

const registerTourismModule = () => {
  container.register({
    tourismRepository: asClass(TourismRepositoryMock).singleton(),
    bookingService: asClass(BookingService).singleton(),
    tourismService: asClass(TourismService).singleton(),
    tourismController: asFunction(tourismController).singleton(),
  });
};

const registerTourPackageModule = () => {
  container.register({
    tourPackageRepository: asClass(TourPackageRepository).singleton(),
    packageRepo: aliasTo("tourPackageRepository"),
    tourPackageService: asClass(TourPackageService).singleton(),
    tourPackageBookingService: asClass(TourPackageBookingService).singleton(),
    tourPackageController: asClass(TourPackageController).singleton(),
  });
};

const registerUserModule = () => {
  container.register({
    userRepository: asClass(UserRepository).singleton(),
    userRepo: aliasTo("userRepository"),
    userService: asClass(UserService).singleton(),
    userController: asClass(UserController).singleton(),
  });
};

registerAdventureModule();
registerAnalyticsModule();
registerAuthModule();
registerGuideModule();
registerTourismModule();
registerTourPackageModule();
registerUserModule();

type ControllerInstance = Record<string, unknown>;

const controllerTokenByFeature: Record<string, string> = {
  adventures: "adventureController",
  analytics: "analyticsController",
  auth: "authController",
  guides: "guideController",
  tourism_places: "tourismController",
  tour_packages: "tourPackageController",
  user: "userController",
  mart: "martController",
};

export const resolveControllerByFeature = (
  feature: string
): ControllerInstance => {
  const token = controllerTokenByFeature[feature];
  if (!token) {
    throw new Error(
      `No DI controller token configured for feature "${feature}"`
    );
  }

  return container.resolve<ControllerInstance>(token);
};

export default container;
