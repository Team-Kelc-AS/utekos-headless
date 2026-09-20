// src/components/footer/components/NewsLetter.tsx

'use client'

import { NewsletterForm } from '@/components/form/components/NewsLetterForm'

export function NewsLetter() {
  return (
    <div className='mt-12 border-t border-card pb-12 pt-12'>
      <div className='mx-auto w-full max-w-5xl px-4'>
        <NewsletterForm />
      </div>
    </div>
  )
}
