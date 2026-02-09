export interface AnalyticsMetric {
  name: string;
  value: number;
}
export interface AnalyticsMetricsQuery {
  startDate?: string;
  endDate?: string;
}
export interface AnalyticsReport {
  metrics: AnalyticsMetric[];
  startDate?: Date;
  endDate?: Date;
}