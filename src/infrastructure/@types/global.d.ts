declare global {
  // eslint-disable-next-line no-var
  var SERVER_STARTUP_METRICS: ServerStartupMetrics | undefined;
  // eslint-disable-next-line no-var
  var FIREBASE_INIT_TIME: number | undefined;
}

export interface ServerStartupMetrics {
  memoryUsageMB?: number;
  processUptime?: number;
  readyTime?: string;
  startupTime?: number;
  totalInitializationTime?: number;
}
