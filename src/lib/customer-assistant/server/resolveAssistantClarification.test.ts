import assert from 'node:assert/strict'
import test from 'node:test'
import type { AssistantChatRequest } from '../assistantProtocol'
import { resolveAssistantClarification } from './resolveAssistantClarification'

const messages = (
  entries: Array<{ role: 'assistant' | 'user'; text: string }>
): AssistantChatRequest['messages'] =>
  entries.map((entry, index) => ({
    id: `message-${index}`,
    role: entry.role,
    parts: [{ type: 'text', text: entry.text }]
  }))

test('asks for a use case when no use cue is recognized', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe varmt.' }
      ])
    ),
    'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytta, i båten, i bobilen eller i hverdagen?'
  )
})

test('asks for a weather or priority when only a use cue is recognized', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' }
      ])
    ),
    'Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?'
  )
})

test('uses all active user text and stops once a profile has two cues', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' },
        {
          role: 'assistant',
          text: 'Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?'
        },
        { role: 'user', text: 'Det blir ofte fuktig.' }
      ])
    ),
    null
  )
})

test('stops after three previous assistant questions', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' },
        {
          role: 'assistant',
          text: 'Hva slags bruk ser du for deg?'
        },
        {
          role: 'assistant',
          text: 'Hvor ofte vil du bruke plagget?'
        },
        { role: 'assistant', text: 'Hva er viktigst for deg?' }
      ])
    ),
    null
  )
})
