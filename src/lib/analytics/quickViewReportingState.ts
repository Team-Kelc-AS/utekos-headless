export type QuickViewReportingState = {
  isOpen: boolean
  openSequence: number
  reportedCurrentOpen: boolean
}

export const initialQuickViewReportingState: QuickViewReportingState = {
  isOpen: false,
  openSequence: 0,
  reportedCurrentOpen: false
}

export function advanceQuickViewReportingState(
  state: QuickViewReportingState,
  input: { isOpen: boolean; isResolved: boolean }
): {
  nextState: QuickViewReportingState
  reportSequence: number | null
} {
  if (!input.isOpen) {
    return {
      nextState: {
        ...state,
        isOpen: false,
        reportedCurrentOpen: false
      },
      reportSequence: null
    }
  }

  const nextState: QuickViewReportingState =
    state.isOpen ?
      { ...state }
    : {
        isOpen: true,
        openSequence: state.openSequence + 1,
        reportedCurrentOpen: false
      }

  if (!input.isResolved || nextState.reportedCurrentOpen) {
    return { nextState, reportSequence: null }
  }

  return {
    nextState: { ...nextState, reportedCurrentOpen: true },
    reportSequence: nextState.openSequence
  }
}
