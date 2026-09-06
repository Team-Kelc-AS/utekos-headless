import type { MagazineBlock } from '../types'

type MagazineStepListBlockProps = {
  block: Extract<MagazineBlock, { type: 'stepList' }>
}

export function MagazineStepListBlock({
  block
}: MagazineStepListBlockProps) {
  return (
    <article className='my-16'>
      {(block.title || block.intro) && (
        <header className='mb-8'>
          {block.title && (
            <h2 className='font-google-sans font-sans text-4xl leading-[0.95] font-bold text-balance text-foreground sm:text-5xl'>
              {block.title}
            </h2>
          )}
          {block.intro && (
            <p className='mt-4 max-w-2xl text-lg leading-[1.55] text-foreground/86'>
              {block.intro}
            </p>
          )}
        </header>
      )}
      <ol className='space-y-4'>
        {block.steps.map((step, index) => (
          <li
            key={step.title}
            className='grid gap-4 rounded-lg border border-background/10 bg-foreground p-5 sm:grid-cols-[3rem_1fr]'
          >
            <div className='font-google-sans flex size-11 items-center justify-center rounded-lg bg-background font-sans text-lg leading-none font-bold text-foreground'>
              {index + 1}
            </div>
            <div>
              <h3 className='font-google-sans font-sans text-2xl leading-[0.95] font-bold text-background'>
                {step.title}
              </h3>
              <p className='mt-3 text-base leading-[1.55] text-background/80'>
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  )
}
