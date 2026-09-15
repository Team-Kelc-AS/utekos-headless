import { ChevronDown } from 'lucide-react'
import { TECH_MODES_SECTION_ID } from '@/app/handlehjelp/teknologi-materialer/constants'
import styles from './TechHero.module.css'

export function TechHeroScrollInvite() {
  return (
    <a
      href={`#${TECH_MODES_SECTION_ID}`}
      className={styles.invite}
      aria-label='Fortsett nedover til modusene'
      data-track='TechHeroScrollInvite'
    >
      <span className={styles.inviteMotion}>
        <ChevronDown
          className={styles.inviteIcon}
          strokeWidth={1.5}
          aria-hidden
        />
      </span>
    </a>
  )
}
