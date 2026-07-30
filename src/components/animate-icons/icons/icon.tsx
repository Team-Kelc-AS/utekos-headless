'use client'

import {
  motion,
  useAnimation,
  type HTMLMotionProps,
  type SVGMotionProps,
  type Variants
} from 'motion/react'
import * as React from 'react'

import { cn } from '@/lib/utils/className'

const staticAnimations = {
  'path': {
    initial: { pathLength: 1 },
    animate: {
      pathLength: [0.05, 1],
      transition: {
        duration: 0.8,
        ease: 'easeInOut'
      }
    }
  } as Variants,
  'path-loop': {
    initial: { pathLength: 1 },
    animate: {
      pathLength: [1, 0.05, 1],
      transition: {
        duration: 1.6,
        ease: 'easeInOut'
      }
    }
  } as Variants
} as const

type StaticAnimations = keyof typeof staticAnimations
type TriggerProp<T = string> = boolean | StaticAnimations | T

type AnimateIconContextValue = {
  controls: ReturnType<typeof useAnimation> | 'initial'
  animation: StaticAnimations | string
  active: boolean
}

type DefaultIconProps<T = string> = {
  animate?: TriggerProp<T>
  animateOnHover?: TriggerProp<T>
  animateOnTap?: TriggerProp<T>
  animateOnView?: TriggerProp<T>
  animation?: T | StaticAnimations
  loop?: boolean
  loopDelay?: number
  initialOnAnimateEnd?: boolean
  completeOnStop?: boolean
  persistOnAnimateEnd?: boolean
  delay?: number
}

type AnimateIconProps<T = string> = Omit<HTMLMotionProps<'span'>, 'animate'>
  & DefaultIconProps<T> & {
    children: React.ReactNode
    asChild?: boolean
  }

type IconProps<T> = DefaultIconProps<T>
  & Omit<SVGMotionProps<SVGSVGElement>, 'animate'> & {
    size?: number
  }

type IconWrapperProps<T> = IconProps<T> & {
  icon: React.ComponentType<IconProps<T>>
}

type KnownVariantName =
  | 'circle'
  | 'circle1'
  | 'circle2'
  | 'group'
  | 'group1'
  | 'group2'
  | 'line'
  | 'line1'
  | 'line2'
  | 'line3'
  | 'line4'
  | 'line5'
  | 'line6'
  | 'line7'
  | 'line8'
  | 'line9'
  | 'path'
  | 'path1'
  | 'path2'
  | 'path3'
  | 'path4'
  | 'path5'
  | 'path6'
  | 'path7'
  | 'path8'
  | 'path9'
  | 'polygon'
  | 'rect'

type KnownVariantMap = Record<KnownVariantName, Variants>
type IconAnimationSet = {
  readonly default: Readonly<Record<string, Variants>>
} & Readonly<Record<string, Readonly<Record<string, Variants>>>>
type DefaultVariantMap<T extends IconAnimationSet> = {
  [K in keyof T['default'] & string]: Variants
}

const emptyKnownVariants: KnownVariantMap = {
  circle: {},
  circle1: {},
  circle2: {},
  group: {},
  group1: {},
  group2: {},
  line: {},
  line1: {},
  line2: {},
  line3: {},
  line4: {},
  line5: {},
  line6: {},
  line7: {},
  line8: {},
  line9: {},
  path: {},
  path1: {},
  path2: {},
  path3: {},
  path4: {},
  path5: {},
  path6: {},
  path7: {},
  path8: {},
  path9: {},
  polygon: {},
  rect: {}
}

const AnimateIconContext = React.createContext<AnimateIconContextValue | null>(
  null
)

function useAnimateIconContext() {
  const context = React.useContext(AnimateIconContext)

  if (!context) {
    return {
      controls: 'initial' as const,
      animation: 'default',
      active: false
    }
  }

  return context
}

function getAnimationFromTrigger<T extends string>(
  trigger: TriggerProp<T> | undefined,
  fallback: T | StaticAnimations | undefined
) {
  if (typeof trigger === 'string') return trigger
  return fallback ?? 'default'
}

function AnimateIcon<T extends string>({
  animate = false,
  animateOnHover = false,
  animateOnTap = false,
  animation,
  loop,
  loopDelay = 0,
  delay = 0,
  children,
  className,
  ...props
}: AnimateIconProps<T>) {
  const controls = useAnimation()
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const loopTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const [animationName, setAnimationName] = React.useState<
    StaticAnimations | string
  >(() => getAnimationFromTrigger(animate, animation))
  const [active, setActive] = React.useState(Boolean(animate))

  function clearTimers() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current)
      loopTimeoutRef.current = null
    }
  }

  function startAnimation(trigger: TriggerProp<T> | undefined) {
    clearTimers()
    setAnimationName(getAnimationFromTrigger(trigger, animation))

    if (delay > 0) {
      setActive(false)
      timeoutRef.current = setTimeout(() => setActive(true), delay)
      return
    }

    setActive(true)
  }

  function stopAnimation() {
    clearTimers()
    setActive(false)
  }

  React.useEffect(() => {
    if (animate) {
      // Prop changes intentionally synchronize Motion controls and timer state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startAnimation(animate)
      return clearTimers
    }

    stopAnimation()
    return clearTimers
    // React Compiler handles function identity here; no memoized callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, animation, delay])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (!active) {
        await controls.start('initial')
        return
      }

      await controls.start('animate')

      if (!loop || cancelled) return

      loopTimeoutRef.current = setTimeout(() => {
        if (!cancelled) void run()
      }, loopDelay)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [active, controls, loop, loopDelay, animationName])

  React.useEffect(() => clearTimers, [])

  function handleMouseEnter(event: React.MouseEvent<HTMLSpanElement>) {
    props.onMouseEnter?.(event)
    if (animateOnHover) startAnimation(animateOnHover)
  }

  function handleMouseLeave(event: React.MouseEvent<HTMLSpanElement>) {
    props.onMouseLeave?.(event)
    if (animateOnHover || animateOnTap) stopAnimation()
  }

  function handlePointerDown(event: React.PointerEvent<HTMLSpanElement>) {
    props.onPointerDown?.(event)
    if (animateOnTap) startAnimation(animateOnTap)
  }

  function handlePointerUp(event: React.PointerEvent<HTMLSpanElement>) {
    props.onPointerUp?.(event)
    if (animateOnTap) stopAnimation()
  }

  return (
    <AnimateIconContext.Provider
      value={{ controls, animation: animationName, active }}
    >
      <motion.span
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {children}
      </motion.span>
    </AnimateIconContext.Provider>
  )
}

const pathClassName =
  '[&_[stroke-dasharray="1px_1px"]]:![stroke-dasharray:1px_0px]'

function IconWrapper<T extends string>({
  size = 28,
  animation: animationProp,
  animate,
  animateOnHover,
  animateOnTap,
  icon: IconComponent,
  loop,
  loopDelay,
  delay,
  className,
  ...props
}: IconWrapperProps<T>) {
  if (
    animate !== undefined
    || animateOnHover !== undefined
    || animateOnTap !== undefined
    || animationProp !== undefined
  ) {
    return (
      <AnimateIcon
        {...(animate !== undefined ? { animate } : {})}
        {...(animateOnHover !== undefined ? { animateOnHover } : {})}
        {...(animateOnTap !== undefined ? { animateOnTap } : {})}
        {...(animationProp !== undefined ? { animation: animationProp } : {})}
        {...(loop !== undefined ? { loop } : {})}
        {...(loopDelay !== undefined ? { loopDelay } : {})}
        {...(delay !== undefined ? { delay } : {})}
      >
        <IconComponent
          size={size}
          className={cn(
            className,
            (animationProp === 'path' || animationProp === 'path-loop')
              && pathClassName
          )}
          {...props}
        />
      </AnimateIcon>
    )
  }

  return (
    <IconComponent
      size={size}
      className={cn(
        className,
        (animationProp === 'path' || animationProp === 'path-loop')
          && pathClassName
      )}
      {...props}
    />
  )
}

function getVariants<T extends IconAnimationSet>(
  animations: T
): DefaultVariantMap<T> & KnownVariantMap {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { animation: animationType } = useAnimateIconContext()

  if (animationType in staticAnimations) {
    const variant = staticAnimations[animationType as StaticAnimations]
    const result: Record<string, Variants> = {}

    for (const key in emptyKnownVariants) {
      result[key] = variant
    }

    for (const key in animations.default) {
      result[key] = variant
    }

    return result as DefaultVariantMap<T> & KnownVariantMap
  }

  const selectedAnimation = animations[animationType] ?? {}

  return {
    ...emptyKnownVariants,
    ...animations.default,
    ...selectedAnimation
  } as DefaultVariantMap<T> & KnownVariantMap
}

export {
  pathClassName,
  staticAnimations,
  AnimateIcon,
  IconWrapper,
  useAnimateIconContext,
  getVariants,
  type IconProps,
  type IconWrapperProps,
  type AnimateIconProps,
  type AnimateIconContextValue
}
