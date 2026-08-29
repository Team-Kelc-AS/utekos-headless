import { NameCursor } from '@/components/chat/NameCursor'
import { SendIcon } from '@/components/icon/SendIcon'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import {
  Message,
  MessageContent,
  MessageGroup
} from '@/components/ui/message'
import { motion, type Variants } from 'motion/react'
import { P } from '@/components/typography/TypographyP'
import { InlineText } from '@/components/typography/TypographyInlineText'

const chatMotion = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.12, staggerChildren: 0.12 }
  }
} satisfies Variants

const messageMotion = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] }
  }
} satisfies Variants

const chatBubbleClassName = 'max-w-xs sm:max-w-sm'

/* Hanne: calm Utekos teal with a precise light-teal edge. */
const incomingBubbleContentClassName =
  '!rounded-2xl !rounded-tl-md !border !border-light-teal/24 !bg-dark-teal !p-3 !text-base !leading-snug !text-foreground shadow-[0_24px_60px_-42px_color-mix(in_oklch,var(--jungle)_92%,transparent)] ring-1 ring-inset ring-foreground/6'

/* Thomas: the established Facebook blue, anchored by the same card treatment. */
const outgoingBubbleContentClassName =
  '!rounded-2xl !rounded-tr-md !border !border-foreground/20 !bg-[oklch(0.5891_0.2029_257.86)] !p-3 !text-base !leading-snug !text-foreground shadow-[0_24px_60px_-42px_color-mix(in_oklch,var(--jungle)_92%,transparent)] ring-1 ring-inset ring-foreground/12'

export function AnimatedChat() {
  return (
    <motion.div
      variants={chatMotion}
      className='relative mx-auto flex h-full min-h-100 flex-col justify-center p-4 pt-4 sm:p-8'
    >
      <MessageGroup className='gap-8'>
        <motion.div variants={messageMotion}>
          <Message align='start'>
            <MessageContent>
              <Bubble
                align='start'
                variant='outline'
                className={chatBubbleClassName}
              >
                <BubbleContent
                  className={incomingBubbleContentClassName}
                >
                  <P className='chat-bubble-text not-first:mt-0'>
                    Husk å pakke noe skikkelig varmt til kvelden
                    på hytten, det blir fort kaldt 🥶
                  </P>
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </motion.div>
        <motion.div
          variants={messageMotion}
          className='flex justify-end pr-8 @lg/chat:hidden'
        >
          <NameCursor name='Hanne' side='left' tone='incoming' />
        </motion.div>
        <motion.div variants={messageMotion}>
          <Message align='end'>
            <MessageContent>
              <Bubble
                align='end'
                className={chatBubbleClassName}
              >
                <BubbleContent
                  className={outgoingBubbleContentClassName}
                >
                  <P className='chat-bubble-text font-sans text-foreground not-first:mt-0'>
                    Slapp av, jeg tar med Utekosen min. Den er
                    alt vi trenger.
                  </P>
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </motion.div>

        <motion.div
          variants={messageMotion}
          className='flex justify-start pl-8 @lg/chat:hidden'
        >
          <NameCursor
            name='Thomas'
            side='right'
            tone='outgoing'
          />
        </motion.div>

        <motion.div variants={messageMotion}>
          <Message align='start'>
            <MessageContent>
              <Bubble
                align='start'
                variant='outline'
                className={chatBubbleClassName}
              >
                <BubbleContent
                  className={incomingBubbleContentClassName}
                >
                  <P className='chat-bubble-text not-first:mt-0'>
                    Genialt! Da slipper vi å drasse med oss de
                    gamle pleddene.
                  </P>
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </motion.div>

        <motion.div variants={messageMotion} className='mt-2'>
          <Message align='end'>
            <MessageContent>
              <Bubble align='end' className='max-w-[82%]'>
                <BubbleContent
                  className={outgoingBubbleContentClassName}
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <P className='chat-bubble-text flex min-w-0 items-center text-foreground not-first:mt-0'>
                      <InlineText className='min-w-0 font-sans text-foreground'>
                        Nettopp. Mer plass til vinen 😉
                      </InlineText>
                      <motion.span
                        className='ml-1 inline-block h-4 w-0.5 bg-foreground'
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{
                          duration: 0.9,
                          ease: [0.32, 0.72, 0, 1],
                          repeat: Infinity
                        }}
                      />
                    </P>
                    <span
                      className='hidden size-5 shrink-0 items-center justify-center rounded-md bg-transparent text-foreground sm:inline-flex'
                      aria-hidden
                      title='Send'
                    >
                      <SendIcon className='size-5' />
                    </span>
                  </div>
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </motion.div>
      </MessageGroup>
      <div className='hidden @lg/chat:block'>
        <NameCursor
          name='Hanne'
          side='left'
          tone='incoming'
          className='absolute top-[22%] right-[15%]'
        />
        <NameCursor
          name='Thomas'
          side='right'
          tone='outgoing'
          className='absolute top-[42%] left-[18%]'
        />
      </div>
    </motion.div>
  )
}
