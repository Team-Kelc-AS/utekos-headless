import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const arrivalSource = readFileSync(
  fileURLToPath(new URL('./TechHeroArrival.tsx', import.meta.url)),
  'utf8'
)
const heroSource = readFileSync(
  fileURLToPath(new URL('./TechHero.tsx', import.meta.url)),
  'utf8'
)
const motionSource = readFileSync(
  fileURLToPath(
    new URL('./TechHeroArrival.module.css', import.meta.url)
  ),
  'utf8'
)
const sceneSource = readFileSync(
  fileURLToPath(new URL('./TechHero.module.css', import.meta.url)),
  'utf8'
)
const inviteSource = readFileSync(
  fileURLToPath(
    new URL('./TechHeroScrollInvite.tsx', import.meta.url)
  ),
  'utf8'
)
const modeCardsSource = readFileSync(
  fileURLToPath(
    new URL('./TechMaterialsModeCards.tsx', import.meta.url)
  ),
  'utf8'
)

test('arrival hero shoots in JUSTER FORM NYT and drops the old comfort copy', () => {
  assert.match(arrivalSource, /JUSTER/u)
  assert.match(arrivalSource, /FORM/u)
  assert.match(arrivalSource, /NYT/u)
  assert.match(
    arrivalSource,
    /font-sans text-cloud-dancer font-extrabold/u
  )
  assert.match(
    arrivalSource,
    /font-sans text-primary font-extrabold/u
  )
  assert.match(arrivalSource, /UtekosWordmark/u)
  assert.match(arrivalSource, /gir deg friheten til å velge\./u)
  assert.match(arrivalSource, /Vi kaller det/u)
  assert.match(arrivalSource, /adaptiv funksjonalitet\./u)
  assert.match(arrivalSource, /font-utekos-text-medium leading-\[1\.1\] italic/u)
  assert.match(arrivalSource, /9\.55s/u)
  assert.match(
    arrivalSource,
    /text-\[clamp\(4\.5rem,12vw,10rem\)\]/u
  )
  assert.match(arrivalSource, /text-xl leading-none text-cloud-dancer md:text-2xl/u)
  assert.match(arrivalSource, /text-xl text-cloud-dancer md:mt-3\.5 md:text-2xl/u)
  assert.match(arrivalSource, /mx-auto w-fit max-w-full text-left/u)
  assert.doesNotMatch(arrivalSource, /initial=["']hidden["']/u)
  assert.match(
    heroSource,
    /mb-24 flex min-h-dvh items-center justify-center/u
  )
  assert.doesNotMatch(heroSource, /-mt-34/u)
  assert.doesNotMatch(heroSource, /md:items-start/u)
  assert.doesNotMatch(heroSource, /md:pt-8/u)
  assert.match(motionSource, /--arrival-delay/u)
  assert.match(motionSource, /--arrival-duration/u)
  assert.doesNotMatch(arrivalSource, /Skapt for komfort/u)
  assert.doesNotMatch(arrivalSource, /Ett plagg/u)
  assert.doesNotMatch(arrivalSource, /Tre opplevelser/u)
  assert.doesNotMatch(heroSource, /ArrowDown|BrandBadge/u)
  assert.match(heroSource, /data-tech-hero-scene/u)
  assert.match(heroSource, /TechHeroScrollInvite/u)
  assert.match(inviteSource, /ChevronDown/u)
  assert.match(inviteSource, /Fortsett nedover til modusene/u)
  assert.match(inviteSource, /#\$\{TECH_MODES_SECTION_ID\}/u)
  assert.match(modeCardsSource, /id=\{TECH_MODES_SECTION_ID\}/u)
  assert.match(modeCardsSource, /scroll-mt-24/u)
  assert.match(sceneSource, /--tech-scene-end: 10\.7s/u)
  assert.match(sceneSource, /position: fixed/u)
  assert.match(sceneSource, /background: transparent/u)
  assert.match(sceneSource, /tech-hero-header-brand/u)
  assert.match(sceneSource, /tech-hero-header-actions/u)
  assert.match(sceneSource, /translate3d\(-118%/u)
  assert.match(sceneSource, /translate3d\(118%/u)
  assert.match(sceneSource, /tech-hero-invite-pulse/u)
  assert.match(sceneSource, /2\.8s ease-in-out/u)
  assert.match(sceneSource, /prefers-reduced-motion: reduce/u)
  assert.match(motionSource, /translate3d\(-118%/u)
  assert.match(motionSource, /prefers-reduced-motion: reduce/u)
})
