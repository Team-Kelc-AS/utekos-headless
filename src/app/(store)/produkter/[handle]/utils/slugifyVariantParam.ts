// Path: src/app/(store)/produkter/[handle]/utils/slugifyVariantParam.ts

export function slugifyVariantParam(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replaceAll('æ', 'ae')
    .replaceAll('ø', 'o')
    .replaceAll('å', 'a')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
