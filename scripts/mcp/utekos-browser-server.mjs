#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { randomUUID } from 'node:crypto'

import axe from 'axe-core'
import { chromium } from 'playwright'
import {
  McpServer,
  StdioServerTransport
} from '@modelcontextprotocol/server'
import { z } from 'zod/v4'

const repoRoot = path.resolve(
  process.env.UTEKOS_REPO_ROOT ?? process.cwd()
)
const profile = 'utekos_chatgpt_browser'
const mode = 'runtime-browser'
const defaultBaseUrl =
  process.env.UTEKOS_BROWSER_BASE_URL ?? 'http://127.0.0.1:3000'
const artifactRoot = path.join(
  repoRoot,
  '.agent-artifacts',
  'browser'
)

let browser = null
let context = null
let page = null
let consoleMessages = []
let networkRequests = []
let requestSequence = 0

const sourceSchema = z.object({
  path: z.string().optional(),
  url: z.string().optional(),
  type: z.string().optional()
})

const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  category: z.string(),
  retryable: z.boolean(),
  safe_to_retry: z.boolean(),
  user_action_required: z.boolean(),
  suggested_fix: z.string(),
  details_redacted: z.boolean()
})

const permissionsSchema = z.object({
  read_only: z.boolean(),
  network_access: z.boolean(),
  writes_possible: z.boolean(),
  changes_browser_state: z.boolean(),
  secrets_redacted: z.boolean()
})

function envelopeSchema(toolName, dataSchema) {
  return z.object({
    ok: z.boolean(),
    tool: z.literal(toolName),
    profile: z.literal(profile),
    mode: z.literal(mode),
    request_id: z.string(),
    started_at: z.string(),
    finished_at: z.string(),
    duration_ms: z.number().nonnegative(),
    data: dataSchema,
    sources: z.array(sourceSchema),
    warnings: z.array(z.string()),
    errors: z.array(errorSchema),
    limits: z.record(z.string(), z.unknown()),
    permissions: permissionsSchema,
    next: z.array(z.string())
  })
}

function nowIso() {
  return new Date().toISOString()
}

function makeError(
  code,
  message,
  suggestedFix,
  category = 'browser'
) {
  return {
    code,
    message,
    category,
    retryable: false,
    safe_to_retry: true,
    user_action_required: false,
    suggested_fix: suggestedFix,
    details_redacted: true
  }
}

function createEnvelope(
  toolName,
  startedAt,
  data,
  options = {}
) {
  const finishedAt = nowIso()
  return {
    ok: options.ok ?? true,
    tool: toolName,
    profile,
    mode,
    request_id: options.requestId ?? randomUUID(),
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: Date.parse(finishedAt) - Date.parse(startedAt),
    data,
    sources: options.sources ?? [],
    warnings: options.warnings ?? [],
    errors: options.errors ?? [],
    limits: options.limits ?? {},
    permissions: {
      read_only: options.readOnly ?? true,
      network_access: true,
      writes_possible: false,
      changes_browser_state:
        options.changesBrowserState ?? false,
      secrets_redacted: true
    },
    next: options.next ?? []
  }
}

function textResult(envelope, summary) {
  return {
    content: [
      {
        type: 'text',
        text: summary ?? JSON.stringify(envelope, null, 2)
      }
    ],
    structuredContent: envelope
  }
}

function normalizeUrl(input) {
  const value = String(input || defaultBaseUrl).trim()
  if (value.startsWith('/'))
    return new URL(value, defaultBaseUrl).toString()
  if (
    /^localhost:\d+/.test(value) ||
    /^127\.0\.0\.1:\d+/.test(value)
  )
    return `http://${value}`
  return value
}

async function ensurePage(viewport = {}) {
  if (!browser) {
    browser = await chromium.launch({
      headless: process.env.UTEKOS_BROWSER_HEADLESS !== '0'
    })
  }

  if (!context) {
    context = await browser.newContext({
      viewport: {
        width: viewport.width ?? 1440,
        height: viewport.height ?? 900
      }
    })
  }

  if (!page || page.isClosed()) {
    page = await context.newPage()
    attachPageListeners(page)
  }

  return page
}

function attachPageListeners(activePage) {
  activePage.on('console', message => {
    consoleMessages.push({
      index: consoleMessages.length + 1,
      type: message.type(),
      text: message.text(),
      location: message.location(),
      timestamp: nowIso()
    })
    consoleMessages = consoleMessages.slice(-250)
  })

  activePage.on('request', request => {
    const id = ++requestSequence
    request._utekosRequestId = id
    networkRequests.push({
      id,
      method: request.method(),
      url: request.url(),
      resource_type: request.resourceType(),
      started_at: nowIso(),
      status: null,
      status_text: null,
      failed: false,
      failure_text: null,
      duration_ms: null,
      has_request_body: Boolean(request.postData()),
      has_response_body: false
    })
    networkRequests = networkRequests.slice(-500)
  })

  activePage.on('response', async response => {
    const request = response.request()
    const id = request._utekosRequestId
    const item = networkRequests.find(entry => entry.id === id)
    if (!item) return

    item.status = response.status()
    item.status_text = response.statusText()
    item.finished_at = nowIso()
    item.duration_ms =
      Date.parse(item.finished_at) - Date.parse(item.started_at)
    item.has_response_body =
      response.headers()['content-length'] !== '0'
  })

  activePage.on('requestfailed', request => {
    const id = request._utekosRequestId
    const item = networkRequests.find(entry => entry.id === id)
    if (!item) return

    item.failed = true
    item.failure_text =
      request.failure()?.errorText ?? 'request failed'
    item.finished_at = nowIso()
    item.duration_ms =
      Date.parse(item.finished_at) - Date.parse(item.started_at)
  })
}

async function currentPageState() {
  const activePage = page && !page.isClosed() ? page : null
  if (!activePage) {
    return {
      url: null,
      title: null,
      viewport: null,
      ready_state: null,
      react_detected: false,
      next_detected: false
    }
  }

  const viewport = activePage.viewportSize()
  const state = await activePage.evaluate(() => ({
    ready_state: document.readyState,
    react_detected: Boolean(
      document.querySelector('[data-reactroot]') ||
      [...document.querySelectorAll('*')].some(element =>
        Object.keys(element).some(
          key =>
            key.startsWith('__reactFiber$') ||
            key.startsWith('__reactProps$')
        )
      )
    ),
    next_detected: Boolean(
      window.next ||
      document.querySelector('script[src*="/_next/"]') ||
      document.querySelector('#__next')
    )
  }))

  return {
    url: activePage.url(),
    title: await activePage.title(),
    viewport,
    ready_state: state.ready_state,
    react_detected: state.react_detected,
    next_detected: state.next_detected
  }
}

async function browserAvailable() {
  try {
    const probe = await chromium.launch({ headless: true })
    await probe.close()
    return { ok: true, message: 'chromium launch ok' }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : String(error)
    }
  }
}

const pageStateSchema = z.object({
  url: z.string().nullable(),
  title: z.string().nullable(),
  viewport: z
    .object({
      width: z.number().int(),
      height: z.number().int()
    })
    .nullable(),
  ready_state: z.string().nullable(),
  react_detected: z.boolean(),
  next_detected: z.boolean()
})

const bootstrapDataSchema = z.object({
  profile: z.string(),
  mode: z.string(),
  repo_root: z.string(),
  default_base_url: z.string(),
  playwright: z.object({
    version: z.string().nullable(),
    chromium_launch_ok: z.boolean(),
    message: z.string()
  }),
  canonical_tools: z.array(z.string()),
  recommended_flow: z.array(z.string())
})

const openDataSchema = z.object({
  page: pageStateSchema,
  navigation: z.object({
    requested_url: z.string(),
    final_url: z.string(),
    status: z.number().int().nullable(),
    status_text: z.string().nullable()
  })
})

const resizeDataSchema = z.object({
  page: pageStateSchema,
  viewport: z.object({
    width: z.number().int(),
    height: z.number().int()
  })
})

const snapshotDataSchema = z.object({
  page: pageStateSchema,
  aria_snapshot: z.string(),
  dom_summary: z.object({
    headings: z.array(
      z.object({ level: z.number().int(), text: z.string() })
    ),
    links: z.array(
      z.object({ text: z.string(), href: z.string().nullable() })
    ),
    buttons: z.array(
      z.object({ text: z.string(), disabled: z.boolean() })
    ),
    forms: z.array(
      z.object({
        action: z.string().nullable(),
        method: z.string().nullable()
      })
    )
  })
})

const consoleDataSchema = z.object({
  page: pageStateSchema,
  messages: z.array(
    z.object({
      index: z.number().int(),
      type: z.string(),
      text: z.string(),
      location: z.unknown(),
      timestamp: z.string()
    })
  )
})

const networkRequestSchema = z.object({
  id: z.number().int(),
  method: z.string(),
  url: z.string(),
  resource_type: z.string(),
  started_at: z.string(),
  finished_at: z.string().optional(),
  status: z.number().int().nullable(),
  status_text: z.string().nullable(),
  failed: z.boolean(),
  failure_text: z.string().nullable(),
  duration_ms: z.number().nullable(),
  has_request_body: z.boolean(),
  has_response_body: z.boolean()
})

const networkRequestsDataSchema = z.object({
  page: pageStateSchema,
  requests: z.array(networkRequestSchema)
})

const networkRequestDataSchema = z.object({
  page: pageStateSchema,
  request: networkRequestSchema.nullable()
})

const screenshotDataSchema = z.object({
  page: pageStateSchema,
  path: z.string(),
  mime_type: z.literal('image/png'),
  size_bytes: z.number().int().nonnegative()
})

const axeViolationSchema = z.object({
  id: z.string(),
  impact: z.string().nullable(),
  description: z.string(),
  help: z.string(),
  help_url: z.string(),
  nodes: z.array(
    z.object({
      target: z.array(z.string()),
      html: z.string(),
      failure_summary: z.string().nullable()
    })
  )
})

const accessibilityDataSchema = z.object({
  page: pageStateSchema,
  axe: z.object({
    passes_count: z.number().int().nonnegative(),
    violations_count: z.number().int().nonnegative(),
    incomplete_count: z.number().int().nonnegative(),
    inapplicable_count: z.number().int().nonnegative(),
    violations: z.array(axeViolationSchema)
  })
})

const performanceAuditDataSchema = z.object({
  page: pageStateSchema,
  navigation: z
    .object({
      type: z.string().nullable(),
      duration_ms: z.number().nullable(),
      dom_content_loaded_ms: z.number().nullable(),
      load_event_end_ms: z.number().nullable(),
      response_start_ms: z.number().nullable(),
      response_end_ms: z.number().nullable(),
      transfer_size_bytes: z.number().nullable(),
      encoded_body_size_bytes: z.number().nullable(),
      decoded_body_size_bytes: z.number().nullable()
    })
    .nullable(),
  paint: z.object({
    first_paint_ms: z.number().nullable(),
    first_contentful_paint_ms: z.number().nullable()
  }),
  resources: z.object({
    count: z.number().int().nonnegative(),
    total_transfer_size_bytes: z.number().nonnegative(),
    total_encoded_body_size_bytes: z.number().nonnegative(),
    total_decoded_body_size_bytes: z.number().nonnegative(),
    by_initiator_type: z.array(
      z.object({
        type: z.string(),
        count: z.number().int().nonnegative(),
        transfer_size_bytes: z.number().nonnegative()
      })
    ),
    slowest: z.array(
      z.object({
        name: z.string(),
        initiator_type: z.string(),
        duration_ms: z.number(),
        transfer_size_bytes: z.number()
      })
    )
  }),
  thresholds: z.array(
    z.object({
      metric: z.string(),
      value: z.number().nullable(),
      budget: z.number(),
      unit: z.string(),
      passed: z.boolean().nullable()
    })
  )
})

const devtoolsMetricSchema = z.object({
  name: z.string(),
  value: z.number()
})

const devtoolsDataSchema = z.object({
  page: pageStateSchema,
  browser: z.object({
    protocol_version: z.string().nullable(),
    product: z.string().nullable(),
    revision: z.string().nullable(),
    user_agent: z.string().nullable(),
    js_version: z.string().nullable()
  }),
  layout: z.object({
    css_content_size: z.object({
      width: z.number(),
      height: z.number()
    }),
    css_layout_viewport: z.object({
      page_x: z.number(),
      page_y: z.number(),
      client_width: z.number(),
      client_height: z.number()
    }),
    css_visual_viewport: z.object({
      page_x: z.number(),
      page_y: z.number(),
      client_width: z.number(),
      client_height: z.number(),
      scale: z.number(),
      zoom: z.number().optional()
    })
  }),
  performance_metrics: z.array(devtoolsMetricSchema),
  runtime: z.object({
    href: z.string(),
    ready_state: z.string(),
    scripts_count: z.number().int().nonnegative(),
    stylesheets_count: z.number().int().nonnegative(),
    images_count: z.number().int().nonnegative()
  })
})

const closeDataSchema = z.object({ closed: z.boolean() })

const mutateBrowserAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: true,
  idempotentHint: false
}

const inspectBrowserAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true
}

const canonicalTools = [
  'browser_bootstrap',
  'browser_open',
  'browser_resize',
  'browser_snapshot',
  'browser_console_messages',
  'browser_network_requests',
  'browser_network_request',
  'browser_take_screenshot',
  'browser_accessibility_audit',
  'browser_performance_audit',
  'browser_devtools_metrics',
  'browser_close'
]

const server = new McpServer({
  name: 'utekos-browser-workbench',
  version: '1.0.0'
})

server.registerTool(
  'browser_bootstrap',
  {
    title: 'Browser Bootstrap',
    description:
      'Use this first in Utekos Browser Workbench sessions. Returns Playwright readiness and the canonical runtime verification flow.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'browser_bootstrap',
      bootstrapDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async () => {
    const startedAt = nowIso()
    const availability = await browserAvailable()
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, 'package.json'),
        'utf8'
      )
    )
    const data = {
      profile,
      mode,
      repo_root: repoRoot,
      default_base_url: defaultBaseUrl,
      playwright: {
        version: packageJson.dependencies?.playwright ?? null,
        chromium_launch_ok: availability.ok,
        message: availability.message
      },
      canonical_tools: canonicalTools,
      recommended_flow: [
        'browser_bootstrap',
        'browser_open',
        'browser_snapshot',
        'browser_console_messages',
        'browser_network_requests',
        'browser_accessibility_audit',
        'browser_performance_audit',
        'browser_devtools_metrics',
        'browser_take_screenshot'
      ]
    }

    return textResult(
      createEnvelope('browser_bootstrap', startedAt, data, {
        next: [
          'Call browser_open with localhost or a full URL.',
          'Use browser_snapshot before screenshot-based conclusions.'
        ]
      }),
      availability.ok ?
        'Browser Workbench ready.'
      : `Browser Workbench not ready: ${availability.message}`
    )
  }
)

server.registerTool(
  'browser_open',
  {
    title: 'Browser Open',
    description:
      'Navigate the controlled Playwright page to a URL and return structured runtime state.',
    inputSchema: z.object({
      url: z.string().optional(),
      wait_until: z
        .enum([
          'load',
          'domcontentloaded',
          'networkidle',
          'commit'
        ])
        .optional(),
      timeout_ms: z
        .number()
        .int()
        .min(1000)
        .max(60000)
        .optional()
    }),
    outputSchema: envelopeSchema('browser_open', openDataSchema),
    annotations: mutateBrowserAnnotations
  },
  async ({
    url,
    wait_until: waitUntil,
    timeout_ms: timeoutMs
  }) => {
    const startedAt = nowIso()
    const targetUrl = normalizeUrl(url)
    const activePage = await ensurePage()
    const response = await activePage.goto(targetUrl, {
      waitUntil: waitUntil ?? 'domcontentloaded',
      timeout: timeoutMs ?? 30000
    })
    const pageState = await currentPageState()
    const data = {
      page: pageState,
      navigation: {
        requested_url: targetUrl,
        final_url: activePage.url(),
        status: response?.status() ?? null,
        status_text: response?.statusText() ?? null
      }
    }

    return textResult(
      createEnvelope('browser_open', startedAt, data, {
        readOnly: false,
        changesBrowserState: true,
        sources: [{ url: activePage.url(), type: 'browser' }],
        next: [
          'Call browser_snapshot and browser_console_messages before making UI claims.'
        ]
      }),
      `Opened ${activePage.url()} with status ${response?.status() ?? 'unknown'}.`
    )
  }
)

server.registerTool(
  'browser_resize',
  {
    title: 'Browser Resize',
    description:
      'Resize the controlled Playwright viewport and return structured page state.',
    inputSchema: z.object({
      width: z.number().int().min(320).max(3840),
      height: z.number().int().min(320).max(2400)
    }),
    outputSchema: envelopeSchema(
      'browser_resize',
      resizeDataSchema
    ),
    annotations: mutateBrowserAnnotations
  },
  async ({ width, height }) => {
    const startedAt = nowIso()
    const activePage = await ensurePage({ width, height })
    await activePage.setViewportSize({ width, height })
    const data = {
      page: await currentPageState(),
      viewport: { width, height }
    }

    return textResult(
      createEnvelope('browser_resize', startedAt, data, {
        readOnly: false,
        changesBrowserState: true,
        next: ['Call browser_snapshot after resizing.']
      }),
      `Viewport resized to ${width}x${height}.`
    )
  }
)

server.registerTool(
  'browser_snapshot',
  {
    title: 'Browser Snapshot',
    description:
      'Return structured page state, AI-oriented ARIA snapshot, and DOM summary for the current page.',
    inputSchema: z.object({
      selector: z.string().optional(),
      timeout_ms: z
        .number()
        .int()
        .min(1000)
        .max(30000)
        .optional()
    }),
    outputSchema: envelopeSchema(
      'browser_snapshot',
      snapshotDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async ({ selector, timeout_ms: timeoutMs }) => {
    const startedAt = nowIso()
    const activePage = await ensurePage()
    const locator = activePage.locator(selector ?? 'body')
    let ariaSnapshot = ''
    const warnings = []

    try {
      ariaSnapshot = await locator.ariaSnapshot({
        mode: 'ai',
        timeout: timeoutMs ?? 5000
      })
    } catch (error) {
      warnings.push(
        error instanceof Error ? error.message : String(error)
      )
    }

    const domSummary = await activePage.evaluate(() => ({
      headings: [
        ...document.querySelectorAll('h1,h2,h3,h4,h5,h6')
      ]
        .slice(0, 80)
        .map(element => ({
          level: Number(element.tagName.slice(1)),
          text: element.textContent?.trim().slice(0, 240) ?? ''
        })),
      links: [...document.querySelectorAll('a')]
        .slice(0, 120)
        .map(element => ({
          text: element.textContent?.trim().slice(0, 240) ?? '',
          href: element.getAttribute('href')
        })),
      buttons: [
        ...document.querySelectorAll('button,[role="button"]')
      ]
        .slice(0, 120)
        .map(element => ({
          text: element.textContent?.trim().slice(0, 240) ?? '',
          disabled: Boolean(
            element.disabled ||
            element.getAttribute('aria-disabled') === 'true'
          )
        })),
      forms: [...document.querySelectorAll('form')]
        .slice(0, 40)
        .map(element => ({
          action: element.getAttribute('action'),
          method: element.getAttribute('method')
        }))
    }))

    const data = {
      page: await currentPageState(),
      aria_snapshot: ariaSnapshot,
      dom_summary: domSummary
    }

    return textResult(
      createEnvelope('browser_snapshot', startedAt, data, {
        warnings,
        sources: [{ url: activePage.url(), type: 'browser' }],
        next: [
          'Call browser_console_messages and browser_network_requests for runtime issues.'
        ]
      }),
      `Captured snapshot for ${activePage.url()}.`
    )
  }
)

server.registerTool(
  'browser_console_messages',
  {
    title: 'Browser Console Messages',
    description:
      'Return structured console messages captured from the controlled page.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(250).optional()
    }),
    outputSchema: envelopeSchema(
      'browser_console_messages',
      consoleDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async ({ limit }) => {
    const startedAt = nowIso()
    const max = limit ?? 100
    const data = {
      page: await currentPageState(),
      messages: consoleMessages.slice(-max)
    }

    return textResult(
      createEnvelope(
        'browser_console_messages',
        startedAt,
        data,
        {
          limits: { limit: max },
          next: [
            'Investigate error and warning console messages before final UI delivery.'
          ]
        }
      ),
      `Returned ${data.messages.length} console messages.`
    )
  }
)

server.registerTool(
  'browser_network_requests',
  {
    title: 'Browser Network Requests',
    description:
      'Return structured network request summaries captured from the controlled page.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(500).optional(),
      failed_only: z.boolean().optional()
    }),
    outputSchema: envelopeSchema(
      'browser_network_requests',
      networkRequestsDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async ({ limit, failed_only: failedOnly }) => {
    const startedAt = nowIso()
    const max = limit ?? 150
    const filtered =
      failedOnly ?
        networkRequests.filter(
          request =>
            request.failed || (request.status ?? 200) >= 400
        )
      : networkRequests
    const data = {
      page: await currentPageState(),
      requests: filtered.slice(-max)
    }

    return textResult(
      createEnvelope(
        'browser_network_requests',
        startedAt,
        data,
        {
          limits: {
            limit: max,
            failed_only: Boolean(failedOnly)
          },
          next: [
            'Use browser_network_request with a request id for a focused detail object.'
          ]
        }
      ),
      `Returned ${data.requests.length} network request summaries.`
    )
  }
)

server.registerTool(
  'browser_network_request',
  {
    title: 'Browser Network Request',
    description:
      'Return one captured network request summary by id.',
    inputSchema: z.object({ id: z.number().int().positive() }),
    outputSchema: envelopeSchema(
      'browser_network_request',
      networkRequestDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async ({ id }) => {
    const startedAt = nowIso()
    const request =
      networkRequests.find(item => item.id === id) ?? null
    const data = { page: await currentPageState(), request }

    return textResult(
      createEnvelope(
        'browser_network_request',
        startedAt,
        data,
        {
          ok: Boolean(request),
          errors:
            request ?
              []
            : [
                makeError(
                  'REQUEST_NOT_FOUND',
                  `No captured request with id ${id}.`,
                  'Call browser_network_requests and choose an existing id.'
                )
              ],
          next:
            request ?
              [
                'Use status, failed, and resource_type to decide whether deeper provider/runtime verification is needed.'
              ]
            : ['Call browser_network_requests.']
        }
      ),
      request ?
        `Returned request ${id}.`
      : `Request ${id} was not found.`
    )
  }
)

server.registerTool(
  'browser_take_screenshot',
  {
    title: 'Browser Take Screenshot',
    description:
      'Capture a PNG screenshot of the current page into .agent-artifacts/browser and return file metadata.',
    inputSchema: z.object({
      full_page: z.boolean().optional(),
      name: z
        .string()
        .regex(/^[a-zA-Z0-9._-]+$/)
        .optional()
    }),
    outputSchema: envelopeSchema(
      'browser_take_screenshot',
      screenshotDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async ({ full_page: fullPage, name }) => {
    const startedAt = nowIso()
    const activePage = await ensurePage()
    fs.mkdirSync(artifactRoot, { recursive: true })
    const filename = name ?? `screenshot-${Date.now()}.png`
    const screenshotPath = path.join(
      artifactRoot,
      filename.endsWith('.png') ? filename : `${filename}.png`
    )
    await activePage.screenshot({
      path: screenshotPath,
      fullPage: Boolean(fullPage)
    })
    const stat = fs.statSync(screenshotPath)
    const data = {
      page: await currentPageState(),
      path: path
        .relative(repoRoot, screenshotPath)
        .replaceAll(path.sep, '/'),
      mime_type: 'image/png',
      size_bytes: stat.size
    }

    return textResult(
      createEnvelope(
        'browser_take_screenshot',
        startedAt,
        data,
        {
          sources: [{ path: data.path, type: 'artifact' }],
          next: [
            'Use browser_snapshot for actionable DOM/accessibility details.'
          ]
        }
      ),
      `Saved screenshot to ${data.path}.`
    )
  }
)

server.registerTool(
  'browser_accessibility_audit',
  {
    title: 'Browser Accessibility Audit',
    description:
      'Run axe-core against the current page and return structured accessibility violations.',
    inputSchema: z.object({
      max_nodes_per_violation: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
    }),
    outputSchema: envelopeSchema(
      'browser_accessibility_audit',
      accessibilityDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async ({ max_nodes_per_violation: maxNodesPerViolation }) => {
    const startedAt = nowIso()
    const activePage = await ensurePage()
    await activePage.addScriptTag({ content: axe.source })
    const result = await activePage.evaluate(async () =>
      window.axe.run(document, {
        resultTypes: [
          'violations',
          'incomplete',
          'inapplicable',
          'passes'
        ]
      })
    )
    const maxNodes = maxNodesPerViolation ?? 5
    const violations = result.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact ?? null,
      description: violation.description,
      help: violation.help,
      help_url: violation.helpUrl,
      nodes: violation.nodes
        .slice(0, maxNodes)
        .map(node => ({
          target: node.target,
          html: node.html.slice(0, 500),
          failure_summary: node.failureSummary ?? null
        }))
    }))
    const data = {
      page: await currentPageState(),
      axe: {
        passes_count: result.passes.length,
        violations_count: result.violations.length,
        incomplete_count: result.incomplete.length,
        inapplicable_count: result.inapplicable.length,
        violations
      }
    }

    return textResult(
      createEnvelope(
        'browser_accessibility_audit',
        startedAt,
        data,
        {
          limits: { max_nodes_per_violation: maxNodes },
          sources: [{ url: activePage.url(), type: 'browser' }],
          next:
            result.violations.length > 0 ?
              [
                'Fix or explicitly classify accessibility violations before final UI delivery.'
              ]
            : [
                'Pair this with visual contrast checks for brand-critical UI.'
              ]
        }
      ),
      `Axe audit found ${result.violations.length} violations.`
    )
  }
)

server.registerTool(
  'browser_performance_audit',
  {
    title: 'Browser Performance Audit',
    description:
      'Collect local browser Navigation Timing, Paint Timing, and Resource Timing metrics for the current page. This is the localhost-safe performance gate for ChatGPT Browser Workbench.',
    inputSchema: z.object({
      wait_until: z
        .enum(['load', 'domcontentloaded', 'networkidle'])
        .optional(),
      timeout_ms: z
        .number()
        .int()
        .min(1000)
        .max(60000)
        .optional(),
      slowest_limit: z.number().int().min(1).max(50).optional()
    }),
    outputSchema: envelopeSchema(
      'browser_performance_audit',
      performanceAuditDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async ({
    wait_until: waitUntil,
    timeout_ms: timeoutMs,
    slowest_limit: slowestLimit
  }) => {
    const startedAt = nowIso()
    const activePage = await ensurePage()
    const warnings = []

    try {
      await activePage.waitForLoadState(waitUntil ?? 'load', {
        timeout: timeoutMs ?? 15000
      })
    } catch (error) {
      warnings.push(
        error instanceof Error ? error.message : String(error)
      )
    }

    const metrics = await activePage.evaluate(limit => {
      const navigationEntry =
        performance.getEntriesByType('navigation')[0]
      const navigation =
        navigationEntry ?
          {
            type: navigationEntry.type ?? null,
            duration_ms: navigationEntry.duration ?? null,
            dom_content_loaded_ms:
              navigationEntry.domContentLoadedEventEnd ?? null,
            load_event_end_ms:
              navigationEntry.loadEventEnd ?? null,
            response_start_ms:
              navigationEntry.responseStart ?? null,
            response_end_ms: navigationEntry.responseEnd ?? null,
            transfer_size_bytes:
              navigationEntry.transferSize ?? null,
            encoded_body_size_bytes:
              navigationEntry.encodedBodySize ?? null,
            decoded_body_size_bytes:
              navigationEntry.decodedBodySize ?? null
          }
        : null

      const paintEntries = performance.getEntriesByType('paint')
      const paint = {
        first_paint_ms:
          paintEntries.find(
            entry => entry.name === 'first-paint'
          )?.startTime ?? null,
        first_contentful_paint_ms:
          paintEntries.find(
            entry => entry.name === 'first-contentful-paint'
          )?.startTime ?? null
      }

      const resourceEntries =
        performance.getEntriesByType('resource')
      const grouped = new Map()
      for (const entry of resourceEntries) {
        const type = entry.initiatorType || 'unknown'
        const previous = grouped.get(type) ?? {
          type,
          count: 0,
          transfer_size_bytes: 0
        }
        previous.count += 1
        previous.transfer_size_bytes += entry.transferSize || 0
        grouped.set(type, previous)
      }

      const sortedResources = resourceEntries
        .map(entry => ({
          name: entry.name,
          initiator_type: entry.initiatorType || 'unknown',
          duration_ms: entry.duration || 0,
          transfer_size_bytes: entry.transferSize || 0
        }))
        .sort(
          (left, right) => right.duration_ms - left.duration_ms
        )
        .slice(0, limit)

      return {
        navigation,
        paint,
        resources: {
          count: resourceEntries.length,
          total_transfer_size_bytes: resourceEntries.reduce(
            (sum, entry) => sum + (entry.transferSize || 0),
            0
          ),
          total_encoded_body_size_bytes: resourceEntries.reduce(
            (sum, entry) => sum + (entry.encodedBodySize || 0),
            0
          ),
          total_decoded_body_size_bytes: resourceEntries.reduce(
            (sum, entry) => sum + (entry.decodedBodySize || 0),
            0
          ),
          by_initiator_type: [...grouped.values()].sort(
            (left, right) =>
              right.transfer_size_bytes -
              left.transfer_size_bytes
          ),
          slowest: sortedResources
        }
      }
    }, slowestLimit ?? 10)

    const thresholds = [
      {
        metric: 'first_contentful_paint_ms',
        value: metrics.paint.first_contentful_paint_ms,
        budget: 1800,
        unit: 'ms',
        passed:
          metrics.paint.first_contentful_paint_ms == null ?
            null
          : metrics.paint.first_contentful_paint_ms <= 1800
      },
      {
        metric: 'load_event_end_ms',
        value: metrics.navigation?.load_event_end_ms ?? null,
        budget: 2500,
        unit: 'ms',
        passed:
          metrics.navigation?.load_event_end_ms == null ?
            null
          : metrics.navigation.load_event_end_ms <= 2500
      },
      {
        metric: 'total_transfer_size_bytes',
        value: metrics.resources.total_transfer_size_bytes,
        budget: 1500000,
        unit: 'bytes',
        passed:
          metrics.resources.total_transfer_size_bytes <= 1500000
      }
    ]

    const data = {
      page: await currentPageState(),
      ...metrics,
      thresholds
    }

    return textResult(
      createEnvelope(
        'browser_performance_audit',
        startedAt,
        data,
        {
          warnings,
          limits: { slowest_limit: slowestLimit ?? 10 },
          sources: [
            {
              url: activePage.url(),
              type: 'browser-performance-api'
            }
          ],
          next: [
            'Use browser_devtools_metrics for CDP-backed runtime/layout metrics.',
            'Use external PageSpeed only for public URLs, not localhost.'
          ]
        }
      ),
      `Performance audit collected ${metrics.resources.count} resource entries.`
    )
  }
)

server.registerTool(
  'browser_devtools_metrics',
  {
    title: 'Browser DevTools Metrics',
    description:
      'Collect Chrome DevTools Protocol metrics from the controlled Chromium page without exposing arbitrary code execution.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'browser_devtools_metrics',
      devtoolsDataSchema
    ),
    annotations: inspectBrowserAnnotations
  },
  async () => {
    const startedAt = nowIso()
    const activePage = await ensurePage()
    const activeContext = context
    const cdpSession =
      await activeContext.newCDPSession(activePage)

    try {
      await cdpSession.send('Performance.enable')
      const [version, layout, metrics, runtime] =
        await Promise.all([
          cdpSession
            .send('Browser.getVersion')
            .catch(() => ({
              protocolVersion: null,
              product: null,
              revision: null,
              userAgent: null,
              jsVersion: null
            })),
          cdpSession.send('Page.getLayoutMetrics'),
          cdpSession.send('Performance.getMetrics'),
          activePage.evaluate(() => ({
            href: window.location.href,
            ready_state: document.readyState,
            scripts_count: document.scripts.length,
            stylesheets_count: document.styleSheets.length,
            images_count: document.images.length
          }))
        ])

      const data = {
        page: await currentPageState(),
        browser: {
          protocol_version: version.protocolVersion ?? null,
          product: version.product ?? null,
          revision: version.revision ?? null,
          user_agent: version.userAgent ?? null,
          js_version: version.jsVersion ?? null
        },
        layout: {
          css_content_size: {
            width: layout.cssContentSize.width,
            height: layout.cssContentSize.height
          },
          css_layout_viewport: {
            page_x: layout.cssLayoutViewport.pageX,
            page_y: layout.cssLayoutViewport.pageY,
            client_width: layout.cssLayoutViewport.clientWidth,
            client_height: layout.cssLayoutViewport.clientHeight
          },
          css_visual_viewport: {
            page_x: layout.cssVisualViewport.pageX,
            page_y: layout.cssVisualViewport.pageY,
            client_width: layout.cssVisualViewport.clientWidth,
            client_height: layout.cssVisualViewport.clientHeight,
            scale: layout.cssVisualViewport.scale,
            zoom: layout.cssVisualViewport.zoom
          }
        },
        performance_metrics: metrics.metrics.map(metric => ({
          name: metric.name,
          value: metric.value
        })),
        runtime
      }

      return textResult(
        createEnvelope(
          'browser_devtools_metrics',
          startedAt,
          data,
          {
            sources: [
              {
                url: activePage.url(),
                type: 'chrome-devtools-protocol'
              }
            ],
            next: [
              'Use browser_console_messages and browser_network_requests to connect CDP metrics to concrete failures.'
            ]
          }
        ),
        `Collected ${data.performance_metrics.length} Chrome DevTools Protocol metrics.`
      )
    } finally {
      await cdpSession.detach().catch(() => {})
    }
  }
)

server.registerTool(
  'browser_close',
  {
    title: 'Browser Close',
    description:
      'Close the controlled Playwright browser session.',
    inputSchema: z.object({}),
    outputSchema: envelopeSchema(
      'browser_close',
      closeDataSchema
    ),
    annotations: mutateBrowserAnnotations
  },
  async () => {
    const startedAt = nowIso()
    if (browser) await browser.close()
    browser = null
    context = null
    page = null
    consoleMessages = []
    networkRequests = []
    const data = { closed: true }

    return textResult(
      createEnvelope('browser_close', startedAt, data, {
        readOnly: false,
        changesBrowserState: true,
        next: [
          'Call browser_bootstrap to start a fresh browser session.'
        ]
      }),
      'Browser session closed.'
    )
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(
    'Utekos Browser Workbench MCP server running on stdio'
  )
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exit(1)
})
