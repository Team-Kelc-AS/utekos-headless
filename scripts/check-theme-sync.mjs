#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const storeRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const wikiRoot = resolve(
  process.env.UTEKOS_WIKI_ROOT ?? resolve(storeRoot, '../utekos-wiki')
)
const storeGlobals = resolve(storeRoot, 'src/globals.css')
const wikiGlobals = resolve(wikiRoot, 'src/globals.css')

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

const store = await readFile(storeGlobals)
let wiki
try {
  wiki = await readFile(wikiGlobals)
} catch {
  console.warn(`Wiki globals missing at ${wikiGlobals}. Skipping theme-sync check.`)
  process.exit(0)
}

const storeHash = sha256(store)
const wikiHash = sha256(wiki)

if (storeHash !== wikiHash) {
  console.warn('Wiki src/globals.css diverges from this store fasit.')
  console.warn(`store ${storeHash}`)
  console.warn(`wiki  ${wikiHash}`)
  process.exit(0)
}

console.log(`Wiki src/globals.css matches this store fasit (${storeHash})`)
