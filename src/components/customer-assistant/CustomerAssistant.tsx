'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType
} from 'react'
import { CustomerAssistantLauncher } from './CustomerAssistantLauncher'
import { allowsAssistantSurface } from './assistantViewModel'
import { loadCustomerAssistantRuntime } from './loadCustomerAssistantRuntime'
import { scheduleAssistantRuntimePrefetch } from './scheduleAssistantRuntimePrefetch'

type CustomerAssistantProps = {
  rolloutPercent: number
  productHandle: string | null
}

type RuntimeComponent = ComponentType<{
  initialOpen?: boolean
  productHandle: string | null
}>

export function CustomerAssistant({
  rolloutPercent,
  productHandle
}: CustomerAssistantProps) {
  if (!allowsAssistantSurface(rolloutPercent)) return null

  return (
    <CustomerAssistantShell productHandle={productHandle} />
  )
}

function CustomerAssistantShell({
  productHandle
}: {
  productHandle: string | null
}) {
  const [Runtime, setRuntime] =
    useState<RuntimeComponent | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const openingRef = useRef(false)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    return scheduleAssistantRuntimePrefetch(() => {
      void loadCustomerAssistantRuntime()
    })
  }, [])

  async function openRuntime() {
    if (Runtime || openingRef.current) return

    openingRef.current = true
    setIsOpening(true)
    try {
      const runtimeModule = await loadCustomerAssistantRuntime()
      setRuntime(() => runtimeModule.CustomerAssistantRuntime)
    } catch {
      openingRef.current = false
      setIsOpening(false)
    }
  }

  if (Runtime) {
    return (
      <Runtime initialOpen productHandle={productHandle} />
    )
  }

  return (
    <CustomerAssistantLauncher
      busy={isOpening}
      controls={panelId}
      expanded={isOpening}
      launcherRef={launcherRef}
      onClick={() => {
        void openRuntime()
      }}
    />
  )
}
