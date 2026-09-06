import type {
  CSSProperties,
  ReactNode,
  HTMLAttributes
} from 'react'

type PatternFrameSurface = 'default' | 'transparent' | 'dark'
type PatternFrameVariant = 'centered' | 'content' | 'card'
type PatternFrameAlign = 'center' | 'start'

type PatternFrameVars = CSSProperties & {
  '--pattern-content-width'?: string
  '--pattern-gutter-width'?: string
  '--pattern-fg'?: string
}

type PatternFrameProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article'
  id?: string
  children: ReactNode
  className?: string
  contentClassName?: string
  contentWidth?: string
  gutterWidth?: string
  surface?: PatternFrameSurface
  variant?: PatternFrameVariant
  align?: PatternFrameAlign
  showHorizontalRules?: boolean
  fixedPattern?: boolean
  style?: PatternFrameVars
}

function cn(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(' ')
}

const patternColumnClassName =
  'bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px]'

const surfaceClassNames: Record<PatternFrameSurface, string> = {
  default:
    'bg-white [--pattern-fg:color-mix(in_oklab,var(--color-gray-950)_5%,transparent)]',
  transparent:
    '[--pattern-fg:color-mix(in_oklab,var(--color-gray-950)_5%,transparent)]',
  dark: '[--pattern-fg:color-mix(in_oklab,var(--color-white)_10%,transparent)]'
}

export function PatternFrame({
  as = 'div',
  id,
  children,
  className,
  contentClassName,
  contentWidth,
  gutterWidth,
  surface = 'default',
  variant = 'centered',
  align = 'center',
  showHorizontalRules = true,
  fixedPattern = true,
  style,
  ...props
}: PatternFrameProps) {
  const Component = as

  const frameStyle: PatternFrameVars = {
    ...(contentWidth ?
      { '--pattern-content-width': contentWidth }
    : {}),
    ...(gutterWidth ?
      { '--pattern-gutter-width': gutterWidth }
    : {}),
    ...style
  }

  const isCard = variant === 'card'
  const isCentered = variant === 'centered'
  const isStartAligned = align === 'start'

  const gridClassName =
    isCard ?
      'grid-cols-[var(--pattern-gutter-width,1rem)_minmax(0,1fr)_var(--pattern-gutter-width,1rem)] grid-rows-[1px_minmax(0,1fr)_1px]'
    : isStartAligned ?
      'grid-cols-[var(--pattern-gutter-width,2.5rem)_minmax(0,1fr)_var(--pattern-gutter-width,2.5rem)]'
    : 'grid-cols-[minmax(0,1fr)_var(--pattern-gutter-width,2.5rem)_var(--pattern-content-width,auto)_var(--pattern-gutter-width,2.5rem)_minmax(0,1fr)]'

  const rowClassName =
    isCard ? ''
    : isCentered ? 'grid-rows-[1fr_1px_auto_1px_1fr]'
    : showHorizontalRules ? 'grid-rows-[1px_auto_1px]'
    : 'grid-rows-[auto]'

  const contentPositionClassName =
    isCard ?
      'col-start-2 row-start-2'
    : cn(
        isStartAligned ? 'col-start-2' : 'col-start-3',
        isCentered ? 'row-start-3'
        : showHorizontalRules ? 'row-start-2'
        : 'row-start-1'
      )

  const leftPatternPositionClassName =
    isCard ? 'col-start-1'
    : isStartAligned ? 'col-start-1'
    : 'col-start-2'

  const rightPatternPositionClassName =
    isCard ? 'col-start-3'
    : isStartAligned ? 'col-start-3'
    : 'col-start-4'

  return (
    <Component
      id={id}
      style={frameStyle}
      className={cn(
        'relative isolate grid',
        gridClassName,
        rowClassName,
        surfaceClassNames[surface],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative z-10 min-w-0',
          contentPositionClassName,
          contentClassName
        )}
      >
        {children}
      </div>

      <div
        aria-hidden='true'
        className={cn(
          'relative -right-px row-span-full row-start-1 border-x border-x-(--pattern-fg)',
          leftPatternPositionClassName,
          patternColumnClassName,
          fixedPattern && 'bg-fixed'
        )}
      />

      <div
        aria-hidden='true'
        className={cn(
          'relative -left-px row-span-full row-start-1 border-x border-x-(--pattern-fg)',
          rightPatternPositionClassName,
          patternColumnClassName,
          fixedPattern && 'bg-fixed'
        )}
      />

      {showHorizontalRules && (
        <>
          <div
            aria-hidden='true'
            className={cn(
              'relative -bottom-px col-span-full col-start-1 h-px bg-(--pattern-fg)',
              isCard ? 'row-start-1'
              : isCentered ? 'row-start-2'
              : 'row-start-1'
            )}
          />

          <div
            aria-hidden='true'
            className={cn(
              'relative -top-px col-span-full col-start-1 h-px bg-(--pattern-fg)',
              isCard ? 'row-start-3'
              : isCentered ? 'row-start-4'
              : 'row-start-3'
            )}
          />
        </>
      )}
    </Component>
  )
}
