import { Google_Sans_Flex } from 'next/font/google'

/**
 * Google Sans Flex has no entry in Next.js capsize metrics, so
 * `adjustFontFallback` must stay false. next/font/local can derive
 * size-adjust from a font file; next/font/google cannot for this family.
 */
export const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  variable: '--font-google-sans-flex',
  axes: ['GRAD', 'opsz']
})
