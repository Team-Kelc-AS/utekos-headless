export type CanonicalViewItemRouteDependencies = {
  collect: (request: Request) => Promise<Response>
}

export async function handleCanonicalViewItemRoute(
  request: Request,
  { collect }: CanonicalViewItemRouteDependencies
): Promise<Response> {
  return collect(request)
}