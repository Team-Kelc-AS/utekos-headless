# TRACKING.md

## TAGS og PIXLER utenfor kodebasen

- Aktiv: [GTM Web](src/lib/analytics/gtm/always-updated-web-gtm-version.json)
- Pauset rollback-artefakt, skal ikke publiseres sammen med app-loaderen:
  [GTM Signals Gateway Canonical v1](scripts/tracking/gtm/signals-gateway-canonical-v1.html)

Appen eier Meta `fbq(...)`-hendelsene. Signals Gateway Pixel kan bare være en
automatisk transport/fork av disse hendelsene; manuelle `cbq('track')`- og
`cbq('trackCustom')`-kall er forbudt.

## SIGNALS GATEWAY GCP

### Services:

1. .agent/signals/signals-hub.yaml
2. .agent/signals/signals-capig.yaml

**Custom domain:** signals.utekos.no via the Signals Gateway GCP load balancer

**App kill switch:** `SIGNALS_GATEWAY_PIXEL_ENABLED` (serverlest, default `false`)

### GTM Servers:
1. .agent/gtm-servers/gtm-preview.yaml
**Custom domain:** None
3. .agent/gtm-servers/gtm-server.yaml
**Custom domain:** cloud.server.utekos.no


## Data Quality

**This has to be optimized at all times.**

Event match quality (EMQ) is a score (out of 10) that indicates how effective the customer information sent from the server may be at matching event instances to a Meta account. 
High quality event matching may improve ads attribution and performance. 

**Optimization:**
