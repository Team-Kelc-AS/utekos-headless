import {
  getLastUserText,
  type AssistantChatRequest,
  type AssistantProduct
} from '../assistantProtocol'
import { normalizeAssistantText } from '../assistantProductProfiles'

export type AssistantStockAvailability =
  | { kind: 'product'; availableForSale: boolean }
  | { kind: 'variant'; availableForSale: boolean; label: string }
  | { kind: 'clarify' }

type StockOptionChoice = {
  normalizedName: string
  value: string
  normalizedValue: string
  order: number
}

type StockOptionDimension = {
  normalizedName: string
  order: number
  values: Map<string, string>
}

type TextMatch = { start: number; end: number }

type StockValueMention = TextMatch & {
  normalizedValue: string
  dimensions: StockOptionDimension[]
}

type StockDimensionMention = TextMatch & {
  dimension: StockOptionDimension
}

type ExplicitMentionResolution =
  | { kind: 'none' }
  | { kind: 'selected'; dimension: StockOptionDimension }
  | { kind: 'ambiguous'; dimensions: StockOptionDimension[] }

type ExplicitMentionScore = {
  connectorRank: number
  distance: number
}

type StockOptionState =
  | { kind: 'selected'; choice: StockOptionChoice }
  | { kind: 'ambiguous' }

const variantQuestionPattern =
  /\b(?:størrelse|storrelse|str|size|farge|farve|variant|modell)\b/u

const bareValuePrefixCuePattern =
  /(?:^|[^\p{L}\p{N}])(?:vil(?:\s+gjerne)?\s+ha|ønsker|trenger|velger|bytt(?:er)?(?:\s+til)?|heller|ta(?:r)?|skal\s+ha|har\s+dere|finnes|sjekk(?:e|er)?(?:\s+om)?|lagerstatus|hva\s+med)\s*$/u

const bareValueAvailabilitySuffixPattern =
  /^\s*(?:(?:er|blir)\s+)?(?:tilgjengelig|på\s+lager|utsolgt)\s*$/u

const bareValueSelectionSuffixPattern =
  /^\s*(?:vil\s+(?:jeg\s+)?(?:gjerne\s+)?ha|ønsker\s+(?:jeg\s+)?|trenger\s+(?:jeg\s+)?|passer\s+(?:for\s+)?meg)\s*$/u

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findExactTextMatches(
  normalizedText: string,
  normalizedValue: string
): TextMatch[] {
  const pattern = escapeRegularExpression(
    normalizedValue
  ).replace(/\s+/gu, '\\s+')

  return [
    ...normalizedText.matchAll(
      new RegExp(
        `(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`,
        'gu'
      )
    )
  ].map(match => {
    const start = match.index ?? 0

    return { start, end: start + match[0].length }
  })
}

function getStockOptionDimensions(product: AssistantProduct) {
  const dimensions = new Map<string, StockOptionDimension>()
  let order = 0

  for (const variant of product.variants) {
    for (const option of variant.selectedOptions) {
      const normalizedName = normalizeAssistantText(option.name)
      const normalizedValue = normalizeAssistantText(
        option.value
      )
      const dimension = dimensions.get(normalizedName)

      if (dimension) {
        if (!dimension.values.has(normalizedValue)) {
          dimension.values.set(normalizedValue, option.value)
        }
        continue
      }

      dimensions.set(normalizedName, {
        normalizedName,
        order,
        values: new Map([[normalizedValue, option.value]])
      })
      order += 1
    }
  }

  return dimensions
}

function getStockValueMentions(
  normalizedText: string,
  dimensions: Map<string, StockOptionDimension>
) {
  const dimensionsByValue = new Map<
    string,
    StockOptionDimension[]
  >()

  for (const dimension of dimensions.values()) {
    for (const normalizedValue of dimension.values.keys()) {
      const valueDimensions =
        dimensionsByValue.get(normalizedValue) ?? []
      valueDimensions.push(dimension)
      dimensionsByValue.set(normalizedValue, valueDimensions)
    }
  }

  return [...dimensionsByValue].flatMap(
    ([normalizedValue, valueDimensions]) =>
      findExactTextMatches(normalizedText, normalizedValue).map(
        match => ({
          ...match,
          normalizedValue,
          dimensions: valueDimensions
        })
      )
  )
}

function getStockDimensionMentions(
  normalizedText: string,
  dimensions: Map<string, StockOptionDimension>
) {
  return [...dimensions.values()].flatMap(dimension =>
    findExactTextMatches(
      normalizedText,
      dimension.normalizedName
    ).map(match => ({ ...match, dimension }))
  )
}

function getTextBetweenMatches(
  text: string,
  left: TextMatch,
  right: TextMatch
) {
  if (left.end <= right.start) {
    return text.slice(left.end, right.start)
  }

  return text.slice(right.end, left.start)
}

function isNumericUnitValueMention(
  normalizedText: string,
  valueMention: StockValueMention
) {
  return (
    /^\p{L}$/u.test(valueMention.normalizedValue) &&
    /\p{N}(?:[.,]\p{N}+)?\s*$/u.test(
      normalizedText.slice(0, valueMention.start)
    )
  )
}

function isNegatedValueMention(
  normalizedText: string,
  valueMention: StockValueMention
) {
  const beforeValue = normalizedText.slice(0, valueMention.start)
  const afterValue = normalizedText.slice(
    valueMention.end,
    valueMention.end + 64
  )
  const afterValueClause =
    afterValue.split(/[,.!?;\n]/u, 1)[0]?.slice(0, 48) ?? ''

  return (
    /\b(?:ikke|ingen|uten)\b[^,.!?;\n]{0,24}$/u.test(
      beforeValue
    ) ||
    /(?<![\p{L}\p{N}])(?:vil\s+(?:jeg\s+)?(?:helst\s+)?ikke\s+ha|ønsker\s+(?:jeg\s+)?(?:helst\s+)?ikke|skal\s+(?:jeg\s+)?ikke\s+ha|(?:passer|fungerer)(?:\s+\p{L}+){0,3}\s+ikke)(?![\p{L}\p{N}])/u.test(
      afterValueClause
    )
  )
}

function getExplicitConnectorRank(connector: string) {
  if (/\ber\b|[:=/#-]|\(/u.test(connector)) {
    return 0
  }

  return connector.includes(',') ? 2 : 1
}

function compareExplicitMentionScores(
  left: ExplicitMentionScore,
  right: ExplicitMentionScore
) {
  return (
    left.connectorRank - right.connectorRank ||
    left.distance - right.distance
  )
}

function getExplicitMentionScore(
  normalizedText: string,
  dimensionMention: StockDimensionMention,
  valueMention: StockValueMention
) {
  const dimensionBeforeValue =
    dimensionMention.end <= valueMention.start
  const valueBeforeDimension =
    valueMention.end <= dimensionMention.start

  if (!dimensionBeforeValue && !valueBeforeDimension) {
    return null
  }

  const connector = getTextBetweenMatches(
    normalizedText,
    dimensionMention,
    valueMention
  )

  if (connector.length > 48 || /[.!?;\n]/u.test(connector)) {
    return null
  }

  const connectorIsValid =
    dimensionBeforeValue ?
      /^(?:[\s,:=()/#-]*|[\s,:=()/#-]*\ber\b[\s,:=()/#-]*)$/u.test(
        connector
      )
    : /^[\s()/#-]*$/u.test(connector)

  if (!connectorIsValid) {
    return null
  }

  return {
    connectorRank: getExplicitConnectorRank(connector),
    distance: connector.length
  }
}

function findExplicitMentionDimension(
  normalizedText: string,
  valueMention: StockValueMention,
  dimensionMentions: StockDimensionMention[]
): ExplicitMentionResolution {
  const candidates = dimensionMentions
    .filter(({ dimension }) =>
      dimension.values.has(valueMention.normalizedValue)
    )
    .flatMap(mention => {
      const score = getExplicitMentionScore(
        normalizedText,
        mention,
        valueMention
      )

      return score === null ? [] : [{ mention, score }]
    })
    .toSorted((left, right) =>
      compareExplicitMentionScores(left.score, right.score)
    )

  const closest = candidates[0]

  if (!closest) {
    return { kind: 'none' } satisfies ExplicitMentionResolution
  }

  const closestDimensions = [
    ...new Map(
      candidates
        .filter(
          candidate =>
            compareExplicitMentionScores(
              candidate.score,
              closest.score
            ) === 0
        )
        .map(({ mention: { dimension } }) => [
          dimension.normalizedName,
          dimension
        ])
    ).values()
  ]

  if (closestDimensions.length > 1) {
    return { kind: 'ambiguous', dimensions: closestDimensions }
  }

  const [dimension] = closestDimensions

  if (!dimension) {
    return { kind: 'none' }
  }

  return { kind: 'selected', dimension }
}

function removeTextMatches(text: string, matches: TextMatch[]) {
  const mergedMatches = matches
    .toSorted((left, right) => left.start - right.start)
    .reduce<TextMatch[]>((merged, match) => {
      const previous = merged.at(-1)

      if (!previous || match.start > previous.end) {
        merged.push({ ...match })
      } else {
        previous.end = Math.max(previous.end, match.end)
      }

      return merged
    }, [])

  return mergedMatches
    .toReversed()
    .reduce(
      (result, match) =>
        `${result.slice(0, match.start)} ${result.slice(match.end)}`,
      text
    )
}

function removeProductMentions(
  normalizedText: string,
  product: AssistantProduct
) {
  const normalizedTitle = normalizeAssistantText(
    product.title.replace(/[™®]/gu, '')
  )
  const normalizedHandle = normalizeAssistantText(
    product.handle.replace(/[-_]+/gu, ' ')
  )
  const aliases = new Set(
    [normalizedTitle, normalizedHandle]
      .flatMap(value => [
        value,
        value.replace(/^utekos\s+/u, '')
      ])
      .filter(value => value.length >= 3)
  )
  const matches = [...aliases].flatMap(alias =>
    findExactTextMatches(normalizedText, alias)
  )

  return removeTextMatches(normalizedText, matches)
    .replace(/\s+/gu, ' ')
    .trim()
}

function containsOnlyBareOptionSyntax(
  normalizedText: string,
  valueMentions: StockValueMention[]
) {
  const remainder = removeTextMatches(
    normalizedText,
    valueMentions
  )
    .replace(/[?!.,:;()[\]{}\\/+_-]/gu, ' ')
    .replace(
      /\b(?:eller|og|i|på|til|den|det|en|et|av|med)\b/gu,
      ' '
    )
    .trim()

  return remainder.length === 0
}

function hasDirectBareValueCue(
  normalizedText: string,
  valueMention: StockValueMention,
  valueMentions: StockValueMention[]
) {
  const beforeValue = normalizedText.slice(0, valueMention.start)
  const clauseStart = Math.max(
    beforeValue.lastIndexOf('.'),
    beforeValue.lastIndexOf(','),
    beforeValue.lastIndexOf('!'),
    beforeValue.lastIndexOf('?'),
    beforeValue.lastIndexOf(';'),
    beforeValue.lastIndexOf('\n')
  )
  const prefix = beforeValue.slice(clauseStart + 1).slice(-64)
  const afterValue = normalizedText.slice(valueMention.end)
  const nextBoundary = afterValue.search(/[.!?;\n]/u)
  const suffixLength =
    nextBoundary === -1 ? afterValue.length : nextBoundary
  const suffix =
    suffixLength <= 64 ? afterValue.slice(0, suffixLength) : ''
  const suffixEnd =
    nextBoundary === -1 ?
      normalizedText.length
    : valueMention.end + nextBoundary
  const continuationMatches = valueMentions
    .filter(
      mention =>
        mention !== valueMention &&
        mention.start >= valueMention.end &&
        mention.end <= suffixEnd
    )
    .map(mention => ({
      start: mention.start - valueMention.end,
      end: mention.end - valueMention.end
    }))
  const continuationRemainder = removeTextMatches(
    normalizedText.slice(valueMention.end, suffixEnd),
    continuationMatches
  )
    .replace(
      /(?:(?:er|blir)\s+)?(?:tilgjengelig|på\s+lager|utsolgt)/gu,
      ' '
    )
    .replace(/[,/:()[\]{}\\+_-]/gu, ' ')
    .replace(
      /\b(?:eller|og|i|på|til|den|det|en|et|av|med)\b/gu,
      ' '
    )
    .trim()

  return (
    (bareValuePrefixCuePattern.test(prefix) &&
      continuationRemainder.length === 0) ||
    bareValueAvailabilitySuffixPattern.test(suffix) ||
    bareValueSelectionSuffixPattern.test(suffix)
  )
}

function getRelevantBareValueMentions(
  normalizedText: string,
  valueMentions: StockValueMention[],
  explicitlyBoundMentions: Set<StockValueMention>,
  containsOnlyOptionSyntax: boolean
) {
  const relevantMentions = new Set<StockValueMention>()
  const bareMentions = valueMentions
    .filter(mention => !explicitlyBoundMentions.has(mention))
    .toSorted((left, right) => left.start - right.start)

  for (const mention of bareMentions) {
    if (
      containsOnlyOptionSyntax ||
      hasDirectBareValueCue(
        normalizedText,
        mention,
        valueMentions
      )
    ) {
      relevantMentions.add(mention)
    }
  }

  let changed = true

  while (changed) {
    changed = false

    for (
      let index = 0;
      index < bareMentions.length - 1;
      index += 1
    ) {
      const left = bareMentions[index]
      const right = bareMentions[index + 1]

      if (!left || !right) {
        continue
      }

      const connector = normalizedText.slice(
        left.end,
        right.start
      )

      if (!/^\s*(?:og|i|med|\/|,)\s*$/u.test(connector)) {
        continue
      }

      if (
        relevantMentions.has(left) &&
        !relevantMentions.has(right)
      ) {
        relevantMentions.add(right)
        changed = true
      } else if (
        relevantMentions.has(right) &&
        !relevantMentions.has(left)
      ) {
        relevantMentions.add(left)
        changed = true
      }
    }
  }

  return relevantMentions
}

function getPreviousAssistantContext(
  messages: AssistantChatRequest['messages'],
  messageIndex: number,
  dimensions: Map<string, StockOptionDimension>
) {
  const previousMessage = messages[messageIndex - 1]

  if (previousMessage?.role !== 'assistant') {
    return { isClarification: false, expectedDimension: null }
  }

  const normalizedText = normalizeAssistantText(
    previousMessage.parts.map(part => part.text).join('\n')
  )
  const dimensionMentions = getStockDimensionMentions(
    normalizedText,
    dimensions
  )
  const mentionedDimensions = [
    ...new Map(
      dimensionMentions.map(({ dimension }) => [
        dimension.normalizedName,
        dimension
      ])
    ).values()
  ]
  const isClarification =
    /\?|\b(?:hvilken|hvilke|velg|oppgi)\b/u.test(
      normalizedText
    ) &&
    (mentionedDimensions.length > 0 ||
      variantQuestionPattern.test(normalizedText))

  return {
    isClarification,
    expectedDimension:
      isClarification && mentionedDimensions.length === 1 ?
        (mentionedDimensions[0] ?? null)
      : null
  }
}

function resolveStockTurnStates(
  normalizedText: string,
  dimensions: Map<string, StockOptionDimension>,
  previousAssistantContext: ReturnType<
    typeof getPreviousAssistantContext
  >
) {
  const selectedValues = new Map<string, Set<string>>()
  const ambiguousDimensions = new Set<string>()
  const valueMentions = getStockValueMentions(
    normalizedText,
    dimensions
  ).filter(
    valueMention =>
      !isNumericUnitValueMention(normalizedText, valueMention)
  )
  const dimensionMentions = getStockDimensionMentions(
    normalizedText,
    dimensions
  )
  const containsOnlyOptionSyntax = containsOnlyBareOptionSyntax(
    normalizedText,
    valueMentions
  )
  const explicitlyBoundMentions = new Set<StockValueMention>()
  const addAmbiguousMentionDimensions = (
    valueMention: StockValueMention
  ) => {
    const explicitResolution = findExplicitMentionDimension(
      normalizedText,
      valueMention,
      dimensionMentions
    )
    const ambiguousMentionDimensions =
      explicitResolution.kind === 'selected' ?
        [explicitResolution.dimension]
      : explicitResolution.kind === 'ambiguous' ?
        explicitResolution.dimensions
      : valueMention.dimensions

    for (const dimension of ambiguousMentionDimensions) {
      ambiguousDimensions.add(dimension.normalizedName)
    }
  }
  const addSelectedValue = (
    dimension: StockOptionDimension,
    normalizedValue: string
  ) => {
    const values =
      selectedValues.get(dimension.normalizedName) ?? new Set()
    values.add(normalizedValue)
    selectedValues.set(dimension.normalizedName, values)
  }

  for (const valueMention of valueMentions) {
    if (isNegatedValueMention(normalizedText, valueMention)) {
      addAmbiguousMentionDimensions(valueMention)
    }
  }

  const orderedValueMentions = valueMentions.toSorted(
    (left, right) => left.start - right.start
  )

  for (
    let index = 0;
    index < orderedValueMentions.length - 1;
    index += 1
  ) {
    const left = orderedValueMentions[index]
    const right = orderedValueMentions[index + 1]

    if (
      left &&
      right &&
      /\beller\b/u.test(
        normalizedText.slice(left.end, right.start)
      )
    ) {
      addAmbiguousMentionDimensions(left)
      addAmbiguousMentionDimensions(right)
    }
  }

  for (const valueMention of valueMentions) {
    const explicitResolution = findExplicitMentionDimension(
      normalizedText,
      valueMention,
      dimensionMentions
    )

    if (explicitResolution.kind === 'selected') {
      addSelectedValue(
        explicitResolution.dimension,
        valueMention.normalizedValue
      )
      explicitlyBoundMentions.add(valueMention)
      continue
    }

    if (explicitResolution.kind === 'ambiguous') {
      for (const dimension of explicitResolution.dimensions) {
        ambiguousDimensions.add(dimension.normalizedName)
      }
      explicitlyBoundMentions.add(valueMention)
      continue
    }

    const expectedDimension =
      previousAssistantContext.expectedDimension

    if (
      expectedDimension?.values.has(
        valueMention.normalizedValue
      ) &&
      (containsOnlyOptionSyntax ||
        hasDirectBareValueCue(
          normalizedText,
          valueMention,
          valueMentions
        ))
    ) {
      addSelectedValue(
        expectedDimension,
        valueMention.normalizedValue
      )
      explicitlyBoundMentions.add(valueMention)
    }
  }

  const relevantBareValueMentions = getRelevantBareValueMentions(
    normalizedText,
    valueMentions,
    explicitlyBoundMentions,
    containsOnlyOptionSyntax
  )

  for (const valueMention of valueMentions) {
    if (
      explicitlyBoundMentions.has(valueMention) ||
      !relevantBareValueMentions.has(valueMention)
    ) {
      continue
    }

    if (valueMention.dimensions.length === 1) {
      const [dimension] = valueMention.dimensions

      if (dimension) {
        addSelectedValue(dimension, valueMention.normalizedValue)
      }
      continue
    }

    for (const dimension of valueMention.dimensions) {
      ambiguousDimensions.add(dimension.normalizedName)
    }
  }

  return { ambiguousDimensions, selectedValues }
}

function resolveStockChoices(
  product: AssistantProduct,
  messages: AssistantChatRequest['messages']
): StockOptionChoice[] | null {
  const dimensions = getStockOptionDimensions(product)
  const states = new Map<string, StockOptionState>()

  for (const [messageIndex, message] of messages.entries()) {
    if (message.role !== 'user') {
      continue
    }

    const normalizedText = normalizeAssistantText(
      message.parts.map(part => part.text).join('\n')
    )
    const turnStates = resolveStockTurnStates(
      removeProductMentions(normalizedText, product),
      dimensions,
      getPreviousAssistantContext(
        messages,
        messageIndex,
        dimensions
      )
    )

    for (const [
      normalizedName,
      normalizedValues
    ] of turnStates.selectedValues) {
      const dimension = dimensions.get(normalizedName)

      if (!dimension) {
        continue
      }

      if (normalizedValues.size !== 1) {
        states.set(normalizedName, { kind: 'ambiguous' })
        continue
      }

      const [normalizedValue] = normalizedValues
      const value =
        normalizedValue ?
          dimension.values.get(normalizedValue)
        : undefined

      if (!normalizedValue || !value) {
        states.set(normalizedName, { kind: 'ambiguous' })
        continue
      }

      states.set(normalizedName, {
        kind: 'selected',
        choice: {
          normalizedName,
          value,
          normalizedValue,
          order: dimension.order
        }
      })
    }

    for (const normalizedName of turnStates.ambiguousDimensions) {
      states.set(normalizedName, { kind: 'ambiguous' })
    }
  }

  if (
    [...states.values()].some(
      state => state.kind === 'ambiguous'
    )
  ) {
    return null
  }

  return [...states.values()]
    .flatMap(state =>
      state.kind === 'selected' ? [state.choice] : []
    )
    .toSorted((left, right) => left.order - right.order)
}

export function resolveAssistantStockAvailability(
  product: AssistantProduct,
  messages: AssistantChatRequest['messages']
): AssistantStockAvailability {
  const choices = resolveStockChoices(product, messages)
  const normalizedQuestion = normalizeAssistantText(
    getLastUserText(messages)
  )

  if (!choices) {
    return { kind: 'clarify' }
  }

  if (choices.length === 0) {
    const availability = new Set(
      product.variants.map(variant => variant.availableForSale)
    )

    return (
        variantQuestionPattern.test(normalizedQuestion) ||
          availability.size > 1
      ) ?
        { kind: 'clarify' }
      : {
          kind: 'product',
          availableForSale: product.availableForSale
        }
  }

  const variants = product.variants.filter(variant =>
    choices.every(choice =>
      variant.selectedOptions.some(
        option =>
          normalizeAssistantText(option.name) ===
            choice.normalizedName &&
          normalizeAssistantText(option.value) ===
            choice.normalizedValue
      )
    )
  )
  const availability = new Set(
    variants.map(variant => variant.availableForSale)
  )

  if (variants.length === 0 || availability.size !== 1) {
    return { kind: 'clarify' }
  }

  return {
    kind: 'variant',
    availableForSale: variants[0]?.availableForSale ?? false,
    label: choices.map(choice => choice.value).join(' / ')
  }
}
