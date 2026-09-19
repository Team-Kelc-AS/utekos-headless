import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import ControlConsole from './ControlConsole'

export default function CanonicalControlPage() {
  return (
    <main className='control-shell'>
      <header>
        <UtekosWordmark className='control-wordmark' />
        <p>Privat operatørflate · kun lesing</p>
        <h1>Canonical Event Control</h1>
        <p>
          Én kilde for eventdefinisjoner, parametre og pipeline.
          Samme innhold for mennesker og agenter.
        </p>
      </header>
      <ControlConsole />
    </main>
  )
}
