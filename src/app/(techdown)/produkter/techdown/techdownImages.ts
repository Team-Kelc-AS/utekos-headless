type TechdownImage = {
  alt: string
  height: number
  id: number
  main: string
  thumbnail: string
  width: number
}

const SQUARE_IMAGE_SIZE = 1080

function image(id: number, alt: string): TechdownImage {
  const src = `/${id}.webp`

  return {
    id,
    main: src,
    thumbnail: src,
    width: SQUARE_IMAGE_SIZE,
    height: SQUARE_IMAGE_SIZE,
    alt
  }
}

// These are the supplied square TechDown™ source images in public/.
// Their intrinsic 1:1 dimensions are preserved in both the main gallery and thumbnails.
export const techdownImages = [
  image(
    1,
    'Kvinne i marineblå Utekos TechDown™ med hette i skogen.'
  ),
  image(
    2,
    'Kvinne i marineblå Utekos TechDown™ med hette og armene foran kroppen.'
  ),
  image(
    3,
    'Smilende kvinne i marineblå Utekos TechDown™ med hette i skogen.'
  ),
  image(
    4,
    'Utekos TechDown™ sett bakfra, med hette, ved et rekkverk.'
  ),
  image(
    7,
    'To personer i marineblå Utekos TechDown™ i hengekøyer i skogen.'
  ),
  image(
    8,
    'To personer i marineblå Utekos TechDown™ som ligger i hengekøyer.'
  ),
  image(
    9,
    'To personer i marineblå Utekos TechDown™ i hengekøyer med kopper.'
  ),
  image(
    12,
    'Nærbilde av hette, krage og glidelåsdetaljer på marineblå Utekos TechDown™.'
  ),
  image(
    13,
    'To personer i marineblå Utekos TechDown™ som ligger i hengekøyer, sett ovenfra.'
  ),
  image(
    14,
    'Nærbilde av to personer i marineblå Utekos TechDown™ i hengekøyer.'
  )
] as const
