export function shouldLoadGoogleTagManager(
  vercelEnvironment: string | undefined
): boolean {
  return (
    vercelEnvironment === 'production' ||
    vercelEnvironment === 'preview'
  )
}
