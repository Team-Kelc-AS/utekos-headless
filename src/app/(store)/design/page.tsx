import { ColorPaletteViewer } from '@/components/design/ColorPaletteViewer'
import { Toaster } from '@/components/ui/sonner'
import { color2Scales } from '@/lib/brand/color-2-scales'

export default function DesignColorsPage() {
  return (
    <>
      <ColorPaletteViewer
        families={color2Scales.families}
        source={color2Scales.source}
        generatedAt={color2Scales.generatedAt}
      />
      <Toaster richColors position='bottom-center' />
    </>
  )
}
