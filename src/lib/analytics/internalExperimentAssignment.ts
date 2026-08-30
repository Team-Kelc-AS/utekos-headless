import type { CanonicalExperimentAssignment } from './experimentAssignment'

type ExperimentCompatibleEvent = {
  experiment?: CanonicalExperimentAssignment | undefined
}

export function stripInternalExperimentAssignment<
  E extends ExperimentCompatibleEvent
>(event: E): E {
  const nextEvent = { ...event }
  delete nextEvent.experiment
  return nextEvent
}
