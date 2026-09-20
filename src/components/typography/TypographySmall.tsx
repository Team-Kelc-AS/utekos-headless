export function Small({ Text }: { Text: string }) {
  return (
    <p>
     <small className="text-sm leading-none font-sans font-semibold">{Text}</small>
  </p>
  )
}

