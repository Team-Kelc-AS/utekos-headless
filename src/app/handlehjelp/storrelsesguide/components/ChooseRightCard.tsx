import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
export function ChooseRightCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vårt beste tips for å velge riktig</CardTitle>
      </CardHeader>
      <CardDescription>
        Tenk på hvordan du vil bruke plagget. Ønsker du en
        passform som er romslig, men som følger deg? Velg din
        normale størrelse. Ser du for deg maksimal plass til
        tykke lag under, eller en bevisst overdimensjonert stil?
        Da kan du vurdere å gå opp en størrelse. Det er ingen
        fasit – det viktigste er hva du føler deg mest
        komfortabel i.
      </CardDescription>
    </Card>
  )
}
