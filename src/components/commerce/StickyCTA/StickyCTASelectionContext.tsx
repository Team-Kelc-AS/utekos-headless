'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'

export type StickyCTASelection = {
  productHandle: string
  productName: string
  priceAmount: number
}

type StickyCTASelectionContextValue = {
  selection: StickyCTASelection | null
  selectedVariantId: string | null
  setSelection: (selection: StickyCTASelection | null) => void
  setSelectedVariantId: (variantId: string | null) => void
}

const StickyCTASelectionContext =
  createContext<StickyCTASelectionContextValue | null>(null)

export function StickyCTASelectionProvider({
  children
}: {
  children: ReactNode
}) {
  const [selection, setSelection] =
    useState<StickyCTASelection | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | null
  >(null)
  const value = useMemo(
    () => ({
      selection,
      selectedVariantId,
      setSelection,
      setSelectedVariantId
    }),
    [selectedVariantId, selection]
  )

  return (
    <StickyCTASelectionContext value={value}>
      {children}
    </StickyCTASelectionContext>
  )
}

export function useStickyCTASelection() {
  return useContext(StickyCTASelectionContext)
}
