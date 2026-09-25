import '../../globals.css'
import { Suspense } from 'react'
import { googleSansFlex } from '@/lib/fonts'
import { MetaBrowserTransportLoader } from '@/components/analytics/MetaBrowserTransportLoader'
import { MetaParameterBuilderInitializer } from '@/components/analytics/MetaParameterBuilderInitializer'
import { PageViewObserver } from '@/components/analytics/PageViewObserver'
import { getTrackingEnvironment } from '@/lib/analytics/getTrackingEnvironment'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'

export { siteMetadata as metadata } from '@/app/siteMetadata'

export default function WaitlistLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang='no'
      className={`${googleSansFlex.variable} dark`}
    >
      <body className='min-h-dvh bg-background font-sans font-medium text-foreground antialiased'>
        {shouldLoadGoogleTagManager(process.env.VERCEL_ENV) && (
          <MetaBrowserTransportLoader />
        )}
        <Suspense fallback={null}>
          <MetaParameterBuilderInitializer />
          <PageViewObserver
            environment={getTrackingEnvironment()}
            metaOnly
          />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  )
}
