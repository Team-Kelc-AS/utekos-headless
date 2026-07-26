type ClientLogContext = { pathname: string }

export type LogPayload =
  | {
      event: 'client_error'
      level: 'error'
      data: {
        source: 'window_error'
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
      }
      context: ClientLogContext
    }
