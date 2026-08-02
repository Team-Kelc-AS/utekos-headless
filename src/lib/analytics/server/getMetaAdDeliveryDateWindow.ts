function formatDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric'
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map(part => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

export function getMetaAdDeliveryDateWindow(
  now: Date,
  accountTimezone: string
) {
  const localToday = formatDateInTimeZone(now, accountTimezone)
  const untilDate = new Date(`${localToday}T00:00:00.000Z`)
  untilDate.setUTCDate(untilDate.getUTCDate() - 1)
  const until = untilDate.toISOString().slice(0, 10)
  const sinceDate = new Date(untilDate)
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 6)

  return {
    since: sinceDate.toISOString().slice(0, 10),
    until
  }
}
