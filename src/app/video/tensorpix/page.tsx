import { Suspense } from 'react'
import { TensorPixVideoCacheWrapper } from '@/app/produkter/(oversikt)/components/Video/TensorPixVideoCacheWrapper'

export default function TensorPixVideoPage() {
  return (
    <main className='flex min-h-dvh items-center justify-center bg-background px-4 py-8'>
      <Suspense fallback={null}>
        <TensorPixVideoCacheWrapper variant='embed' />
      </Suspense>
    </main>
  )
}
