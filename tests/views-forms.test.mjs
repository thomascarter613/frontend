import test from 'node:test';
import assert from 'node:assert/strict';
import { createFilter, createSavedView, createTableViewState, serializeTableViewState } from '../src/platform/views.js';
import { createFormSchema, createFormState, updateFormField, isFormDirty, validateForm } from '../src/platform/forms.js';

test('saved table views serialize configuration but not data records', () => {
  const state = createTableViewState(createSavedView({ id: 'v1', name: 'Review', resourceType: 'table', viewType: 'table', filters: createFilter({ field: 'status', value: 'Review' }), settings: { pageSize: 25 } }));
  const saved = serializeTableViewState({ id: 'v2', name: 'Copy', resourceType: 'table', state, fields: ['status'] });
  assert.equal(saved.settings.pageSize, 25);
  assert.equal('rows' in saved, false);
  assert.equal('data' in saved, false);
});

test('form dirty state is independent from validation state', () => {
  const schema = createFormSchema({ id: 'task', fields: [{ name: 'title', label: 'Title', required: true }] });
  const initial = createFormState(schema, { title: 'Existing' });
  const dirty = updateFormField(initial, 'title', '');
  const validated = validateForm(schema, dirty);
  assert.equal(isFormDirty(dirty), true);
  assert.equal(validated.errors.title, 'Title is required');
  const cleanInvalid = validateForm(schema, createFormState(schema, { title: '' }));
  assert.equal(isFormDirty(cleanInvalid), false);
  assert.equal(Boolean(cleanInvalid.errors.title), true);
});
