export type CanonicalBeginCheckoutRouteDependencies = {
  collect: (request: Request) => Promise<Response>
}

export async function handleCanonicalBeginCheckoutRoute(
  request: Request,
  { collect }: CanonicalBeginCheckoutRouteDependencies
): Promise<Response> {
  return collect(request)
}