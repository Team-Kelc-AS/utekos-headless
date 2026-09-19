import { config } from 'zod/mini'
import en from 'zod/v4/locales/en.js'

// Match classic Zod's default messages without importing the locale registry.
config(en())

export * from 'zod/mini'
