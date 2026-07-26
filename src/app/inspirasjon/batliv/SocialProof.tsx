import { Card, CardContent } from '@/components/ui/card'
export function SocialProof() {
  return (
    <article className='dark:bg-dark-background bg-background py-24 text-foreground'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className='mb-8 pb-8'>Skippere elsker Utekos</h2>

          <Card className='border-border bg-card text-card-foreground'>
            <CardContent className='p-12'>
              <blockquote className='mb-6 text-xl text-card-foreground italic'>
                &quot;Som mangeårig seiler er Utekos det beste
                båtutstyret jeg har kjøpt på lenge. Den er helt
                genial for kalde kvelder for anker og har i
                praksis utvidet sesongen vår med to
                måneder.&quot;
              </blockquote>
              <div className='flex items-center justify-center gap-4'>
                <div className='dark:bg-dark-secondary h-12 w-12 rounded-full bg-secondary' />
                <div className='text-left'>
                  <p className='font-utekos-text-medium'>
                    Kjell-Arne Larsen
                  </p>
                  <p className='dark:text-dark-muted-foreground text-sm text-muted-foreground'>
                    Seilentusiast fra Tønsberg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </article>
  )
}
