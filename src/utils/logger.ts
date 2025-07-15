import winston from 'winston';
import { LoggerOptions } from '../types';

export class Logger {
  private logger: winston.Logger;

  constructor(options: LoggerOptions | string) {
    // Handle string parameter for simple service name
    if (typeof options === 'string') {
      options = {
        service: options,
        level: 'info',
        environment: 'development'
      };
    }
    this.logger = winston.createLogger({
      level: options.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, service, environment, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            service: options.service,
            environment: options.environment,
            ...meta
          });
        })
      ),
      defaultMeta: { 
        service: options.service,
        environment: options.environment 
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: winston.format.json()
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: winston.format.json()
        })
      ]
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

export function createLogger(options: LoggerOptions): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(options);
  }
  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call createLogger() first.');
  }
  return loggerInstance;
}
