import {
  returnPolicy,
  returnPolicyCopy
} from '@/lib/policies/returnPolicy'

export const shippingReturnsFaqItems = [
  {
    id: 'Merchant-Center-Shopping-Cost',
    question: 'Hva koster frakten hos Utekos?',
    answer:
      'Vi tilbyr fri frakt på bestillinger over 999 kr i Norge. For bestillinger under 999 kr koster ordinær frakt 99 kr.'
  },
  {
    id: 'Merchant-C-Delivery-Time',
    question: 'Hvor lang er leveringstiden?',
    answer:
      'Leveringstiden er normalt 2–5 virkedager. Bestillinger som gjøres før klokken 16 sendes normalt samme dag, med unntak av søndag.'
  },
  {
    id: 'return-window',
    question: 'Hvor lang er angreretten?',
    answer: returnPolicyCopy.summary
  },
  {
    id: 'return-process',
    question: 'Hvordan returnerer jeg en vare?',
    answer: `${returnPolicyCopy.notice} Send meldingen til ${returnPolicy.contactEmail}. ${returnPolicyCopy.returnDeadline} ${returnPolicyCopy.returnShipping}`
  },
  {
    id: 'return-exceptions',
    question: 'Er det unntak fra angreretten?',
    answer: returnPolicyCopy.exceptions
  }
] as const
