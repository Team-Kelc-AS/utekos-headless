export function List({ Text1, Text2, Text3 }: { Text1: string, Text2: string, Text3: string }) {
  return (
    <ul className="my-6 ml-6 font-sans list-disc [&>li]:mt-2">
      <li>{Text1}</li>
      <li>{Text2}</li>
      <li>{Text3}</li>
    </ul>
  )
}
