type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface Logger {
  trace(meta: Record<string, unknown> | string, msg?: string): void;
  debug(meta: Record<string, unknown> | string, msg?: string): void;
  info(meta: Record<string, unknown> | string, msg?: string): void;
  warn(meta: Record<string, unknown> | string, msg?: string): void;
  error(meta: Record<string, unknown> | string, msg?: string): void;
  fatal(meta: Record<string, unknown> | string, msg?: string): void;
  child(bindings: Record<string, unknown>): Logger;
}

function consoleLogger(bindings: Record<string, unknown> = {}): Logger {
  const log = (level: Level, meta: any, msg?: string) => {
    const isMsg = typeof meta === 'string';
    const payload = {
      level, time: new Date().toISOString(),
      ...bindings,
      ...(isMsg ? { msg: meta } : { ...meta, msg }),
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(payload));
    } else {
      console.log(`[${level}]`, payload.msg ?? '', payload);
    }
  };
  return {
    trace: (m, s) => log('trace', m, s),
    debug: (m, s) => log('debug', m, s),
    info:  (m, s) => log('info', m, s),
    warn:  (m, s) => log('warn', m, s),
    error: (m, s) => log('error', m, s),
    fatal: (m, s) => log('fatal', m, s),
    child: (b) => consoleLogger({ ...bindings, ...b }),
  };
}

let real: Logger;
try {
  const pino = require('pino');
  real = pino({
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    base: { app: 'iraq-erp', env: process.env.NODE_ENV ?? 'development' },
  });
} catch {
  real = consoleLogger();
}

export const logger = real;
