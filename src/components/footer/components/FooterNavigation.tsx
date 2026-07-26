// Path: src/components/footer/FooterNavigation.tsx
import { footerConfig } from '@/db/config/footer.config'
import Link from 'next/link'

export function FooterNavigation() {
  return (
    <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
      {footerConfig.map(section => (
        <div key={section.title}>
          <h3 className='mb-4 font-utekos-text-medium text-lg'>
            {section.title}
          </h3>
          <nav aria-label={`${section.title} navigasjon`}>
            <ul className='space-y-2'>
              {section.links.map(link => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className='dark:hover:text-dark-foreground font-utekos-text text-base transition-colors hover:text-foreground'
                    {...(link.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer'
                    })}
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ))}
    </div>
  )
}
