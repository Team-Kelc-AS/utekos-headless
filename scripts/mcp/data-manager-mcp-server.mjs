#!/usr/bin/env node

/**
 * Lean, read-oriented MCP surface for Google Data Manager API diagnostics.
 * There is no official hosted Data Manager MCP endpoint as of 2026-08-01.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { JWT } from 'google-auth-library'
import {
  McpServer,
  StdioServerTransport
} from '@modelcontextprotocol/server'
import { z } from 'zod/v4'

const DATA_MANAGER_SCOPES = [
  'https://www.googleapis.com/auth/datamanager',
  'https://www.googleapis.com/auth/cloud-platform'
]

const LOCAL_SA_CANDIDATES = [
  'src/api/lib/cloud-credentials/tag-manager-credentials.json',
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  process.env.GOOGLE_ADS_APPLICATION_CREDENTIALS
].filter(Boolean)

const serviceAccountSchema = z.object({
  client_email: z.string().email(),
  private_key: z.string().min(1),
  project_id: z.string().optional()
})

function jsonResult(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }
    ]
  }
}

function jsonError(message, details = {}) {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          { ok: false, error: message, ...details },
          null,
          2
        )
      }
    ]
  }
}

function readServiceAccount() {
  const inline =
    process.env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_DATAMANAGER_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON

  if (inline?.trim()) {
    return serviceAccountSchema.parse(JSON.parse(inline))
  }

  for (const candidate of LOCAL_SA_CANDIDATES) {
    const resolved = path.isAbsolute(candidate)
      ? candidate
      : path.join(process.cwd(), candidate)
    if (!fs.existsSync(resolved)) continue
    return serviceAccountSchema.parse(
      JSON.parse(fs.readFileSync(resolved, 'utf8'))
    )
  }

  throw new Error(
    'No Data Manager credentials found. Set GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON or provide a local service-account JSON path.'
  )
}

async function getAccessToken() {
  const sa = readServiceAccount()
  const client = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: DATA_MANAGER_SCOPES
  })
  const token = await client.getAccessToken()
  if (!token.token) {
    throw new Error('Failed to mint Data Manager access token')
  }
  return {
    accessToken: token.token,
    clientEmail: sa.client_email,
    projectId: sa.project_id ?? null
  }
}

function publicConfig() {
  return {
    googleAdsCustomerId:
      process.env.GOOGLE_ADS_CUSTOMER_ID?.replaceAll('-', '').trim() ||
      null,
    googleAdsLoginCustomerId:
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replaceAll(
        '-',
        ''
      ).trim() || null,
    customerMatchUserListId:
      process.env.GOOGLE_ADS_CUSTOMER_MATCH_USER_LIST_ID?.trim() || null,
    validateOnly:
      (
        process.env.GOOGLE_DATA_MANAGER_VALIDATE_ONLY ?? 'true'
      ).toLowerCase() !== 'false',
    apiBase: 'https://datamanager.googleapis.com/v1',
    docs: {
      overview: 'https://developers.google.com/data-manager/api',
      sendEvents:
        'https://developers.google.com/data-manager/api/devguides/events/send-events',
      retrieveStatus:
        'https://developers.google.com/data-manager/api/reference/rest/v1/requestStatus/retrieve',
      diagnostics:
        'https://developers.google.com/data-manager/api/devguides/diagnostics',
      scope: 'https://www.googleapis.com/auth/datamanager'
    }
  }
}

const server = new McpServer({
  name: 'data-manager-mcp',
  version: '1.0.0'
})

server.registerTool(
  'data_manager_get_config',
  {
    title: 'Data Manager Config',
    description:
      'Return non-secret Data Manager destination/config knobs and official doc links.',
    inputSchema: z.object({})
  },
  async () => jsonResult({ ok: true, config: publicConfig() })
)

server.registerTool(
  'data_manager_whoami',
  {
    title: 'Data Manager Whoami',
    description:
      'Verify Data Manager auth by minting an access token; returns service-account email only.',
    inputSchema: z.object({})
  },
  async () => {
    try {
      const { clientEmail, projectId } = await getAccessToken()
      return jsonResult({
        ok: true,
        authenticated: true,
        clientEmail,
        projectId,
        scopes: DATA_MANAGER_SCOPES
      })
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : String(error)
      )
    }
  }
)

server.registerTool(
  'data_manager_retrieve_request_status',
  {
    title: 'Retrieve Data Manager Request Status',
    description:
      'Retrieve Google Data Manager request status for one request_id (read-only).',
    inputSchema: z.object({
      requestId: z.string().min(1).describe('Data Manager request id')
    })
  },
  async ({ requestId }) => {
    try {
      const { accessToken } = await getAccessToken()
      const url = new URL(
        'https://datamanager.googleapis.com/v1/requestStatus:retrieve'
      )
      url.searchParams.set('request_id', requestId)
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      })
      const body = await response.text()
      let parsed
      try {
        parsed = JSON.parse(body)
      } catch {
        parsed = { raw: body.slice(0, 2000) }
      }
      if (!response.ok) {
        return jsonError('Data Manager status request failed', {
          httpStatus: response.status,
          body: parsed
        })
      }
      return jsonResult({ ok: true, requestId, status: parsed })
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : String(error),
        { requestId }
      )
    }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
