import gateway, { type GatewayEnv } from './index'

export type DirectPreviewEnv = GatewayEnv & { PRIVATE_PREVIEW_EXPIRES_AT: string }

/** The formal handler is unchanged; only this temporary preview has an absolute expiry. */
export default {
  fetch(request: Request, env: DirectPreviewEnv): Promise<Response> | Response {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      const expiresAt = Date.parse(env.PRIVATE_PREVIEW_EXPIRES_AT)
      if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
        return Response.json({ error: 'preview-expired' }, { status: 410, headers: { 'Cache-Control': 'no-store' } })
      }
    }
    return gateway.fetch(request, env)
  }
}
