import {
  assistantProductProfiles,
  countAssistantProfileCues,
  matchesAssistantCue,
  normalizeAssistantText
} from '../assistantProductProfiles'
import type { AssistantChatRequest } from '../assistantProtocol'

const useCues = [
  'båt',
  'kyst',
  'hytte',
  'bobil',
  'reise',
  'hundelufting',
  'sidelinje',
  'isbading'
] as const

const useQuestion =
  'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytta, i båten, i bobilen eller i hverdagen?'

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

export function resolveAssistantClarification(
  messages: AssistantChatRequest['messages']
): string | null {
  if (countAssistantQuestions(messages) >= 3) {
    return null
  }

  const userText = getUserText(messages)
  const hasUseCue = useCues.some(cue =>
    matchesAssistantCue(userText, cue)
  )

  if (!hasUseCue) {
    return useQuestion
  }

  const highestProfileCueCount = Math.max(
    ...assistantProductProfiles.map(profile =>
      countAssistantProfileCues(userText, profile)
    )
  )

  if (highestProfileCueCount >= 2) {
    return null
  }

  return priorityQuestion
}
