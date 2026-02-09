import { AnalyticsRepository } from '../ports/analytics-repository';
import { AnalyticsEvent, PrismaClient } from '../../generated/prisma';
import { AnalyticsReport } from '../types/analytics';
import logger from '../utils/logger';

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private prisma: PrismaClient) {}

  async postEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventName: event.eventName,
          userId: event.userId,
          anonymousId: event.anonymousId,
          occurredAt: event.occurredAt,
          platform: event.platform,
          appVersion: event.appVersion,
          deviceModel: event.deviceModel,
          osVersion: event.osVersion,
          properties: event.properties ?? undefined, // Prisma handles Json nicely
        },
      });
    } catch (error) {
      const prismaError = error as { code?: string; message?: string };
      if (prismaError?.code === 'P2021') {
        logger.warn('Analytics table missing; event skipped', {
          eventName: event.eventName,
          code: prismaError.code,
        });
        return;
      }
      logger.error('Failed to store analytics event', {
        eventName: event.eventName,
        error,
      });
      throw error;
    }
  }

  async getMetrics(query: { startDate?: string; endDate?: string }): Promise<AnalyticsReport> {
    const { startDate, endDate } = query;
    const whereClause: any = {};

    if (startDate) whereClause.occurredAt = { gte: new Date(startDate) };
    if (endDate) {
      whereClause.occurredAt = { ...whereClause.occurredAt, lte: new Date(endDate) };
    }

    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['eventName'],
      _count: {
        eventName: true,
      },
      where: whereClause,
      orderBy: {
        _count: {
          eventName: 'desc',
        },
      },
    });

    const metrics = grouped.map((g) => ({
      name: g.eventName,
      value: g._count.eventName,
    }));

    return {
        metrics, 
        startDate: startDate ? new Date(startDate) : undefined, 
        endDate: endDate ? new Date(endDate) : undefined
    };
  }
}