const EVENT_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z0-9_-]+)+$/i;
const SENSITIVE_KEYS = /(?:content|body|draft|text|value|password|secret|token|credential|authorization|cookie)/i;

function sanitizeValue(value, depth = 0) {
  if (depth > 4 || value == null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value !== 'object') return String(value);
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !SENSITIVE_KEYS.test(key))
    .slice(0, 40)
    .map(([key, child]) => [key, sanitizeValue(child, depth + 1)]));
}

export function sanitizeInstrumentationPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new TypeError('instrumentation payload must be an object');
  return Object.freeze(sanitizeValue(payload));
}

export function createInstrumentation({ sink = () => {}, clock = () => Date.now() } = {}) {
  if (typeof sink !== 'function' || typeof clock !== 'function') throw new TypeError('sink and clock must be functions');
  return Object.freeze({
    emit(name, payload = {}) {
      if (!EVENT_PATTERN.test(name)) throw new TypeError('instrumentation event names use dotted stable identifiers');
      const event = Object.freeze({ name, timestamp: clock(), payload: sanitizeInstrumentationPayload(payload) });
      sink(event);
      return event;
    },
  });
}

export function createMemoryInstrumentation() {
  const events = [];
  const instrumentation = createInstrumentation({ sink: (event) => events.push(event) });
  return Object.freeze({ instrumentation, events, clear: () => { events.length = 0; } });
}

export function createInstrumentationHub({ limit = 100, clock = () => Date.now() } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError('instrumentation hub limit must be a positive integer');
  const events = [];
  const listeners = new Set();
  const instrumentation = createInstrumentation({
    clock,
    sink(event) {
      events.push(event);
      if (events.length > limit) events.splice(0, events.length - limit);
      for (const listener of listeners) listener(event);
    },
  });
  return Object.freeze({
    emit: instrumentation.emit,
    recent: () => [...events],
    subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('listener must be a function'); listeners.add(listener); return () => listeners.delete(listener); },
    clear() { events.length = 0; },
  });
}
