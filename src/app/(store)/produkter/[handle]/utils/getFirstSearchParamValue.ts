// Path: src/app/(store)/produkter/[handle]/utils/getFirstSearchParamValue.ts

export function getFirstSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}
