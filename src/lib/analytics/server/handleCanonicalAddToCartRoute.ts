export type CanonicalAddToCartRouteDependencies = {
  collect: (request: Request) => Promise<Response>
}

export async function handleCanonicalAddToCartRoute(
  request: Request,
  { collect }: CanonicalAddToCartRouteDependencies
): Promise<Response> {
  return collect(request)
}
