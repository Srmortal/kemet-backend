import type {
  CreateMethodRepository,
  GetAllMethodRepository,
  GetByIdMethodRepository,
} from "#app/shared/ports/generic-repository.js";
import type {
  CreateGuideBookingRequest,
  Guide,
  GuideBooking,
} from "./guide.types.js";

export interface GuideRepository
  extends CreateMethodRepository<
      "createGuideBooking",
      CreateGuideBookingRequest,
      GuideBooking
    >,
    GetAllMethodRepository<"getAllGuides", Guide>,
    GetByIdMethodRepository<"getGuideById", Guide, string, null> {
  isGuideAvailable(
    guideId: string,
    date: string,
    startTime: string,
    hours: number
  ): Promise<boolean>;
}
