import 'server-only'

import { ServerEvent } from 'facebook-nodejs-business-sdk'

type MetaPayloadExtensions = {
  appData?: Record<string, unknown> | undefined
  topLevel?: Record<string, unknown> | undefined
  userData?: Record<string, unknown> | undefined
}

export class ExactMetaServerEvent extends ServerEvent {
  readonly #extensions: MetaPayloadExtensions

  constructor(extensions: MetaPayloadExtensions = {}) {
    super()
    this.#extensions = extensions
  }

  override normalize(): Record<string, unknown> {
    const normalized = super.normalize() as Record<
      string,
      unknown
    >
    const normalizedUserData =
      (
        normalized.user_data &&
        typeof normalized.user_data === 'object' &&
        !Array.isArray(normalized.user_data)
      ) ?
        (normalized.user_data as Record<string, unknown>)
      : {}

    return {
      ...normalized,
      ...this.#extensions.topLevel,
      ...(this.#extensions.userData ?
        {
          user_data: {
            ...normalizedUserData,
            ...this.#extensions.userData
          }
        }
      : {}),
      ...(this.#extensions.appData ?
        { app_data: this.#extensions.appData }
      : {})
    }
  }
}
