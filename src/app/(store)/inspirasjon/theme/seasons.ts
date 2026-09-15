export type InspirationSeasonIconName =
  | 'Anchor'
  | 'CloudRain'
  | 'Fish'
  | 'Flame'
  | 'GlassWater'
  | 'Leaf'
  | 'LifeBuoy'
  | 'Mountain'
  | 'Snowflake'
  | 'Sun'
  | 'Sunrise'
  | 'Wind'

export interface InspirationSeasonDefinition {
  value: string
  label: string
  iconName: InspirationSeasonIconName
  iconColor: string
  glowColor: string
  title: string
  description?: string
  intro?: string
  tips?: readonly string[]
  hasBrandTitle?: boolean
}
