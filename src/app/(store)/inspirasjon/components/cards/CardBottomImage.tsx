import Image from 'next/image'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'

export const CardBottomImage = () => {
  return (
    <Card className='max-w-md pb-0'>
      <CardHeader>
        <CardTitle>Fluid Gradient Flow</CardTitle>
        <CardDescription>A vibrant and abstract background with smooth gradient curves.</CardDescription>
      </CardHeader>
      <CardContent className='px-0'>
        <Image
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-1.png?height=280&format=auto'
          alt='Banner'
          width={1120}
          height={630}
          className='aspect-video h-70 rounded-b-xl object-cover'
        />
      </CardContent>
    </Card>
  )
}
