import { prisma } from './config';
import { PrismaAnalyticsRepository } from './repositories/prisma-analytics.repository';

// 1. Import Repositories
import { adventureRepository } from './repositories/adventure.repository';
import { adventureBookingRepository } from './repositories/adventureBooking.repository';
import { bookingRepository } from './repositories/booking.repository';
import { firebaseAdminRepository } from './repositories/firebaseAdmin.repository';
import { guideRepository } from './repositories/guide.repository';
import { tourPackageRepository } from './repositories/tourPackage.repository';
import { tourPackageBookingRepository } from './repositories/tourPackageBooking.repository';
import { tourismRepository } from './repositories/tourism.repository';
import { userRepository } from './repositories/user.repository';
import { userAuthRepository } from './repositories/userAuth.repository';
 // One single instance
const analyticsRepo = new PrismaAnalyticsRepository(prisma);

// 3. Import Services
import { AdventureService } from './services/adventure.service';
import { AdventureBookingService } from './services/adventure.booking.service';
import { AnalyticsService } from './services/analytics.service';
import { BookingService } from './services/booking.service';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { GuideService } from './services/guide.service';
import { TourismService } from './services/tourism.service';
import { TourPackageService } from './services/tourPackage.service';
import { TourPackageBookingService } from './services/tourPackageBooking.service';
import { UserService } from './services/user.service';

// 4. Instantiate Services with Dependencies
const adventureService = new AdventureService(adventureRepository);
const adventureBookingService = new AdventureBookingService(adventureBookingRepository, adventureRepository);
const analyticsService = new AnalyticsService(analyticsRepo);
const bookingService = new BookingService(bookingRepository);
const firebaseAdminService = new FirebaseAdminService(firebaseAdminRepository);
const guideService = new GuideService(guideRepository);
const tourismService = new TourismService(tourismRepository);
const tourPackageService = new TourPackageService(tourPackageRepository);
const tourPackageBookingService = new TourPackageBookingService(tourPackageBookingRepository, tourPackageRepository);
const userService = new UserService(userRepository, userAuthRepository);

// 5. Export Service Instances
export {
  adventureService,
  adventureBookingService,
  analyticsService,
  bookingService,
  firebaseAdminService,
  guideService,
  tourismService,
  tourPackageService,
  tourPackageBookingService,
  userService,
};