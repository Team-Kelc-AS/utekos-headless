export function DetailBlock({
  title,
  text
}: {
  title: string
  text: string
}) {
  return (
    <li>
      <h4 className='mb-1 font-sans text-base font-bold text-foreground'>
        {title}
      </h4>
      <p className='leading-text-paragraph text-sm text-foreground md:text-base'>
        {text}
      </p>
    </li>
  )
}
