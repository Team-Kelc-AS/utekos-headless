# main-documentation

Utekos hoveddokumentasjon — kategori → forfatter → filnavn.

| Mappe                  | Innhold                                        |
| ---------------------- | ---------------------------------------------- |
| `01-work-utekos`       | JSON-LD, Utekos-spesifikke integrasjoner       |
| `02-development`       | Next.js, web-API, Google/Meta/Merchant, Klarna |
| `03-marketing-science` | Vitenskap (MDX), Byron Sharp, Ehrenberg-Bass   |
| `04-ux-design`         | UX-bøker og designreferanser                   |
| `05-industry-reports`  | Ipsos, bransjerapporter                        |
| `06-ai-technology`     | build-server, agent-dokumentasjon              |
| `07-brand-guidelines`  | Distinctive assets, brand identity             |
| `08-color-print`       | Pantone, fargespecifikasjon                    |
| `09-norwegian-media`   | Norske bransjedokumenter                       |
| `10-books-reference`   | PDF-bøker og referansebibliotek                |
| `11-data-exports`      | CSV, XLSX, analytics-eksporter                 |
| `12-images-assets`     | Bilder, fonter, screenshots                    |
| `14-agent-config`      | GA skills, agent-konfigurasjon                 |
| `15-remark`            | Remark/rehype toolchain-referanse              |
| `16-mdast`             | Markdown AST (mdast) spesifikasjon             |
| `17-remark`            | Remark plugin-referanse                        |
| `18-retext`            | Retext NLP-verktøy                             |
| `20-hast`              | Hypertext AST (HTML)                           |
| `21-unist`             | Universal Syntax Tree                          |
| `22-ts-morph`          | TypeScript AST (ts-morph)                      |
| `23-markdoc`           | Markdoc dokumentasjonsrammeverk                |
| `24-micromark`         | Micromark markdown-parser                      |
| `25-motion`            | Motion / Framer Motion animasjonsdokumentasjon |
| `react`                | React API docs mirror                          |

## Agent-inngang

1. [agents.txt](agents.txt) — startpunkt for agenter
2. [llms.txt](llms.txt) — full filindeks
3. [25-motion/agents.txt](25-motion/agents.txt) — Motion / Framer Motion
4. [25-motion/sitemap.md](25-motion/sitemap.md) — hierarkisk Motion-indeks
5. **`*.llm.md`** — ren tekst + metadata for LLM-innlesning
6. **`*.code.html`** — syntax-highlighted kode (rehype-starry-night)

## Verktøy

```bash
pnpm run optimize      # MDX-normalisering, frontmatter, .llm.md, .code.html
pnpm run index         # llms.txt + agents.txt + sitemap.xml
pnpm run report:quality  # extraction_quality rapport → _tools/logs/
pnpm run format:docs   # remark-cli format pass
```

## Filnavn

Kun denne rotfilen heter `README.md`. Importert dokumentasjon bruker beskrivende navn (f.eks. `merchant-api-v1-migration.md`, `upgrade-guide.md`) — ikke `README.md` i undermapper.

## Status (2026-06-22)

- **1371** indekserbare kildefiler
- **717 `.llm.md`** agent-kompanjonger
- **401 `.code.html`** syntax-highlighted kodepreviews
- Kategorier `16-mdast`–`25-motion` og `react` inkludert i indeks
- `rehype/` konsolidert inn i `15-remark/`
- Vitenskap-MDX: `intro-text`-divs unwrappet → ren markdown/MDX
- Lesbarhet: Flesch reading ease + grade level per dokument

Logg: `_tools/logs/`
