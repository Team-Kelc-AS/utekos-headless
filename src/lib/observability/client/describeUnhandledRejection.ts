function isErrorReason(value: unknown): value is Error {
  try {
    return value instanceof Error
  } catch {
    return false
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
} {
  void _promise

  return {
    reasonType: reason === null ? 'null' : typeof reason,
    reasonIsError: isErrorReason(reason)
  }
}
