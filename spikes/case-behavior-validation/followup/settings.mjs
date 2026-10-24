import { limits as originalLimits } from '../settings.mjs'
import { matrix } from './matrix.mjs'

export { approvedPrompt, expectedModelId, hash } from '../settings.mjs'
export const limits = { ...originalLimits, answers: matrix.length }
