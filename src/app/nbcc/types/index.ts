import type { Route } from 'next'
import { z } from 'zod'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'

export type NbccTrackingData = Record<string, string>

export type NbccProduct = {
  title: string
  shortTitle: string
  description: string
  bestFor: string
  images: Array<{ src: string; alt: string }>
  href: Route
  handle: string
  sizes: string[]
  color?: string
  tracking: NbccTrackingData
}

export type NbccUseCase = {
  title: string
  description: string
}

export type NbccStep = {
  title: string
  description: string
}

export type NbccFaqItem = {
  question: string
  answer: string
}

export type NbccAiSummaryIntent = 'how-to-use' | 'sizes'

export type NbccAiSummarySection = {
  title: string
  body?: string | undefined
  items?: string[] | undefined
  style?: 'paragraph' | 'list' | 'steps' | undefined
}

export type NbccAiSummaryPayload = {
  kicker: string
  title: string
  intro: string
  sections: NbccAiSummarySection[]
}

export type NbccAiSummaryResponse = NbccAiSummaryPayload & {
  generated?: boolean
  error?: string
}

export type NbccAiSummaryStatus = 'idle' | 'thinking' | 'completed'

export const NbccAiSummarySectionSchema = z.object({
  title: z.string().min(2).max(72).describe('Kort seksjonstittel på norsk.'),
  body: z.string().min(20).max(520).optional().describe('Valgfri brødtekst for seksjonen.'),
  items: z
    .array(z.string().min(8).max(220))
    .min(1)
    .max(6)
    .optional()
    .describe('Valgfrie punkter eller steg.'),
  style: z.enum(['paragraph', 'list', 'steps']).optional().describe('Hvordan seksjonen bør vises i UI.')
})

export const NbccAiSummarySchema = z.object({
  kicker: z.string().min(2).max(36).describe('Kort merkelapp på norsk, maks 3 ord.'),
  title: z.string().min(4).max(72).describe('Kort, trygg og konkret tittel på norsk.'),
  intro: z
    .string()
    .min(60)
    .max(620)
    .describe('Vennlig intro i naturlig norsk, skrevet som en dyktig kundeservice-ansatt.'),
  sections: z
    .array(NbccAiSummarySectionSchema)
    .min(2)
    .max(5)
    .describe('Strukturerte seksjoner som hjelper kunden videre.')
})

export type NbccAiSummaryButtonProps = {
  intent: NbccAiSummaryIntent
  idleLabel: string
  completedLabel?: string
  trackingName: string
  trackingData: NbccTrackingData
  buttonClassName: string
  containerClassName?: string
  panelClassName?: string
}

export type NbccAiSummarySectionBodyProps = {
  intent: NbccAiSummaryIntent
  section: NbccAiSummarySection
}

export type NbccProductVariant = {
  label: string
  variantId: string
  availableForSale: boolean
  price: string
}

export type NbccProductCardActionsProps = {
  product: ShopifyProduct
  variants: NbccProductVariant[]
  href: Route
  productTitle: string
  tracking: NbccTrackingData
  totalItemCount: number
}

export type NbccProductCarouselImage = {
  src: string
  alt: string
}

export type NbccProductCarouselProps = {
  images: NbccProductCarouselImage[]
}

export type NbccHeroTracking = {
  primary: NbccTrackingData
  secondary: NbccTrackingData
}

export type NbccProductSectionVariantMatch = {
  label: string
  variantId: string
  availableForSale: boolean
  price: string
}
