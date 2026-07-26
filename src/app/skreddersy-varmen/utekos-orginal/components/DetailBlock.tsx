export function DetailBlock({
  title,
  text
}: {
  title: string
  text: string
}) {
  return (
    <li>
      <h4 className='font-google-sans dark:text-dark-background mb-1 text-base font-bold text-background'>
        {title}
      </h4>
      <p className='leading-text-paragraph dark:text-dark-background/82 text-sm text-background/82 md:text-base'>
        {text}
      </p>
    </li>
  )
}
