import { Ruler } from 'lucide-react'

export function SizeFeature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className='flex flex-col items-center'>
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#F4F1EA]/10 bg-dark-teal text-[#E07A5F]'>
        <Ruler size={20} />
      </div>
      <h4 className='mb-2 font-utekos-text-medium text-[#F4F1EA]'>
        {title}
      </h4>
      <p className='max-w-xs font-utekos-text text-sm leading-relaxed text-[#F4F1EA]/60'>
        {desc}
      </p>
    </div>
  )
}
