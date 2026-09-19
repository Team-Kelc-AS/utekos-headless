import { controlToolInputSchema } from './controlInput'

export type ControlModelContext = {
  registerTool: (
    definition: {
      name: string
      description: string
      inputSchema: typeof controlToolInputSchema
      annotations: {
        readOnlyHint: true
        untrustedContentHint: true
      }
      execute: (
        input: unknown,
        options?: { signal?: AbortSignal }
      ) => Promise<unknown>
    },
    options: { signal: AbortSignal }
  ) => Promise<void> | void
}

export async function registerControlTool(
  context: ControlModelContext,
  signal: AbortSignal,
  execute: (
    input: unknown,
    signal: AbortSignal
  ) => Promise<unknown>
) {
  signal.throwIfAborted()
  await context.registerTool(
    {
      name: 'canonical_event_context',
      description:
        'Read Utekos canonical event definitions, structural JSON Schema, provider mappings, parameter lineage and source pipeline in one call. No bootstrap required. Omit name/query for inventory. Requires the current authenticated operator session; read-only, no dispatch, replay or provider mutation. Source declarations are not live delivery evidence.',
      inputSchema: controlToolInputSchema,
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true
      },
      execute: async (input, options) => {
        signal.throwIfAborted()
        const execution =
          options?.signal === undefined ?
            signal
          : AbortSignal.any([signal, options.signal])
        execution.throwIfAborted()
        return execute(input, execution)
      }
    },
    { signal }
  )
}
