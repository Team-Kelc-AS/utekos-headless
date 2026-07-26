import { renderToStaticMarkup } from 'react-dom/server'
import {
  createPrivacySections,
  lastUpdated
} from '../../src/db/config/privacy.config'

const sections = createPrivacySections({
  includeCookieDeclaration: false
})

const html = renderToStaticMarkup(
  <>
    <h1>Personvernerklæring</h1>
    <p>Sist oppdatert: {lastUpdated}</p>
    {sections.map(section => (
      <section key={section.id}>
        <h2>{section.title}</h2>
        {section.content}
      </section>
    ))}
  </>
)

process.stdout.write(`${html}\n`)
