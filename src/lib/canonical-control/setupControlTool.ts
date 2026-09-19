import {
  registerControlTool,
  type ControlModelContext
} from './registerControlTool'

export async function setupControlTool(
  context: ControlModelContext | undefined,
  signal: AbortSignal,
  execute: (
    input: unknown,
    signal: AbortSignal
  ) => Promise<unknown>
) {
  if (!context?.registerTool)
    return 'Nettleseren tilbyr ikke native WebMCP. Vanlig søk fungerer.'
  await registerControlTool(context, signal, execute)
  return 'canonical_event_context er registrert. Agenttilkobling må støtte WebMCP.'
}
