// Path: src/app/handlehjelp/sammenlign-modeller/components/ComparisonTable.tsx
import {
  comparisonRows,
  modelRecommendations
} from '../utils/comparisonData'
import { TableCellContent } from './TableCellContent'

export function ComparisonTable() {
  return (
    <div className='max-w-full overflow-x-auto rounded-xl border border-card-foreground bg-card text-card-foreground contain-[paint]'>
      <table className='w-full min-w-[880px] border-collapse text-left'>
        <caption className='sr-only'>
          Sammenligning av Utekos Dun, Utekos Mikrofiber og
          Utekos TechDown
        </caption>
        <thead>
          <tr className='bg-featured text-foreground'>
            <th
              scope='col'
              className='font-google-sans w-[20%] p-5 font-sans text-base font-bold tracking-[-0.01em]'
            >
              Egenskap
            </th>
            {modelRecommendations.map(model => (
              <th
                key={model.key}
                scope='col'
                className='font-google-sans w-[26.6%] p-5 text-center font-sans text-base font-bold tracking-[-0.01em]'
              >
                {model.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonRows.map(row => (
            <tr
              key={row.feature}
              className='border-b border-card-foreground/20'
            >
              <th
                scope='row'
                className='font-google-sans p-5 align-top font-sans text-base leading-[1.05] font-bold tracking-[-0.01em] text-card-foreground'
              >
                <span>{row.feature}</span>
                <span className='mt-2 block text-xs leading-[1.35] font-medium text-muted-foreground'>
                  {row.shortAnswer}
                </span>
              </th>
              {modelRecommendations.map(model => (
                <td
                  key={model.key}
                  className='p-5 text-center align-top'
                >
                  <TableCellContent
                    value={row.values[model.key]}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
