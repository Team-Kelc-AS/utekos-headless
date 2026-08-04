import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const inspirationPages = [
  { href: '/inspirasjon/hytte', title: 'Hytteliv' },
  { href: '/inspirasjon/bobil', title: 'Bobil' },
  { href: '/inspirasjon/batliv', title: 'Båtliv' },
  { href: '/inspirasjon/terrassen', title: 'Terrasseliv' },
  { href: '/inspirasjon/grillkvelden', title: 'Grillkvelden' },
  { href: '/inspirasjon/camping', title: 'Camping' }
] as const

export function InspirationLinkCards() {
  return (
    <section
      aria-label='Inspirasjonssider'
      className='container mx-auto mt-16 max-w-6xl px-4 sm:mt-20'
    >
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {inspirationPages.map(page => (
          <Link
            key={page.href}
            href={page.href}
            className='group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'
          >
            <Card className='h-full min-h-40 justify-between bg-jungle transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-md motion-reduce:transition-none motion-reduce:group-hover:translate-y-0'>
              <CardHeader>
                <CardTitle>
                  <h3 className='text-2xl font-bold'>
                    {page.title}
                  </h3>
                </CardTitle>
              </CardHeader>
              <CardFooter className='gap-1.5 text-sm text-foreground/70'>
                <span className='font-utekos-text-medium text-lg'>
                  Utforsk
                </span>
                <ArrowUpRight
                  aria-hidden
                  className='size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none'
                />
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
