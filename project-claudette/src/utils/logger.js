// Minimal console logger with ISO timestamps and log levels.
// No external deps — keeps the footprint small for Render.

function ts() {
  return new Date().toISOString();
}

function format(level, args) {
  return [`[${ts()}] [${level}]`, ...args];
}

export const logger = {
  info(...args) {
    console.log(...format('INFO', args));
  },
  warn(...args) {
    console.warn(...format('WARN', args));
  },
  error(...args) {
    console.error(...format('ERROR', args));
  },
  debug(...args) {
    if (process.env.DEBUG === 'true') {
      console.debug(...format('DEBUG', args));
    }
  }
};

export default logger;
