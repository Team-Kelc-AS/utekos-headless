import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
 import { Google_Sans_Flex } from 'next/font/google'
// Image metadata
export const alt = 'Om Utekos'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-google-sans',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
  axes: ['ROND', 'GRAD', 'wdth', 'opsz', 'slnt']
})

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontFamily: googleSansFlex.style.fontFamily,
          fontWeight: 700,
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Om Utekos
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image's
      // size config to also set the ImageResponse's width and height.
      ...size,
      fonts: [
        {
          name: 'Google Sans Flex',
          data: await readFile(
            join(process.cwd(), 'node_modules/@fontsource-variable/google-sans/files/google-sans-latin-wght-normal.woff2')
          ) as unknown as ArrayBuffer  ,
        style: 'normal',
        weight: 700,
      },
    ],
  });
}