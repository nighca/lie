import { execFileSync } from 'node:child_process'

export type PageBuild = { commit: string | null; dirty: boolean }

/** A local build with local changes must not claim to be the clean commit. */
export function readPageBuild(directory: string): PageBuild {
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return { commit, dirty: changes.length > 0 }
  } catch {
    return { commit: null, dirty: false }
  }
}
