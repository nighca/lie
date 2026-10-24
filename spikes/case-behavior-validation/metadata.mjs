import { mkdir, open, readFile, writeFile } from 'node:fs/promises'
import { approvedPrompt, expectedModelId, hash } from './settings.mjs'
const args = process.argv.slice(2)
function option(key) { const index = args.indexOf(key); if (index < 0 || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error('missing-option'); return args[index + 1] }
const keyPath = option('--key-file')
const sourcePath = option('--source-state')
const temporary = new URL('./tmp/', import.meta.url)
await mkdir(temporary, { recursive: true })
const attempt = await open(new URL('metadata-attempt.json', temporary), 'wx', 0o600)
await attempt.writeFile(JSON.stringify({ at: new Date().toISOString(), purpose: 'one-source-agent-get-and-one-model-catalog-get' })); await attempt.close()
const key = (await readFile(keyPath, 'utf8')).trim()
const source = JSON.parse(await readFile(sourcePath, 'utf8'))
if (!source.name?.startsWith('LIE-online-preview-') || typeof source.agentId !== 'string') throw new Error('unexpected-source-owner')
async function get(path) {
  const response = await fetch(`https://xrobo.qiniu.com${path}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20_000) })
  const result = await response.json()
  if (!response.ok || result.code !== 0) throw new Error('metadata-get-rejected')
  return { status: response.status, code: result.code, data: result.data }
}
try {
  const sourceResult = await get(`/xiaozhi/agent/${source.agentId}`)
  const agent = sourceResult.data
  const catalogResult = await get('/v1/agents/models/llm')
  const entries = [...(catalogResult.data.publics ?? []), ...(catalogResult.data.privates ?? [])]
  const model = entries.find(item => item.id === agent.llmModelId)
  const prompt = await approvedPrompt()
  const billing = Object.fromEntries(Object.entries(model ?? {}).filter(([name, value]) => /coefficient|multiplier|billing|rate|tier/i.test(name) && (typeof value === 'number' || typeof value === 'boolean' || value === null || ['free', 'pro'].includes(value))))
  const result = {
    capturedAt: new Date().toISOString(), sourceAgentGet: { status: sourceResult.status, code: sourceResult.code }, modelCatalogGet: { status: catalogResult.status, code: catalogResult.code },
    llmModelId: agent.llmModelId ?? null, llmModelName: model?.name ?? null, modelType: model?.type ?? null,
    provider: typeof model?.provider === 'string' ? model.provider : null,
    modelMatchedExpected: agent.llmModelId === expectedModelId,
    genericPromptMatchesSource: agent.systemPrompt === prompt, genericPromptHash: typeof agent.systemPrompt === 'string' ? hash(agent.systemPrompt) : null,
    memModelId: agent.memModelId ?? null, chatHistoryConf: agent.chatHistoryConf ?? null,
    ttsVoiceId: agent.ttsVoiceId ?? null, ttsModelId: agent.ttsModelId ?? null,
    maxTokens: agent.extra?.llm?.max_tokens ?? null, searchEnabled: agent.extra?.llm?.enable_search ?? null, greetingDisabled: agent.extra?.disable_greeting ?? null,
    observedBillingFields: billing, actualVoiceCoefficient: null, cashCostVerified: false,
  }
  await writeFile(new URL('metadata.json', temporary), JSON.stringify(result, null, 2), { mode: 0o600 })
  console.log(JSON.stringify(result))
} catch { console.error(JSON.stringify({ stopped: true, reason: 'metadata-read-failed', retry: false })); process.exitCode = 1 }
