'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface FlipWordState {
  currentIndex: number
  currentWord: string
  isAnimating: boolean
  queue: string[]
  wordKey: number
}

function shuffleUniqueWords(words: string[], avoidFirst?: string): string[] {
  const unique = [...new Set(words)]
  if (unique.length === 0) return []

  const shuffled = [...unique]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const left = shuffled[i]
    const right = shuffled[j]
    if (left === undefined || right === undefined) continue
    shuffled[i] = right
    shuffled[j] = left
  }

  if (avoidFirst && shuffled.length > 1 && shuffled[0] === avoidFirst) {
    const swapWith = 1 + Math.floor(Math.random() * (shuffled.length - 1))
    const first = shuffled[0]
    const candidate = shuffled[swapWith]
    if (first !== undefined && candidate !== undefined) {
      shuffled[0] = candidate
      shuffled[swapWith] = first
    }
  }

  return shuffled
}

function createInitialFlipWordState(words: string[]): FlipWordState {
  return {
    currentIndex: 0,
    currentWord: words[0] ?? '',
    isAnimating: false,
    queue: [],
    wordKey: 0
  }
}

function getNextFlipWordState(
  state: FlipWordState,
  words: string[],
  random: boolean
): FlipWordState {
  if (words.length === 0) {
    return { ...state, currentWord: '', isAnimating: false }
  }

  if (random) {
    if (state.queue.length > 0) {
      const [next = '', ...rest] = state.queue
      return {
        ...state,
        currentWord: next,
        isAnimating: true,
        queue: rest,
        wordKey: state.wordKey + 1
      }
    }

    const [next = '', ...rest] = shuffleUniqueWords(
      words,
      state.currentWord
    )
    return {
      ...state,
      currentWord: next,
      isAnimating: true,
      queue: rest,
      wordKey: state.wordKey + 1
    }
  }

  const nextIndex = (state.currentIndex + 1) % words.length
  return {
    ...state,
    currentIndex: nextIndex,
    currentWord: words[nextIndex] ?? '',
    isAnimating: true,
    wordKey: state.wordKey + 1
  }
}

export const FlipWords = ({
  words,
  duration = 900,
  className,
  animateLetters = true,
  random = false
}: {
  words: string[]
  duration?: number
  className?: string
  animateLetters?: boolean
  random?: boolean
}) => {
  const [wordState, setWordState] = useState(() =>
    createInitialFlipWordState(words)
  )

  useEffect(() => {
    if (wordState.isAnimating) {
      return
    }

    const timeout = setTimeout(() => {
      setWordState(state => getNextFlipWordState(state, words, random))
    }, duration)

    return () => clearTimeout(timeout)
  }, [duration, random, wordState.isAnimating, words])

  return (
    <AnimatePresence
      mode='wait'
      onExitComplete={() => {
        setWordState(state => ({ ...state, isAnimating: false }))
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 8
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32,
          mass: 0.6
        }}
        exit={{
          opacity: 0,
          y: -8,
          filter: 'blur(4px)',
          transition: {
            duration: 0.12,
            ease: 'easeIn'
          }
        }}
        className={cn(
          'relative z-10 inline-block px-2 text-left text-neutral-900',
          className
        )}
        key={wordState.wordKey}
      >
        {animateLetters ?
          wordState.currentWord?.split(' ').map((word, wordIndex) => (
            <motion.span
              key={word + wordIndex}
              initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                delay: wordIndex * 0.08,
                duration: 0.16
              }}
              className='inline-block whitespace-nowrap'
            >
              {word.split('').map((letter, letterIndex) => (
                <motion.span
                  key={word + letterIndex}
                  initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    delay: wordIndex * 0.08 + letterIndex * 0.02,
                    duration: 0.12
                  }}
                  className='inline-block'
                >
                  {letter}
                </motion.span>
              ))}
              <span className='inline-block'>&nbsp;</span>
            </motion.span>
          ))
        : wordState.currentWord}
      </motion.div>
    </AnimatePresence>
  )
}
