import { AnalyticsEvent } from "../../generated/prisma";
import { AnalyticsMetricsQuery, AnalyticsReport } from "../types/analytics";

export interface AnalyticsRepository {
  getMetrics(query: AnalyticsMetricsQuery): Promise<AnalyticsReport>;
  postEvent(event: AnalyticsEvent): Promise<void>;
}