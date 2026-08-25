"use client"

import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const components: { title: string; href: Route; description: string }[] = [
  {
    title: "Utekos Dun™",
    href: "/produkter/utekos-dun" as Route,
    description:
      "NOK 2490,-",
  },
  {
    title: "Utekos TechDown™",
    href: "/produkter/utekos-techdown?farge=havdyp&storrelse=middels&kjonn=unisex" as Route,
    description:
      "NOK 1990,-",
  },
  {
    title: "Utekos Mikrofiber™",
    href: "/produkter/utekos-techdown?farge=havdyp&storrelse=stor&kjonn=unisex" as Route,
    description:
      "NOK 1790,-",
  },
  {
    title: "Comfyrobe™",
    href: "/produkter/utekos-techdown?farge=havdyp&storrelse=storre&kjonn=unisex" as Route,
    description: "NOK 899,-",
  }
]

const mikrofiberMediumHref =
  '/produkter/utekos-mikrofiber?farge=fjellbla&storrelse=medium&kjonn=unisex' as Route
const mikrofiberLargeHref =
  '/produkter/utekos-mikrofiber?farge=fjellbla&storrelse=large&kjonn=unisex' as Route

export function ProductNavigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Utekos Dun™</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-100 gap-2 md:w-125 md:grid-cols-2 lg:w-150">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuTrigger>Utekos TechDown</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-100 gap-2 md:w-125 md:grid-cols-2 lg:w-150">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Utekos Mikrofiber</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-50">
              <li>
                <NavigationMenuLink
                  render={
                    <Link
                      href={mikrofiberMediumHref}
                      className="flex-row items-center gap-2"
                    >
                      <CircleAlertIcon />
                      Fjellblå Medium
                    </Link>
                  }
                />
                <NavigationMenuLink
                  render={
                    <Link
                      href={mikrofiberLargeHref}
                      className="flex-row items-center gap-2"
                    >
                      <CircleDashedIcon />
                      Fjellblå Large
                    </Link>
                  }
                />
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="/produkter/utekos-dun">Utekos Dun</Link>} />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: Route }) {
  return (
    <li {...props}>
      <NavigationMenuLink render={<Link href={href}><div className="flex flex-col gap-1 text-sm">
          <div className="leading-none font-medium">{title}</div>
          <div className="line-clamp-2 text-muted-foreground">{children}</div>
        </div></Link>} />
    </li>
  )
}
