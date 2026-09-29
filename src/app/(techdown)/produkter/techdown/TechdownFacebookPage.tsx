import styles from './TechdownContent.module.css'

const UTEKOS_FACEBOOK_PAGE_URL = 'https://www.facebook.com/utekosen'
const FACEBOOK_PAGE_PLUGIN_SRC = `https://www.facebook.com/plugins/page.php?${new URLSearchParams(
  {
    href: UTEKOS_FACEBOOK_PAGE_URL,
    tabs: 'timeline',
    width: '500',
    height: '500',
    small_header: 'false',
    adapt_container_width: 'true',
    hide_cover: 'false',
    show_facepile: 'true'
  }
).toString()}`

export function TechdownFacebookPage() {
  return (
    <section
      className={styles.facebookPage}
      aria-labelledby='techdown-facebook-heading'
    >
      <a
        className={styles.facebookFollowLink}
        href={UTEKOS_FACEBOOK_PAGE_URL}
        target='_blank'
        rel='noopener noreferrer'
      >
        Følg Utekos på Facebook
      </a>
      <div className={styles.facebookPagePlugin}>
        <iframe
          title='Utekos på Facebook'
          src={FACEBOOK_PAGE_PLUGIN_SRC}
          width={500}
          height={500}
          className={styles.facebookPageIframe}
          allow='autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share'
          allowFullScreen
          loading='lazy'
        />
      </div>
    </section>
  )
}
