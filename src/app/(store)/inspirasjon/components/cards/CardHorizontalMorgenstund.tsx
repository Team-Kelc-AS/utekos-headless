import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle
} from './Card'

export function CardHorizontalMorgenstund() {
  return (
    <Card
      size='sm'
      className='mt-4 w-full min-w-0 overflow-hidden bg-card  px-2 py-4 md:px-4 md:py-6 lg:aspect-video'
    >
      <div className='w-full min-w-0'>
        <CardHeader className='pt-2'>
          <CardTitle>Morgenstund</CardTitle>
          <CardDescription className='pb-2'>
            Nyt morgenkaffen ute i frisk fjellluft.
          </CardDescription>
        </CardHeader>
      </div>
    </Card>
  )
}
