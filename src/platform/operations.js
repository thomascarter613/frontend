export const OPERATION_STATES = Object.freeze([
  'idle', 'pending', 'queued', 'running', 'retrying', 'paused',
  'waiting-input', 'waiting-connection', 'success', 'partial-success',
  'failed', 'cancelled', 'interrupted',
]);

export const TERMINAL_OPERATION_STATES = Object.freeze(['success', 'partial-success', 'failed', 'cancelled', 'interrupted']);

const TRANSITIONS = Object.freeze({
  idle: ['pending', 'queued'],
  pending: ['queued', 'running', 'cancelled', 'failed'],
  queued: ['running', 'cancelled', 'interrupted'],
  running: ['success', 'partial-success', 'failed', 'cancelled', 'interrupted', 'paused', 'waiting-input', 'waiting-connection'],
  retrying: ['running', 'failed', 'cancelled', 'waiting-connection'],
  paused: ['running', 'cancelled', 'interrupted'],
  'waiting-input': ['running', 'cancelled', 'interrupted'],
  'waiting-connection': ['retrying', 'running', 'cancelled', 'interrupted'],
  failed: ['retrying', 'queued'],
  interrupted: ['retrying', 'queued', 'cancelled'],
  'partial-success': ['retrying'],
  success: [],
  cancelled: [],
});

export function createOperation({ id, label, kind = 'operation', state = 'pending', progress = null, recoverable = false, resourceId = null, metadata = null } = {}) {
  if (!id || !label) throw new TypeError('Operations require id and label');
  if (!OPERATION_STATES.includes(state)) throw new TypeError(`Unknown operation state: ${state}`);
  return Object.freeze({ id, label, kind, state, progress, recoverable, resourceId, metadata, attempt: 0, createdAt: Date.now(), updatedAt: Date.now() });
}

export function canTransition(operation, nextState) {
  return Boolean(TRANSITIONS[operation?.state]?.includes(nextState));
}

export function transitionOperation(operation, nextState, patch = {}) {
  if (!OPERATION_STATES.includes(nextState)) throw new TypeError(`Unknown operation state: ${nextState}`);
  if (operation.state !== nextState && !canTransition(operation, nextState)) {
    throw new Error(`Invalid operation transition: ${operation.state} -> ${nextState}`);
  }
  return Object.freeze({
    ...operation,
    ...patch,
    state: nextState,
    attempt: nextState === 'retrying' ? operation.attempt + 1 : operation.attempt,
    updatedAt: Date.now(),
  });
}

export function isTerminalOperation(operation) {
  return TERMINAL_OPERATION_STATES.includes(operation?.state);
}
