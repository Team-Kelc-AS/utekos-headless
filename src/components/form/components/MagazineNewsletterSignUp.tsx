// src/components/form/components/MagazineNewsletterSignUp.tsx

import { NewsletterForm } from '@/components/form/components/NewsLetterForm'

export function MagazineNewsletterSignup() {
  return (
    <article className='bg-transparent'>
      <div className='container mx-auto max-w-5xl px-4 py-16 text-center sm:py-24'>
        <h2 className='font-google-sans text-3xl font-bold sm:text-4xl'>
          Likte du det du leste?
        </h2>

        <p className='mx-auto mt-4 max-w-4xl text-lg text-foreground'>
          Bli den første som får vite om nye artikler, tips og
          produktnyheter. Meld deg på Utekos Magasinet og få
          inspirasjonen rett i innboksen.
        </p>

        <div className='mx-auto mt-8 w-full max-w-4xl'>
          <NewsletterForm />
        </div>
      </div>
    </article>
  )
}
