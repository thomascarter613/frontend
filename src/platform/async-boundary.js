export function createAsyncActionState() {
  return Object.freeze({ status: 'idle', result: null, error: null });
}

export function transitionAsyncAction(state, status, patch = {}) {
  if (!['idle', 'pending', 'success', 'failure', 'cancelled'].includes(status)) throw new TypeError(`unsupported async action status: ${status}`);
  return Object.freeze({ ...state, ...patch, status });
}

export async function executeMutation({ execute, optimistic = null, confirm = null, rollback = null, normalizeError = (error) => error, instrumentation = null, eventName = 'mutation.execute' } = {}) {
  if (typeof execute !== 'function') throw new TypeError('execute must be a function');
  let state = transitionAsyncAction(createAsyncActionState(), 'pending');
  let optimisticValue;
  try {
    if (optimistic) optimisticValue = await optimistic();
    instrumentation?.emit?.(`${eventName}.pending`, {});
    const result = await execute();
    if (confirm) await confirm(result, optimisticValue);
    state = transitionAsyncAction(state, 'success', { result });
    instrumentation?.emit?.(`${eventName}.success`, {});
    return state;
  } catch (error) {
    if (rollback) await rollback(optimisticValue, error);
    const normalized = normalizeError(error);
    const status = error?.name === 'AbortError' ? 'cancelled' : 'failure';
    state = transitionAsyncAction(state, status, { error: normalized });
    instrumentation?.emit?.(`${eventName}.${status}`, { errorCategory: normalized?.category ?? normalized?.name ?? 'unknown' });
    return state;
  }
}

export function safeRender(render, fallback, { scope = 'component', onError = null } = {}) {
  if (typeof render !== 'function' || typeof fallback !== 'function') throw new TypeError('render and fallback must be functions');
  try {
    return Object.freeze({ ok: true, value: render(), error: null, scope });
  } catch (error) {
    onError?.(error, scope);
    return Object.freeze({ ok: false, value: fallback(error), error, scope });
  }
}

export function createLoadingBoundary({ id, label = id, state = 'idle' } = {}) {
  if (!id) throw new TypeError('loading boundary requires id');
  if (!['idle', 'loading', 'ready', 'failed'].includes(state)) throw new TypeError('unsupported loading boundary state');
  return Object.freeze({ id, label, state, error: null });
}

export function transitionLoadingBoundary(boundary, state, error = null) {
  if (!['idle', 'loading', 'ready', 'failed'].includes(state)) throw new TypeError('unsupported loading boundary state');
  return Object.freeze({ ...boundary, state, error: state === 'failed' ? error : null });
}
