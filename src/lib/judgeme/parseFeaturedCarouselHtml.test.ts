import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFeaturedCarouselHtml } from './parseFeaturedCarouselHtml'

const sampleHtml = `
<section class='jdgm-widget jdgm-carousel'>
  <div class='jdgm-carousel-item ' data-review-id='rev-1'>
    <div class='jdgm-carousel-item__review'>
      <div class='jdgm-carousel-item__review-rating' aria-label='5 stars' role='img'>
        <span class='jdgm-star jdgm--on'></span>
      </div>
      <div class='jdgm-carousel-item__review-content'>
        <div class='jdgm-carousel-item__review-title'>Varm</div>
        <div class='jdgm-carousel-item__review-body'><p>Veldig bra plagg.</p></div>
      </div>
    </div>
    <div class='jdgm-carousel-item__reviewer-name-wrapper'>
      <div class='jdgm-carousel-item__reviewer-name jdgm-ellipsis'> Lisa </div>
      <div class='jdgm-carousel-item__timestamp jdgm-ellipsis' data-time='09/01/2026'> 09/01/2026 </div>
    </div>
    <div class='jdgm-carousel-item__product'>
      <img class='jdgm-carousel-item__product-image' alt='Utekos TechDown™' data-src='https://cdn.example/techdown.png'/>
    </div>
  </div>
  <div class='jdgm-carousel-item jdgm--shop-review' data-review-id='rev-2'>
    <div class='jdgm-carousel-item__review'>
      <div class='jdgm-carousel-item__review-rating' aria-label='4 stars' role='img'>
        <span class='jdgm-star jdgm--on'></span>
      </div>
      <div class='jdgm-carousel-item__review-content'>
        <div class='jdgm-carousel-item__review-title'></div>
        <div class='jdgm-carousel-item__review-body'><p>God service &amp; rask levering.</p></div>
      </div>
    </div>
    <div class='jdgm-carousel-item__reviewer-name-wrapper'>
      <div class='jdgm-carousel-item__reviewer-name'> Odd </div>
    </div>
  </div>
  <div class='jdgm-carousel__arrows'></div>
</section>
`

test('parseFeaturedCarouselHtml extracts carousel cards', () => {
  const reviews = parseFeaturedCarouselHtml(sampleHtml)

  assert.equal(reviews.length, 2)
  assert.deepEqual(reviews[0], {
    id: 'rev-1',
    author: 'Lisa',
    body: 'Veldig bra plagg.',
    title: 'Varm',
    rating: 5,
    reviewedOn: '09/01/2026',
    productTitle: 'Utekos TechDown™',
    productImageUrl: 'https://cdn.example/techdown.png'
  })
  assert.equal(reviews[1]?.author, 'Odd')
  assert.equal(reviews[1]?.body, 'God service & rask levering.')
  assert.equal(reviews[1]?.rating, 4)
  assert.equal(reviews[1]?.title, null)
})
