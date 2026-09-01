type ClientLogContext = { pathname: string }

export type LogPayload =
  | {
      event: 'client_error'
      level: 'error'
      data: {
        source: 'window_error'
        message?: string
        filename?: string
        line?: number
        column?: number
      }
      context: ClientLogContext
    }
  | {
      event: 'client_unhandled_rejection'
      level: 'error'
      data: {
        source: 'unhandled_rejection'
        errorName?:
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
        message?: string
      }
      context: ClientLogContext
    }
