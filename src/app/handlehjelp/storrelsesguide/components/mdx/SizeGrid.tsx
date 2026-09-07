import type { ReactNode } from 'react'
import { H3 } from '@/components/typography/TypographyH3'
import { cn } from '@/lib/utils/className'
import { groupMdxHeadingSections } from './groupMdxHeadingSections'
import styles from '../../page.module.css'

export function SizeGrid({ children }: { children: ReactNode }) {
  const groups = groupMdxHeadingSections(children, ['h3', H3])

  return (
    <div
      className={cn(
        styles.sizeGrid,
        groups.length === 2 && styles.twoColumns
      )}
    >
      {groups.map((group, index) => (
        <div key={index} className={styles.sizeAdvice}>
          {group}
        </div>
      ))}
    </div>
  )
}
