import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";

export function CompareButton({ href }: { href: Route }) {
  return (
    <div className='mt-12 text-center relative flex items-center justify-center'>
            <Button
              asChild
              variant='default'
              size='lg'
              className='h-12 rounded-2xl bg-primary text-primary-foreground px-8 transition-all'
            >
              <Link
                href={href}
                data-track='ComparisonTeaserSeeFullComparisonClick'
              >
                Se full sammenligning
                <ArrowRightIcon className='ml-2 size-4' />
              </Link>
            </Button>
          </div>
  )
}