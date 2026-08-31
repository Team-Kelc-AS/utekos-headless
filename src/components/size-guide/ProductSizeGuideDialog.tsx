'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { TechDownSizeGuideDocument } from '@/components/size-guide/TechDownSizeGuideDocument'
import { getProductSizeGuideContent } from '@/lib/products/presentation/getProductSizeGuideContent'
import { resolveProductSizeGuideFamily } from '@/lib/products/presentation/resolveProductSizeGuideFamily'
import { cn } from '@/lib/utils/className'

type ProductSizeGuideDialogProps = {
  productHandle: string
  triggerLabel?: string
  triggerClassName?: string
}

export function ProductSizeGuideDialog({
  productHandle,
  triggerLabel = 'her',
  triggerClassName
}: ProductSizeGuideDialogProps) {
  const family = resolveProductSizeGuideFamily(productHandle)
  const content = getProductSizeGuideContent(family)
  const usesMdxDocument = family === 'techdown'

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type='button'
            className={cn(
              'text-card-foreground underline underline-offset-4 hover:text-card-foreground/76 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card-foreground',
              triggerClassName
            )}
          />
        }
      >
        {triggerLabel}
      </DialogTrigger>

      <DialogContent className='inset-0 top-0 left-0 flex h-svh max-h-svh max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground ring-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:ring-1'>
        {usesMdxDocument ?
          <>
            <DialogHeader className='sr-only'>
              <DialogTitle>{content.title}</DialogTitle>
              <DialogDescription>
                {content.description}
              </DialogDescription>
            </DialogHeader>

            <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6'>
              <TechDownSizeGuideDocument />
            </div>
          </>
        : <>
            <DialogHeader className='shrink-0 border-b border-foreground/12 px-6 py-6 pr-14 sm:px-8 sm:py-7 sm:pr-14'>
              <p className='font-utekos-text-medium text-xs tracking-wide text-primary uppercase'>
                {content.badge}
              </p>
              <DialogTitle className='font-sans text-2xl font-bold tracking-tight sm:text-3xl'>
                {content.title}
              </DialogTitle>
              <DialogDescription className='max-w-2xl font-sans text-sm leading-6 text-foreground/72 sm:text-base'>
                {content.description}
              </DialogDescription>
            </DialogHeader>

            <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6'>
              <div className='space-y-6'>
                <section
                  aria-label='Størrelsesanbefalinger'
                  className='space-y-3'
                >
                  {content.sizeTips.map(tip => (
                    <article
                      key={tip.size}
                      className='rounded-xl border border-foreground/12 bg-jungle p-4 text-card-foreground'
                    >
                      <div className='flex flex-wrap items-baseline justify-between gap-2'>
                        <h3 className='font-sans text-base font-semibold'>
                          {tip.heading}
                        </h3>
                        <p className='font-sans text-sm text-card-foreground/76'>
                          {tip.heightGuide}
                        </p>
                      </div>
                      <ul className='mt-3 space-y-2'>
                        {tip.fitGuidance.map(item => (
                          <li
                            key={item}
                            className='font-sans text-sm leading-relaxed text-card-foreground/90'
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </section>

                <section
                  aria-label={content.tableAriaLabel}
                  className='overflow-hidden rounded-xl border border-foreground/12'
                >
                  <Table className='bg-background text-foreground'>
                    <TableCaption className='sr-only'>
                      {content.tableCaption}
                    </TableCaption>
                    <TableHeader className='bg-jungle'>
                      <TableRow className='hover:bg-transparent'>
                        <TableHead
                          scope='col'
                          className='h-12 min-w-44 px-4 font-sans font-semibold text-foreground'
                        >
                          Måling
                        </TableHead>
                        {content.columns.map(column => (
                          <TableHead
                            key={column}
                            scope='col'
                            className='h-12 px-3 text-right font-sans font-semibold text-foreground'
                          >
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {content.rows.map(row => (
                        <TableRow key={row.measurement}>
                          <TableCell className='px-4 py-3 font-sans font-medium whitespace-normal'>
                            {row.measurement}
                          </TableCell>
                          {row.values.map((value, index) => (
                            <TableCell
                              key={`${row.measurement}-${content.columns[index] ?? index}`}
                              className='px-3 py-3 text-right font-sans tabular-nums'
                            >
                              {value}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              </div>
            </div>
          </>
        }

        <DialogFooter className='shrink-0 border-t border-foreground/12 bg-background px-4 py-4 sm:px-8'>
          <DialogClose
            render={
              <Button
                type='button'
                className='min-h-12 w-full rounded-xl bg-primary font-sans font-medium text-foreground hover:bg-primary/90 sm:w-auto sm:min-w-32'
              />
            }
          >
            Lukk
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
