#!/usr/bin/env node

import fs from 'node:fs'
import http from 'node:http'
import process from 'node:process'
import { URL } from 'node:url'

import dotenv from 'dotenv'

function loadEnv() {
  const env = { ...process.env }

  for (const file of [
    '.env.tunnel.example',
    '.env.tunnel.local'
  ]) {
    if (!fs.existsSync(file)) continue
    Object.assign(
      env,
      dotenv.parse(fs.readFileSync(file, 'utf8'))
    )
  }

  env.OPENAI_TUNNEL_PROXY_HOST ||= '127.0.0.1'
  env.OPENAI_TUNNEL_PROXY_PORT ||= '8813'
  env.OPENAI_TUNNEL_TARGET_ORIGIN ||= 'http://127.0.0.1:8812'

  return env
}

const env = loadEnv()
const token = env.MCP_GATEWAY_AUTH_TOKEN?.trim()

if (!token) {
  console.error(
    'Missing MCP_GATEWAY_AUTH_TOKEN in .env.tunnel.local'
  )
  process.exit(1)
}

const targetOrigin = new URL(env.OPENAI_TUNNEL_TARGET_ORIGIN)
const host = env.OPENAI_TUNNEL_PROXY_HOST
const port = Number(env.OPENAI_TUNNEL_PROXY_PORT)

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(
      request.url ?? '/',
      `http://${host}:${port}`
    )
    if (requestUrl.pathname.startsWith('/.well-known/oauth-')) {
      response.statusCode = 404
      response.end('Not Found')
      return
    }

    const targetUrl = new URL(request.url ?? '/', targetOrigin)
    const headers = new Headers()

    for (const [key, value] of Object.entries(request.headers)) {
      if (value === undefined) continue
      if (key.toLowerCase() === 'host') continue
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item)
      } else {
        headers.set(key, value)
      }
    }

    headers.set('authorization', `Bearer ${token}`)
    headers.set('host', targetUrl.host)

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === 'GET' || request.method === 'HEAD' ?
          undefined
        : request,
      duplex: 'half',
      redirect: 'manual'
    })

    response.statusCode = upstream.status
    response.statusMessage = upstream.statusText

    upstream.headers.forEach((value, key) => {
      response.setHeader(key, value)
    })

    if (!upstream.body) {
      response.end()
      return
    }

    await upstream.body.pipeTo(
      new WritableStream({
        write(chunk) {
          response.write(chunk)
        },
        close() {
          response.end()
        },
        abort(error) {
          response.destroy(error)
        }
      })
    )
  } catch (error) {
    response.statusCode = 502
    response.end(
      error instanceof Error ? error.message : 'Proxy error'
    )
  }
})

server.listen(port, host, () => {
  console.log(
    `OpenAI tunnel proxy listening on http://${host}:${port}`
  )
  console.log(
    `Forwarding to ${targetOrigin.origin} with local Docker MCP bearer auth`
  )
})
