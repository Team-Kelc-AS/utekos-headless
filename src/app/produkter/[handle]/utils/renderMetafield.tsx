// Path: src/app/produkter/[handle]/utils/renderMetafield.tsx

import { RichTextRenderer } from '@/components/RichTextRenderer/RichTextRenderer'
import { safeJsonParse } from '@/lib/utils/safeJsonParse'
import type { RootNode } from '@types'

export const renderMetafield = (
  fieldValue: string | null | undefined
): React.ReactNode => {
  if (!fieldValue)
    return (
      <p className='text-muted-foreground'>Ingen informasjon tilgjengelig</p>
    )

  const parsed = safeJsonParse(fieldValue, null) as RootNode | null

  if (!parsed) {
    return <p className='text-muted-foreground'>Kunne ikke laste innhold</p>
  }

  return <RichTextRenderer content={parsed} />
}
