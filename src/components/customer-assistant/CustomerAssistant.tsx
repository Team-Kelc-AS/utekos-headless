'use client'

import { useChat } from '@ai-sdk/react'
import {
  projectTextOnlyMessages,
  type AssistantIntent,
  type AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'
import { DefaultChatTransport } from 'ai'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { CustomerAssistantLauncher } from './CustomerAssistantLauncher'
import { CustomerAssistantPanel } from './CustomerAssistantPanel'
import { allowsAssistantSurface } from './assistantViewModel'

type CustomerAssistantProps = {
  rolloutPercent: number
  productHandle: string | null
}

type CustomerAssistantRuntimeProps = {
  productHandle: string | null
}

function CustomerAssistantRuntime({
  productHandle
}: CustomerAssistantRuntimeProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [intent, setIntent] =
    useState<AssistantIntent>('product_help')
  const [input, setInput] = useState('')
  const sessionIdRef = useRef<string | null>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstActionRef = useRef<HTMLButtonElement>(null)
  const hasOpenedRef = useRef(false)
  const panelId = useId()
  const headingId = useId()
  const inputId = useId()

  const { messages, sendMessage, status, error } =
    useChat<AssistantUIMessage>({
      transport: new DefaultChatTransport<AssistantUIMessage>({
        api: '/api/customer-assistant/chat',
        credentials: 'same-origin',
        prepareSendMessagesRequest: ({
          body,
          id,
          messages: nextMessages
        }) => {
          return {
            body: {
              id,
              sessionId: body?.sessionId,
              intent: body?.intent,
              messages: projectTextOnlyMessages(nextMessages),
              pageContext: {
                pathname: pathname || '/',
                productHandle
              }
            }
          }
        }
      })
    })

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true
      headingRef.current?.focus()

      function closeOnEscape(event: KeyboardEvent) {
        if (event.key === 'Escape') setIsOpen(false)
      }

      document.addEventListener('keydown', closeOnEscape)
      return () =>
        document.removeEventListener('keydown', closeOnEscape)
    }

    if (hasOpenedRef.current) launcherRef.current?.focus()
  }, [isOpen])

  function closePanel() {
    setIsOpen(false)
  }

  async function sendText(
    text: string,
    requestIntent: AssistantIntent = intent
  ) {
    const normalizedText = text.trim()
    if (
      normalizedText.length === 0 ||
      normalizedText.length > 800 ||
      status !== 'ready'
    ) {
      return
    }

    setInput('')
    sessionIdRef.current ??= crypto.randomUUID()
    await sendMessage(
      { text: normalizedText },
      {
        body: {
          sessionId: sessionIdRef.current,
          intent: requestIntent
        }
      }
    )
  }

  function selectIntent(
    nextIntent: AssistantIntent,
    prompt: string
  ) {
    setIntent(nextIntent)
    void sendText(prompt, nextIntent)
  }

  return (
    <>
      {isOpen && (
        <CustomerAssistantPanel
          error={error}
          firstActionRef={firstActionRef}
          headingId={headingId}
          headingRef={headingRef}
          input={input}
          inputId={inputId}
          intent={intent}
          messages={messages}
          panelId={panelId}
          status={status}
          onClose={closePanel}
          onInputChange={setInput}
          onIntentSelect={selectIntent}
          onSubmit={() => void sendText(input)}
        />
      )}
      <CustomerAssistantLauncher
        controls={panelId}
        expanded={isOpen}
        launcherRef={launcherRef}
        onClick={() => setIsOpen(current => !current)}
      />
    </>
  )
}

export function CustomerAssistant({
  rolloutPercent,
  productHandle
}: CustomerAssistantProps) {
  if (!allowsAssistantSurface(rolloutPercent)) return null

  return (
    <CustomerAssistantRuntime productHandle={productHandle} />
  )
}
