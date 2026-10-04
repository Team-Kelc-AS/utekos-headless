import '../../globals.css'
import './document.css'
import { StickyCTA } from '@/components/commerce/StickyCTA'
import { googleSansFlex } from '@/lib/fonts'
import { SvaleDocumentTelemetry } from './SvaleDocumentTelemetry'
import { SvaleIntro } from './SvaleIntro'

export default function SvaleLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang='nb'
      suppressHydrationWarning
      className={googleSansFlex.variable}
    >
      <body>
        <SvaleIntro
          mobileContent={
            <>
              <SvaleDocumentTelemetry />
              <StickyCTA />
            </>
          }
        >
          {children}
        </SvaleIntro>
      </body>
    </html>
  )
}
