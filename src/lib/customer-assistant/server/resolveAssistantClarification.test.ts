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

const useQuestion =
  'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytta, i båten, i bobilen eller i hverdagen?'

const priorityQuestion =
  'Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?'

test('asks for a use case when no use cue is recognized', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe varmt.' }
      ])
    ),
    useQuestion
  )
})

test('asks for a weather or priority when only a use cue is recognized', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' }
      ])
    ),
    priorityQuestion
  )
})

test('uses all active user text and stops once a profile has two cues', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' },
        { role: 'assistant', text: priorityQuestion },
        { role: 'user', text: 'Det blir ofte fukt.' }
      ])
    ),
    null
  )
})

test('continues clarification when cues belong to different profiles', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt i regn.' }
      ])
    ),
    priorityQuestion
  )
})

test('stops after three exact locked clarification questions', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' },
        { role: 'assistant', text: useQuestion },
        { role: 'assistant', text: priorityQuestion },
        { role: 'assistant', text: useQuestion }
      ])
    ),
    null
  )
})

test('does not count unrelated assistant questions toward the cap', () => {
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
    priorityQuestion
  )
})

test('normalizes decomposed Norwegian use cues', () => {
  assert.equal(
    resolveAssistantClarification(
      messages([{ role: 'user', text: 'BÅT' }])
    ),
    priorityQuestion
  )
})
