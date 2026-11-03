import assert from 'node:assert/strict'
import test from 'node:test'

import { verifyUnconfiguredGateway } from './dev-websocket-rejection.mjs'

test('development rejection probe only permits explicitly unavailable voice', async () => {
  await verifyUnconfiguredGateway(Response.json({ status: 'ok', storage: 'none', voice: { status: 'unavailable' } }))
  for (const body of [
    { status: 'ok' },
    { status: 'ready', voice: { status: 'unavailable' } },
    { status: 'ok', voice: { status: 'ready', transport: 'relay' } },
    { status: 'ok', voice: { status: 'ready', transport: 'direct' } }
  ]) await assert.rejects(verifyUnconfiguredGateway(Response.json(body)))
})

test('development rejection probe rejects missing health and malformed responses', async () => {
  await assert.rejects(verifyUnconfiguredGateway(Response.json({ error: 'Not found' }, { status: 404 })))
  await assert.rejects(verifyUnconfiguredGateway(new Response('<html>fallback</html>')))
})
