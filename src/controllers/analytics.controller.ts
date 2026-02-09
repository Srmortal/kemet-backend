import { analyticsService } from '../di';
import { operations } from '../types/api'; // adjust import path as needed
import { Request, Response } from 'express';

export async function getAnalyticsMetricsController(
  req: Request,
  res: Response
): Promise<void> {
  const { startDate, endDate } = req.query as operations['getAnalyticsMetrics']['parameters']['query'] || {};

  // Call the analytics service (service orchestration only, no business logic)
  const result = await analyticsService.getAnalyticsMetrics({ startDate, endDate });

  // For demonstration, assuming result matches the OpenAPI response type:
  res.status(200).json(result);
}

export async function postAnalyticsEventController(
  req: Request,
  res: Response
): Promise<void> {
  const body =
    req.body as operations['postAnalyticsEvent']['requestBody']['content']['application/json'];

  const event = {
    id: 0n, // placeholder id, repository should handle assignment
    eventName: body.event_name,
    userId: body.user_id || null,
    anonymousId: body.anonymous_id || null,
    occurredAt: new Date(body.timestamp || new Date()),
    platform: body.context?.platform || null,
    appVersion: body.context?.app_version || null,
    deviceModel: body.context?.device_model || null,
    osVersion: body.context?.os_version || null,
    properties: (body.properties || {}) as any,
  };

  await analyticsService.postAnalyticsEvent(event);

  res.status(200).json({ success: true });
}