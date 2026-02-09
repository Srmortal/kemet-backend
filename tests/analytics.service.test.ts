import { AnalyticsRepository } from '../src/ports/analytics-repository';
import { AnalyticsMetricsQuery, AnalyticsReport } from '../src/types/analytics';
import { AnalyticsService } from '../src/services/analytics.service';
import { AnalyticsEvent } from '../generated/prisma';

describe('AnalyticsService', () => {
  let repo: AnalyticsRepository;
  let service: AnalyticsService;

  beforeEach(() => {
    repo = {
      getMetrics: jest.fn(),
      postEvent: jest.fn()
    };
    service = new AnalyticsService(repo);
  });

  it('returns metrics for a valid date range', async () => {
    const query: AnalyticsMetricsQuery = { startDate: '2026-02-01', endDate: '2026-02-09' };
    const metricsResult: AnalyticsReport = {
      metrics: [
        { name: 'login', value: 100 },
        { name: 'purchase', value: 20 }
      ]
    };
    (repo.getMetrics as jest.Mock).mockResolvedValue(metricsResult);

    const result = await service.getAnalyticsMetrics(query);
    expect(result).toEqual(metricsResult);
    expect(repo.getMetrics).toHaveBeenCalledWith(query);
  });

  it('returns empty metrics if no actions found', async () => {
    const query: AnalyticsMetricsQuery = { startDate: '2026-01-01', endDate: '2026-01-02' };
    const metricsResult: AnalyticsReport = {
      metrics: []
    };
    (repo.getMetrics as jest.Mock).mockResolvedValue(metricsResult);

    const result = await service.getAnalyticsMetrics(query);
    expect(result.metrics).toHaveLength(0);
  });

  it('throws error if repository fails', async () => {
    const query: AnalyticsMetricsQuery = { startDate: '2026-02-01', endDate: '2026-02-09' };
    (repo.getMetrics as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(service.getAnalyticsMetrics(query)).rejects.toThrow('DB error');
  });

  it('delegates postAnalyticsEvent to repo.postEvent', async () => {
    const repo: AnalyticsRepository = {
      getMetrics: jest.fn<Promise<AnalyticsReport>, [AnalyticsMetricsQuery]>(),
      postEvent: jest.fn<Promise<void>, [AnalyticsEvent]>().mockResolvedValue(undefined),
    };

    const service = new AnalyticsService(repo);

    const event: AnalyticsEvent = {
        id: BigInt(1),
        eventName: 'feature_used',
        userId: '123',
        anonymousId: null,
        occurredAt: new Date('2026-02-09T10:30:00Z'),
        platform: 'android',
        appVersion: '1.4.2',
        osVersion: '14',
        deviceModel: 'Pixel 7',
        properties: {
            feature: 'search',
            source: 'navbar',
        },
    };

    await service.postAnalyticsEvent(event);

    expect(repo.postEvent).toHaveBeenCalledWith(event);
    expect(repo.postEvent).toHaveBeenCalledTimes(1);
  });
});
