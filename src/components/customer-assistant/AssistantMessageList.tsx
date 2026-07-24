'use client'

import type { AssistantUIMessage } from '@/lib/customer-assistant/assistantProtocol'
import { ExternalLinkIcon } from 'lucide-react'
import { AssistantFeedback } from './AssistantFeedback'
import { AssistantHandoff } from './AssistantHandoff'
import { AssistantProductRecommendation } from './AssistantProductRecommendation'
import {
  createAssistantViewRows,
  createHandoffSummary,
  type AssistantChatStatus,
  type AssistantFeedbackState,
  type AssistantFeedbackValue
} from './assistantViewModel'

export type { AssistantChatStatus } from './assistantViewModel'

type AssistantMessageListProps = {
  feedback: AssistantFeedbackState
  messages: AssistantUIMessage[]
  status: AssistantChatStatus
  onFeedbackSelect: (
    responseId: string,
    value: AssistantFeedbackValue
  ) => void
}

type AssistantLiveAnnouncerProps = { text: string }

export function AssistantLiveAnnouncer({
  text
}: AssistantLiveAnnouncerProps) {
  return (
    <p className='sr-only' aria-live='polite' aria-atomic='true'>
      {text}
    </p>
  )
}

export function AssistantMessageList({
  feedback,
  messages,
  status,
  onFeedbackSelect
}: AssistantMessageListProps) {
  const lastAssistantMessage = messages.findLast(
    message => message.role === 'assistant'
  )
  const summary = createHandoffSummary(messages)

  return (
    <ol aria-label='Samtale' className='space-y-5'>
      {messages.map(message => {
        const rows = createAssistantViewRows([message])
        const statusRow = rows.find(row => row.kind === 'status')
        const isCompletedAssistantResponse =
          message.role === 'assistant' &&
          statusRow?.kind === 'status' &&
          (message.id !== lastAssistantMessage?.id ||
            status === 'ready')

        return (
          <li
            key={message.id}
            data-assistant-confidence={
              statusRow?.kind === 'status' ?
                statusRow.confidence
              : undefined
            }
            data-assistant-failure={
              statusRow?.kind === 'status' ?
                statusRow.failureCode
              : undefined
            }
          >
            <div className='space-y-3'>
              {rows.map(row => {
                if (row.kind === 'text') {
                  return (
                    <div
                      key={row.id}
                      className={
                        row.role === 'user' ?
                          'flex justify-end'
                        : 'flex justify-start'
                      }
                    >
                      <p
                        className={
                          row.role === 'user' ?
                            'max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-primary-foreground'
                          : 'max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-popover-foreground'
                        }
                      >
                        <span className='sr-only'>
                          {row.role === 'user' ?
                            'Du: '
                          : 'Kjøpshjelp: '}
                        </span>
                        {row.text}
                      </p>
                    </div>
                  )
                }

                if (row.kind === 'recommendation') {
                  return (
                    <AssistantProductRecommendation
                      key={row.id}
                      recommendation={row.recommendation}
                    />
                  )
                }

                if (row.kind === 'source') {
                  return (
                    <a
                      key={row.id}
                      href={row.source.url}
                      className='inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium underline underline-offset-4 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
                    >
                      Kilde: {row.source.title}
                      <ExternalLinkIcon
                        className='size-4'
                        aria-hidden='true'
                      />
                    </a>
                  )
                }

                if (row.kind === 'handoff') {
                  return (
                    <AssistantHandoff
                      key={row.id}
                      handoff={row.handoff}
                      summary={summary}
                    />
                  )
                }

                return null
              })}
            </div>

            {isCompletedAssistantResponse && (
              <AssistantFeedback
                responseId={message.id}
                value={feedback[message.id] ?? null}
                onSelect={onFeedbackSelect}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
