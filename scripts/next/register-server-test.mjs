import Module, { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const navigationPath = require.resolve('next/navigation')
const serverNavigationPath =
  require.resolve('next/dist/client/components/navigation.react-server')
const originalLoad = Module._load

// Match Next's server alias when running server modules directly in Node tests.
Module._load = function (request, parent, isMain) {
  return originalLoad.call(
    this,
    request === 'next/navigation' || request === navigationPath ?
      serverNavigationPath
    : request,
    parent,
    isMain
  )
}

// Node does not have Next's static-image loader; these tests do not render images.
for (const extension of [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.gif'
]) {
  require.extensions[extension] = (module, filename) => {
    module.exports = { src: filename, width: 1, height: 1 }
  }
}
