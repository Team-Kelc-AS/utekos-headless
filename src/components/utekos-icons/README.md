# Utekos complete icon system

Complete merged icon set from the three supplied SVG archives.

- Unique icons: **138**
- Original set retained: **42**
- New unique icons added: **96**
- Exact duplicates skipped: **4**
- Allowed tones:
  - `orange` → `#b44701`
  - `light` → `#f0eee9`

## Usage

```tsx
import { SearchIcon, DeliveryIcon } from '@/components/icons'

<SearchIcon tone="orange" size={24} />
<DeliveryIcon tone="light" size={24} />
```

All visible source `fill` and `stroke` colors in the newly added icons are normalized to `currentColor`.
Structural colors inside SVG `<defs>` / `<clipPath>` are preserved because they are not presentation colors.

Suggested destination:

```text
src/components/icons/
```
