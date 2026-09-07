import { registrySnapshotSchema } from './registrySnapshotSchema'

export function renderAudienceReview(input: unknown) {
  const r = registrySnapshotSchema.parse(input)
  const cell = (value: unknown) =>
    String(value ?? 'Uavklart')
      .replaceAll('|', '\\|')
      .replaceAll('\n', ' ')
  return [
    '# Utekos – publikumskart og firekriteriers-test',
    '',
    `Avlest: ${r.observedAt}. Graph API ${r.graphApiVersion}. Konto ${r.account.id}.`,
    '',
    '## Status',
    '',
    '**Ingen Meta-labels, medlemskap, regler eller kampanjer er endret av denne kjøringen. Ingen A/B-test er opprettet eller startet.**',
    '',
    `Registeret omfatter ${r.audiences.length} publikum, ${r.audiences.filter(a => a.subtype === 'CUSTOM').length} kundelister og ${r.audiences.filter(a => a.subtype === 'LOOKALIKE').length} lookalikes.`,
    '',
    `Shopify: ${r.buyerSnapshot.total} kundeprofiler, ${r.buyerSnapshot.buyerProfiles} med ordre. ${r.localAudit.excludedBuyers} eksakte kjøpertreff i de gjeldende prospektfilene mot dette grunnlaget og ${r.buyerSnapshot.historicalBuyerRows} historiske kjøperrader. Offline-dekning er ikke bekreftet fullstendig.`,
    '',
    `Lokalt: ${r.localAudit.uniqueIdentities} unike identiteter passerer formatkontrollen. ${r.localAudit.invalidRows} rader er satt til gjennomgang, ${r.localAudit.ambiguousRows} rader har motstridende identifikatorer. Dette er ikke Meta-matcher. Ingen kildefiler er omskrevet.`,
    '',
    '## Forretningssegmenter',
    '',
    '| Segment | Planlagt label | Unike formatvaliderte identiteter | Kjente kjøpertreff |',
    '|---|---|---:|---:|',
    ...r.segments.map(s => {
      const n = r.localAudit.segments.find(a => a.key === s.key)
      return `| ${cell(s.key)} | ${cell(s.label)} | ${n?.uniqueIdentities ?? 'Uavklart'} | ${n?.excludedBuyers ?? 'Uavklart'} |`
    }),
    '',
    'Filene er transportpartisjoner. Ingen Meta-medlemskap antas bevist av samme filnavn eller lignende estimert størrelse.',
    '',
    '| Segmentpar | Overlappende formatvaliderte identiteter |',
    '|---|---:|',
    ...r.localAudit.overlap.map(
      pair =>
        `| ${cell(pair.left)} × ${cell(pair.right)} | ${pair.identities} |`
    ),
    '',
    '## Eldre lister og kundeseeds – lokal kildekontroll',
    '',
    '| Kilde | Meta-ID (kandidatkobling) | Rader | Verdikolonne med tall | Sterke kjøpertreff | Uavklart identitet/kjøperstatus |',
    '|---|---|---:|---:|---:|---:|',
    ...(r.legacySources ?? []).map(
      s =>
        `| ${cell(s.file)} | ${s.audienceId} | ${s.rowCount} | ${s.numericValueRows} | ${s.strongBuyerMatchAudit?.excludedBuyers ?? 'Uavklart'} | ${s.strongBuyerMatchAudit?.unmatchedBuyerStatus ?? 'Uavklart'} |`
    ),
    '',
    'Liste 14/15 sammenlignes med de to gjeldende campingvognfilene via eksakt normalisert telefon. Kjøpertreff bruker også e-post der kilden har dette. Filinnhold beviser ikke at samme versjon ligger i Meta. En verdikolonne dokumenterer heller ikke dekningsbidrag. Originalfilene beholdes.',
    '',
    '| Tilleggskilde | Unike telefoner | Også i gjeldende campingvognpartisjoner | Kjente kjøpertelefoner | Ikke i campingvognpartisjoner og ikke kjent kjøper |',
    '|---|---:|---:|---:|---:|',
    ...(r.legacySources ?? [])
      .filter(source => source.segment === 'caravan')
      .map(
        source =>
          `| ${cell(source.file)} | ${source.comparison.sourceUniquePhones} | ${source.comparison.alsoInCurrentSegment} | ${source.comparison.knownBuyerPhones} | ${source.comparison.sourceNotInCurrentAndNotKnownBuyer} |`
      ),
    '',
    'Tilleggslistene er ikke inkludert i de åtte grunnpartisjonenes total. Tallene over skal ikke summeres til en samlet unik utvidelse uten kryssjekk mellom liste 14, liste 15 og øvrige segmenter.',
    '',
    '## Foreslått label-migrering – ikke utført',
    '',
    '| Meta-ID | Før | Foreslått etter | Andre eksisterende brukere av mållabelen |',
    '|---|---|---|---|',
    ...r.segments.flatMap(s =>
      s.audienceIds.map(
        id =>
          `| ${id} | ${cell(r.audiences.find(a => a.id === id)?.audience_labels.join(', ') || 'Ingen')} | ${s.label} | ${
            r.audiences
              .filter(
                a =>
                  !s.audienceIds.includes(a.id) &&
                  a.audience_labels.some(
                    label => label.toUpperCase() === s.label
                  )
              )
              .map(a => `${a.id} (${a.subtype})`)
              .join(', ') || 'Ingen funnet'
          } |`
      )
    ),
    '',
    'Gamle labels må ikke flyttes uten kontroll av eksisterende regler og aktive annonsesett. Lookalikes får ingen automatisk kundestatus. Arvet versus eksplisitt label er fortsatt uavklart.',
    '',
    '## Regelsett og koblinger',
    '',
    '| ID | Navn | Tilknyttede annonsesett ved avlesning |',
    '|---|---|---|',
    ...r.ruleSets.map(
      s =>
        `| ${s.id} | ${cell(s.name)} | ${s.attachedAdsets.join(', ') || 'Ingen funnet i dette uttrekket; ny kontroll kreves før gjenbruk'} |`
    ),
    '',
    '## Kundelister – førtilstand og kildekobling',
    '',
    '| Meta-ID | Navn | Labels | Verdibasert | Kildeopplysning fra Meta | Kildekobling |',
    '|---|---|---|---|---|---|',
    ...r.audiences
      .filter(a => a.subtype === 'CUSTOM')
      .map(
        a =>
          `| ${a.id} | ${cell(a.name)} | ${cell(a.audience_labels.join(', ') || 'Ingen')} | ${String(a.is_value_based ?? 'Uavklart')} | ${cell(a.customer_file_source)} | ${cell(a.segment ?? 'Uavklart')} – ${cell(a.provenance)} |`
      ),
    '',
    'Alle lookalikes, deres kilde-ID-er, labels og annonsesettbruk finnes i registry.json og det beskyttede Supabase-registeret. En lookalike med kundelabel er ikke en kjøperliste.',
    '',
    '## Testspesifikasjon – ikke opprettet i Ads Manager',
    '',
    '- TechDown på lager, godkjent materiell og https://utekos.no/skreddersy-varmen.',
    '- A: ingen Value Rules. B: fire kriterier +20 % først; bobil generelt +10 % etterpå; standard uendret.',
    '- 50/50 randomiserte, gjensidig utelukkende Meta-testceller. To ordinære annonsesett er ikke en godkjent erstatning.',
    '- 14 dager. 21 000 kr per celle, samlet maksimalt 42 000 kr; gjennomsnitt 3 000 kr/dag. Ingen automatisk forlengelse.',
    '- Felles kjøpereksklusjoner; Website Visitors L180 skal ikke ekskluderes i de nye testcellene.',
    '- 95 % konfidensnivå. Manglende datagrunnlag betyr «ikke avgjort». Ukjent kundestatus er ikke bekreftet ny kunde.',
    '- Datoer, kostnader, tapsgrense, godkjente annonse-/produktsett-ID-er og studie-ID er ikke fylt inn.',
    '',
    '## Stoppunkter',
    '',
    ...r.blockers.map(b => `- ${b}`),
    '',
    '## Dokumentasjon',
    '',
    '- [Meta Value Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules)',
    '- [Meta kriterier og første treff](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding-and-optimization/bid-multiplier)',
    '- [Meta kundelister og batchkontrakt](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences)',
    '- [Meta Split Testing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/split-testing)',
    '- [Shopify Customer](https://shopify.dev/docs/api/admin-graphql/2026-07/objects/Customer)',
    '- [Supabase tilgangskontroll](https://supabase.com/docs/guides/api/securing-your-api)',
    '- [EBM: penetrasjon og bred kategorirekkevidde](https://github.com/utekos-brand/ebm/blob/fa76572d70dae8fdf2795fd3f773895604b6d7f3/how-brands-grow/01-Chapter-One.md)',
    '- [EBM: balansert måling – kuratert Binet/Field-syntese](https://github.com/utekos-brand/ebm/blob/848bd7dd4005dde01c7990a301d2f100370086bb/the-long-and-short-of-it/oppsummering-agent-optimalisert.md)',
    '',
    'Twilio-rammen er brukt til kilde-, segment- og tillatelsessporbarhet, ikke til SMS eller en ny kanal. Evidence-Based Marketing holder den forhåndsdefinerte hypotesen atskilt fra dokumentert effekt. +20/+10 er testpåslag, ikke en effektgaranti.',
    '',
    'EBM-kildene er versjonslåste, med korpusdato 2026-07-11, og gir et strategisk utgangspunkt – ikke bevis for dagens kanaløkonomi eller for at Utekos-regelen vil vinne. Verktøyet for automatisk beslutningsbrief er ikke eksponert. De to relevante evidensseksjonene er hentet og gjennomgått i denne implementeringsrunden.',
    ''
  ].join('\n')
}
