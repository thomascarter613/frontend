const VALID_MOTION = new Set(['system', 'reduce', 'full']);

export function createAccessibilityContract({ role, name, keyboard = [], focus = 'native', announcements = [] } = {}) {
  if (!role || !name) throw new TypeError('Accessibility contract requires role and name');
  if (!Array.isArray(keyboard) || !Array.isArray(announcements)) throw new TypeError('keyboard and announcements must be arrays');
  return Object.freeze({ role, name, keyboard: [...keyboard], focus, announcements: [...announcements] });
}

export function validateAccessibilityContract(contract) {
  const issues = [];
  if (!contract?.role) issues.push('missing-role');
  if (!contract?.name) issues.push('missing-name');
  if (!Array.isArray(contract?.keyboard)) issues.push('missing-keyboard-contract');
  if (!contract?.focus) issues.push('missing-focus-contract');
  if (!Array.isArray(contract?.announcements)) issues.push('missing-announcement-contract');
  return Object.freeze(issues);
}

export function moveRovingFocus(ids, currentId, key, { wrap = true } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const currentIndex = Math.max(0, ids.indexOf(currentId));
  if (key === 'Home') return ids[0];
  if (key === 'End') return ids.at(-1);
  const delta = ['ArrowDown', 'ArrowRight'].includes(key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(key) ? -1 : 0;
  if (!delta) return currentId ?? ids[0];
  const next = currentIndex + delta;
  if (wrap) return ids[(next + ids.length) % ids.length];
  return ids[Math.max(0, Math.min(ids.length - 1, next))];
}

export function shouldReduceMotion(preference = 'system', systemPrefersReducedMotion = false) {
  if (!VALID_MOTION.has(preference)) throw new TypeError('motion preference must be system, reduce, or full');
  if (preference === 'reduce') return true;
  if (preference === 'full') return false;
  return Boolean(systemPrefersReducedMotion);
}
