import { handleMetaNonWebEventRequest } from '@/lib/analytics/server/handleMetaNonWebEventRequest'

export const maxDuration = 60

export async function POST(request: Request) {
  return handleMetaNonWebEventRequest(request)
}
