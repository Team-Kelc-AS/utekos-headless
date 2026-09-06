import Image from 'next/image'
import { PatternFrame } from '@/components/ui/pattern-frame'

export function LayoutTest() {
  return (
    <PatternFrame
      className='min-h-screen'
      contentClassName='flex flex-row gap-4'
    >
      <LayoutTestBox />
      <LayoutTestBox />
      <LayoutTestBox />
    </PatternFrame>
  )
}

function LayoutTestBox() {
  return (
    <div className='flex max-w-lg shrink-0 flex-col bg-gray-100 p-2'>
      <div className='rounded-xl bg-white p-10 text-sm/7 text-gray-700'>
        <Image
          src='logo-dark.svg'
          width={24}
          height={24}
          className='mb-11.5 h-6'
          alt='Tailwind Play'
        />
        <Image
          src='logo.svg'
          width={24}
          height={24}
          className='mb-11.5 h-6'
          alt='Tailwind Play'
        />
        <div className='space-y-6'>
          <p>
            An advanced online playground for Tailwind CSS,
            including support for things like:
          </p>
          <ul className='space-y-3'>
            <li className='flex'>
              <svg
                className='h-lh w-5.5 shrink-0'
                viewBox='0 0 22 22'
                fill='none'
                strokeLinecap='square'
              >
                <circle
                  cx='11'
                  cy='11'
                  r='11'
                  className='fill-sky-400/25'
                />
                <circle
                  cx='11'
                  cy='11'
                  r='10.5'
                  className='stroke-sky-400/25'
                />
                <path
                  d='M8 11.5L10.5 14L14 8'
                  className='stroke-sky-800'
                />
              </svg>
              <p className='ml-3'>
                Customizing your theme with
                <code className='font-mono font-medium text-gray-950'>
                  @theme
                </code>
              </p>
            </li>
            <li className='flex'>
              <svg
                className='h-lh w-5.5 shrink-0'
                viewBox='0 0 22 22'
                fill='none'
                strokeLinecap='square'
              >
                <circle
                  cx='11'
                  cy='11'
                  r='11'
                  className='fill-sky-400/25'
                />
                <circle
                  cx='11'
                  cy='11'
                  r='10.5'
                  className='stroke-sky-400/25'
                />
                <path
                  d='M8 11.5L10.5 14L14 8'
                  className='stroke-sky-800'
                />
              </svg>
              <p className='ml-3'>
                Adding custom utilities with
                <code className='font-mono font-medium text-gray-950'>
                  @utility
                </code>
              </p>
            </li>
            <li className='flex'>
              <svg
                className='h-lh w-5.5 shrink-0'
                viewBox='0 0 22 22'
                fill='none'
                strokeLinecap='square'
              >
                <circle
                  cx='11'
                  cy='11'
                  r='11'
                  className='fill-sky-400/25'
                />
                <circle
                  cx='11'
                  cy='11'
                  r='10.5'
                  className='stroke-sky-400/25'
                />
                <path
                  d='M8 11.5L10.5 14L14 8'
                  className='stroke-sky-800'
                />
              </svg>
              <p className='ml-3'>
                Adding custom variants with
                <code className='font-mono font-medium text-gray-950'>
                  @variant
                </code>
              </p>
            </li>
            <li className='flex'>
              <svg
                className='h-lh w-5.5 shrink-0'
                viewBox='0 0 22 22'
                fill='none'
                strokeLinecap='square'
              >
                <circle
                  cx='11'
                  cy='11'
                  r='11'
                  className='fill-sky-400/25'
                />
                <circle
                  cx='11'
                  cy='11'
                  r='10.5'
                  className='stroke-sky-400/25'
                />
                <path
                  d='M8 11.5L10.5 14L14 8'
                  className='stroke-sky-800'
                />
              </svg>
              <p className='ml-3'>
                Code completion with instant preview
              </p>
            </li>
          </ul>
          <p>
            Perfect for learning how the framework works,
            prototyping a new idea, or creating a demo to share
            online.
          </p>
        </div>
        <hr className='my-6 w-full border-(--pattern-fg)' />
        <p className='mb-3'>Want to dig deeper into Tailwind?</p>
        <p className='font-utekos-text-medium'>
          <a
            href='https://tailwindcss.com/docs'
            className='text-gray-950 underline decoration-sky-400 underline-offset-3 hover:decoration-2'
          >
            Read the docs &rarr;
          </a>
        </p>
      </div>
    </div>
  )
}
