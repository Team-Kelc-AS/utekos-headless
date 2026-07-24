'use client'

import { useChat } from '@ai-sdk/react'
import {
  type AssistantIntent,
  type AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'
import { DefaultChatTransport } from 'ai'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { CustomerAssistantLauncher } from './CustomerAssistantLauncher'
import { CustomerAssistantPanel } from './CustomerAssistantPanel'
import { AssistantLiveAnnouncer } from './AssistantMessageList'
import {
  allowsAssistantSurface,
  createAssistantRequestBody,
  createCompletedAssistantAnnouncement,
  recordAssistantFeedback,
  resolveAssistantAnnouncementText,
  type AssistantFeedbackState,
  type AssistantFeedbackValue
} from './assistantViewModel'

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
  const [feedback, setFeedback] =
    useState<AssistantFeedbackState>({})
  const [suppressedAnnouncementId, setSuppressedAnnouncementId] =
    useState<string | null>(null)
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
            body: createAssistantRequestBody({
              id,
              sessionId: body?.sessionId,
              intent: body?.intent,
              messages: nextMessages,
              pathname: pathname || '/',
              productHandle
            })
          }
        }
      })
    })
  const latestAssistantMessageId =
    messages.findLast(message => message.role === 'assistant')
      ?.id ?? null
  const completedAnnouncement =
    createCompletedAssistantAnnouncement(messages, status)
  const announcementText = resolveAssistantAnnouncementText(
    completedAnnouncement,
    isOpen,
    suppressedAnnouncementId
  )

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true
      headingRef.current?.focus()
      return
    }

    if (hasOpenedRef.current) launcherRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      setSuppressedAnnouncementId(latestAssistantMessageId)
      setIsOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () =>
      document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, latestAssistantMessageId])

  function closePanel() {
    setSuppressedAnnouncementId(latestAssistantMessageId)
    setIsOpen(false)
  }

  function openPanel() {
    setSuppressedAnnouncementId(latestAssistantMessageId)
    setIsOpen(true)
  }

  function selectFeedback(
    responseId: string,
    value: AssistantFeedbackValue
  ) {
    setFeedback(current =>
      recordAssistantFeedback(current, responseId, value)
    )
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
      <AssistantLiveAnnouncer text={announcementText} />
      {isOpen && (
        <CustomerAssistantPanel
          error={error}
          feedback={feedback}
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
          onFeedbackSelect={selectFeedback}
          onInputChange={setInput}
          onIntentSelect={selectIntent}
          onSubmit={() => void sendText(input)}
        />
      )}
      <CustomerAssistantLauncher
        controls={panelId}
        expanded={isOpen}
        launcherRef={launcherRef}
        onClick={isOpen ? closePanel : openPanel}
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
