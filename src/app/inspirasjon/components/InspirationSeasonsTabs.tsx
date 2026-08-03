'use client'

import { useState } from 'react'
import {
  Anchor,
  Check,
  CloudRain,
  Fish,
  Flame,
  GlassWater,
  Leaf,
  LifeBuoy,
  Mountain,
  Snowflake,
  Sun,
  Sunrise,
  Wind,
  type LucideIcon
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { cn } from '@/lib/utils/className'
import { H3 } from '@/components/typography/TypographyH3'
import { P } from '@/components/typography/TypographyP'
import type {
  InspirationSeasonDefinition,
  InspirationSeasonIconName
} from '../theme/seasons'

const inspirationSeasonIcons = {
  Anchor,
  CloudRain,
  Fish,
  Flame,
  GlassWater,
  Leaf,
  LifeBuoy,
  Mountain,
  Snowflake,
  Sun,
  Sunrise,
  Wind
} satisfies Record<InspirationSeasonIconName, LucideIcon>

function getSeasonIcon(
  iconName: InspirationSeasonIconName
): LucideIcon {
  return inspirationSeasonIcons[iconName]
}

interface InspirationSeasonsTabsProps {
  seasons: readonly InspirationSeasonDefinition[]
  defaultValue: string
  /** pill: kompakt (isbading). rounded: full tabs (bobil/grill/båt/terrasse) */
  variant?: 'pill' | 'rounded'
  showTips?: boolean
  tabTriggerClassName?: string
  tabActiveClassName?: string
  tabInactiveClassName?: string
  contentCardClassName?: string
  contentIconClassName?: string
  contentIconGlyphClassName?: string
  contentTitleClassName?: string
  contentTextClassName?: string
  showTabGlow?: boolean
  showCardGlow?: boolean
}

export function InspirationSeasonsTabs({
  seasons,
  defaultValue,
  variant = 'rounded',
  showTips = false,
  tabTriggerClassName,
  tabActiveClassName,
  tabInactiveClassName,
  contentCardClassName,
  contentIconClassName,
  contentIconGlyphClassName,
  contentTitleClassName,
  contentTextClassName,
  showTabGlow = true,
  showCardGlow = true
}: InspirationSeasonsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const listClassName =
    variant === 'pill' ?
      'group-data-[orientation=horizontal]/tabs:h-auto grid w-full grid-cols-2 gap-2 bg-transparent p-1 sm:grid-cols-4'
    : 'group-data-[orientation=horizontal]/tabs:h-auto grid w-full grid-cols-2 gap-3 bg-transparent p-0 sm:grid-cols-4'

  const roundedTriggerLayoutClassName =
    'inspiration-seasons-tab-trigger relative flex !h-auto min-h-20 w-full flex-col items-center justify-center overflow-hidden rounded-xl border-none px-3 py-3 transition-all duration-300'

  const roundedTriggerClassName =
    'inspiration-seasons-tab-trigger relative flex !h-auto min-h-20 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-foreground/12 bg-background/58 px-3 py-3 transition-all duration-300 hover:border-foreground/28 hover:bg-background/72 data-active:border-foreground/24 data-active:bg-primary data-active:text-background dark:bg-dark-background/58 dark:hover:bg-dark-background/72 dark:data-active:bg-dark-primary dark:data-active:text-dark-background'

  const pillTriggerClassName =
    'relative flex !h-auto w-full items-center justify-center overflow-hidden rounded-lg border border-foreground/12 bg-background/58 px-3 py-3 transition-all duration-300 hover:border-foreground/28 data-active:border-foreground/18 data-active:bg-background data-active:text-foreground dark:bg-dark-background/58 dark:data-active:bg-dark-background'

  const triggerBaseClassName =
    variant === 'pill' ? pillTriggerClassName
    : tabTriggerClassName ? roundedTriggerLayoutClassName
    : roundedTriggerClassName

  return (
    <Tabs
      defaultValue={defaultValue}
      className='mx-auto flex w-full max-w-5xl flex-col gap-6'
      onValueChange={setActiveTab}
    >
      <TabsList className={listClassName}>
        {seasons.map(season => {
          const Icon = getSeasonIcon(season.iconName)
          const isActive = activeTab === season.value
          const activeClassName =
            tabActiveClassName ?? 'text-foreground'
          const inactiveClassName =
            tabInactiveClassName ?? 'text-ancient-water'

          return (
            <TabsTrigger
              key={season.value}
              value={season.value}
              className={cn(triggerBaseClassName, tabTriggerClassName)}
            >
              {isActive && showTabGlow ?
                <div
                  className='inspiration-seasons-active-glow'
                  style={{
                    background: `radial-gradient(120% 120% at 50% 0%, transparent 30%, ${season.glowColor} 100%)`
                  }}
                />
              : null}

              <div
                className={
                  variant === 'pill' ?
                    'relative z-10 flex items-center justify-center gap-2 py-1'
                  : 'relative z-10 flex flex-col items-center justify-center gap-1.5 sm:flex-row sm:gap-2'
                }
              >
                <Icon
                  className={cn(
                    'size-5 transition-colors',
                    variant === 'pill' ?
                      isActive ? season.iconColor
                      : 'dark:text-dark-muted-foreground text-muted-foreground'
                    : isActive ? activeClassName
                    : inactiveClassName
                  )}
                />
                <span
                  className={cn(
                    'transition-colors',
                    variant === 'pill' ?
                      [
                        'hidden font-medium sm:inline',
                        isActive ?
                          'text-foreground'
                        : 'dark:text-dark-muted-foreground text-muted-foreground'
                      ]
                    : [
                        'font-google-sans font-sans font-bold tracking-[-0.01em]',
                        isActive ? activeClassName : (
                          inactiveClassName
                        )
                      ]
                  )}
                >
                  {season.label}
                </span>
              </div>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {seasons.map(season => {
        const Icon = getSeasonIcon(season.iconName)
        const bodyText = season.description ?? season.intro ?? ''

        return (
          <TabsContent
            key={season.value}
            value={season.value}
            className='mt-0 w-full min-w-0 data-ending-style:hidden'
          >
            <div className='inspiration-seasons-tab-content-enter'>
              <Card
                className={cn(
                  'dark:bg-dark-background/58 relative overflow-hidden rounded-2xl border-foreground/12 bg-background/58 py-0',
                  contentCardClassName
                )}
              >
                {showCardGlow ?
                  <div
                    className='absolute -inset-x-2 -inset-y-16 opacity-20 blur-3xl'
                    style={{
                      background: `radial-gradient(120% 120% at 50% 0%, transparent 30%, ${season.glowColor} 100%)`
                    }}
                  />
                : null}

                <CardContent
                  className={
                    showTips ?
                      'relative grid gap-8 bg-inherit p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12 lg:p-10'
                    : 'relative bg-inherit p-6 sm:p-8 lg:p-10'
                  }
                >
                  <div>
                    <div className='mb-5 flex items-center gap-4'>
                      <div
                        className={cn(
                          'dark:bg-dark-background flex size-12 shrink-0 items-center justify-center rounded-xl border border-foreground/18 bg-background transition-shadow duration-300',
                          contentIconClassName
                        )}
                        style={
                          showCardGlow ?
                            {
                              boxShadow: `0 0 20px ${season.glowColor}20`
                            }
                          : undefined
                        }
                      >
                        <Icon
                          className={cn(
                            'size-6',
                            contentIconGlyphClassName ??
                              season.iconColor
                          )}
                        />
                      </div>
                      <H3
                        className={cn(
                          'pb-0 text-2xl leading-none text-foreground sm:text-3xl',
                          contentTitleClassName
                        )}
                      >
                        {season.hasBrandTitle ?
                          <span className='inline-flex flex-wrap items-baseline gap-x-2'>
                            <span>{season.title}</span>
                            <UtekosWordmark className='h-[0.74em] w-auto translate-y-[0.05em]' />
                          </span>
                        : season.title}
                      </H3>
                    </div>
                    <P
                      className={cn(
                        'text-left text-lg leading-relaxed text-ancient-water not-first:mt-0',
                        contentTextClassName
                      )}
                    >
                      {bodyText}
                    </P>
                  </div>

                  {showTips && season.tips ?
                    <ul className='grid gap-3'>
                      {season.tips.map((tip, index) => (
                        <li
                          key={index}
                          className='inspiration-seasons-tip-enter dark:bg-dark-background/36 flex items-start gap-3 rounded-xl border border-foreground/10 bg-background/36 p-4'
                          style={{
                            animationDelay: `${index * 0.1}s`
                          }}
                        >
                          <div className='dark:bg-dark-background mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-foreground/18 bg-background'>
                            <Check
                              className={`size-4 ${season.iconColor}`}
                            />
                          </div>
                          <span className='leading-text-paragraph text-ancient-water'>
                            {tip}
                          </span>
                        </li>
                      ))}
                    </ul>
                  : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
