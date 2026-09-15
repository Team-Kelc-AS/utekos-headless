import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const landing = path.join(root, 'src/app/skreddersy-varmen')
const visited = new Set()
const queue = [
  path.join(landing, 'page.tsx'),
  path.join(landing, 'layout.tsx')
]
function resolveImport(from, value) {
  const bases =
    value.startsWith('@/') ?
      [
        path.join(root, 'src', value.slice(2)),
        ...(value.startsWith('@/app/') ?
          [path.join(root, 'src/app/(store)', value.slice(6))]
        : [])
      ]
    : value.startsWith('.') ?
      [path.resolve(path.dirname(from), value)]
    : []
  return bases
    .flatMap(base => [
      base,
      ...['.ts', '.tsx', '.mdx', '/index.ts', '/index.tsx'].map(
        ext => base + ext
      )
    ])
    .find(file => /\.(tsx?|mdx)$/.test(file) && existsSync(file))
}
while (queue.length) {
  const file = queue.pop()
  if (visited.has(file)) continue
  visited.add(file)
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(
    /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g
  )) {
    const next = resolveImport(file, match[1])
    if (next) queue.push(next)
  }
}
const sources =
  [...visited]
    .filter(file => /\.(tsx|mdx)$/.test(file))
    .sort()
    .map(file => `@source '${path.relative(landing, file)}';`)
    .join('\n') + '\n'
const target = path.join(landing, 'landing-sources.css')
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== sources)
    throw new Error(
      'Run node scripts/perf/generate-landing-css-sources.mjs after changing landing imports'
    )
} else writeFileSync(target, sources)
console.log(
  `Landing CSS: ${sources.split('\n').length - 1} explicit component sources`
)
