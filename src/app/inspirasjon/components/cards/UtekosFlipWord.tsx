import { FlipWords } from '@/components/ui/flip-words'
import flipWordData from './UtekosFlipWords.json'

export function UtekosFlipWord() {
  return (
    <div className='mt-8 flex w-full items-center'>
      <div className='relative flex min-h-12 w-full flex-1 items-center overflow-hidden sm:min-h-14'>
        <FlipWords
          words={flipWordData.words}
          duration={900}
          animateLetters={false}
          random
          className='font-utekos-text-medium px-0 text-4xl whitespace-nowrap text-foreground sm:text-5xl'
        />
      </div>
    </div>
  )
}
