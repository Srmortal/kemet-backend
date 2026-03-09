import type { AnalyticsEvent } from "../../../generated/prisma/index.js";
import type {
  AnalyticsMetricsQuery,
  AnalyticsReport,
} from "./analytics.types.js";

export interface AnalyticsRepository {
  getMetrics(query: AnalyticsMetricsQuery): Promise<AnalyticsReport>;
  postEvent(event: AnalyticsEvent): Promise<void>;
}
