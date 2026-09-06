import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { ProductCareUtekosDun } from './ProductCareUtekosDun'
import { ProductCareUtekosMikrofiber } from './ProductCareUtekosMikrofiber'
import { ProductCareComfyrobe } from './ProductCareComfyrobe'
import { ProductCareTechDown } from './ProductCareTechDown'

const tabTriggerClassName =
  'min-h-11 w-full flex-none rounded-full border-transparent bg-card  px-4 py-2.5 font-utekos-text text-sm font-medium text-card-foreground  shadow-none transition-[filter,transform] duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 data-active:border-primary/35 data-active:bg-card data-active:text-card-foreground sm:w-auto sm:px-5'

export function ProductCareBody() {
  return (
    <article
      aria-labelledby='materialspesifikk-heading'
      className='max-w-6xl scroll-mt-24'
    >
      <div className='mb-8 text-center'>
        <h2
          id='materialspesifikk-heading'
          className='font-google-sans text-left font-sans text-5xl leading-[0.95] font-bold text-foreground sm:text-5xl'
        >
          Materialspesifikk pleie
        </h2>
        <p className='/90 mt-5 text-left font-utekos-text-medium text-lg leading-8 text-foreground/90'>
          Hvert materiale har sine egne styrker og sine egne
          behov. Velg plagget ditt for detaljerte råd.
        </p>
      </div>

      <Tabs defaultValue='dun' className='w-full flex-col'>
        <TabsList className='grid h-auto w-full grid-cols-2 items-start gap-2 rounded-none border-0 p-0 sm:flex sm:flex-wrap sm:justify-start'>
          <TabsTrigger
            value='dun'
            className={tabTriggerClassName}
          >
            Utekos Dun
          </TabsTrigger>
          <TabsTrigger
            value='mikrofiber'
            className={tabTriggerClassName}
          >
            Utekos Mikrofiber
          </TabsTrigger>
          <TabsTrigger
            value='techdown'
            className={tabTriggerClassName}
          >
            TechDown™
          </TabsTrigger>
          <TabsTrigger
            value='comfyrobe'
            className={tabTriggerClassName}
          >
            Comfyrobe™
          </TabsTrigger>
        </TabsList>
        <ProductCareUtekosDun />
        <ProductCareUtekosMikrofiber />
        <ProductCareTechDown />
        <ProductCareComfyrobe />
      </Tabs>
    </article>
  )
}
