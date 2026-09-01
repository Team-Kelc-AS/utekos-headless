import { handleProductGet } from './handleProductGet'

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  return handleProductGet(request, context)
}
