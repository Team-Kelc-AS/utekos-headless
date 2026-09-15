'use client'

import { Ruler } from 'lucide-react'
import { comfyrobeData } from '@/app/handlehjelp/storrelsesguide/utils/data'
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

export function ComfyrobeSizeGuideDialog({
  onOpen,
  triggerClassName
}: {
  onOpen: () => void
  triggerClassName?: string
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type='button'
            data-track='ComfyrobePurchaseSizeGuide'
            onClick={onOpen}
            className={triggerClassName}
          />
        }
      >
        <Ruler className='size-4' aria-hidden />
        Se størrelsetabell
      </DialogTrigger>

      <DialogContent className='inset-0 top-0 left-0 flex h-svh max-h-svh max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground ring-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:ring-1'>
        <DialogHeader className='shrink-0 border-b border-foreground/12 px-6 py-6 pr-14 sm:px-8 sm:py-7 sm:pr-14'>
          <p className='font-utekos-text-medium text-xs tracking-wide text-primary uppercase'>
            Comfyrobe™
          </p>
          <DialogTitle className='font-sans text-2xl font-bold tracking-tight sm:text-3xl'>
            Størrelsesguide
          </DialogTitle>
          <DialogDescription className='max-w-xl font-utekos-text text-sm leading-6 text-foreground/72 sm:text-base'>
            Sammenlign målene med et lignende plagg du allerede
            har. Alle mål er oppgitt i centimeter.
          </DialogDescription>
        </DialogHeader>

        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6'>
          <div
            className='overflow-hidden rounded-xl border border-foreground/12'
            role='region'
            aria-label='Måletabell for Comfyrobe-størrelser'
            tabIndex={0}
          >
            <Table className='bg-background text-foreground'>
              <TableCaption className='sr-only'>
                Mål for Comfyrobe™ i størrelse XL
              </TableCaption>
              <TableHeader className='bg-jungle'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead
                    scope='col'
                    className='h-12 min-w-44 px-4 font-utekos-text-medium text-foreground'
                  >
                    Måling
                  </TableHead>
                  <TableHead
                    scope='col'
                    className='h-12 px-3 text-right font-utekos-text-medium text-foreground'
                  >
                    XL
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comfyrobeData.map(row => (
                  <TableRow key={row.measurement}>
                    <TableCell className='px-4 py-3 font-utekos-text-medium whitespace-normal'>
                      {row.measurement}
                    </TableCell>
                    <TableCell className='bg-primary/8 px-3 py-3 text-right font-utekos-text-medium tabular-nums'>
                      {row.lxl}
                    </TableCell>
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
                className='min-h-12 w-full rounded-xl bg-primary font-utekos-text-medium text-foreground hover:bg-primary/90 sm:w-auto sm:min-w-32'
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
