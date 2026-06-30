/**
 * Tiny leveled logger. Gaffer's pipeline is long-running and mostly silent, so a
 * little structured, timestamp-free, prefixed output keeps the demo readable.
 * Respects GAFFER_DEBUG for verbose tracing.
 */

import { RUNTIME } from '../config/models.js';

const ICONS = { info: '•', step: '▸', ok: '✓', warn: '!', debug: '·', error: '✗' };

function emit(level, prefix, msg) {
  const icon = ICONS[level] || '•';
  const line = `${icon} ${prefix ? `[${prefix}] ` : ''}${msg}`;
  if (level === 'error') console.error(line);
  else console.log(line);
}

export function createLogger(prefix = '') {
  return {
    info: (m) => emit('info', prefix, m),
    step: (m) => emit('step', prefix, m),
    ok: (m) => emit('ok', prefix, m),
    warn: (m) => emit('warn', prefix, m),
    error: (m) => emit('error', prefix, m),
    debug: (m) => { if (RUNTIME.debug) emit('debug', prefix, m); },
  };
}

export const log = createLogger();
