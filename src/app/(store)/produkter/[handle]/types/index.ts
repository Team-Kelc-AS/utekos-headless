import type { Metadata } from 'next'

export type MetadataOther = NonNullable<Metadata['other']>

export type RouteParamsPromise = Promise<{ handle: string }>

export type SearchParamsRecord = {
  [key: string]: string | string[] | undefined
}

export type SearchParamsPromise = Promise<SearchParamsRecord>

export type ProductPageProps = {
  params: RouteParamsPromise
  searchParams: SearchParamsPromise
}

export type GenerateMetadataProps = {
  params: Promise<{ handle: string }>
}
