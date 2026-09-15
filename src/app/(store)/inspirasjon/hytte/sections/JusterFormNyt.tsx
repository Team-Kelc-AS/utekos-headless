import {
  CardAspectRatioCustomContent,
  CardAspectRatioCustom
} from '../../components/cards/AspectRatioCustom'

export function JusterFormNyt() {
  return (
    <article
      id='juster-form-nyt'
      className='w-full min-w-0 overflow-x-clip'
    >
      <div className='grid w-full min-w-0 grid-cols-1 items-center justify-center bg-sidebar text-sidebar-foreground lg:grid-cols-2'>
        <CardAspectRatioCustomContent className='flex-1' />
        <CardAspectRatioCustom className='flex-1' />
      </div>
    </article>
  )
}
