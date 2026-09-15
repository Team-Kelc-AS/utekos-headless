import type { ReactNode } from 'react'
import { H3 } from '@/components/typography/TypographyH3'
import { groupMdxHeadingSections } from './groupMdxHeadingSections'
import styles from '../../page.module.css'

export function FeatureGrid({
  children
}: {
  children: ReactNode
}) {
  const groups = groupMdxHeadingSections(children, ['h3', H3])

  return (
    <div className={styles.featureGrid}>
      {groups.map((group, index) => (
        <div key={index}>{group}</div>
      ))}
    </div>
  )
}
