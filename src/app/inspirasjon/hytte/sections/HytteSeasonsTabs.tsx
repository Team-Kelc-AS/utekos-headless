import autumnVideo from '@/assets/videos/kaldt_vakkert.mp4'
import summerVideo from '@/assets/videos/lange_kvelder.mp4'
import springVideo from '@/assets/videos/spring.mp4'
import winterVideo from '@/assets/videos/varme.mp4'
import { Card, CardContent } from '@/components/ui/card'
import { HytteSeasonVideo } from './HytteSeasonVideo'
import { HytteSeasonsAnimator } from './HytteSeasonsAnimator'

const seasons = [
  {
    value: 'spring',
    label: 'Vår',
    videoSrc: springVideo
  },
  {
    value: 'summer',
    label: 'Sommer',
    videoSrc: summerVideo
  },
  {
    value: 'autumn',
    label: 'Høst',
    videoSrc: autumnVideo
  },
  {
    value: 'winter',
    label: 'Vinter',
    videoSrc: winterVideo
  }
] satisfies readonly {
  value: string
  label: string
  videoSrc: string
}[]

export function HytteSeasonsTabs() {
  return (
    <article className='w-full min-w-0 overflow-x-clip pb-12'>
      <HytteSeasonsAnimator
        className='mx-auto grid w-full max-w-[112rem] grid-cols-1 gap-x-6 gap-y-12 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16'
        itemClassName='group flex min-w-0 flex-col gap-4'
        seasonValues={seasons.map(season => season.value)}
      >
        {seasons.map(season => (
          <figure
            key={season.value}
            className='flex min-w-0 flex-col gap-4'
          >
            <Card
              size='sm'
              className='relative aspect-video w-full gap-0 overflow-hidden rounded-lg bg-card py-0 text-card-foreground shadow-none ring-0'
            >
              <CardContent className='h-full overflow-hidden p-0'>
                <HytteSeasonVideo src={season.videoSrc} />
              </CardContent>
            </Card>

            <figcaption className='dark:text-dark-muted-foreground font-google-sans font-(family-name:--font-google-sans) text-2xl leading-none font-bold tracking-normal text-muted-foreground sm:text-3xl'>
              {season.label}
            </figcaption>
          </figure>
        ))}
      </HytteSeasonsAnimator>
    </article>
  )
}
