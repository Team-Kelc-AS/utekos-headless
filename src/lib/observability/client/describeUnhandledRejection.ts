function isErrorReason(value: unknown): value is Error {
  try {
    return value instanceof Error
  } catch {
    return false
  }
}

const SAFE_ERROR_NAMES = new Set([
  'AbortError',
  'AggregateError',
  'DOMException',
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TimeoutError',
  'TypeError',
  'URIError',
  'ZodError'
])

export type SafeUnhandledRejectionErrorName =
  | 'AbortError'
  | 'AggregateError'
  | 'DOMException'
  | 'Error'
  | 'EvalError'
  | 'OtherError'
  | 'RangeError'
  | 'ReferenceError'
  | 'SyntaxError'
  | 'TimeoutError'
  | 'TypeError'
  | 'URIError'
  | 'ZodError'

function safeErrorName(
  error: Error
): SafeUnhandledRejectionErrorName {
  try {
    return SAFE_ERROR_NAMES.has(error.name) ?
        (error.name as SafeUnhandledRejectionErrorName)
      : 'OtherError'
  } catch {
    return 'OtherError'
  }
}

export function describeUnhandledRejection(
  reason: unknown,
  _promise: Promise<unknown> | undefined
): {
  reasonType:
    | 'bigint'
    | 'boolean'
    | 'function'
    | 'null'
    | 'number'
    | 'object'
    | 'string'
    | 'symbol'
    | 'undefined'
  reasonIsError: boolean
  errorName?: SafeUnhandledRejectionErrorName
} {
  void _promise

  const reasonIsError = isErrorReason(reason)

  return {
    reasonType: reason === null ? 'null' : typeof reason,
    reasonIsError,
    ...(reasonIsError ? { errorName: safeErrorName(reason) } : {})
  }
}
