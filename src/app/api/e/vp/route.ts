import { POST as handleViewPromotion } from '../../events/view-promotion/route'

export const maxDuration = 60

export function POST(request: Request) {
  return handleViewPromotion(request)
}
