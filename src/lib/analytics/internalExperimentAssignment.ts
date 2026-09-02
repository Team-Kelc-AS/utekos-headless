import type { CanonicalExperimentAssignment } from './experimentAssignment'

type ExperimentCompatibleEvent = {
  experiment?: CanonicalExperimentAssignment | undefined
}

export function stripInternalExperimentAssignment<
  E extends object
>(event: E): E {
  const nextEvent: E & ExperimentCompatibleEvent = { ...event }
  delete nextEvent.experiment
  return nextEvent
}
