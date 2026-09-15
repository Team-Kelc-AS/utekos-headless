import assert from 'node:assert/strict'
import test from 'node:test'
import { mapMetaClientParameterContext } from './mapMetaClientParameterContext'

test('maps the official underscored Parameter Builder response immediately', () => {
  assert.deepEqual(
    mapMetaClientParameterContext({
      _fbc: 'fb.1.1784368700000.meta-click.AQQCAQMB',
      _fbi: '2001:db8::1.AQQCAQMB',
      _fbp: 'fb.1.1784368600000.123456789.AQQCAQMB'
    }),
    {
      clientIpAddress: '2001:db8::1.AQQCAQMB',
      fbc: 'fb.1.1784368700000.meta-click.AQQCAQMB',
      fbp: 'fb.1.1784368600000.123456789.AQQCAQMB'
    }
  )
})
