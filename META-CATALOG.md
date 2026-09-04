# Meta-katalog v26

## Fast kontrakt

- Katalog: `690208780604782`
- Eier: Business `538548380599665`
- Primær datakilde: Utekos App Master `1154247890253046`
- Batch-datakilde: `25304523395872924`
- Graph API: alltid `v26.0`
- Produktdata: Shopify Admin API er sannhetskilde for pris, lager, GTIN, MPN og variantvekt.
- Presentasjon: Utekos-kode er sannhetskilde for offentlig tittel, beskrivelse, produktkategori, offentlig URL og tillatte annonsemedier.
- Offentlig produkt-URL: kun `https://utekos.no`; `kasse.utekos.no` er forbudt.
- Mobil-URL: utelates så lenge samme responsive Utekos-PDP brukes på mobil og desktop.

## Sortiment

| Familie | Publisert | Staging | Ekskludert |
| --- | ---: | ---: | --- |
| Utekos TechDown™ Havdyp | Middels, Stor, Større | – | Liten |
| Utekos Mikrofiber™ Fjellblå | Medium, Large | – | – |
| Utekos Mikrofiber™ Vargnatt | – | Medium, Large | – |
| Utekos Dun™ | – | 4 varianter | – |
| Comfyrobe™ Fjellnatt | XS, XL | – | M/M-L |
| Utekos Stapper™ | OneSize | – | – |

Forventet kontrakt er 14 oppdaterte varer: 8 `published`, 6 `staging`, 4 aktive produktgrupper, 0 uten GTIN, 0 uten MPN og 0 Shopify-kasse-lenker. Stapper beholdes fordi Collection-formatet krever minst fire unike produkter, og de øvrige aktive variantene utgjør bare tre produktgrupper.

Varianttitler følger `Produkt Farge - Størrelse`, for eksempel `Utekos TechDown™ Havdyp - Stor`. Meta oppretter den virtuelle foreldregruppen fra felles `item_group_id`; `product_groups`-kanten har ingen create/update-operasjon og tilbyr derfor ikke en separat skrivbar foreldretittel. En kort produktnivåtittel kan ikke styres uavhengig av varianttitlene i denne katalogmodellen.

## Synkronisering

`pnpm run meta:catalog:plan` er alltid tørrkjøring. Kommandoen henter ferske Shopify-data og stopper hvis sortiment-, identifikator-, vekt- eller URL-kontrakten ikke stemmer.

`pnpm run meta:catalog:sync` sender den validerte planen til `POST /v26.0/{catalog_id}/items_batch`, venter på batch-status og feiler hvis Meta rapporterer feil eller ugyldige ID-er.

Produksjonscron ligger på `/api/cron/meta-catalog-sync` og kjører hvert 15. minutt. Den er fail-closed og krever alle disse miljøvariablene:

- `CATALOG_API_TOKEN`
- `CRON_SECRET`
- `META_CATALOG_SYNC_ENABLED=true`

Tilgangstoken sendes i `Authorization`-headeren og aldri i URL eller logger.

Den offentlige `/meta-catalog.tsv` er en kontroll- og fallback-feed. Den inneholder bare de åtte publiserte variantene. Batch API beholder i tillegg de seks utsolgte variantene som komplette staging-varianter, slik at variantstrukturen ikke mister data.

## Feltdekning

Batchen setter dokumenterte felt som er kjent for hvert produkt: ID, tittel, plain-text-beskrivelse, rich-text-beskrivelse, kort beskrivelse, tilgjengelighet, synlighet, tilstand, ordinær pris, salgspris, offentlig lenke, kuraterte bilder, kuraterte videoer når de finnes, merke, variantgruppe, Google- og Facebook-kategori, produkttype, GTIN, MPN, farge, størrelse, kjønn, aldersgruppe, materiale, strukturert fraktpris og -tjeneste, variantvekt som `shipping_weight`, internetiketter, fem egendefinerte etiketter, lagerantall som `custom_number_0` og rekkefølge i variantgruppen.

`return_policy_info` sendes ikke til `/items_batch`, fordi feltet ikke finnes i den dokumenterte PRODUCT_ITEM-skrivekontrakten. Utekos-policyen er 14 dagers retur-/angrerett regnet fra mottak, og fraktløftet er 1–4 dager. Item-level frakt sendes både i den strukturerte v26-batchen og TSV-formatet. Returpolicy må publiseres på den støttede merchant/storefront-policyflaten, ikke som et oppdiktet batchfelt.

Metas shipping-profiler og produktspesifikke returvinduer er dokumentert for Commerce Platform/onsite-ordre. Den nåværende Utekos-integrasjonen er offsite. En v26-lesing av Business-kontoens `commerce_merchant_settings` med katalogtokenet returnerte `OAuthException` kode 200 (appen mangler nødvendig permission/capability), så ingen Commerce Merchant Settings-flate er verifisert eller endret.

`quantity_to_sell_on_facebook` utelates fordi katalogen peker til Utekos' egen checkout og ikke bruker Meta checkout.

`origin_country` utelates. Kina (`CN`) er kjent som mulig verdi, men feltet gir ingen dokumentert ytelsesfordel som forsvarer å sende en generell opprinnelse uten en egen, variantverifisert datakilde.

## Produktsett

Aktive annonser skal bruke et sett som filtrerer `availability = in stock`. Familie- og kampanjesett skal bygges på stabile `internal_label`-verdier, ikke titteltekst. Tittelbaserte eldre sett må ikke slettes før det er kontrollert at ingen aktive annonsegrupper eller kreativer bruker dem.

Interne etiketter kan endres uten den samme policygjennomgangen som egendefinerte etiketter, og er derfor primær mekanisme for fremtidige produktsett. Egendefinerte etiketter beholdes for rapportering og visningsoverlegg.

## Bilder og video

Alle medier må være eksplisitt kuratert i mediemanifestet. Shopify-produktgalleriet blir ikke automatisk sluppet inn i Meta-katalogen.

Nye bildefiler, videofiler og medie-URL-er er utsatt. Første synk beholder derfor de eksisterende kuraterte mediene i manifestet; dette skal ikke åpne for automatisk bruk av øvrige Shopify-bilder.

Opprett disse bildeflatene per produkt/farge:

- `1080 × 1350` (4:5): primær Feed-flate og anbefalt master.
- `1080 × 1080` (1:1): carousel og kvadratiske flater.
- `1200 × 628` (ca. 1.91:1): valgfri liggende variant.
- `1080 × 1920` (9:16): separat placement-asset for Stories/Reels når det brukes i annonsekreativet.

Meta krever minst 500 × 500 for katalogbilder. Enkeltbilde støtter omtrent 4:5 til 1.91:1; carousel beskjæres til 1:1.

Opprett disse produktvideoene per produkt/farge:

- `1080 × 1350` (4:5), primær katalogvideo.
- `1080 × 1080` (1:1), kvadratisk variant.
- `1080 × 1920` (9:16), Stories/Reels-variant.

Praktisk mål er 6–10 sekunder per video. Metas generelle anbefalte arbeidsområde er 6–15 sekunder; katalogspesifikasjonen oppgir ingen hard maksimal varighet. Produkt og merke må være tydelig innen de første 2–3 sekundene, med CTA omtrent ved sekund 5–6. Filen må være direkte nedlastbar over HTTPS, minst 500 × 500 og maksimalt 200 MB.

Når alle relevante videoformater finnes, kan Meta velge format som matcher plasseringen og unngå automatisk beskjæring. Katalogens media-tags er ikke en deterministisk plasseringstildeling. Absolutt kontroll per placement må gjøres i annonsekreativets asset customization; Advantage+ catalog ads kan ellers velge blant kvalifiserte katalogmedier.

Shopify Files/CDN er foretrukket for varige produktbilder og videoer fordi redaksjonell forvaltning og direkte nedlasting blir enklere. Små statiske bilder kan ligge i Vercel-prosjektets `public`-flate. Store videoer skal ikke lagres i kodebasen eller bygges inn i Vercel-deployen.

## Apper og webhooks

Utekos App `2031748470995074` er legacy og skal kobles fra katalogen. Utekos App Master `1154247890253046` beholdes som datakilde.

`pnpm run meta:catalog:legacy-app:plan` viser det eksakte målet uten skriving. `pnpm run meta:catalog:legacy-app:disconnect` sender en v26 `DELETE` som bare inneholder legacy-app-ID-en.

Webhook-endepunktet er `/api/webhooks/meta/catalog`. Det støtter challenge-verifisering og HMAC SHA-256-verifisering av `items_batch`- og `product_feed`-hendelser. Det krever:

- `META_APP_SECRET`
- `META_CATALOG_WEBHOOK_VERIFY_TOKEN`

Meta App Dashboard viser per 4. september 2026 at kontakt-e-post er registrert, at alle nødvendige appinnstillinger er komplette, og at App Master ikke har noen utestående «Required actions». Graph-lesingen viser likevel `contact_email_verified=false`, og Meta dokumenterer ikke en separat validerings-e-post for dette feltet. Flagget behandles derfor ikke som en blokkering når publiseringsflaten eksplisitt godkjenner appinnstillingene.

App Master må fortsatt være live, endepunktet må være produksjonsdeployet, appen må abonnere på katalogfeltene, og katalogen må kobles til app-abonnementet før webhook kan regnes som etablert.

## Metodevalg

| Metode | Rolle | Fordel | Begrensning |
| --- | --- | --- | --- |
| Catalog API v26 | Primær runtime-skriving | Full kontroll over batch, media og de nyeste katalogfeltene | Krever egen validering, statuskontroll og drift |
| Meta Business SDK 26.0.1 | Andre Marketing API-/CAPI-overflater | Offisielle objekter og enum-kontrakter | Generert SDK kan ligge etter dokumenterte felt og gir lite verdi for selve `items_batch`-payloaden |
| Meta MCP | Diagnose og operatørarbeid | Live katalog-, diagnostikk-, app- og annonseinnsikt | Ikke egnet som deterministisk, uovervåket cron-runtime |
| Offentlig TSV | Kontroll og fallback | Menneskelig inspeksjon og enkel feed-ingest | Maks én planlagt oppdatering per time og svakere respons på lagerendringer |

Anbefalt løsning er derfor en miks: Catalog API v26 for kontrollert runtime-synk, MCP for diagnostikk og operatørarbeid, SDK der SDK-objektene faktisk gir typeverdi, og TSV som kontroll/fallback.

## Offisielle kilder

- [Product Catalog Items Batch](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch)
- [Check Batch Request Status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/check_batch_request_status)
- [Catalog Fields](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/catalog/fields)
- [Catalog inventory best practices](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/best-practices/inventory)
- [Commerce Merchant Settings API](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/commerce-merchant-settings-api)
- [Shipping and fulfillment](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/best-practices/ship-fulfillment)
- [Allow product video in Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video)
- [Meta catalog product video](https://www.facebook.com/business/help/412185511855836)
- [Collection ads product minimum](https://www.facebook.com/business/help/599014736904594)
