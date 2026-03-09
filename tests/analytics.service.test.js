import { AnalyticsService } from "@features/analytics/analytics.service";
import { describe, expect, it, jest } from "@jest/globals";

describe("AnalyticsService", () => {
  let repo;
  let service;
  beforeEach(() => {
    repo = {
      getMetrics: jest.fn(),
      postEvent: jest.fn(),
    };
    service = new AnalyticsService(repo);
  });
  it("returns metrics for a valid date range", async () => {
    const query = {
      startDate: "2026-02-01",
      endDate: "2026-02-09",
    };
    const metricsResult = {
      metrics: [
        { name: "login", value: 100 },
        { name: "purchase", value: 20 },
      ],
      metricsQuery: query,
    };
    repo.getMetrics.mockResolvedValue(metricsResult);
    const result = await service.getAnalyticsMetrics(query);
    expect(result.ok && result.value).toEqual(metricsResult);
    expect(repo.getMetrics).toHaveBeenCalledWith(query);
  });
  it("returns empty metrics if no actions found", async () => {
    const query = {
      startDate: "2026-01-01",
      endDate: "2026-01-02",
    };
    const metricsResult = {
      metrics: [],
      metricsQuery: query,
    };
    repo.getMetrics.mockResolvedValue(metricsResult);
    const result = await service.getAnalyticsMetrics(query);
    expect(result.ok && result.value.metrics).toHaveLength(0);
  });
  it("returns error if repository fails", async () => {
    const query = {
      startDate: "2026-02-01",
      endDate: "2026-02-09",
    };
    repo.getMetrics.mockRejectedValue(new Error("DB error"));
    const result = await service.getAnalyticsMetrics(query);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.message).toBe("DB error");
  });
  it("delegates postAnalyticsEvent to repo.postEvent", async () => {
    const repo = {
      getMetrics: jest.fn(),
      postEvent: jest.fn(),
    };
    const service = new AnalyticsService(repo);
    const event = {
      id: BigInt(1),
      eventName: "feature_used",
      userId: "123",
      anonymousId: null,
      occurredAt: new Date("2026-02-09T10:30:00Z"),
      platform: "android",
      appVersion: "1.4.2",
      osVersion: "14",
      deviceModel: "Pixel 7",
      properties: {
        feature: "search",
        source: "navbar",
      },
    };
    await service.postAnalyticsEvent(event);
    expect(repo.postEvent).toHaveBeenCalledWith(event);
    expect(repo.postEvent).toHaveBeenCalledTimes(1);
  });
});
//# sourceMappingURL=analytics.service.test.js.map
