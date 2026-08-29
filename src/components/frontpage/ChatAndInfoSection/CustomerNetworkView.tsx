'use client'

import Image from 'next/image'
import UtekosLogo from '@public/icon.png'
import {
  iconMap,
  type IconName
} from '@/components/frontpage/components/initialElements'
import type {
  CustomerNetworkViewProps,
  EdgeData,
  NodeData
} from 'types/flow.types'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { cn } from '@/lib/utils/className'
import {
  motion,
  MotionConfig,
  useReducedMotion,
  type Variants
} from 'motion/react'

const easeOut = [0.22, 1, 0.36, 1] as const

function IconRenderer({
  name,
  className,
  style
}: {
  name: IconName
  className?: string
  style?: React.CSSProperties
}) {
  const Icon = iconMap[name]

  return Icon ?
      <Icon
        aria-hidden='true'
        className={className}
        style={style}
      />
    : null
}

function NetworkOrbitSvg({
  nodes,
  edges,
  className,
  pathVariants,
  pillVariants
}: {
  nodes: NodeData[]
  edges: EdgeData[]
  className?: string
  pathVariants: Variants
  pillVariants: Variants
}) {
  const benefitNodes = nodes.filter(
    node => node.type !== 'center'
  )

  return (
    <svg
      width='100%'
      height='100%'
      viewBox='0 0 520 520'
      aria-hidden='true'
      className={cn(
        'absolute inset-0 overflow-visible',
        className
      )}
    >
      {edges.map((edge, index) => {
        const sourceNode = nodes.find(
          node => node.id === edge.sourceId
        )
        const targetNode = nodes.find(
          node => node.id === edge.targetId
        )

        if (!sourceNode || !targetNode) return null

        const sourceX =
          sourceNode.position.x + sourceNode.width / 2
        const sourceY =
          sourceNode.position.y + sourceNode.height / 2
        const targetX =
          targetNode.position.x + targetNode.width / 2
        const targetY =
          targetNode.position.y + targetNode.height / 2

        const midX = (sourceX + targetX) / 2
        const midY = (sourceY + targetY) / 2
        const pathD = `M ${sourceX},${sourceY} Q ${sourceX},${midY} ${midX},${midY} T ${targetX},${targetY}`

        return (
          <motion.path
            key={edge.id}
            d={pathD}
            stroke={edge.data.color}
            strokeWidth={2}
            strokeLinecap='round'
            strokeDasharray='5 7'
            vectorEffect='non-scaling-stroke'
            fill='none'
            custom={index}
            variants={pathVariants}
          />
        )
      })}

      {benefitNodes.map((node, index) => (
        <foreignObject
          key={node.id}
          x={node.position.x}
          y={node.position.y}
          width={node.width}
          height={node.height}
        >
          <motion.div
            className='flex size-full items-center justify-center rounded-full border border-foreground/15 bg-dark-teal px-3 text-foreground shadow-[0_18px_40px_-28px_color-mix(in_oklab,var(--jungle)_75%,transparent)] ring-1 ring-foreground/10'
            custom={index}
            variants={pillVariants}
          >
            {node.data ?
              <div className='flex min-w-0 items-center justify-center gap-2'>
                <span className='flex size-7 shrink-0 items-center justify-center rounded-full border border-foreground/25 bg-jungle text-foreground'>
                  <IconRenderer
                    name={node.data.icon as IconName}
                    className='size-3.5'
                  />
                </span>

                <InlineText className='font-utekos-text-medium text-xs leading-tight tracking-normal text-foreground sm:text-sm'>
                  {node.data.text}
                </InlineText>
              </div>
            : null}
          </motion.div>
        </foreignObject>
      ))}
    </svg>
  )
}

export function CustomerNetworkView({
  nodes,
  nodesDesktop,
  edges,
  centerNode
}: CustomerNetworkViewProps) {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
  }

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.86 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.8,
        ease: easeOut
      }
    }
  }

  const pathVariants: Variants = {
    hidden: { opacity: 0 },
    visible: (index: number) => ({
      opacity: 0.72,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.7,
        ease: easeOut,
        delay: shouldReduceMotion ? 0 : 0.15 + index * 0.08
      }
    })
  }

  const pillVariants: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.8,
        ease: easeOut,
        delay: shouldReduceMotion ? 0 : 0.45 + index * 0.08
      }
    })
  }

  return (
    <MotionConfig reducedMotion='user'>
      <motion.div
        className='relative mx-auto aspect-square w-full max-w-130'
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, amount: 0.4 }}
        variants={containerVariants}
      >
        {centerNode ?
          <motion.div
            className='pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2'
            variants={logoVariants}
          >
            <div className='relative size-28 overflow-hidden rounded-full shadow-[0_24px_54px_-32px_color-mix(in_oklab,var(--color-background)_92%,transparent)]'>
              <Image
                src={UtekosLogo}
                alt='Utekos'
                fill
                priority
                sizes='112px'
                className='object-contain'
              />
            </div>
          </motion.div>
        : null}

        <NetworkOrbitSvg
          nodes={nodes}
          edges={edges}
          className='md:hidden'
          pathVariants={pathVariants}
          pillVariants={pillVariants}
        />
        <NetworkOrbitSvg
          nodes={nodesDesktop}
          edges={edges}
          className='hidden md:block'
          pathVariants={pathVariants}
          pillVariants={pillVariants}
        />
      </motion.div>
    </MotionConfig>
  )
}
