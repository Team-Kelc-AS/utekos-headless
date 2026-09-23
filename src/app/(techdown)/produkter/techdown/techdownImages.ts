type TechdownImage = {
  alt: string
  height: number
  id: number
  main: string
  thumbnail: string
  width: number
}

const galleryPath = '/images/techdown/gallery'

function image(
  id: number,
  width: number,
  height: number,
  alt: string,
  thumbnail = String(id)
): TechdownImage {
  return {
    id,
    main: `${galleryPath}/main/${id}.webp`,
    thumbnail: `${galleryPath}/thumbnails/${thumbnail}.jpg`,
    width,
    height,
    alt
  }
}

// Public URLs avoid serializing static-image blur metadata into the gallery bundle.
// Dimensions are the original files' intrinsic dimensions; images are never transformed here.
export const techdownImages = [
  image(
    1,
    1000,
    1500,
    'Kvinne med hetten oppe i marineblå Utekos TechDown™ i skogen.'
  ),
  image(
    2,
    1000,
    1500,
    'Marineblå Utekos TechDown™ med hette og hendene i frontlommen, sett forfra.'
  ),
  image(
    3,
    1000,
    1500,
    'Kvinne som smiler i marineblå Utekos TechDown™ med hetten oppe.'
  ),
  image(
    4,
    1000,
    1500,
    'To menn sitter i marineblå Utekos TechDown™ på en terrasse.'
  ),
  image(
    5,
    1000,
    1500,
    'En mann og en kvinne i marineblå Utekos TechDown™ sitter med en kopp på terrassen.'
  ),
  image(
    6,
    1000,
    1500,
    'To kvinner i marineblå Utekos TechDown™ på terrassen; den ene ser i kikkert.',
    '6-corrected'
  ),
  image(
    7,
    1000,
    1500,
    'To kvinner i marineblå Utekos TechDown™ deler snacks ved et lite terrassebord.'
  ),
  image(
    8,
    1000,
    1500,
    'Kvinne i lang, marineblå Utekos TechDown™ med armene utstrakt ved vannet.'
  ),
  image(
    9,
    1000,
    1500,
    'Nærbilde av hetten, kragen og den oransje glidelåsdetaljen på Utekos TechDown™.'
  ),
  image(
    10,
    1000,
    1500,
    'Kvinne i marineblå Utekos TechDown™ sitter i skogen med en varm kopp og en soppkurv.'
  ),
  image(
    11,
    1000,
    1500,
    'Marineblå Utekos TechDown™ i full lengde, sett skrått forfra.'
  ),
  image(
    12,
    1875,
    2813,
    'Marineblå Utekos TechDown™ i full lengde, sett bakfra med hetten oppe.'
  ),
  image(
    13,
    1875,
    2813,
    'Baksiden av marineblå Utekos TechDown™ i kort utgave, med hette.'
  ),
  image(
    14,
    1000,
    1500,
    'Nærbilde av lommeglidelås med oransje detaljer og Utekos-symbol.'
  ),
  image(
    15,
    1000,
    1500,
    'Nærbilde av glidelås, snorstramming og Utekos-symbol ved kragen.'
  ),
  image(
    16,
    1000,
    1500,
    'Åpen front på marineblå Utekos TechDown™, med innside og oransje glidelåsdetaljer.'
  )
] as const
