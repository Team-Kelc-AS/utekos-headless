export function parseAudienceCsv(
  input: string
): Record<string, string>[] {
  const text = input.replace(/^\uFEFF/, '')
  const delimiter =
    text.slice(0, text.indexOf('\n')).includes(';') ? ';' : ','
  const rows: string[][] = []
  let row: string[] = [],
    value = '',
    quoted = false,
    closed = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"'
        i++
      } else if (char === '"') {
        quoted = false
        closed = true
      } else value += char
    } else if (
      char === delimiter ||
      char === '\n' ||
      char === '\r'
    ) {
      row.push(value)
      value = ''
      closed = false
      if (char !== delimiter) {
        if (row.some(cell => cell.length > 0)) rows.push(row)
        row = []
        if (char === '\r' && text[i + 1] === '\n') i++
      }
    } else if (char === '"' && value === '' && !closed)
      quoted = true
    else {
      if (closed || char === '"')
        throw new Error('Invalid CSV quote')
      value += char
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote')
  if (value || row.length || closed) rows.push([...row, value])
  const headers =
    rows.shift()?.map(cell => cell.trim().toLowerCase()) ?? []
  if (
    !headers.length ||
    headers.some(x => !x) ||
    new Set(headers).size !== headers.length
  )
    throw new Error('Invalid CSV headers')
  return rows.map((cells, index) => {
    if (cells.length !== headers.length)
      throw new Error(
        `CSV column count mismatch at data row ${index + 1}`
      )
    return Object.fromEntries(
      headers.map((header, i) => [header, cells[i] ?? ''])
    )
  })
}
