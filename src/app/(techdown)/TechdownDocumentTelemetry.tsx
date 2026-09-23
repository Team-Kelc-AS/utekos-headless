import { LandingTelemetry } from '@/app/skreddersy-varmen/components/LandingTelemetry'
import { GoogleTagManagerNoScript } from '@/components/analytics/GoogleTagManagerNoScript'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'

export function TechdownDocumentTelemetry() {
  return (
    <>
      <GoogleTagManagerNoScript
        enabled={shouldLoadGoogleTagManager(
          process.env.VERCEL_ENV
        )}
      />
      <LandingTelemetry />
    </>
  )
}
