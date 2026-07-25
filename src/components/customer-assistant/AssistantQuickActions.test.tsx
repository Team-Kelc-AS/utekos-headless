import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { AssistantQuickActions } from './AssistantQuickActions'

test('renders the four useful quick actions without Noe annet', () => {
  const markup = renderToStaticMarkup(
    <AssistantQuickActions
      disabled={false}
      firstActionRef={{ current: null }}
      intent='product_help'
      onSelect={() => undefined}
    />
  )

  assert.equal((markup.match(/<button/g) ?? []).length, 4)
  assert.match(markup, /Finn riktig produkt/u)
  assert.match(markup, /Hjelp med størrelse/u)
  assert.match(markup, /Se lagerstatus/u)
  assert.match(markup, /Frakt og retur/u)
  assert.doesNotMatch(markup, /Noe annet/u)
})
