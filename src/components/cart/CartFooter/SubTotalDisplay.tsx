/**
 * Pure component that renders the subtotal display.
 * Separates presentation logic from main component.
 */
export const SubtotalDisplay = ({
  subtotal
}: {
  subtotal: string
}): React.JSX.Element => (
  <div className='flex justify-between font-utekos-text-medium'>
    <span>Delsum</span>
    <span>{subtotal}</span>
  </div>
)
