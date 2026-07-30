import type { ActorRefFrom, EventFrom } from 'xstate'
import type { CartMutationMachine } from '@/lib/context/CartMutationContext'

export const waitForMutation = (
  event: EventFrom<CartMutationMachine>,
  actor: ActorRefFrom<CartMutationMachine>
): Promise<void> => {
  return new Promise(resolve => {
    let isInitial = true
    const sub = actor.subscribe(snapshot => {
      if (isInitial) {
        isInitial = false
        return
      }
      if (snapshot.matches('idle')) {
        sub.unsubscribe()
        resolve()
      }
    })
    actor.send(event)
  })
}
