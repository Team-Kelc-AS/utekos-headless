import Image from 'next/image'
import { ArticleTableOfContents } from '@/components/articles/ArticleTableOfContents'
import { comparisonArticle as article } from '../utils/comparisonArticle'
import styles from '../comparisonGuide.module.css'

export function CompareModelsPageHero() {
  // Emphasize names without keeping a second copy of the introduction.
  const introParts = article.intro.split(
    /(Utekos (?:Dun|Mikrofiber|TechDown)™)/g
  )
  return (
    <header>
      <Image
        src={article.image.src}
        alt={article.image.alt}
        width={article.image.width}
        height={article.image.height}
        preload
        sizes='100vw'
        className='block h-auto w-full'
      />
      <div className={`${styles.container} ${styles.intro}`}>
        <span className={styles.pill}>{article.category}</span>
        <h1 id='compare-models-title'>{article.title}</h1>
        <p className={styles.lead}>
          {introParts.map((part, index) =>
            index % 2 ?
              <strong key={index}>{part}</strong>
            : part
          )}
        </p>
        <p className={styles.byline}>
          Veiledning fra{' '}
          <a href={article.author.url}>{article.author.name}</a>,
          som selger modellene i sammenligningen.
        </p>
        <div className={styles.summary}>
          <p>
            <strong>Dette får du hjelp til</strong>
          </p>
          <ul className={styles.points}>
            {article.learnings.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <ArticleTableOfContents
          title='Innhold i kjøpsguiden'
          id='comparison-contents-title'
          entries={article.toc}
        />
      </div>
    </header>
  )
}
