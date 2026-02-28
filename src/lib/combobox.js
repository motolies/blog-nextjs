export const COMBOBOX_POPOVER_CONTENT_CLASSNAME =
  "w-[var(--radix-popover-trigger-width)] max-w-[90vw] p-0"

export function normalizeEntityId(value) {
  if (value === null || value === undefined) {
    return null
  }

  return String(value)
}

export function isSameEntityId(left, right) {
  const normalizedLeft = normalizeEntityId(left)
  const normalizedRight = normalizeEntityId(right)

  if (normalizedLeft === null || normalizedRight === null) {
    return false
  }

  return normalizedLeft === normalizedRight
}

export function isUnsetComboboxValue(value) {
  const normalizedValue = normalizeEntityId(value)

  return (
    normalizedValue === null ||
    normalizedValue === "" ||
    normalizedValue === "ROOT" ||
    normalizedValue === "NEW"
  )
}
