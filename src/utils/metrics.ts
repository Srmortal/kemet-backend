// src/utils/metrics.ts
import type { ServerStartupMetrics } from '../@types/global';

let metrics: ServerStartupMetrics = {};

export const setMetrics = (m: ServerStartupMetrics) => { metrics = m; };
export const getMetrics = () => metrics;