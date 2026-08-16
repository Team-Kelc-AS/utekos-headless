export const PINTEREST_CATALOG_PUBLIC_IMAGE_DIRECTORY =
  '/Utekos-TechDown-Maritime-Blue-Unisex'

export const PINTEREST_MAX_ADDITIONAL_IMAGES = 10

export type PinterestCatalogImageSet = {
  imageFileName: string
  additionalFileNames: readonly string[]
}

const PINTEREST_CATALOG_IMAGES_BY_HANDLE: Record<
  string,
  PinterestCatalogImageSet
> = {
  'utekos-techdown': {
    imageFileName: 'Utekos-TechDown-Maritime-Blue-Unisex.png',
    additionalFileNames: [
      'Utekos-TechDown-Zipper-Closeup.png',
      'Utekos-TechDown-Maritime-Blue-Zipper-Detail.png',
      'Utekos-TechDown-Maritime-Blue-Zipper-Detail-Orange-Bg.png',
      'Utekos-TechDown-Maritime-Blue-Post-Bonfire.png',
      'Utekos-TechDown-Maritime-Blue-Medium-Unisex-Full-Body.png',
      'Utekos-TechDown-Maritime-Blue-Medium-Unisex-1.png',
      'Utekos-TechDown-Maritime-Blue-Folded-Front.png',
      'Utekos-TechDown-Maritime-Blue-Coast-House-Relax.png',
      'Utekos-TechDown-Maritime-Blue-Close.png',
      'Utekos-TechDown-Maritime-Blue-Close-Folded-Back.png'
    ]
  },
  'utekos-mikrofiber': {
    imageFileName: 'Utekos-Mikrofiber-Patriot-Blue-Unisex..png',
    additionalFileNames: [
      'Utekos-Mikrofiber-Sleeve-Detail..png',
      'Utekos-Mikrofiber-Patriot-Blue-Pocket-Detail..png',
      'Utekos-Mikrofiber-Patriot-Blue-Medium-Unisex.png',
      'Utekos-Mikrofiber-Patriot-Blue-Medium-Parkas-Mode.png',
      'Utekos-Mikrofiber-Patriot-Blue-Medium-Parkas-Mode..png',
      'Utekos-Mikrofiber-Patriot-Blue-Medium-Folded-Front.png',
      'Utekos-Mikrofiber-Patriot-Blue-Backside..png',
      'Utekos-Mikrofiber-Open-Zipper-Front.png',
      'Utekos-Mikrofiber-Lifestyle-Woods.png'
    ]
  },
  'comfyrobe': {
    imageFileName: 'Comfyrobe-XL-Dark-Blue.png',
    additionalFileNames: [
      'Comfyrobe-SherpaCore-Inside.png',
      'Comfyrobe-Plain-Open-Full-Front.png',
      'Comfyrobe-Hoodie-Details.png',
      'Comfyrobe-Backside.png',
      'Comfyrobe-Dark-Blue-Front.png',
      'Comfyrobe-Fjellnatt-Blue-XL-.png',
      'Comfyrobe-Lifestyle-Outside-Cabin.png',
      'Comfyrobe-Zipper.png'
    ]
  },
  'utekos-stapper': {
    imageFileName: 'Utekos-Stapper-Dark-Background.png',
    additionalFileNames: ['Utekos-Stapper-Black.png']
  }
}

export function getPinterestCatalogImageSet(
  productHandle: string
): PinterestCatalogImageSet {
  const imageSet =
    PINTEREST_CATALOG_IMAGES_BY_HANDLE[productHandle]

  if (!imageSet) {
    throw new Error(
      `Pinterest catalog product ${productHandle} is missing dedicated public images`
    )
  }

  if (
    imageSet.additionalFileNames.length >
    PINTEREST_MAX_ADDITIONAL_IMAGES
  ) {
    throw new Error(
      `Pinterest catalog product ${productHandle} has more than ${PINTEREST_MAX_ADDITIONAL_IMAGES} additional images`
    )
  }

  return imageSet
}

export function listPinterestCatalogImageFileNames() {
  return Object.values(
    PINTEREST_CATALOG_IMAGES_BY_HANDLE
  ).flatMap(imageSet => [
    imageSet.imageFileName,
    ...imageSet.additionalFileNames
  ])
}
