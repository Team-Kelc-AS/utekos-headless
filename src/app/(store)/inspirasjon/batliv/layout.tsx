import { BoatingInspirationJsonLdScript } from './BoatingInspirationJsonLd'
import { Fragment } from 'react/jsx-runtime'

export default function BoatingInspirationLayout({ children }: { children: React.ReactNode }) {
  return (
    <Fragment>
      <BoatingInspirationJsonLdScript />
      {children}
    </Fragment>
  )
}