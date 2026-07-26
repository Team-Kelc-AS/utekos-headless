import {
  assistantProductProfiles,
  countAssistantProfileCues,
  matchesAssistantCue,
  normalizeAssistantText
} from '../assistantProductProfiles'
import type { AssistantChatRequest } from '../assistantProtocol'

const useCues = ['båt', 'hytte', 'bobil', 'hverdag'] as const
const priorityCues = [
  'mest varme',
  'mest mulig varme',
  'lav vekt',
  'værbeskyttelse',
  'enkelt vedlikehold'
] as const

const useQuestion =
  'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytten, i båten, i bobilen eller i hverdagen?'

const priorityQuestion =
  'Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?'

function getUserText(
  messages: AssistantChatRequest['messages']
) {
  return normalizeAssistantText(
    messages
      .filter(message => message.role === 'user')
      .flatMap(message => message.parts.map(part => part.text))
      .join('\n')
  )
}

function countAssistantQuestions(
  messages: AssistantChatRequest['messages']
) {
  return messages
    .filter(message => message.role === 'assistant')
    .flatMap(message => message.parts)
    .filter(
      part =>
        part.text === useQuestion ||
        part.text === priorityQuestion
    ).length
}

export type AssistantClarificationResult =
  | {
      kind: 'ask'
      category: 'use' | 'priority'
      question: string
    }
  | { kind: 'ready' }
  | { kind: 'exhausted' }

export function resolveAssistantClarification(
  messages: AssistantChatRequest['messages']
): AssistantClarificationResult {
  const userText = getUserText(messages)
  const highestProfileCueCount = Math.max(
    ...assistantProductProfiles.map(profile =>
      countAssistantProfileCues(userText, profile)
    )
  )

  if (highestProfileCueCount >= 2) {
    return { kind: 'ready' }
  }

  if (countAssistantQuestions(messages) >= 3) {
    return { kind: 'exhausted' }
  }

  const hasUseCue = useCues.some(cue =>
    matchesAssistantCue(userText, cue)
  )
  const hasPriorityCue = priorityCues.some(cue =>
    matchesAssistantCue(userText, cue)
  )

  if (!hasUseCue) {
    return {
      kind: 'ask',
      category: 'use',
      question: useQuestion
    }
  }

  if (!hasPriorityCue) {
    return {
      kind: 'ask',
      category: 'priority',
      question: priorityQuestion
    }
  }

  return { kind: 'exhausted' }
}
