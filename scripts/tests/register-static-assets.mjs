import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'

const assetsRoot = new URL('../../src/assets/', import.meta.url)
  .href

registerHooks({
  load(url, context, nextLoad) {
    if (
      url.startsWith(assetsRoot) &&
      /\.(png|jpe?g|webp|svg|avif)$/.test(url) &&
      existsSync(fileURLToPath(url))
    ) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `export default ${JSON.stringify({ src: url, width: 1, height: 1 })}`
      }
    }
    return nextLoad(url, context)
  }
})
