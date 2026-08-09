export const ABANDONED_CHECKOUT_RECOVERY_DESIGN_PREVIEW_TIMELINE = [
  { step: 1, elapsedMs: 0 },
  { step: 2, elapsedMs: 15_000 },
  { step: 3, elapsedMs: 30_000 }
] as const

export type AbandonedCheckoutRecoveryDesignPreviewFrame =
  (typeof ABANDONED_CHECKOUT_RECOVERY_DESIGN_PREVIEW_TIMELINE)[number]

type DesignPreviewDependencies = {
  wait: (durationMs: number) => Promise<void>
  renderFrame: (
    frame: AbandonedCheckoutRecoveryDesignPreviewFrame
  ) => Promise<void>
}

const wait = (durationMs: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, durationMs)
  })

export async function runAbandonedCheckoutRecoveryDesignPreview(
  dependencies: Partial<DesignPreviewDependencies> &
    Pick<DesignPreviewDependencies, 'renderFrame'>
): Promise<void> {
  const waitFor = dependencies.wait ?? wait
  let elapsedMs = 0

  for (const frame of ABANDONED_CHECKOUT_RECOVERY_DESIGN_PREVIEW_TIMELINE) {
    const waitDurationMs = frame.elapsedMs - elapsedMs

    if (waitDurationMs > 0) {
      await waitFor(waitDurationMs)
    }

    await dependencies.renderFrame(frame)
    elapsedMs = frame.elapsedMs
  }
}
