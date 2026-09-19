'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchControlContext } from '@/lib/canonical-control/fetchControlContext'
import { type ControlModelContext } from '@/lib/canonical-control/registerControlTool'
import { setupControlTool } from '@/lib/canonical-control/setupControlTool'
import type { ControlResult } from '@/lib/canonical-control/controlResult'

export default function ControlConsole() {
  const [result, setResult] = useState<ControlResult | null>(
    null
  )
  const [authenticated, setAuthenticated] = useState(false)
  const [status, setStatus] = useState(
    'Kontrollerer operatørtilgang …'
  )
  const [webmcp, setWebmcp] = useState('Venter på innlogging')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const requestNumber = useRef(0)

  async function load(input: unknown, signal?: AbortSignal) {
    const request = ++requestNumber.current
    setBusy(true)
    try {
      const next = await fetchControlContext(input, signal)
      if (
        request === requestNumber.current &&
        !signal?.aborted
      ) {
        setResult(next)
        setAuthenticated(true)
        setStatus(
          next.contexts.length ?
            `${next.total_matches} treff${next.truncated ? ', viser de første 3' : ''}.`
          : 'Kilderegister lastet. Velg et event eller søk etter en parameter.'
        )
      }
      return next
    } catch (error) {
      if (
        !signal?.aborted &&
        request === requestNumber.current
      ) {
        if (
          error instanceof Error &&
          error.message === 'AUTH_REQUIRED'
        ) {
          setAuthenticated(false)
          setResult(null)
          setStatus(
            'Logg inn med din eksisterende Utekos-konto via WorkOS.'
          )
        } else
          setStatus(
            (
              error instanceof Error &&
                error.message === 'EVENT_NOT_FOUND'
            ) ?
              'Eventet finnes ikke i canonical schema.'
            : 'Konteksten kunne ikke hentes. Ingen handling ble utført.'
          )
      }
      throw error
    } finally {
      if (request === requestNumber.current) setBusy(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void fetchControlContext({}, controller.signal)
      .then(next => {
        if (controller.signal.aborted) return
        setResult(next)
        setAuthenticated(true)
        setStatus(
          'Kilderegister lastet. Velg et event eller søk etter en parameter.'
        )
      })
      .catch(error => {
        if (controller.signal.aborted) return
        setStatus(
          (
            error instanceof Error &&
              error.message === 'AUTH_REQUIRED'
          ) ?
            'Logg inn med din eksisterende Utekos-konto via WorkOS.'
          : 'Konteksten kunne ikke hentes. Ingen handling ble utført.'
        )
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!authenticated) return
    const context = (
      document as Document & {
        modelContext?: ControlModelContext
      }
    ).modelContext
    const controller = new AbortController()
    void setupControlTool(
      context,
      controller.signal,
      (input, signal) => load(input, signal)
    )
      .then(message => {
        if (!controller.signal.aborted) setWebmcp(message)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          controller.abort()
          setWebmcp(
            'Registrering ble avvist av nettleseren. Vanlig søk fungerer.'
          )
        }
      })
    return () => controller.abort()
  }, [authenticated])

  return (
    <>
      <section
        className='control-panel'
        aria-labelledby='access-heading'
      >
        <div className='control-row'>
          <h2 id='access-heading'>Operatørtilgang</h2>
          {authenticated ?
            <button
              onClick={async () => {
                const response = await fetch(
                  '/canonical-control/logout',
                  { method: 'POST', credentials: 'same-origin' }
                )
                if (response.ok) {
                  requestNumber.current++
                  setAuthenticated(false)
                  setResult(null)
                  setStatus('Du er logget ut.')
                  setWebmcp('Venter på innlogging')
                } else
                  setStatus('Utlogging mislyktes. Prøv igjen.')
              }}
            >
              Logg ut
            </button>
          : <a
              className='control-button'
              href='/canonical-control/login'
            >
              Logg inn med WorkOS
            </a>
          }
        </div>
        <p role='status' aria-live='polite'>
          {status}
        </p>
        <p className='control-detail'>{webmcp}</p>
      </section>
      {authenticated && result && (
        <>
          <section
            className='control-panel'
            aria-labelledby='find-heading'
          >
            <h2 id='find-heading'>Finn riktig definisjon</h2>
            <form
              onSubmit={event => {
                event.preventDefault()
                void load({ query }).catch(() => {})
              }}
            >
              <label htmlFor='control-query'>
                Event, parameter eller leverandør
              </label>
              <div className='control-row'>
                <input
                  id='control-query'
                  value={query}
                  onChange={event =>
                    setQuery(event.target.value)
                  }
                  maxLength={120}
                  required
                  placeholder='For eksempel event_id eller purchase'
                />
                <button disabled={busy}>Søk</button>
              </div>
            </form>
            <div
              className='control-events'
              aria-label='Canonical events'
            >
              {result.inventory.map(event => (
                <button
                  key={event.name}
                  disabled={busy}
                  onClick={() => {
                    void load({ name: event.name }).catch(
                      () => {}
                    )
                  }}
                >
                  {event.name}
                </button>
              ))}
            </div>
            <p>
              {result.inventory.length} canonical events. Kun i
              katalog, ikke i schema:{' '}
              {result.catalog_only
                .map(event => event.name)
                .join(', ')}
              .
            </p>
          </section>
          {result.contexts.map(context => (
            <section
              className='control-panel'
              key={context.definition.name}
              aria-label={context.definition.name}
            >
              <h2>{context.definition.name}</h2>
              <p>
                Kildedefinisjon · runtime og leverandørleveranse
                er ikke kontrollert.
              </p>
              <details open>
                <summary>
                  Definisjon, parametre og leverandørmapping
                </summary>
                <pre tabIndex={0}>
                  {JSON.stringify(context.definition, null, 2)}
                </pre>
              </details>
              <details>
                <summary>Pipeline og kildehenvisninger</summary>
                <pre tabIndex={0}>
                  {JSON.stringify(context.pipeline, null, 2)}
                </pre>
              </details>
            </section>
          ))}
          <section
            className='control-panel'
            aria-labelledby='evidence-heading'
          >
            <h2 id='evidence-heading'>Versjon og bevisgrense</h2>
            <p>Manifest: {result.manifest_version}</p>
            <p className='control-hash'>
              SHA-256: {result.manifest_sha256}
            </p>
            <p className='control-hash'>
              Deployment:{' '}
              {result.deployment_sha ??
                'lokal / ikke tilgjengelig'}
            </p>
            <p>
              Dagens webautorisasjon: operator_policy.
              Cookiebot-status brukes ikke til å avgjøre sporing.
            </p>
            <ul>
              {result.limitations.map(text => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <details>
              <summary>
                Kildekontrollsummer ({result.sources.length})
              </summary>
              <pre tabIndex={0}>
                {JSON.stringify(result.sources, null, 2)}
              </pre>
            </details>
          </section>
        </>
      )}
    </>
  )
}
