import type { ActorRef, AnyMachineSnapshot, EventObject } from 'xstate'

export function createMutationPromise<
  TSnapshot extends AnyMachineSnapshot,
  TEvent extends EventObject
>(event: TEvent, actor: ActorRef<TSnapshot, TEvent>): Promise<TSnapshot> {
  return new Promise(resolve => {
    let isInitialEmission = true
    const subscription = actor.subscribe(snapshot => {
      if (isInitialEmission) {
        isInitialEmission = false
        return
      }
      if (snapshot.matches('idle')) {
        subscription.unsubscribe()
        resolve(snapshot)
      }
    })
    actor.send(event)
  })
}
