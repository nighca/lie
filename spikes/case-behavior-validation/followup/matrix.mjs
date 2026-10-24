import { matrix as original } from '../matrix.mjs'

const ids = new Set(['duck-05', 'duck-06', 'duck-07', 'duck-08', ...Array.from({ length: 8 }, (_, index) => 'salt-' + String(index + 1).padStart(2, '0'))])
export const matrix = original.filter(row => ids.has(row.id))
if (matrix.length !== 12 || new Set(matrix.map(row => row.id)).size !== 12) throw new Error('followup-matrix-invalid')
