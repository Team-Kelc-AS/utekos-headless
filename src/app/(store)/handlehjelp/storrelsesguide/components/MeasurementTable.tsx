import {
  Children,
  cloneElement,
  createElement,
  isValidElement
} from 'react'
import type { ReactNode } from 'react'
import styles from '../page.module.css'

type TableNodeProps = { children?: ReactNode; scope?: string }

export function MeasurementTable({
  children,
  caption,
  id
}: {
  children: ReactNode
  caption: string
  id: string
}) {
  const table = Children.toArray(children).find(
    child =>
      isValidElement<TableNodeProps>(child) &&
      child.type === 'table'
  )
  if (!isValidElement<TableNodeProps>(table)) {
    throw new Error('MeasurementTable requires a Markdown table')
  }

  return (
    <div className={styles.tableBlock} id={id}>
      <div
        className={styles.tableRegion}
        role='region'
        aria-labelledby={`${id}-caption`}
        tabIndex={0}
      >
        <table>
          <caption id={`${id}-caption`}>{caption}</caption>
          {Children.map(table.props.children, section => {
            if (!isValidElement<TableNodeProps>(section))
              return section
            return cloneElement(
              section,
              {},
              Children.map(section.props.children, row => {
                if (!isValidElement<TableNodeProps>(row))
                  return row
                const cells = Children.toArray(
                  row.props.children
                ).filter(isValidElement<TableNodeProps>)
                return cloneElement(
                  row,
                  {},
                  cells.map((cell, index) => {
                    const isHeader =
                      section.type === 'thead' || index === 0
                    return createElement(
                      isHeader ? 'th' : 'td',
                      {
                        ...cell.props,
                        key: cell.key ?? index,
                        ...(isHeader ?
                          {
                            scope:
                              section.type === 'thead' ?
                                'col'
                              : 'row'
                          }
                        : {})
                      }
                    )
                  })
                )
              })
            )
          })}
        </table>
      </div>
      <p className={styles.scrollHint}>
        Rull sidelengs for å se alle størrelsene →
      </p>
    </div>
  )
}
