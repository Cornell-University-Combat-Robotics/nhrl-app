/**
 * Log utility matching scraper's log API.
 * Outputs to console with timestamp and level.
 */
export function log(level: 'info' | 'warn' | 'error', message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const formatted = `${timestamp} [${level}] ${message}`;
  if (level === 'error') {
    console.error(formatted, meta ?? '');
  } else {
    console.log(formatted, meta ?? '');
  }
}
