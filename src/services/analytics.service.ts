import logger from "@utils/logger";
import { AnalyticsEvent } from "../../generated/prisma";
import { AnalyticsRepository } from "../ports/analytics-repository";
import { AnalyticsMetricsQuery, AnalyticsReport } from "../types/analytics";

export class AnalyticsService {
  private repo: AnalyticsRepository;

  constructor(repo: AnalyticsRepository) {
    this.repo = repo;
  }

  async getAnalyticsMetrics(query: AnalyticsMetricsQuery): Promise<AnalyticsReport> {
    // Delegate to repository, no business logic in service
    return await this.repo.getMetrics(query);
  }

  async postAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.repo.postEvent(event);
    } catch {
      // Swallow analytics storage errors to avoid breaking request flow.
      logger.warn('Failed to store analytics event, but continuing without blocking user', {
        eventName: event.eventName,
      });
    }
  }
}