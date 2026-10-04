import Image from 'next/image'
import { Suspense } from 'react'
import {
  Feather,
  PersonStanding,
  SlidersHorizontal
} from 'lucide-react'
import {
  MerchantTruckIcon,
  ReturnsOutlineIcon
} from '@/components/utekos-icons'
import styles from '@/app/(techdown)/produkter/techdown/TechdownContent.module.css'
import {
  SvaleSizeSelector,
  SvaleSizeSelectorFallback
} from './SvaleSizeSelector'
import {
  SvaleSpecsAccordion,
  SvaleSpecsAccordionFallback
} from './SvaleSpecsAccordion'

function TrustFootnoteMark() {
  return (
    <a href='#levering-vilkar' className={styles.trustRef}>
      <span aria-hidden='true'>*</span>
      <span className='sr-only'>
        Mer om sending samme dag lenger ned
      </span>
    </a>
  )
}

export function SvaleContent() {
  return (
    <div className={styles.content}>
      <section
        className={styles.trustPanel}
        data-journey-section='purchase'
        aria-labelledby='svale-trust-heading'
      >
        <h2 id='svale-trust-heading' className='sr-only'>
          Frakt, bytte og sending
        </h2>
        <div className={styles.trustGrid}>
          <div className={styles.trustRow}>
            <span className={styles.trustIconSurface}>
              <Image
                src='/postnord_blue_wordmark.svg'
                alt='PostNord'
                width={1064}
                height={200}
                unoptimized
              />
            </span>
            <h3>Gratis frakt</h3>
          </div>
          <div className={styles.trustRow}>
            <span
              className={styles.exchangeIcon}
              aria-hidden='true'
            >
              <ReturnsOutlineIcon tone='orange' />
            </span>
            <h3>Gratis bytte</h3>
          </div>
          <div className={styles.trustRow}>
            <span
              className={styles.exchangeIcon}
              aria-hidden='true'
            >
              <MerchantTruckIcon tone='orange' />
            </span>
            <h3>
              Sendes samme dag
              <TrustFootnoteMark />
            </h3>
          </div>
        </div>
        <Suspense fallback={<SvaleSizeSelectorFallback />}>
          <SvaleSizeSelector />
        </Suspense>
        <div className={`${styles.paymentRow} rounded-lg`}>
          <div
            className={styles.paymentLogos}
            aria-label='Betalingsmetoder'
          >
            <Image
              className={styles.logoKlarna}
              src='/klarna_orig.svg'
              alt='Klarna'
              width={69}
              height={30}
              unoptimized
            />
            <Image
              className={styles.logoVisa}
              src='/visa_orig.svg'
              alt='Visa'
              width={63}
              height={21}
              unoptimized
            />
            <Image
              className={styles.logoVipps}
              src='/vipps_orig.svg'
              alt='Vipps'
              width={92}
              height={24}
              unoptimized
            />
            <Image
              className={styles.logoGooglePay}
              src='/gpay_orig.svg'
              alt='Google Pay'
              width={60}
              height={32}
              unoptimized
            />
            <Image
              className={styles.logoApplePay}
              src='/apple_orig.svg'
              alt='Apple Pay'
              width={50}
              height={32}
              unoptimized
            />
          </div>
        </div>
      </section>

      <section
        className={styles.outcomes}
        data-journey-section='svale'
        aria-labelledby='outcomes-heading'
      >
        <div className={styles.sectionHeading}>
          <h2 id='outcomes-heading'>Skreddersy varmen</h2>
          <p>
            Sømløs balanse mellom teknisk raffinement og
            uanstrengt komfort løfter Utekos TechDown™ den
            nordiske utetiden. Fra hytte- og terrasseliv til
            bobil- og campingglede eller kalde høstkvelder på
            sidelinjen, mens barnebarna utfolder seg på
            fotballbanen.
          </p>
        </div>
        <ul className={styles.benefits}>
          <li>
            <Feather aria-hidden='true' />
            <div>
              <strong>Juster, form og nyt</strong>
              <span>
                Vinterdress, kåpe, parkas eller jakke - du
                bestemmer. Juster lengde, tilpass passform og
                reguler ventilasjon etter behov.
              </span>
            </div>
          </li>
          <li>
            <PersonStanding aria-hidden='true' />
            <div>
              <strong>Raffinerte løsninger</strong>
              <span>
                Raffinerte og gjennomtestede løsninger som
                snorstramminger, omvendt V-formet glidelåssystem
                og spesialutviklet materiale er gradvis utbedret
                og optimalisert over år med testing og erfaring.
              </span>
            </div>
          </li>
          <li>
            <SlidersHorizontal aria-hidden='true' />
            <div>
              <strong>43 ganger bedre enn dun</strong>
              <span>
                Målinger av hydroskopiske egenskaper ved høy
                relativ luftfuktighet dokumenterer at CloudWeave™
                har over 43 ganger bedre fuktmotstand enn
                tradisjonell dun.
              </span>
            </div>
          </li>
        </ul>
      </section>
      <Suspense fallback={<SvaleSpecsAccordionFallback />}>
        <SvaleSpecsAccordion />
      </Suspense>
      <aside
        id='levering-vilkar'
        className={styles.trustEndnote}
      >
        <p>
          <span aria-hidden='true'>*</span> Sending av samme dag
          gjelder ved bestilling man-fre før kl 14.
        </p>
      </aside>
    </div>
  )
}
