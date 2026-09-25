'use client'

import { Ruler } from 'lucide-react'
import {
  TECH_DOWN_MEASUREMENT_ROWS,
  TECH_DOWN_PUBLIC_SIZE_DEFINITIONS
} from '@/lib/products/techDownSizes'
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
import type { NbccTrackingData } from '../types'

type OsCaravanSizeGuideDialogProps = {
  triggerClassName?: string
  trackingData: NbccTrackingData
}

export function OsCaravanSizeGuideDialog({
  triggerClassName,
  trackingData
}: OsCaravanSizeGuideDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type='button'
            size='lg'
            variant='commerce-primary'
            data-track='Lead'
            data-track-data={JSON.stringify(trackingData)}
            className={triggerClassName}
          />
        }
      >
        <span className='truncate'>Størrelsesguide</span>
        <Ruler className='size-[18px]' aria-hidden />
      </DialogTrigger>

      <DialogContent className='inset-0 top-0 left-0 flex h-svh max-h-svh max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground ring-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:ring-1'>
        <DialogHeader className='shrink-0 border-b border-foreground/12 px-6 py-6 pr-14 sm:px-8 sm:py-7 sm:pr-14'>
          <p className='font-sans font-semibold text-xs tracking-wide text-primary uppercase'>
            Utekos TechDown™
          </p>
          <DialogTitle className='font-sans text-2xl font-bold tracking-tight sm:text-3xl'>
            Størrelsesguide
          </DialogTitle>
          <DialogDescription className='max-w-xl font-sans text-sm leading-6 text-foreground/72 sm:text-base'>
            Velg mellom Middels, Stor og Større. Start med
            høyderådet, og sammenlign gjerne målene med et plagg
            du allerede har. Alle mål er i centimeter.
          </DialogDescription>
        </DialogHeader>

        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6'>
          <ul className='mb-6 grid gap-3 sm:grid-cols-3'>
            {TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(size => (
              <li
                key={size.size}
                className='rounded-xl border border-foreground/12 bg-jungle/40 px-4 py-3'
              >
                <p className='font-sans font-semibold text-base text-foreground'>
                  {size.size}
                </p>
                <p className='mt-1 font-sans text-sm text-foreground/75'>
                  Høyderåd: {size.heightGuide}
                </p>
                <ul className='mt-2 space-y-1'>
                  {size.fitGuidance.map(tip => (
                    <li
                      key={tip}
                      className='font-sans text-xs leading-5 text-foreground/70'
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div
            className='overflow-hidden rounded-xl border border-foreground/12'
            role='region'
            aria-label='Måletabell for TechDown-størrelser'
            tabIndex={0}
          >
            <Table className='bg-background text-foreground'>
              <TableCaption className='sr-only'>
                Mål for Utekos TechDown™ i Middels, Stor og
                Større
              </TableCaption>
              <TableHeader className='bg-jungle'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead
                    scope='col'
                    className='h-12 min-w-44 px-4 font-sans font-semibold text-foreground'
                  >
                    Måling
                  </TableHead>
                  {TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(
                    size => (
                      <TableHead
                        key={size.size}
                        scope='col'
                        className='h-12 px-3 text-right font-sans font-semibold text-foreground'
                      >
                        {size.size}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TECH_DOWN_MEASUREMENT_ROWS.map(row => (
                  <TableRow key={row.measurement}>
                    <TableCell className='px-4 py-3 font-sans font-semibold whitespace-normal'>
                      {row.measurement}
                    </TableCell>
                    {row.values.map((value, index) => (
                      <TableCell
                        key={`${row.measurement}-${TECH_DOWN_PUBLIC_SIZE_DEFINITIONS[index]?.size}`}
                        className='px-3 py-3 text-right font-sans font-semibold tabular-nums'
                      >
                        {value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className='shrink-0 border-t border-foreground/12 bg-background px-4 py-4 sm:px-8'>
          <DialogClose
            render={
              <Button
                type='button'
                className='min-h-12 w-full rounded-xl bg-primary font-sans font-semibold text-foreground hover:bg-primary/90 sm:w-auto sm:min-w-32'
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
