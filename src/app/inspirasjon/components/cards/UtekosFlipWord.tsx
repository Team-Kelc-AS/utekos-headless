'use client'

import React from 'react'
import { FlipWords } from '@/components/ui/flip-words'
import flipWordData from './UtekosFlipWords.json'
import { JusterFormNyt } from './JusterFormNyt'

export function UtekosFlipWord() {
  return (
    <div className='mt-8 flex w-full flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-10'>
      <JusterFormNyt />
      <div className='relative flex min-h-12 w-full flex-1 items-center overflow-hidden sm:min-h-14'>
        <FlipWords
          words={flipWordData.words}
          duration={2600}
          animateLetters={false}
          random
          className='font-utekos-text-medium px-0 text-4xl whitespace-nowrap text-foreground sm:text-5xl'
        />
      </div>
    </div>
  )
}
