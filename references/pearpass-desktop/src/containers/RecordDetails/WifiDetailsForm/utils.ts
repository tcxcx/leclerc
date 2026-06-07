type FieldRegistration = {
  name: string
  value: string
  onChange?: unknown
  error?: string
}

export const toReadOnlyFieldProps = (field: FieldRegistration) => ({
  name: field.name,
  value: field.value
})
