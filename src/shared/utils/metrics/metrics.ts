import type { ServerStartupMetrics } from "#app/infrastructure/@types/global.d.ts";

let metrics: ServerStartupMetrics = {};

export const setMetrics = (m: ServerStartupMetrics) => {
  metrics = m;
};
export const getMetrics = () => metrics;
