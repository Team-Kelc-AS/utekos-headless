const META_WEBSITE_HIGHLIGHT_IMAGES = [
  {
    src: '/Utekos-Partner-2160x2160.jpg',
    width: 2160,
    height: 2160
  },
  {
    src: '/Utekos-TechDown-Terrasse-Master.jpg',
    width: 1080,
    height: 1080
  },
  {
    src: '/Utekos-TechDown-Partner-1080x1350.jpg',
    width: 1080,
    height: 1350
  },
  {
    src: '/Utekos-Partner-1080x1920.jpg',
    width: 1080,
    height: 1920
  },
  {
    src: '/Utekos-TechDown-Partner-2-1080x1920.jpg',
    width: 1080,
    height: 1920
  },
  {
    src: '/Utekos-TechDown-Partner-1080x1920.jpg',
    width: 1080,
    height: 1920
  }
] as const

export function MetaWebsiteHighlights() {
  return (
    <div className='hidden' aria-hidden='true'>
      {META_WEBSITE_HIGHLIGHT_IMAGES.map(image => (
        // eslint-disable-next-line @next/next/no-img-element -- Meta must receive one direct public URL without an optimized srcset.
        <img
          key={image.src}
          src={image.src}
          alt=''
          width={image.width}
          height={image.height}
          loading='lazy'
          decoding='async'
        />
      ))}
    </div>
  )
}
