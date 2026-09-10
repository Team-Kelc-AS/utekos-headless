export function POST() {
  return Response.json(
    {
      error: 'observation_retired',
      reason: 'operational_data_must_not_link_visitors'
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    }
  )
}
