import Image from 'next/image'
import styles from './knowledgeChrome.module.css'

export type ArticleImageAspect = '16/9' | '4/3' | '1/1'

/**
 * Editorial article image with enforced house rules (see DESIGN.md).
 *
 * `prompt` is required by type: whoever places the image must leave the
 * exact generation prompt for the image model here. It is metadata for
 * editors and future tooling — never rendered to readers.
 */
export function ArticleImage({
  src,
  alt,
  aspect = '16/9',
  caption,
  prompt
}: {
  src: string
  alt: string
  aspect?: ArticleImageAspect
  caption?: string
  prompt: string
}) {
  return (
    <figure
      className={styles.figure}
      data-image-prompt={prompt}
    >
      <span
        className={styles.figureFrame}
        style={{ aspectRatio: aspect.replace('/', ' / ') }}
      >
        <Image
          className={styles.figureImage}
          src={src}
          alt={alt}
          fill
          sizes='(min-width: 64rem) 56rem, 100vw'
        />
      </span>
      {caption ?
        <figcaption className={styles.figcaption}>
          {caption}
        </figcaption>
      : null}
    </figure>
  )
}
