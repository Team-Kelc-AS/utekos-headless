#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import dotenv from 'dotenv'

const root = process.cwd()
const targetPath = path.join(root, '.env.mcp.local')
const appEnvPath = path.join(root, '.env.local')

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  return dotenv.parse(fs.readFileSync(filePath, 'utf8'))
}

function upsert(source, key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`
}

async function readStdin() {
  let value = ''
  for await (const chunk of process.stdin) value += chunk
  return value
}

const stdin = await readStdin()
const clientIdArgument = process.argv.find(value => value.startsWith('--client-id='))?.slice('--client-id='.length)
const input = clientIdArgument ? { clientId: clientIdArgument, clientSecret: stdin.trim() } : JSON.parse(stdin)
const clientId = String(input.clientId ?? '').trim()
const clientSecret = String(input.clientSecret ?? '').trim()
const existingMcp = readEnv(targetPath)
const existingApp = readEnv(appEnvPath)
const storeDomain = String(
  input.storeDomain ??
  existingMcp.SHOPIFY_CHATGPT_STORE_DOMAIN ??
  existingApp.SHOPIFY_STORE_DOMAIN ??
  existingMcp.SHOPIFY_STORE_DOMAIN ??
  ''
).trim().replace(/^https?:\/\//, '').replace(/\/$/, '')

if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(storeDomain)) {
  throw new Error('A valid *.myshopify.com store domain is required.')
}
if (!/^[A-Za-z0-9_-]{20,}$/.test(clientId)) throw new Error('Invalid Shopify client ID.')
if (!/^shpss_[A-Za-z0-9_-]{20,}$/.test(clientSecret)) throw new Error('Invalid Shopify client secret.')

let output = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : ''
output = upsert(output, 'SHOPIFY_CHATGPT_STORE_DOMAIN', storeDomain)
output = upsert(output, 'SHOPIFY_CHATGPT_CLIENT_ID', clientId)
output = upsert(output, 'SHOPIFY_CHATGPT_CLIENT_SECRET', clientSecret)
output = upsert(output, 'SHOPIFY_CHATGPT_API_VERSION', '2026-04')

const temporaryPath = `${targetPath}.tmp`
fs.writeFileSync(temporaryPath, output, { mode: 0o600 })
fs.renameSync(temporaryPath, targetPath)
fs.chmodSync(targetPath, 0o600)

console.log('Configured dedicated Shopify ChatGPT credentials in .env.mcp.local (values redacted).')
