import { XMarkIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

export default function Banner() {
  return (
    <div className='relative isolate flex items-center gap-x-6 overflow-hidden bg-gray-800/50 px-6 py-2.5 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10 sm:px-3.5 sm:before:flex-1'>
      <div
        aria-hidden='true'
        className='absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl'
      >
        <div
          style={{
            clipPath:
              'polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)'
          }}
          className='from-coral-green to-blue-green aspect-577/310 w-144.25 bg-linear-to-r opacity-40'
        />
      </div>
      <div
        aria-hidden='true'
        className='absolute top-1/2 left-[max(45rem,calc(50%+8rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl'
      >
        <div
          style={{
            clipPath:
              'polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)'
          }}
          className='from-coral-green to-blue-green aspect-577/310 w-144.25 bg-linear-to-r opacity-40'
        />
      </div>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <p className='text-sm/6 text-gray-100'>
          <strong className='font-utekos-text-medium'>
            Utekos TechDown™
          </strong>
          <svg
            viewBox='0 0 2 2'
            aria-hidden='true'
            className='mx-2 inline size-0.5 fill-current'
          >
            <circle r={1} cx={1} cy={1} />
          </svg>
          til kr 1790,-
        </p>
        <Link
          href='/produkter/utekos-techdown'
          className='flex-none rounded-full bg-white/10 px-3.5 py-1 font-utekos-text-medium text-sm text-white shadow-xs inset-ring-white/20 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
        >
          Kjøp nå<span aria-hidden='true'>&rarr;</span>
        </Link>
      </div>
      <div className='flex flex-1 justify-end'>
        <button
          type='button'
          className='-m-3 p-3 focus-visible:-outline-offset-4'
        >
          <span className='sr-only'>Lukk banner</span>
          <XMarkIcon
            aria-hidden='true'
            className='size-5 text-gray-100'
          />
        </button>
      </div>
    </div>
  )
}
