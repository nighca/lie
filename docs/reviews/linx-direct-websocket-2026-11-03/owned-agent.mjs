// Provider agent IDs use the documented 32-character lowercase hex representation.
const agentIdPattern = /^[a-f0-9]{32}$/

export async function createOwnedAgent(state, save, request, body) {
  state.createAttempted = true
  state.createUncertain = true
  await save()
  const id = await request('/xiaozhi/agent', 'POST', body)
  if (typeof id !== 'string' || !agentIdPattern.test(id)) {
    throw Error('invalid-create-response')
  }
  state.agentId = id
  state.createUncertain = false
  await save()
}

export function ownedAgentPath(state) {
  return state.createAttempted === true && state.createUncertain === false
    && typeof state.agentId === 'string' && agentIdPattern.test(state.agentId)
    ? `/xiaozhi/agent/${state.agentId}` : null
}
