import type { Request, Response } from "express";
import type { JsonValue } from "../../../generated/prisma/runtime/client.js";
import type { AnalyticsService } from "./analytics.service.js";
import type { operations } from "./dtos/generated.js";

export function analyticsController(analyticsService: AnalyticsService) {
  return {
    async getAnalyticsMetrics(req: Request, res: Response): Promise<void> {
      const { startDate, endDate } =
        (req.query as operations["getAnalyticsMetrics"]["parameters"]["query"]) ||
        {};

      const query: Record<string, string> = {};
      if (startDate !== undefined) {
        query.startDate = startDate;
      }
      if (endDate !== undefined) {
        query.endDate = endDate;
      }

      const result = await analyticsService.getAnalyticsMetrics(query);
      if (!result.ok) {
        res.status(400).json({ error: result.error.message });
        return;
      }

      res.status(200).json(result.value);
    },

    async postAnalyticsEvent(req: Request, res: Response): Promise<void> {
      const body =
        req.body as operations["postAnalyticsEvent"]["requestBody"]["content"]["application/json"];

      const event = {
        id: 0n,
        eventName: body.event_name,
        userId: body.user_id || null,
        anonymousId: body.anonymous_id || null,
        occurredAt: new Date(body.timestamp || new Date()),
        platform: body.context?.platform || null,
        appVersion: body.context?.app_version || null,
        deviceModel: body.context?.device_model || null,
        osVersion: body.context?.os_version || null,
        properties: (body.properties !== undefined && body.properties !== null
          ? body.properties
          : {}) as JsonValue,
      };

      const result = await analyticsService.postAnalyticsEvent(event);
      if (!result.ok) {
        res.status(400).json({ error: result.error.message });
        return;
      }

      res.status(200).json({ success: true });
    },
  };
}
