import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <Card className='-foreground flex h-full flex-col bg-sidebar-foreground'>
      <CardContent className='relative p-0'>
        <AspectRatio ratio={2 / 3}>
          <Skeleton className='size-full rounded-t-lg' />
        </AspectRatio>
      </CardContent>

      <CardHeader className='grow border-t border-card p-6 pb-4'>
        <Skeleton className='mb-3 h-7 w-5/6' />
        {/* Variant Selectors Skeleton */}
        <div className='flex flex-col gap-4'>
          <div>
            <Skeleton className='h-5 w-20' />
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <Skeleton className='h-8 w-12 rounded-md' />
              <Skeleton className='h-8 w-12 rounded-md' />
              <Skeleton className='h-8 w-12 rounded-md' />
            </div>
          </div>
          <div>
            <Skeleton className='h-5 w-16' />
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <Skeleton className='h-6 w-6 rounded-full' />
              <Skeleton className='h-6 w-6 rounded-full' />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className='mt-auto flex flex-col gap-4 p-6 pt-0'>
        <div className='flex w-full items-center justify-between'>
          <Skeleton className='h-8 w-1/3' />
        </div>
        <div className='flex w-full gap-3'>
          <Skeleton className='h-10 flex-1' />
          <Skeleton className='h-10 w-28' />
        </div>
      </CardFooter>
    </Card>
  )
}
