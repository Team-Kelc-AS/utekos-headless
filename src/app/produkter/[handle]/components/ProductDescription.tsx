// Path: src/app/produkter/[handle]/ProductPageView/components/ProductDescription.tsx
import type {
  ProductDescriptionBlock,
  ProductDescriptionContent
} from '@/db/data/products/product-page-content'

type ProductDescriptionProps = {
  description: ProductDescriptionContent | undefined
}

function ProductDescriptionBlockView({
  block
}: {
  block: ProductDescriptionBlock
}) {
  return (
    <article className='space-y-3'>
      {block.title && (
        <h3 className='font-sans font-utekos-text-medium text-xl leading-[1.15] tracking-normal text-card-foreground sm:text-2xl'>
          {block.title}
        </h3>
      )}
      {block.paragraphs?.map(paragraph => (
        <p
          key={paragraph}
          className='/86 text-base leading-[1.6] tracking-normal text-card-foreground/86'
        >
          {paragraph}
        </p>
      ))}
      {block.items && block.items.length > 0 && (
        <ul className='/86 space-y-2 pl-5 text-base leading-[1.55] tracking-normal text-card-foreground/86'>
          {block.items.map(item => (
            <li
              key={item}
              className='dark:marker:text-dark-card-foreground/55 list-disc marker:text-card-foreground/55'
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function ProductDescription({
  description
}: ProductDescriptionProps) {
  if (!description) {
    return null
  }

  const collapsedBlockCount = 1
  const canExpand =
    description.blocks.length > collapsedBlockCount
  const initialBlocks = description.blocks.slice(
    0,
    collapsedBlockCount
  )
  const additionalBlocks = description.blocks.slice(
    collapsedBlockCount
  )

  return (
    <article
      aria-labelledby='product-description-heading'
      className='dark:shadow-dark-background/20 mt-12 rounded-[1.25rem] border border-border bg-jungle p-5 font-utekos-text text-card-foreground shadow-lg shadow-background/20 sm:p-6'
    >
      <div
        id='product-description-content'
        className='max-w-prose space-y-5'
      >
        <div className='space-y-3'>
          <h2
            id='product-description-heading'
            className='font-sans font-utekos-text-medium text-2xl leading-[1.1] tracking-normal text-card-foreground sm:text-3xl'
          >
            {description.title}
          </h2>
          {description.lead && (
            <p className='text-lg leading-normal tracking-normal text-card-foreground'>
              {description.lead}
            </p>
          )}
        </div>

        <div className='space-y-6'>
          {initialBlocks.map((block, index) => (
            <ProductDescriptionBlockView
              key={`${block.title ?? 'block'}-${index}`}
              block={block}
            />
          ))}
        </div>
      </div>

      {canExpand ?
        <details className='group mt-5'>
          <summary className='flex min-h-11 cursor-pointer list-none items-center font-utekos-text-medium text-base tracking-normal text-card-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden'>
            <span className='group-open:hidden'>Les mer</span>
            <span className='hidden group-open:inline'>
              Vis mindre
            </span>
          </summary>
          <div className='mt-6 max-w-prose space-y-6'>
            {additionalBlocks.map((block, index) => (
              <ProductDescriptionBlockView
                key={`${block.title ?? 'block'}-${index + collapsedBlockCount}`}
                block={block}
              />
            ))}
          </div>
        </details>
      : null}
    </article>
  )
}
