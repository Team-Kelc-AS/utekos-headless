'use client'

import { createContext } from 'react'

// React context also reaches the body portal. It gates presentation only.
export const StickyCTAEntranceContext = createContext(true)
