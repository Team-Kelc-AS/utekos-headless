// Path: src/lib/state/createCartMutationMachine.ts
import {
  assign,
  fromPromise,
  setup,
  type ErrorActorEvent
} from 'xstate'
import { extractCartErrorMessage } from '@/lib/errors/extractCartErrorMessage'
import type {
  Cart,
  CartActions,
  CartActionsResult,
  CartMutationContext,
  CartMutationEvent
} from 'types/cart'

export const createCartMutationMachine = (
  serverActions: CartActions,
  adoptCart: (cart: Cart) => void
) =>
  setup({
    types: {
      context: {} as CartMutationContext,
      events: {} as CartMutationEvent
    },
    actors: {
      cartMutator: fromPromise<
        CartActionsResult,
        CartMutationEvent
      >(async ({ input: event }) => {
        switch (event.type) {
          case 'ADD_LINES': {
            let lines: { variantId: string; quantity: number }[]
            let discountCode: string | undefined

            if (Array.isArray(event.input)) {
              lines = event.input
              discountCode = undefined
            } else {
              lines = event.input.lines
              discountCode = event.input.discountCode
            }

            return serverActions.addCartLine(lines, discountCode)
          }

          case 'UPDATE_LINE':
            return serverActions.updateCartLineQuantity(
              event.input
            )

          case 'REMOVE_LINE':
            return serverActions.removeCartLine(event.input)

          case 'CLEAR':
            return serverActions.clearCart()

          default:
            throw new Error(
              'Unhandled event type in cartMutator'
            )
        }
      })
    }
  }).createMachine({
    id: 'CartMutation',
    initial: 'idle',
    context: { error: null, lastResult: null },
    states: {
      idle: {
        entry: assign({ error: null }),
        on: { '*': 'mutating' }
      },
      mutating: {
        entry: assign({ error: null, lastResult: null }),
        invoke: {
          src: 'cartMutator',
          input: ({ event }) => event as CartMutationEvent,
          onDone: [
            {
              guard: ({ event }) => !event.output.success,
              target: 'idle',
              actions: assign({
                error: ({ event }) =>
                  event.output.message ||
                  'En uventet feil oppstod',
                lastResult: ({ event }) => event.output
              })
            },
            {
              target: 'idle',
              actions: [
                assign({
                  error: null,
                  lastResult: ({ event }) => event.output
                }),
                ({ event }) => {
                  const newCart = event.output.cart

                  if (newCart?.id) {
                    adoptCart(newCart)
                  }
                }
              ]
            }
          ],
          onError: {
            target: 'idle',
            actions: assign({
              error: ({ event }: { event: ErrorActorEvent }) => {
                try {
                  const serverActionResult =
                    event.error as CartActionsResult

                  if (serverActionResult?.message) {
                    return serverActionResult.message
                  }

                  return extractCartErrorMessage(event.error)
                } catch (extractionError) {
                  console.error(
                    'Error extracting cart error message:',
                    extractionError
                  )

                  return 'En uventet feil oppstod under behandling av handlekurven'
                }
              },
              lastResult: null
            })
          }
        }
      }
    }
  })
