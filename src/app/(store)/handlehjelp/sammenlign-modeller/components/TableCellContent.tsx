export function TableCellContent({
  value
}: {
  value: string | boolean
}) {
  return (
    <span>
      {typeof value === 'boolean' ?
        value ?
          'Ja'
        : 'Nei'
      : value}
    </span>
  )
}
