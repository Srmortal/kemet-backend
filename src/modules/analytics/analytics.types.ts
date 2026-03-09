export interface AnalyticsMetric {
  name: string;
  value: number;
}
export interface AnalyticsMetricsQuery {
  endDate?: string;
  startDate?: string;
}
export interface AnalyticsReport {
  metrics: AnalyticsMetric[];
  metricsQuery?: AnalyticsMetricsQuery;
}
