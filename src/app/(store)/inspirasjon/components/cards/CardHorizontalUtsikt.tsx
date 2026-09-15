import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle
} from './Card'

export function CardHorizontalUtsikt() {
  return (
    <Card
      size='sm'
      className='mt-4 w-full min-w-0 overflow-hidden bg-card  px-2 py-4'
    >
      <div className='w-full min-w-0'>
        <CardHeader className='pt-2'>
          <CardTitle>Utsikt</CardTitle>
          <CardDescription className='pb-2'>
            Nyt panoramaet i komfort, hele dagen.
          </CardDescription>
        </CardHeader>
      </div>
    </Card>
  )
}
