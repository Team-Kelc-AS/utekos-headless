import type { MagazineBlock } from '../types'

type MagazineFaqBlockProps = {
  block: Extract<MagazineBlock, { type: 'faq' }>
}

export function MagazineFaqBlock({
  block
}: MagazineFaqBlockProps) {
  return (
    <article className='my-16'>
      {block.title && (
        <h2 className='font-google-sans font-sans text-4xl leading-[0.95] font-bold text-balance text-foreground sm:text-5xl'>
          {block.title}
        </h2>
      )}
      <dl className='mt-8 space-y-4'>
        {block.items.map(item => (
          <div
            key={item.question}
            className='dark:border-dark-background/10 rounded-lg border border-background/10 bg-foreground p-5'
          >
            <dt className='font-google-sans font-sans text-xl leading-[1.05] font-bold text-background'>
              {item.question}
            </dt>
            <dd className='mt-3 text-base leading-[1.55] text-background/80'>
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
