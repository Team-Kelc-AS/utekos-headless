'use client'

import { createContext } from 'react'

export type CartBootstrapStatus = 'pending' | 'ready'

export const CartBootstrapContext =
  createContext<CartBootstrapStatus>('pending')
