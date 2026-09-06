// Path: src/app/produkter/components/ProductsPageFooter.tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const footerCardClassName =
  'rounded-xl border border-border bg-muted p-5 text-sm text-background shadow-xs ring-1 ring-foreground/10'

export function ProductsPageFooter() {
  return (
    <article>
      <div className='mt-12 grid grid-cols-1 gap-8 md:mt-2 md:grid-cols-2'>
        <div className={footerCardClassName}>
          <h3 className='font-utekos-text-medium text-xl text-background'>
            Usikker på størrelsen?
          </h3>
          <p className='mt-2 font-utekos-text-medium text-background'>
            Se vår størrelsesguide og finn den perfekte
            passformen for deg.
          </p>
          <Button
            asChild
            className='mt-4 bg-sidebar text-sidebar-foreground hover:bg-sidebar/90'
          >
            <Link
              href='/handlehjelp/storrelsesguide'
              data-track='ProductsPageFooterSizeGuideClick'
            >
              Les størrelsesguiden
            </Link>
          </Button>
        </div>
        <div className={footerCardClassName}>
          <h3 className='font-utekos-text-medium text-xl text-background'>
            Nysgjerrig på teknologien?
          </h3>
          <p className='mt-2 font-utekos-text-medium text-background'>
            Les om materialene og designfilosofien som holder
            deg varm.
          </p>
          <Button
            asChild
            className='mt-4 bg-sidebar text-sidebar-foreground hover:bg-sidebar/90'
          >
            <Link
              href='/handlehjelp/teknologi-materialer'
              data-track='ProductsPageFooterTechnologyMaterialsClick'
            >
              Utforsk materialene
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
