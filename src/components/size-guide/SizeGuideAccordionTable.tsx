import { Ruler } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

export type SizeGuideAccordionRow = {
  label: string
  values: readonly string[]
}

export type SizeGuideAccordionTableProps = {
  id?: string
  triggerLabel?: string
  columns: readonly string[]
  rows: readonly SizeGuideAccordionRow[]
  className?: string
  accordionClassName?: string
  triggerClassName?: string
  tableHeaderClassName?: string
  mobileContent?: ReactNode
}

export function SizeGuideAccordionTable({
  id,
  triggerLabel = 'Se størrelsestabell',
  columns,
  rows,
  className,
  accordionClassName,
  triggerClassName,
  tableHeaderClassName,
  mobileContent
}: SizeGuideAccordionTableProps) {
  return (
    <div
      id={id}
      className={cn('mx-auto w-full max-w-3xl', className)}
    >
      <Accordion
        multiple={false}
        className={cn(
          'w-full rounded-xl border border-[#F4F1EA]/10 bg-jungle px-2 md:px-6',
          accordionClassName
        )}
      >
        <AccordionItem
          value='size-table'
          className='border-none'
        >
          <AccordionTrigger
            className={cn(
              'justify-center bg-jungle py-6 text-lg transition-colors hover:text-[#E07A5F] hover:no-underline',
              triggerClassName ?? 'font-medium text-[#F4F1EA]'
            )}
          >
            <span className='flex items-center gap-3 font-utekos-text-medium'>
              <Ruler
                size={20}
                className='text-[#E07A5F]'
                aria-hidden
              />
              {triggerLabel}
            </span>
          </AccordionTrigger>
          <AccordionContent
            className={mobileContent ? 'pb-0' : undefined}
          >
            {mobileContent ?
              <div>{mobileContent}</div>
            : null}
            <div
              className={cn(
                'relative mt-2 mb-6 w-full overflow-hidden rounded-lg border border-[#F4F1EA]/5 bg-jungle',
                mobileContent && 'hidden'
              )}
            >
              <div className='overflow-x-auto'>
                <table className='w-full border-collapse bg-jungle text-left'>
                  <thead>
                    <tr
                      className={cn(
                        'border-b border-[#F4F1EA]/10 bg-dark-teal',
                        tableHeaderClassName
                      )}
                    >
                      <th
                        className={cn(
                          'bg-dark-teal p-4 font-medium text-[#F4F1EA] md:p-6',
                          tableHeaderClassName
                        )}
                      >
                        Måling
                      </th>
                      {columns.map(column => (
                        <th
                          key={column}
                          className={cn(
                            'w-28 bg-dark-teal p-4 font-medium text-[#F4F1EA] md:w-40 md:p-6',
                            tableHeaderClassName
                          )}
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[#F4F1EA]/5 text-sm text-[#F4F1EA]/80 md:text-base'>
                    {rows.map(row => (
                      <tr
                        key={row.label}
                        className='transition-colors hover:bg-[#F4F1EA]/5'
                      >
                        <td className='p-4 font-medium text-[#F4F1EA]/90 md:p-6'>
                          {row.label}
                        </td>
                        {row.values.map((value, index) => (
                          <td
                            key={`${row.label}-${columns[index] ?? index}`}
                            className='p-4 md:p-6'
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
