import localFont from 'next/font/local'

export const vippsDisplay = localFont({
  src: './fonts/VippsDisplay-Regular-Web.woff2',
  display: 'swap',
  preload: true,
  weight: '400',
  style: 'normal',
  variable: '--font-vipps-display'
})

export const vippsText = localFont({
  src: [
    {
      path: './fonts/VippsText-Regular-Web.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: './fonts/VippsText-Bold-Web.woff2',
      weight: '700',
      style: 'normal'
    }
  ],
  display: 'swap',
  preload: true,
  variable: '--font-vipps-text'
})
