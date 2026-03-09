import logger from "#app/shared/utils/metrics/logger.js";
import {
  type AnalyticsEvent,
  Prisma,
  type PrismaClient,
} from "../../../generated/prisma/index.js";
import type { AnalyticsReport } from "./analytics.types.js";
import type { AnalyticsRepository } from "./analytics-repository.js";

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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
          properties:
            event.properties === null || event.properties === undefined
              ? Prisma.DbNull
              : (event.properties as Prisma.InputJsonValue), // Prisma handles Json nicely
        },
      });
    } catch (error) {
      const prismaError = error as { code?: string; message?: string };
      if (prismaError?.code === "P2021") {
        logger.warn("Analytics table missing; event skipped", {
          eventName: event.eventName,
          code: prismaError.code,
        });
        return;
      }
      logger.error("Failed to store analytics event", {
        eventName: event.eventName,
        error,
      });
      throw error;
    }
  }

  async getMetrics(query: {
    startDate?: string;
    endDate?: string;
  }): Promise<AnalyticsReport> {
    const { startDate, endDate } = query;
    const whereClause: Prisma.AnalyticsEventWhereInput = {};

    if (startDate) {
      whereClause.occurredAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      const existingDateFilter =
        (whereClause.occurredAt as Record<string, unknown>) ?? {};
      whereClause.occurredAt = {
        ...existingDateFilter,
        lte: new Date(endDate),
      };
    }

    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ["eventName"],
      _count: {
        eventName: true,
      },
      where: whereClause,
      orderBy: {
        _count: {
          eventName: "desc",
        },
      },
    });

    const metrics = grouped.map((g) => ({
      name: g.eventName,
      value: g._count.eventName,
    }));

    return {
      metrics,
      metricsQuery: {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      },
    };
  }
}
