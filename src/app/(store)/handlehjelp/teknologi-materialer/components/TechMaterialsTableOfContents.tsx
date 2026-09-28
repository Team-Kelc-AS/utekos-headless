const tableOfContentsEntries = [
  { href: '#utekos-techdown', label: 'Utekos TechDown™' },
  { href: '#utekos-dun', label: 'Utekos Dun™' },
  { href: '#utekos-mikrofiber', label: 'Utekos Mikrofiber™' },
  { href: '#comfyrobe', label: 'Comfyrobe™' },
  {
    href: '#konstruksjon-og-funksjonalitet',
    label: 'Konstruksjon og funksjonalitet'
  }
] as const

export function TechMaterialsTableOfContents() {
  return (
    <nav
      data-tech-materials-toc
      aria-labelledby='innhold'
      className='mb-10 rounded-2xl border border-foreground/12 bg-jungle p-5 md:p-6'
    >
      <h2
        id='innhold'
        className='font-sans text-xl font-extrabold tracking-tight text-foreground md:text-2xl'
      >
        Innhold
      </h2>
      <ol className='mt-4 grid list-none grid-cols-1 gap-x-8 p-0 sm:grid-cols-2 xl:grid-cols-1 xl:gap-x-0'>
        {tableOfContentsEntries.map(entry => (
          <li
            key={entry.href}
            className='border-t border-foreground/12 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 xl:[&:nth-child(2)]:border-t'
          >
            <a
              href={entry.href}
              className='flex min-h-12 items-center py-3 font-sans text-base leading-snug font-medium text-foreground no-underline transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-jungle focus-visible:outline-none'
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
