export function createFieldDefinition({ name, label, type = 'text', required = false, disabled = false, readOnly = false, description = '', validate = null } = {}) {
  if (!name || !label) throw new TypeError('Field definition requires name and label');
  return Object.freeze({ name, label, type, required, disabled, readOnly, description, validate });
}
export function createFormSchema({ id, fields = [] } = {}) { if (!id) throw new TypeError('Form schema requires id'); return Object.freeze({ id, fields: fields.map((field) => createFieldDefinition(field)) }); }
export function createFormState(schema, values = {}) { return { schemaId: schema.id, initialValues: { ...values }, values: { ...values }, errors: {}, touched: {}, validating: false }; }
export function updateFormField(state, name, value) { return { ...state, values: { ...state.values, [name]: value }, touched: { ...state.touched, [name]: true } }; }
export function isFormDirty(state) { const keys = new Set([...Object.keys(state.initialValues), ...Object.keys(state.values)]); return [...keys].some((key) => !Object.is(state.initialValues[key], state.values[key])); }
export function validateForm(schema, state) { const errors = {}; for (const field of schema.fields) { const value = state.values[field.name]; if (field.required && (value == null || value === '' || (Array.isArray(value) && value.length === 0))) errors[field.name] = `${field.label} is required`; else if (field.validate) { const result = field.validate(value, state.values); if (result) errors[field.name] = result; } } return { ...state, errors }; }
export function resolveFieldDefinition(registry, type) { return registry.get(`field.${type}`) ?? registry.get('field.text'); }
export function resourcePropertySchema(resource) { return createFormSchema({ id: `resource-properties:${resource?.type ?? 'unknown'}`, fields: [{ name: 'status', label: 'Status', type: 'status', required: true }, { name: 'owner', label: 'Owner', type: 'user' }, { name: 'priority', label: 'Priority', type: 'status' }, { name: 'updated', label: 'Updated', type: 'date', readOnly: true }, { name: 'visibility', label: 'Visibility', type: 'text' }] }); }
