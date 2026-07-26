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
  'Hvor ser du først og fremst for deg å bruke plagget – for eksempel på hytten, i båten, i bobilen eller i hverdagen?'

const priorityQuestion =
  'Hva er viktigst for deg: mest mulig varme, lav vekt, værbeskyttelse eller enkelt vedlikehold?'

const askUse = {
  kind: 'ask',
  category: 'use',
  question: useQuestion
} as const

const askPriority = {
  kind: 'ask',
  category: 'priority',
  question: priorityQuestion
} as const

test('asks for a use case when no use cue is recognized', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe varmt.' }
      ])
    ),
    askUse
  )
})

test('recommends once one profile has two cues before asking for use', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        {
          role: 'user',
          text: 'Jeg trenger mest varme per gram.'
        }
      ])
    ),
    { kind: 'ready' }
  )
})

test('asks for a weather or priority when only a use cue is recognized', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' }
      ])
    ),
    askPriority
  )
})

test('uses all active user text and stops once a profile has two cues', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' },
        { role: 'assistant', text: priorityQuestion },
        { role: 'user', text: 'Det blir ofte fukt.' }
      ])
    ),
    { kind: 'ready' }
  )
})

test('continues clarification when cues belong to different profiles', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt i regn.' }
      ])
    ),
    askPriority
  )
})

test('stops after three exact locked clarification questions', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger noe til båt.' },
        { role: 'assistant', text: useQuestion },
        { role: 'assistant', text: priorityQuestion },
        { role: 'assistant', text: useQuestion }
      ])
    ),
    { kind: 'exhausted' }
  )
})

test('does not count unrelated assistant questions toward the cap', () => {
  assert.deepEqual(
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
    askPriority
  )
})

test('normalizes decomposed Norwegian use cues', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([{ role: 'user', text: 'BÅT' }])
    ),
    askPriority
  )
})

test('uses the shared matcher for explicit Norwegian cue forms', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([{ role: 'user', text: 'Jeg skal på hyttetur.' }])
    ),
    askPriority
  )
})

test('recognizes every offered use answer and normal inflections without repeating use', () => {
  for (const answer of [
    'på hytta',
    'på hytten',
    'på hyttetur',
    'i båten',
    'på båttur',
    'i bobilen',
    'med bobiler',
    'i hverdagen',
    'til hverdagsbruk'
  ]) {
    assert.deepEqual(
      resolveAssistantClarification(
        messages([{ role: 'user', text: answer }])
      ),
      askPriority,
      answer
    )
  }
})

test('recognizes every offered priority answer and normal inflections without repeating priority', () => {
  for (const answer of [
    'mest mulig varme',
    'mest varme',
    'lav vekt',
    'lavere vekt',
    'værbeskyttelse',
    'værbeskyttet',
    'enkelt vedlikehold',
    'enkel å vedlikeholde'
  ]) {
    assert.deepEqual(
      resolveAssistantClarification(
        messages([{ role: 'user', text: answer }])
      ),
      askUse,
      answer
    )
  }
})

test('never repeats a category the user has already answered', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg vil ha lav vekt.' },
        { role: 'assistant', text: useQuestion },
        { role: 'user', text: 'Til hverdagsbruk.' }
      ])
    ),
    { kind: 'exhausted' }
  )
})

test('distinguishes an exhausted clarification budget from recommendation readiness', () => {
  assert.deepEqual(
    resolveAssistantClarification(
      messages([
        { role: 'user', text: 'Jeg trenger hjelp.' },
        { role: 'assistant', text: useQuestion },
        { role: 'user', text: 'I båten.' },
        { role: 'assistant', text: priorityQuestion },
        { role: 'user', text: 'Lav vekt.' },
        { role: 'assistant', text: useQuestion },
        { role: 'user', text: 'Det er alt.' }
      ])
    ),
    { kind: 'exhausted' }
  )
})
