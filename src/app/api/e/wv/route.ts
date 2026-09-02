import { POST as handleWebVital } from '../../events/web-vital/route'

export const maxDuration = 60

export function POST(request: Request) {
  return handleWebVital(request)
}
