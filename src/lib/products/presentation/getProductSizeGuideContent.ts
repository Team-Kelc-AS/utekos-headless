import {
  comfyrobeData,
  techDownData,
  utekosData
} from '@/app/handlehjelp/storrelsesguide/utils/data'
import { techDownSizeCards } from '@/app/handlehjelp/storrelsesguide/utils/techDownSizeCards'
import { utekosSizeCards } from '@/app/handlehjelp/storrelsesguide/utils/utekosSizeCards'
import type { ProductSizeGuideFamily } from './resolveProductSizeGuideFamily'

export type ProductSizeGuideSizeTip = {
  size: string
  heading: string
  heightGuide: string
  fitGuidance: readonly string[]
}

export type ProductSizeGuideMeasurementRow = {
  measurement: string
  values: readonly string[]
}

export type ProductSizeGuideContent = {
  badge: string
  title: string
  description: string
  tableCaption: string
  tableAriaLabel: string
  columns: readonly string[]
  rows: readonly ProductSizeGuideMeasurementRow[]
  sizeTips: readonly ProductSizeGuideSizeTip[]
}

const comfyrobeSizeTips = [
  {
    size: 'XS',
    heading: 'Velg XS hvis...',
    heightGuide: 'Small',
    fitGuidance: [
      'Du bruker vanligvis small og vil beholde den korteste passformen.',
      'Du ønsker romslig komfort, men uten ekstra lengde og bredde.'
    ]
  },
  {
    size: 'M/L',
    heading: 'Velg M/L hvis...',
    heightGuide: 'Medium',
    fitGuidance: [
      'Du bruker vanligvis medium og ønsker den mest balanserte passformen.',
      'Du vil bruke Comfyrobe uten behov for et ekstra lag med klær under.'
    ]
  },
  {
    size: 'XL',
    heading: 'Velg XL hvis...',
    heightGuide: 'Large',
    fitGuidance: [
      'Du bruker vanligvis large, eller bevisst ønsker en mer overdimensjonert følelse.',
      'Du prioriterer maksimal dekning rundt kropp, skuldre og hette.'
    ]
  }
] as const satisfies readonly ProductSizeGuideSizeTip[]

function mapRows(
  data: readonly Record<string, string>[],
  columnKeys: readonly string[]
): readonly ProductSizeGuideMeasurementRow[] {
  return data.map(row => ({
    measurement: row.measurement ?? '',
    values: columnKeys.map(key => row[key] ?? '—')
  }))
}

export function getProductSizeGuideContent(
  family: ProductSizeGuideFamily
): ProductSizeGuideContent {
  if (family === 'comfyrobe') {
    return {
      badge: 'Comfyrobe™',
      title: 'Størrelsesguide',
      description:
        'Sammenlign målene med et lignende plagg du allerede har. Alle mål er oppgitt i centimeter.',
      tableCaption: 'Mål for Comfyrobe-størrelser',
      tableAriaLabel: 'Måletabell for Comfyrobe-størrelser',
      columns: ['XS', 'M/L', 'XL'],
      rows: mapRows(comfyrobeData, ['xs', 'ml', 'lxl']),
      sizeTips: comfyrobeSizeTips
    }
  }

  if (family === 'techdown') {
    return {
      badge: 'TechDown™',
      title: 'Størrelsesguide: Utekos TechDown™',
      description:
        'Finn nøyaktig TechDown™-størrelse med høydeguider, måletips og måletabell.',
      tableCaption: 'Mål for TechDown-størrelser',
      tableAriaLabel: 'Måletabell for TechDown-størrelser',
      columns: ['Liten', 'Middels', 'Stor'],
      rows: mapRows(techDownData, ['liten', 'middels', 'stor']),
      sizeTips: techDownSizeCards.map(card => ({
        size: card.size,
        heading: card.heading,
        heightGuide: card.heightGuide,
        fitGuidance: card.fitGuidance
      }))
    }
  }

  return {
    badge: 'Mikrofiber & Dun',
    title: 'Størrelsesguide',
    description:
      'Utekos Dun og Mikrofiber er designet for suveren tilpasningsevne. Velg medium for tettere passform, eller large for maksimal romslighet.',
    tableCaption: 'Mål for Utekos Dun og Mikrofiber',
    tableAriaLabel:
      'Måletabell for Utekos Dun og Mikrofiber størrelser',
    columns: ['Medium', 'Large'],
    rows: mapRows(utekosData, ['m', 'l']),
    sizeTips: utekosSizeCards.map(card => ({
      size: card.sizeCode,
      heading: card.heading,
      heightGuide: card.heightGuide,
      fitGuidance: card.fitGuidance
    }))
  }
}
