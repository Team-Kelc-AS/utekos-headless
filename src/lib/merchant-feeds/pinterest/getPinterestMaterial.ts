const PINTEREST_MATERIAL_BY_HANDLE: Record<string, string> = {
  'comfyrobe': 'Sherpa',
  'utekos-dun': 'Down',
  'utekos-mikrofiber': 'Nylon',
  'utekos-techdown': 'Nylon',
  'utekos-stapper': 'Nylon'
}

export function getPinterestMaterial(
  productHandle: string
): string {
  const material = PINTEREST_MATERIAL_BY_HANDLE[productHandle]

  if (!material) {
    throw new Error(
      `Pinterest catalog product ${productHandle} is missing a material mapping`
    )
  }

  return material
}
