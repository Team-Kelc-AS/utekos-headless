'use client'

import { useState } from 'react'
import styles from './Storrelseshjelp.module.css'

type SizeOption = {
  size: string
  heightGuide: string
  measurements: {
    length: string
    chest: string
    armCenter: string
  }
}

export function Storrelsesvalg({
  sizes
}: {
  sizes: SizeOption[]
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = sizes[selectedIndex]

  if (!selected) return null

  return (
    <>
      <div
        className={styles.options}
        role='group'
        aria-label='Velg størrelse for plaggmål'
      >
        {sizes.map((size, index) => (
          <button
            key={size.size}
            type='button'
            className={styles.option}
            aria-pressed={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
          >
            <strong>{size.size}</strong>
            <span>{size.heightGuide}</span>
          </button>
        ))}
      </div>

      <div
        className={styles.result}
        role='status'
        aria-live='polite'
        aria-atomic='true'
      >
        <p>
          <strong>{selected.size}</strong> - plaggmål i
          centimeter
        </p>
        <dl>
          <div>
            <dt>Lengde</dt>
            <dd>{selected.measurements.length}</dd>
          </div>
          <div>
            <dt>Bryst, flatmål</dt>
            <dd>{selected.measurements.chest}</dd>
          </div>
          <div>
            <dt>Ermlengde</dt>
            <dd>{selected.measurements.armCenter}</dd>
          </div>
        </dl>
      </div>
    </>
  )
}
