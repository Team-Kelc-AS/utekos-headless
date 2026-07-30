import assert from 'node:assert/strict'
import test from 'node:test'
import { Project } from 'ts-morph'
import {
  analyzeBoundary,
  type GateId
} from './analyzePdpBoundary'

const root = '/repo'

function createProject(files: Record<string, string>): Project {
  const project = new Project({ useInMemoryFileSystem: true })

  for (const [filePath, contents] of Object.entries(files)) {
    project.createSourceFile(`${root}/${filePath}`, contents)
  }

  return project
}

function analyze(files: Record<string, string>) {
  return analyzeBoundary(
    createProject(files),
    `${root}/entry.tsx`,
    root
  )
}

function gates(report: {
  gateViolations: Array<{ gate: GateId }>
}): GateId[] {
  return report.gateViolations.map(violation => violation.gate)
}

test('server modules reachable from the entry are not counted as client', () => {
  const report = analyze({
    'entry.tsx': `import { load } from './load'
export default function Page() { return load() }`,
    'load.ts': 'export function load() { return null }'
  })

  assert.equal(report.clientModuleCount, 0)
  assert.equal(report.clientBytes, 0)
  assert.equal(report.serverModuleCount, 2)
})

test('client modules pull their runtime dependencies into the client graph', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import { helper } from './helper'
export function Island() { return helper() }`,
    'helper.ts': 'export function helper() { return 1 }'
  })

  const clientFiles = report.clientModules.map(
    module => module.file
  )
  assert.deepEqual(clientFiles.sort(), [
    'Island.tsx',
    'helper.ts'
  ])
  assert.deepEqual(report.boundaryModules, ['Island.tsx'])
})

test('server action modules stay out of the client bundle', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import { save } from './actions'
export function Island() { return save }`,
    'actions.ts': `'use server'
import { heavy } from './heavy'
export async function save() { return heavy() }`,
    'heavy.ts':
      'export function heavy() { return "x".repeat(1000) }'
  })

  const clientFiles = report.clientModules.map(
    module => module.file
  )
  assert.deepEqual(clientFiles, ['Island.tsx'])
  assert.ok(!clientFiles.includes('heavy.ts'))
})

test('type-only imports do not widen the client boundary', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import type { Thing } from './types'
export function Island() { return null as unknown as Thing }`,
    'types.ts': 'export type Thing = { id: string }'
  })

  assert.deepEqual(
    report.clientModules.map(module => module.file),
    ['Island.tsx']
  )
})

test('detects a dehydrated product query and a PDP QueryClient', () => {
  const report = analyze({
    'entry.tsx': `import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
export default function Page() {
  const queryClient = new QueryClient()
  return <HydrationBoundary state={dehydrate(queryClient)} />
}`
  })

  assert.ok(gates(report).includes('dehydrated-product-query'))
  assert.ok(gates(report).includes('product-query-client'))
})

test('detects a Server Action used as a TanStack queryFn', () => {
  const report = analyze({
    'entry.tsx': `import { options } from './options'
export default function Page() { return options() }`,
    'options.ts': `import { queryOptions } from '@tanstack/react-query'
import { getProductAction } from './actions'
export const options = () => queryOptions({
  queryKey: ['products'],
  queryFn: async () => getProductAction('h')
})`,
    'actions.ts': `'use server'
export async function getProductAction(handle: string) { return handle }`
  })

  const violation = report.gateViolations.find(
    candidate => candidate.gate === 'server-action-as-queryfn'
  )
  assert.ok(violation)
  assert.match(violation.detail, /getProductAction/)
})

test('a plain (non-action) queryFn is not reported', () => {
  const report = analyze({
    'entry.tsx': `import { options } from './options'
export default function Page() { return options() }`,
    'options.ts': `import { queryOptions } from '@tanstack/react-query'
import { fetchThing } from './fetchThing'
export const options = () => queryOptions({
  queryKey: ['thing'],
  queryFn: async () => fetchThing()
})`,
    'fetchThing.ts':
      'export async function fetchThing() { return 1 }'
  })

  assert.ok(!gates(report).includes('server-action-as-queryfn'))
})

test('detects a client module refetching server-owned data', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import { useQuery } from '@tanstack/react-query'
export function Island() { return useQuery({ queryKey: ['p'] }) }`
  })

  assert.ok(gates(report).includes('client-product-refetch'))
})

test('detects a full ShopifyProduct crossing into a client island', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import type { ShopifyProduct } from 'types/product'
type Props = { product: ShopifyProduct; relatedProducts: ShopifyProduct[] }
export function Island(props: Props) { return props.product.id }`
  })

  const violations = report.gateViolations.filter(
    candidate => candidate.gate === 'full-product-into-client'
  )
  assert.equal(violations.length, 2)
})

test('a compact purchase model crossing the boundary is allowed', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import type { ProductPurchaseModel } from './model'
type Props = { model: ProductPurchaseModel }
export function Island(props: Props) { return props.model.id }`,
    'model.ts':
      'export type ProductPurchaseModel = { id: string }'
  })

  assert.deepEqual(report.gateViolations, [])
})

test('ShopifyProduct inside a deep client helper is not a boundary violation', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import { report } from './report'
type Props = { id: string }
export function Island(props: Props) { return report(props.id) }`,
    'report.ts': `import type { ShopifyProduct } from 'types/product'
type Input = { product: ShopifyProduct }
export function report(id: string) { return id as unknown as Input }`
  })

  assert.ok(!gates(report).includes('full-product-into-client'))
})

test('detects a Hydrogen provider introduced on the client', () => {
  const report = analyze({
    'entry.tsx': `import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import { ShopifyProvider, useProduct } from '@shopify/hydrogen-react'
export function Island() { return <ShopifyProvider>{useProduct()}</ShopifyProvider> }`
  })

  const violation = report.gateViolations.find(
    candidate => candidate.gate === 'global-shopify-provider'
  )
  assert.ok(violation)
  assert.match(violation.detail, /ShopifyProvider/)
})

test('server-side Hydrogen utilities stay allowed', () => {
  const report = analyze({
    'entry.tsx': `import { getProductOptions } from '@shopify/hydrogen-react'
export default function Page() { return getProductOptions({}) }`
  })

  assert.deepEqual(report.gateViolations, [])
})

test('client third-party packages are collected, server ones are not', () => {
  const report = analyze({
    'entry.tsx': `import 'server-only'
import { Island } from './Island'
export default function Page() { return <Island /> }`,
    'Island.tsx': `'use client'
import { motion } from 'motion/react'
export function Island() { return motion }`
  })

  assert.deepEqual(report.clientThirdPartyPackages, ['motion'])
})
