// Path: src/app/skreddersy-varmen/components/LandingPageVariantSelector.tsx
import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { focusRing } from '../utils/constants'
import { cn } from '@/lib/utils/className'
import type { ModelKey } from '@/api/constants'
import { PRODUCT_VARIANTS } from '@/api/constants'

export type LandingPageVariantSelectorProps = {
  selectedModel: ModelKey
  setSelectedModel: (model: ModelKey) => void
}

export function LandingPageVariantSelector({
  selectedModel,
  setSelectedModel
}: LandingPageVariantSelectorProps) {
  return (
    <div className='mb-12'>
      <Tabs
        value={selectedModel}
        onValueChange={v => setSelectedModel(v as ModelKey)}
        className='w-full md:w-fit'
      >
        <TabsList
          aria-label='Velg modell'
          className='flex h-auto w-full flex-wrap gap-2 rounded-none bg-transparent p-0 shadow-none md:w-fit'
        >
          {Object.keys(PRODUCT_VARIANTS).map(key => (
            <TabsTrigger
              key={key}
              value={key}
              className={cn(
                'h-auto flex-1 rounded-full border border-background/15 bg-transparent px-6 py-3 font-utekos-text-medium text-sm tracking-normal whitespace-nowrap transition-all duration-300 md:flex-none md:text-base',
                'text-background/80 hover:bg-background/8 hover:!text-background',
                'data-active:border-background data-active:bg-background data-active:text-foreground data-active:shadow-md',
                focusRing
              )}
            >
              {PRODUCT_VARIANTS[
                key as keyof typeof PRODUCT_VARIANTS
              ].title.replace('Utekos ', '')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
