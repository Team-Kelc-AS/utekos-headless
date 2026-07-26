import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLeadRequestContextFromHeaders } from './buildLeadRequestContextFromHeaders'

test('passes the same standard Request to Vercel geolocation and IP helpers', () => {
  let geolocationRequest: Request | undefined
  let ipAddressRequest: Request | undefined

  const requestContext = buildLeadRequestContextFromHeaders(
    new Headers({
      'user-agent': 'Codex lead verification',
      'x-forwarded-for': '198.51.100.17, 203.0.113.9',
      'x-real-ip': '192.0.2.44',
      'x-vercel-ip-city': 'Bergen%20sentrum',
      'x-vercel-ip-country': 'NO',
      'x-vercel-ip-country-region': '46',
      'x-vercel-ip-postal-code': '5003'
    }),
    {
      geolocation: request => {
        geolocationRequest = request

        return {
          city: decodeURIComponent(
            request.headers.get('x-vercel-ip-city')!
          ),
          country: request.headers.get('x-vercel-ip-country')!,
          countryRegion: request.headers.get(
            'x-vercel-ip-country-region'
          )!,
          postalCode: request.headers.get(
            'x-vercel-ip-postal-code'
          )!
        }
      },
      ipAddress: request => {
        ipAddressRequest = request
        return request.headers.get('x-real-ip') ?? undefined
      }
    }
  )

  assert.ok(geolocationRequest instanceof Request)
  assert.equal(geolocationRequest, ipAddressRequest)
  assert.deepEqual(requestContext, {
    city: 'Bergen sentrum',
    clientIpAddress: '192.0.2.44',
    countryCode: 'NO',
    postalCode: '5003',
    regionCode: '46',
    userAgent: 'Codex lead verification'
  })
})

test('does not treat x-forwarded-for as the Vercel client IP', () => {
  const requestContext = buildLeadRequestContextFromHeaders(
    new Headers({
      'x-forwarded-for': '198.51.100.17, 203.0.113.9'
    }),
    {
      geolocation: () => ({}),
      ipAddress: request =>
        request.headers.get('x-real-ip') ?? undefined
    }
  )

  assert.deepEqual(requestContext, {})
})
