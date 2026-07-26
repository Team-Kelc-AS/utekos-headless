'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
  CardContent
} from '@/components/ui/card'
import { Heart } from 'lucide-react'

export const CardProduct = () => {
  const [liked, setLiked] = useState<boolean>(false)

  return (
    <div className='relative max-w-md rounded-xl bg-linear-to-r from-neutral-600 to-violet-300 shadow-lg'>
      <div className='flex h-60 items-center justify-center'>
        {/* eslint-disable-next-line @next/next/no-img-element -- This isolated design demo uses an external, non-production asset host. */}
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-11.png?width=300&format=auto'
          alt='Shoes'
          className='w-75'
        />
      </div>
      <Button
        size='icon'
        onClick={() => setLiked(!liked)}
        className='dark:bg-dark-primary/10 dark:hover:bg-dark-primary/20 absolute top-4 right-4 rounded-full bg-primary/10 hover:bg-primary/20'
      >
        {liked ?
          <Heart className='dark:fill-dark-destructive dark:stroke-dark-destructive fill-destructive stroke-destructive' />
        : <Heart className='stroke-white' />}
        <span className='sr-only'>Like</span>
      </Button>
      <Card className='ring-0'>
        <CardHeader>
          <CardTitle>Nike Jordan Air Rev</CardTitle>
          <CardDescription className='flex items-center gap-2'>
            <Badge variant='outline' className='rounded-sm'>
              EU38
            </Badge>
            <Badge variant='outline' className='rounded-sm'>
              Black and White
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
        <CardFooter className='justify-between gap-3 max-sm:flex-col max-sm:items-stretch'>
          <div className='flex flex-col'>
            <span className='text-sm font-medium uppercase'>
              Pris
            </span>
            <span className='font-utekos-text-medium text-xl'>
              $69.99
            </span>
          </div>
          <Button size='lg'>Legg i handlekurv</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
