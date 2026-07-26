// Path: src/db/zod/schemas/ContactFormSchema.server.ts

import { z } from '@/db/zod/zodConfig'

/**
 * SERVER-skjema (full Zod v4).
 * - Norsk feilkart via zodConfig
 * - Kalles fra server actions / route handlers
 */
export const ServerContactFormSchema = z.object({
  name: z.string().min(2, { message: 'Navn må være minst 2 tegn.' }),
  email: z.email({ message: 'E-post er ikke gyldig.' }),
  // Validering fjernet: tom streng tillates — vi konverterer '' -> undefined i action
  phone: z.string().optional(),
  country: z.string().min(1, { message: 'Land er påkrevd.' }),
  orderNumber: z.string().optional(),
  message: z.string().min(10, { message: 'Melding må være minst 10 tegn.' }),

  privacy: z
    .boolean()
    .refine(v => v === true, {
      message: 'Du må bekrefte at du har lest personvernerklæringen.'
    })
})

export type ServerContactFormData = z.infer<typeof ServerContactFormSchema>
