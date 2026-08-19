export default function HytteLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <article className='dark:bg-dark-background w-full min-w-0 overflow-x-clip scroll-smooth bg-background text-foreground antialiased'>
      {children}
    </article>
  )
}
