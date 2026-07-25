import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProductVideoPlayer } from './ProductVideoPlayer'

test('server-renders a local consent poster without an active iframe', () => {
  const markup = renderToStaticMarkup(
    <ProductVideoPlayer src='https://www.youtube-nocookie.com/embed/video-id' />
  )

  assert.doesNotMatch(markup, /<iframe/)
  assert.doesNotMatch(markup, /youtube-nocookie\.com/)
  assert.match(markup, /video-poster-bg\.webp/)
  assert.match(markup, /Endre samtykke og spill av/)
})
