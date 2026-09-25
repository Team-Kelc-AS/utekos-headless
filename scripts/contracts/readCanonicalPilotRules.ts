import { readFileSync } from 'node:fs'
import { dirname, extname, posix, resolve } from 'node:path'
import ts from 'typescript'
import { z } from 'zod'
import {
  eventCatalog,
  type ProviderId
} from '../../src/lib/analytics/eventCatalog'
import { GOOGLE_COMMERCE_EVENT_MAP } from '../../src/lib/analytics/googleCommerceEventMapping'
import { META_COMMERCE_EVENT_MAP } from '../../src/lib/analytics/metaCommerceEventMapping'
import { microsoftCommerceRules } from '../../src/lib/analytics/microsoftCommerceRules'
import { PINTEREST_CANONICAL_EVENT_MAP } from '../../src/lib/analytics/pinterestEventMapping'
import { SNAPCHAT_CANONICAL_EVENT_MAP } from '../../src/lib/analytics/snapchatEventMapping'
import {
  controlConnectionSchema,
  controlRuntimeRuleSchema
} from '../../src/lib/canonical-control/controlDefinition'

type PilotEventName = 'add_to_cart' | 'purchase'
type ServerProviderId = Exclude<ProviderId, 'supabase'>
type ConnectionRelation = z.infer<
  typeof controlConnectionSchema
>['relation']

type ConnectionSpec = {
  fromPath: string
  fromSymbol: string
  relation: ConnectionRelation
  toPath: string
  toSymbol: string
}

const eventMappings = {
  add_to_cart: {
    google: {
      browserEventName:
        GOOGLE_COMMERCE_EVENT_MAP.add_to_cart.browser,
      serverEventName:
        GOOGLE_COMMERCE_EVENT_MAP.add_to_cart.server,
      source: 'src/lib/analytics/googleCommerceEventMapping.ts',
      sourceSymbol: 'GOOGLE_COMMERCE_EVENT_MAP'
    },
    meta: {
      browserEventName:
        META_COMMERCE_EVENT_MAP.add_to_cart.browser,
      serverEventName:
        META_COMMERCE_EVENT_MAP.add_to_cart.server,
      source: 'src/lib/analytics/metaCommerceEventMapping.ts',
      sourceSymbol: 'META_COMMERCE_EVENT_MAP'
    },
    microsoft_uet: {
      browserEventName:
        microsoftCommerceRules.add_to_cart.browser_event_name,
      serverEventName:
        microsoftCommerceRules.add_to_cart.server_event_name,
      source: 'src/lib/analytics/microsoftCommerceRules.ts',
      sourceSymbol: 'microsoftCommerceRules'
    },
    pinterest: {
      browserEventName:
        PINTEREST_CANONICAL_EVENT_MAP.add_to_cart.tag,
      serverEventName:
        PINTEREST_CANONICAL_EVENT_MAP.add_to_cart.api,
      source: 'src/lib/analytics/pinterestEventMapping.ts',
      sourceSymbol: 'PINTEREST_CANONICAL_EVENT_MAP'
    },
    snapchat: {
      browserEventName: SNAPCHAT_CANONICAL_EVENT_MAP.add_to_cart,
      serverEventName: SNAPCHAT_CANONICAL_EVENT_MAP.add_to_cart,
      source: 'src/lib/analytics/snapchatEventMapping.ts',
      sourceSymbol: 'SNAPCHAT_CANONICAL_EVENT_MAP'
    }
  },
  purchase: {
    google: {
      browserEventName:
        GOOGLE_COMMERCE_EVENT_MAP.purchase.browser,
      serverEventName: GOOGLE_COMMERCE_EVENT_MAP.purchase.server,
      source: 'src/lib/analytics/googleCommerceEventMapping.ts',
      sourceSymbol: 'GOOGLE_COMMERCE_EVENT_MAP'
    },
    meta: {
      browserEventName: META_COMMERCE_EVENT_MAP.purchase.browser,
      serverEventName: META_COMMERCE_EVENT_MAP.purchase.server,
      source: 'src/lib/analytics/metaCommerceEventMapping.ts',
      sourceSymbol: 'META_COMMERCE_EVENT_MAP'
    },
    microsoft_uet: {
      browserEventName:
        microsoftCommerceRules.purchase.browser_event_name,
      serverEventName:
        microsoftCommerceRules.purchase.server_event_name,
      source: 'src/lib/analytics/microsoftCommerceRules.ts',
      sourceSymbol: 'microsoftCommerceRules'
    },
    pinterest: {
      browserEventName:
        PINTEREST_CANONICAL_EVENT_MAP.purchase.tag,
      serverEventName:
        PINTEREST_CANONICAL_EVENT_MAP.purchase.api,
      source: 'src/lib/analytics/pinterestEventMapping.ts',
      sourceSymbol: 'PINTEREST_CANONICAL_EVENT_MAP'
    },
    snapchat: {
      browserEventName: SNAPCHAT_CANONICAL_EVENT_MAP.purchase,
      serverEventName: SNAPCHAT_CANONICAL_EVENT_MAP.purchase,
      source: 'src/lib/analytics/snapchatEventMapping.ts',
      sourceSymbol: 'SNAPCHAT_CANONICAL_EVENT_MAP'
    }
  }
} as const

const eventFlow = {
  add_to_cart: {
    acceptPath:
      'src/lib/analytics/server/acceptCanonicalAddToCart.ts',
    acceptSymbol: 'acceptCanonicalAddToCart',
    catalogProvidersSymbol: 'addToCartProviders',
    handlerPath:
      'src/lib/analytics/server/handleCanonicalAddToCartRequest.ts',
    handlerSymbol: 'handleCanonicalAddToCartRequest',
    persistenceFromPath:
      'src/app/api/events/add-to-cart/route.ts',
    persistenceFromSymbol: 'POST',
    routePath: 'src/app/api/events/add-to-cart/route.ts',
    suffix: 'AddToCart'
  },
  purchase: {
    acceptPath:
      'src/lib/analytics/server/acceptCanonicalPurchase.ts',
    acceptSymbol: 'acceptCanonicalPurchase',
    catalogProvidersSymbol: 'purchaseProviders',
    handlerPath:
      'src/lib/analytics/server/handleShopifyOrdersPaidWebhook.ts',
    handlerSymbol: 'handleShopifyOrdersPaidWebhook',
    persistenceFromPath:
      'src/lib/analytics/server/handleShopifyOrdersPaidWebhook.ts',
    persistenceFromSymbol: 'handleShopifyOrdersPaidWebhook',
    routePath:
      'src/app/api/shopify/webhooks/orders-paid/route.ts',
    suffix: 'Purchase'
  }
} as const

const providerOrder = [
  'google',
  'meta',
  'microsoft_uet',
  'pinterest',
  'snapchat'
] as const satisfies readonly ServerProviderId[]

const dispatchProviderOrder = [
  'supabase',
  ...providerOrder
] as const satisfies readonly ProviderId[]

function localImportPath(fromPath: string, specifier: string) {
  const path =
    specifier.startsWith('@/') ? `src/${specifier.slice(2)}`
    : specifier.startsWith('.') ?
      posix.normalize(posix.join(dirname(fromPath), specifier))
    : null
  if (!path) return null
  return extname(path) ? path : `${path}.ts`
}

function findDeclaration(file: ts.SourceFile, symbol: string) {
  for (const statement of file.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === symbol
    ) {
      return statement
    }
    if (!ts.isVariableStatement(statement)) continue
    const declaration =
      statement.declarationList.declarations.find(
        candidate =>
          ts.isIdentifier(candidate.name) &&
          candidate.name.text === symbol
      )
    if (declaration) return declaration
  }
  return null
}

export function readCanonicalPilotRules(root: string) {
  const sourceFiles = new Set<string>([
    'scripts/contracts/readCanonicalPilotRules.ts'
  ])
  const files = new Map<string, ts.SourceFile>()
  const read = (path: string) => {
    const cached = files.get(path)
    if (cached) return cached
    sourceFiles.add(path)
    const file = ts.createSourceFile(
      path,
      readFileSync(resolve(root, path), 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
    files.set(path, file)
    return file
  }
  const verifyConnection = (spec: ConnectionSpec) => {
    const fromFile = read(spec.fromPath)
    const toFile = read(spec.toPath)
    const fromDeclaration = findDeclaration(
      fromFile,
      spec.fromSymbol
    )
    const toDeclaration = findDeclaration(toFile, spec.toSymbol)
    if (!fromDeclaration || !toDeclaration) {
      throw new Error(
        `PILOT_RUNTIME_DECLARATION_MISSING: ${spec.fromSymbol} -> ${spec.toSymbol}`
      )
    }

    let localSymbol = spec.toSymbol
    if (spec.fromPath !== spec.toPath) {
      localSymbol = ''
      for (const node of fromFile.statements) {
        if (
          !ts.isImportDeclaration(node) ||
          !ts.isStringLiteral(node.moduleSpecifier) ||
          node.importClause?.isTypeOnly ||
          localImportPath(
            spec.fromPath,
            node.moduleSpecifier.text
          ) !== spec.toPath
        ) {
          continue
        }
        const bindings = node.importClause?.namedBindings
        if (!bindings || !ts.isNamedImports(bindings)) continue
        const binding = bindings.elements.find(
          candidate =>
            !candidate.isTypeOnly &&
            (candidate.propertyName?.text ??
              candidate.name.text) === spec.toSymbol
        )
        if (binding) {
          localSymbol = binding.name.text
          break
        }
      }
    }

    let used = false
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) && node.text === localSymbol) {
        used = true
      }
      ts.forEachChild(node, visit)
    }
    visit(fromDeclaration)
    if (!localSymbol || !used) {
      throw new Error(
        `PILOT_RUNTIME_BINDING_MISMATCH: ${spec.fromSymbol} -> ${spec.toSymbol}`
      )
    }
    return controlConnectionSchema.parse({
      from: { path: spec.fromPath, symbol: spec.fromSymbol },
      to: { path: spec.toPath, symbol: spec.toSymbol },
      relation: spec.relation,
      evidence: 'source_verified'
    })
  }

  const sharedSpecs: ConnectionSpec[] = [
    {
      fromPath:
        'src/lib/analytics/server/planCanonicalEventDispatch.ts',
      fromSymbol: 'planCanonicalEventDispatch',
      relation: 'reads_definition',
      toPath: 'src/lib/analytics/eventCatalog.ts',
      toSymbol: 'getEventCatalogEntry'
    },
    {
      fromPath:
        'src/lib/analytics/server/postgresCanonicalPageViewStore.ts',
      fromSymbol: 'transactionalCanonicalEventStore',
      relation: 'persists',
      toPath:
        'src/lib/analytics/server/createCanonicalEventStore.ts',
      toSymbol: 'createCanonicalEventStore'
    },
    {
      fromPath:
        'src/lib/analytics/server/postgresCanonicalPageViewStore.ts',
      fromSymbol: 'postgresCanonicalEventStore',
      relation: 'dispatches',
      toPath:
        'src/lib/analytics/server/canonicalProviderDispatchQueue.ts',
      toSymbol: 'publishCanonicalProviderDispatchAttempts'
    },
    {
      fromPath:
        'src/app/api/queues/canonical-provider-dispatch/route.ts',
      fromSymbol: 'defaultDependencies',
      relation: 'dispatches',
      toPath:
        'src/lib/analytics/server/runTargetedProviderOutboxAttempt.ts',
      toSymbol: 'runTargetedProviderOutboxAttempt'
    },
    {
      fromPath:
        'src/lib/analytics/server/runTargetedProviderOutboxAttempt.ts',
      fromSymbol: 'targetedProviderOutboxWorkerRegistry',
      relation: 'registers',
      toPath:
        'src/lib/analytics/server/providerAdapterRegistry.ts',
      toSymbol: 'providerAdapterRegistry'
    }
  ]

  const events: Record<
    string,
    {
      rules: z.infer<typeof controlRuntimeRuleSchema>[]
      connections: z.infer<typeof controlConnectionSchema>[]
    }
  > = {}

  for (const event of [
    'add_to_cart',
    'purchase'
  ] as const satisfies readonly PilotEventName[]) {
    const flow = eventFlow[event]
    const policy = eventCatalog[event]
    const mappings = eventMappings[event]
    const rules: z.infer<typeof controlRuntimeRuleSchema>[] = [
      controlRuntimeRuleSchema.parse(
        microsoftCommerceRules[event]
      )
    ]
    const specs: ConnectionSpec[] = [
      {
        fromPath: flow.routePath,
        fromSymbol: 'POST',
        relation: 'calls',
        toPath: flow.handlerPath,
        toSymbol: flow.handlerSymbol
      },
      {
        fromPath: flow.handlerPath,
        fromSymbol: flow.handlerSymbol,
        relation: 'calls',
        toPath: flow.acceptPath,
        toSymbol: flow.acceptSymbol
      },
      {
        fromPath: flow.persistenceFromPath,
        fromSymbol: flow.persistenceFromSymbol,
        relation: 'persists',
        toPath:
          'src/lib/analytics/server/postgresCanonicalPageViewStore.ts',
        toSymbol: 'postgresCanonicalEventStore'
      },
      {
        fromPath: flow.acceptPath,
        fromSymbol: flow.acceptSymbol,
        relation: 'plans',
        toPath:
          'src/lib/analytics/server/planCanonicalEventDispatch.ts',
        toSymbol: 'planCanonicalEventDispatch'
      },
      ...sharedSpecs
    ]

    for (const provider of providerOrder) {
      const mapping = mappings[provider]
      if (
        policy.providers[provider].eventName !==
        mapping.serverEventName
      ) {
        throw new Error(
          `PILOT_PROVIDER_MAPPING_MISMATCH: ${provider}:${event}`
        )
      }
      rules.push(
        controlRuntimeRuleSchema.parse({
          id: `${provider}.${event}.event_mapping.v1`,
          kind: 'provider_event_mapping',
          event,
          provider,
          browser_event_name: mapping.browserEventName,
          server_event_name: mapping.serverEventName,
          source: mapping.source,
          source_symbol: mapping.sourceSymbol
        })
      )
      specs.push({
        fromPath: 'src/lib/analytics/eventCatalog.ts',
        fromSymbol: flow.catalogProvidersSymbol,
        relation: 'uses_mapping',
        toPath: mapping.source,
        toSymbol: mapping.sourceSymbol
      })
    }

    for (const provider of dispatchProviderOrder) {
      const providerPolicy = policy.providers[provider]
      rules.push(
        controlRuntimeRuleSchema.parse({
          id: `${provider}.${event}.dispatch.v1`,
          kind: 'provider_dispatch',
          event,
          provider,
          lifecycle: policy.lifecycle,
          support: providerPolicy.support,
          consent_requirement: providerPolicy.consentRequirement,
          production_status: providerPolicy.productionStatus,
          server_outbox: providerPolicy.serverOutbox,
          source: 'src/lib/analytics/eventCatalog.ts',
          source_symbol: 'eventCatalog'
        })
      )
    }

    for (const provider of ['google', 'meta'] as const) {
      const prefix =
        provider === 'google' ? 'googleDataManager' : 'meta'
      const target =
        provider === 'google' ? 'GoogleDataManager' : 'Meta'
      const adapterSymbol = `${prefix}${flow.suffix}ProviderAdapter`
      const adapterPath = `src/lib/analytics/server/providerAdapters/${adapterSymbol}.ts`
      const dispatcherSymbol = `dispatchCanonical${flow.suffix}To${target}`
      const dispatcherPath = `src/lib/analytics/server/${dispatcherSymbol}.ts`
      const mapperSymbol = `mapCanonical${flow.suffix}To${target}`
      const mapperPath = `src/lib/analytics/server/${mapperSymbol}.ts`
      const senderSymbol =
        provider === 'google' ?
          'sendGoogleDataManagerEvent'
        : event === 'purchase' ?
          'sendMetaServerEvents'
        : 'sendMetaServerEvent'
      const senderPath =
        provider === 'google' ?
          'src/lib/analytics/server/sendGoogleDataManagerEvent.ts'
        : 'src/lib/analytics/server/sendMetaServerEvent.ts'
      specs.push(
        {
          fromPath:
            'src/lib/analytics/server/providerAdapterRegistry.ts',
          fromSymbol: 'providerAdapterRegistry',
          relation: 'registers',
          toPath: adapterPath,
          toSymbol: adapterSymbol
        },
        {
          fromPath:
            'src/lib/analytics/server/providerOutboxWorkerRegistry.ts',
          fromSymbol: 'providerOutboxWorkerRegistry',
          relation: 'registers',
          toPath: adapterPath,
          toSymbol: adapterSymbol
        },
        {
          fromPath: adapterPath,
          fromSymbol: adapterSymbol,
          relation: 'dispatches',
          toPath: dispatcherPath,
          toSymbol: dispatcherSymbol
        },
        {
          fromPath: dispatcherPath,
          fromSymbol: dispatcherSymbol,
          relation: 'uses_dependencies',
          toPath: dispatcherPath,
          toSymbol: 'defaultDependencies'
        },
        {
          fromPath: dispatcherPath,
          fromSymbol: 'defaultDependencies',
          relation: 'maps',
          toPath: mapperPath,
          toSymbol: mapperSymbol
        },
        {
          fromPath: dispatcherPath,
          fromSymbol: 'defaultDependencies',
          relation: 'sends',
          toPath: senderPath,
          toSymbol: senderSymbol
        },
        {
          fromPath: mapperPath,
          fromSymbol: mapperSymbol,
          relation: 'uses_mapping',
          toPath: mappings[provider].source,
          toSymbol: mappings[provider].sourceSymbol
        }
      )
    }

    const microsoftAdapterSymbol = `microsoftUet${flow.suffix}ProviderAdapter`
    const microsoftAdapterPath = `src/lib/analytics/server/providerAdapters/${microsoftAdapterSymbol}.ts`
    const microsoftDispatcherSymbol = `dispatchCanonical${flow.suffix}ToMicrosoftUet`
    const microsoftDispatcherPath = `src/lib/analytics/server/${microsoftDispatcherSymbol}.ts`
    const microsoftSenderSymbol = `sendMicrosoftUetCapi${flow.suffix}`
    const microsoftSenderPath = `src/lib/analytics/server/${microsoftSenderSymbol}.ts`
    const microsoftMapperSymbol = `mapCanonical${flow.suffix}ToMicrosoftUet`
    const microsoftBuilderSymbol = `buildMicrosoftUetCapi${flow.suffix}Request`
    const microsoftMapperPath = `src/lib/analytics/server/${microsoftMapperSymbol}.ts`
    specs.push(
      {
        fromPath:
          'src/lib/analytics/server/providerAdapterRegistry.ts',
        fromSymbol: 'providerAdapterRegistry',
        relation: 'registers',
        toPath: microsoftAdapterPath,
        toSymbol: microsoftAdapterSymbol
      },
      {
        fromPath:
          'src/lib/analytics/server/providerOutboxWorkerRegistry.ts',
        fromSymbol: 'providerOutboxWorkerRegistry',
        relation: 'registers',
        toPath: microsoftAdapterPath,
        toSymbol: microsoftAdapterSymbol
      },
      {
        fromPath: microsoftAdapterPath,
        fromSymbol: microsoftAdapterSymbol,
        relation: 'dispatches',
        toPath: microsoftDispatcherPath,
        toSymbol: microsoftDispatcherSymbol
      },
      {
        fromPath: microsoftDispatcherPath,
        fromSymbol: microsoftDispatcherSymbol,
        relation: 'uses_dependencies',
        toPath: microsoftDispatcherPath,
        toSymbol: 'defaultDependencies'
      },
      {
        fromPath: microsoftDispatcherPath,
        fromSymbol: 'defaultDependencies',
        relation: 'sends',
        toPath: microsoftSenderPath,
        toSymbol: microsoftSenderSymbol
      },
      {
        fromPath: microsoftSenderPath,
        fromSymbol: microsoftSenderSymbol,
        relation: 'maps',
        toPath: microsoftMapperPath,
        toSymbol: microsoftBuilderSymbol
      },
      {
        fromPath: microsoftMapperPath,
        fromSymbol: microsoftBuilderSymbol,
        relation: 'calls',
        toPath: microsoftMapperPath,
        toSymbol: microsoftMapperSymbol
      },
      {
        fromPath: microsoftMapperPath,
        fromSymbol: microsoftMapperSymbol,
        relation: 'maps',
        toPath:
          'src/lib/analytics/resolveMicrosoftCommerceRule.ts',
        toSymbol: 'resolveMicrosoftCommerceRule'
      },
      {
        fromPath:
          'src/lib/analytics/resolveMicrosoftCommerceRule.ts',
        fromSymbol: 'resolveMicrosoftCommerceRule',
        relation: 'reads_definition',
        toPath: 'src/lib/analytics/microsoftCommerceRules.ts',
        toSymbol: 'microsoftCommerceRules'
      }
    )

    for (const provider of ['pinterest', 'snapchat'] as const) {
      const title =
        provider === 'pinterest' ? 'Pinterest' : 'Snapchat'
      const adapterSymbol = `${provider}${flow.suffix}ProviderAdapter`
      const adapterPath = `src/lib/analytics/server/providerAdapters/${adapterSymbol}.ts`
      const factorySymbol = `create${title}ProviderAdapter`
      const factoryPath = `src/lib/analytics/server/${factorySymbol}.ts`
      const dispatcherSymbol = `dispatchCanonicalEventTo${title}`
      const dispatcherPath = `src/lib/analytics/server/${dispatcherSymbol}.ts`
      const mapperSymbol = `mapCanonicalEventTo${title}`
      const mapperPath = `src/lib/analytics/server/${mapperSymbol}.ts`
      const senderSymbol = `send${title}ServerEvent`
      const senderPath = `src/lib/analytics/server/${senderSymbol}.ts`
      specs.push(
        {
          fromPath:
            'src/lib/analytics/server/providerAdapterRegistry.ts',
          fromSymbol: 'providerAdapterRegistry',
          relation: 'registers',
          toPath: adapterPath,
          toSymbol: adapterSymbol
        },
        {
          fromPath:
            'src/lib/analytics/server/providerOutboxWorkerRegistry.ts',
          fromSymbol: 'providerOutboxWorkerRegistry',
          relation: 'registers',
          toPath: adapterPath,
          toSymbol: adapterSymbol
        },
        {
          fromPath: adapterPath,
          fromSymbol: adapterSymbol,
          relation: 'calls',
          toPath: factoryPath,
          toSymbol: factorySymbol
        },
        {
          fromPath: factoryPath,
          fromSymbol: factorySymbol,
          relation: 'dispatches',
          toPath: dispatcherPath,
          toSymbol: dispatcherSymbol
        },
        {
          fromPath: dispatcherPath,
          fromSymbol: dispatcherSymbol,
          relation: 'maps',
          toPath: mapperPath,
          toSymbol: mapperSymbol
        },
        {
          fromPath: dispatcherPath,
          fromSymbol: dispatcherSymbol,
          relation: 'sends',
          toPath: senderPath,
          toSymbol: senderSymbol
        },
        {
          fromPath: mapperPath,
          fromSymbol: mapperSymbol,
          relation: 'uses_mapping',
          toPath: mappings[provider].source,
          toSymbol: mappings[provider].sourceSymbol
        }
      )
    }

    const connections = specs
      .map(verifyConnection)
      .toSorted((left, right) =>
        `${left.from.path}:${left.from.symbol}:${left.relation}:${left.to.path}:${left.to.symbol}`.localeCompare(
          `${right.from.path}:${right.from.symbol}:${right.relation}:${right.to.path}:${right.to.symbol}`
        )
      )
    events[event] = { rules, connections }
  }

  return { events, sourceFiles: [...sourceFiles].sort() }
}
