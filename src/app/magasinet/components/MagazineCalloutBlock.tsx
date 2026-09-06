import type { MagazineBlock } from '../types'

type MagazineCalloutBlockProps = {
  block: Extract<MagazineBlock, { type: 'callout' }>
}

const calloutClassByTone = {
  quiet:
    'border-background/12 bg-foreground text-background',
  dark: 'border-foreground/12 bg-background text-foreground',
  accent:
    'border-transparent bg-[var(--magazine-accent)] text-[var(--magazine-accent-foreground)]',
  commerce:
    'border-primary-foreground/30 bg-primary text-primary-foreground'
} satisfies Record<
  Extract<MagazineBlock, { type: 'callout' }>['tone'],
  string
>

export function MagazineCalloutBlock({
  block
}: MagazineCalloutBlockProps) {
  return (
    <aside
      className={`my-14 rounded-lg border p-6 sm:p-8 ${calloutClassByTone[block.tone]}`}
    >
      {block.title && (
        <h3 className='font-google-sans font-sans text-2xl leading-[0.95] font-bold sm:text-3xl'>
          {block.title}
        </h3>
      )}
      <p className='mt-4 text-lg leading-[1.55]'>{block.text}</p>
    </aside>
  )
}
