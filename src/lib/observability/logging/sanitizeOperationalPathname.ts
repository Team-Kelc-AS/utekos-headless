import { operationalRoute } from '../../../../supabase/functions/_shared/operational-route'

export function sanitizeOperationalPathname(
  value: string
): string {
  try {
    return operationalRoute(
      new URL(value, 'https://utekos.no').pathname
    )
  } catch {
    return '/:other'
  }
}
