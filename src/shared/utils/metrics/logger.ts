/* eslint-disable no-console */

const LOG_LEVELS = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  DEBUG: "DEBUG",
} as const;

type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(logMessage, data || "");
        break;
      case LOG_LEVELS.WARN:
        console.warn(logMessage, data || "");
        break;
      case LOG_LEVELS.DEBUG:
        console.debug(logMessage, data || "");
        break;
      default:
        console.log(logMessage, data || "");
    }
  }

  info(message: string, data?: unknown) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message: string, data?: unknown) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(
    message: string | { message: string; stack?: string; statusCode?: number },
    data?: unknown
  ) {
    if (typeof message === "object") {
      const additionalData = data && typeof data === "object" ? data : {};
      this.log(LOG_LEVELS.ERROR, message.message, {
        stack: message.stack,
        statusCode: message.statusCode,
        ...additionalData,
      });
    } else {
      this.log(LOG_LEVELS.ERROR, message, data);
    }
  }

  debug(message: string, data?: unknown) {
    if (process.env.NODE_ENV === "development") {
      this.log(LOG_LEVELS.DEBUG, message, data);
    }
  }
}

export default new Logger();
