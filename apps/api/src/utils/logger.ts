type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  meta?: LogMeta;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private serviceName: string;
  private minLevel: LogLevel;

  constructor(serviceName: string, minLevel: LogLevel = 'info') {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    }

    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];
    
    const metaStr = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
    return `${entry.timestamp} ${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: LogMeta): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      ...(meta && { meta }),
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, meta?: LogMeta): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: LogMeta): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogMeta): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: LogMeta): void {
    this.log('error', message, meta);
  }

  child(defaultMeta: LogMeta): ChildLogger {
    return new ChildLogger(this, defaultMeta);
  }
}

class ChildLogger {
  private parent: Logger;
  private defaultMeta: LogMeta;

  constructor(parent: Logger, defaultMeta: LogMeta) {
    this.parent = parent;
    this.defaultMeta = defaultMeta;
  }

  debug(message: string, meta?: LogMeta): void {
    this.parent.debug(message, { ...this.defaultMeta, ...meta });
  }

  info(message: string, meta?: LogMeta): void {
    this.parent.info(message, { ...this.defaultMeta, ...meta });
  }

  warn(message: string, meta?: LogMeta): void {
    this.parent.warn(message, { ...this.defaultMeta, ...meta });
  }

  error(message: string, meta?: LogMeta): void {
    this.parent.error(message, { ...this.defaultMeta, ...meta });
  }
}

let loggerInstance: Logger | null = null;

export function initLogger(serviceName: string, minLevel: LogLevel = 'info'): Logger {
  loggerInstance = new Logger(serviceName, minLevel);
  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger('default', 'info');
  }
  return loggerInstance;
}

export { Logger, ChildLogger, type LogLevel, type LogMeta };
