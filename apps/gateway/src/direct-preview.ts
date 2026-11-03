import gateway, { type GatewayEnv } from './index'

export type DirectPreviewEnv = GatewayEnv & { PRIVATE_PREVIEW_EXPIRES_AT: string }

/** The formal handler is unchanged; only this temporary preview has an absolute expiry. */
export default {
  async fetch(request: Request, env: DirectPreviewEnv): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith('/api/')) return gateway.fetch(request, env)
    const expiresAt = Date.parse(env.PRIVATE_PREVIEW_EXPIRES_AT)
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      return Response.json({ error: 'preview-expired' }, { status: 410, headers: { 'Cache-Control': 'no-store' } })
    }
    const response = await gateway.fetch(request, env)
    if (Date.now() >= expiresAt) {
      void response.body?.cancel().catch(() => {})
      return Response.json({ error: 'preview-expired' }, { status: 410, headers: { 'Cache-Control': 'no-store' } })
    }
    return response
  }
}
