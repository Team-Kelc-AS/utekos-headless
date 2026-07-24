import { assistantProductProfiles } from '../assistantProductProfiles'
import type { AssistantChatRequest } from '../assistantProtocol'

const useCues = new Set([
  'båt',
  'kyst',
  'hytte',
  'bobil',
  'reise',
  'hundelufting',
  'sidelinje',
  'isbading'
])

const useQuestion =
  'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytta, i båten, i bobilen eller i hverdagen?'

const priorityQuestion =
  'Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?'

function normalizeAssistantText(text: string) {
  return text.trim().toLocaleLowerCase('nb-NO')
}

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
    .filter(part => part.text.includes('?')).length
}

export function resolveAssistantClarification(
  messages: AssistantChatRequest['messages']
): string | null {
  if (countAssistantQuestions(messages) >= 3) {
    return null
  }

  const userText = getUserText(messages)
  const hasUseCue = assistantProductProfiles.some(profile =>
    profile.cues.some(
      cue => useCues.has(cue) && userText.includes(cue)
    )
  )

  if (!hasUseCue) {
    return useQuestion
  }

  const highestProfileCueCount = Math.max(
    ...assistantProductProfiles.map(
      profile =>
        profile.cues.filter(cue => userText.includes(cue)).length
    )
  )

  if (highestProfileCueCount >= 2) {
    return null
  }

  const hasWeatherOrPriorityCue = assistantProductProfiles.some(
    profile =>
      profile.cues.some(
        cue => !useCues.has(cue) && userText.includes(cue)
      )
  )

  return hasWeatherOrPriorityCue ? null : priorityQuestion
}
