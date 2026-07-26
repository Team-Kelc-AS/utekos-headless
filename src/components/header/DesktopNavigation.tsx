// Path: src/components/header/DesktopNavigation.tsx
import { ActiveLink } from './ActiveLink'
import { ListItem } from './ListItem'
import {
  InteractiveNavContent,
  InteractiveNavItem,
  InteractiveNavList,
  InteractiveNavMenu,
  InteractiveNavTrigger
} from '@/components/header/InteractiveNavigation'
import { normalizeShopifyUrl } from '@/lib/helpers/normalizers/normalizeShopifyUrl'
import type { MenuItem } from '@types'

export const DesktopNavigation = ({
  menu = []
}: {
  menu?: MenuItem[]
}) => {
  const desktopNavTextClassName =
    'h-10 px-4 text-base font-utekos-text-medium text-foreground  hover:bg-accent dark:hover:bg-dark-accent hover:text-accent-foreground  focus-visible:ring-ring dark:focus-visible:ring-dark-ring data-[state=open]:bg-accent dark:data-[state=open]:bg-dark-accent data-[state=open]:text-accent-foreground dark:data-[state=open]:text-dark-accent-foreground xl:h-11 xl:text-lg'

  return (
    <nav
      aria-label='Hovednavigasjon'
      className='pointer-events-auto hidden lg:block'
    >
      <InteractiveNavMenu>
        <InteractiveNavList>
          {menu.map(item => {
            const href = normalizeShopifyUrl(item.url)
            const hasSubMenu =
              item.items && item.items.length > 0

            return (
              <InteractiveNavItem key={item.title}>
                {hasSubMenu ?
                  <>
                    <InteractiveNavTrigger
                      className={desktopNavTextClassName}
                    >
                      {item.title}
                    </InteractiveNavTrigger>
                    <InteractiveNavContent className='text-foreground'>
                      <ul className='grid w-105 gap-1.5 md:w-130 md:grid-cols-2 lg:w-160'>
                        {item.items?.map(subItem => (
                          <ListItem
                            key={subItem.url}
                            href={normalizeShopifyUrl(
                              subItem.url
                            )}
                            title={subItem.title}
                            data-track={`HeaderDesktopSub_${subItem.title}`}
                          />
                        ))}
                      </ul>
                    </InteractiveNavContent>
                  </>
                : <ActiveLink
                    href={href}
                    className={desktopNavTextClassName}
                    data-track={`HeaderDesktop_${item.title}`}
                  >
                    {item.title}
                  </ActiveLink>
                }
              </InteractiveNavItem>
            )
          })}
        </InteractiveNavList>
      </InteractiveNavMenu>
    </nav>
  )
}
