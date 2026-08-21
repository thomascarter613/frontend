export const ERROR_CATEGORIES = Object.freeze([
  'validation',
  'permission',
  'network',
  'conflict',
  'unavailable',
  'timeout',
  'not-found',
  'dependency',
  'quota',
  'unsupported',
  'corrupt',
  'integration',
  'extension',
  'storage',
  'unknown',
]);

export function createPlatformError({
  code,
  category = 'unknown',
  message,
  recoverable = false,
  operationId = null,
  resourceId = null,
  details = null,
} = {}) {
  if (!code || !message) throw new TypeError('Platform errors require code and message');
  const normalizedCategory = ERROR_CATEGORIES.includes(category) ? category : 'unknown';
  return Object.freeze({
    code,
    category: normalizedCategory,
    message,
    recoverable: Boolean(recoverable),
    operationId,
    resourceId,
    details,
    timestamp: Date.now(),
  });
}

export function ok(value) {
  return { ok: true, value };
}

export function err(error) {
  return { ok: false, error };
}
