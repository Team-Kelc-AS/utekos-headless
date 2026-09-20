// Path: src/components/footer/CopyrightNotice.tsx
const { COMPANY_NAME, SITE_NAME } = process.env
const COPYRIGHT_YEAR = '2026'

export function CopyrightNotice() {
  const copyrightName = COMPANY_NAME || SITE_NAME || ''
  const copyrightText = `${copyrightName}${
    copyrightName.length > 0 && !copyrightName.endsWith('.') ? '.' : ''
  }`

  return (
    <div className='mt-8 text-center'>
      <p className='text-xs font-sans'>
        &copy; {COPYRIGHT_YEAR} {copyrightText} Alle rettigheter forbeholdt. Utekos® er et registrert varemerke
        i Norge.
      </p>
    </div>
  )
}
