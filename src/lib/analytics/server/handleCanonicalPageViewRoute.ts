export type CanonicalPageViewRouteDependencies = {
  collect: (request: Request) => Promise<Response>
}

export async function handleCanonicalPageViewRoute(
  request: Request,
  { collect }: CanonicalPageViewRouteDependencies
): Promise<Response> {
  return collect(request)
}