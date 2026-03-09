import logger from "#app/shared/utils/metrics/logger.js";
import type { AnalyticsEvent } from "../../../generated/prisma/index.js";
import type { DomainError } from "../../shared/types/domain-error.type.js";
import type { Result } from "../../shared/types/result.types.js";
import { err, ok } from "../../shared/types/result.types.js";
import type {
  AnalyticsMetricsQuery,
  AnalyticsReport,
} from "./analytics.types.js";
import type { AnalyticsRepository } from "./analytics-repository.js";

export class AnalyticsService {
  private readonly analyticsRepository: AnalyticsRepository;

  constructor(analyticsRepository: AnalyticsRepository) {
    this.analyticsRepository = analyticsRepository;
  }

  async getAnalyticsMetrics(
    query: AnalyticsMetricsQuery
  ): Promise<Result<AnalyticsReport, DomainError>> {
    // Delegate to repository, no business logic in service
    try {
      const report = await this.analyticsRepository.getMetrics(query);
      return ok(report);
    } catch (e) {
      return err({ type: "Unknown", message: (e as Error).message });
    }
  }

  async postAnalyticsEvent(
    event: AnalyticsEvent
  ): Promise<Result<void, DomainError>> {
    try {
      await this.analyticsRepository.postEvent(event);
      return ok(undefined);
    } catch (e) {
      logger.warn("Failed to store analytics event", {
        eventName: event.eventName,
        message: (e as Error).message,
      });
      return err({ type: "Unknown", message: (e as Error).message });
    }
  }
}
