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
import { HavdypColorGuideDocument } from '@/components/color-guide/HavdypColorGuideDocument'
import { cn } from '@/lib/utils/className'

type HavdypColorGuideDialogProps = {
  triggerClassName?: string
}

export function HavdypColorGuideDialog({
  triggerClassName
}: HavdypColorGuideDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type='button'
            className={cn(
              'relative inline-flex cursor-pointer items-center font-utekos-text-medium text-sm text-primary underline decoration-primary/70 underline-offset-4 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              triggerClassName
            )}
          />
        }
      >
        <span
          aria-hidden
          className='absolute inset-x-0 top-1/2 h-11 -translate-y-1/2'
        />
        Les om fargen
      </DialogTrigger>

      <DialogContent className='inset-0 top-0 left-0 flex h-svh max-h-svh max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground ring-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:ring-1'>
        <DialogHeader className='sr-only'>
          <DialogTitle>Om Havdyp - Maritime Blue</DialogTitle>
          <DialogDescription>
            PANTONE 19-3831 TCX Maritime Blue, fargestandarden bak
            Utekos TechDown i Havdyp.
          </DialogDescription>
        </DialogHeader>

        <div className='no-scrollbar min-h-0 flex-1 overflow-y-auto bg-primary px-4 pt-14 pb-5 sm:px-8 sm:pt-16 sm:pb-6'>
          <HavdypColorGuideDocument />
        </div>

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
