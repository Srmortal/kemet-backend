/* eslint-disable no-console */

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data || '');
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage, data || '');
        break;
      default:
        console.log(logMessage, data || '');
    }
  }

  info(message: string, data?: unknown) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string | { message: string; stack?: string; statusCode?: number }, data?: unknown) {
    if (typeof message === 'object') {
      const additionalData = data && typeof data === 'object' ? data : {};
      this.log(LogLevel.ERROR, message.message, {
        stack: message.stack,
        statusCode: message.statusCode,
        ...additionalData,
      });
    } else {
      this.log(LogLevel.ERROR, message, data);
    }
  }

  debug(message: string, data?: unknown) {
    if (process.env['NODE_ENV'] === 'development') {      
      this.log(LogLevel.DEBUG, message, data);
    }
  }
}

export default new Logger();