/**
 * design/appearances/manifest.json 的单条正式预置形象。
 * 这是制作源规格；前端 Appearance 使用生成后的站点 URL，并保留资源缺失容错。
 * 路径、唯一性、PNG 画布和文件存在性由 scripts/appearances.mjs 进一步校验。
 */
export interface AppearanceManifestEntry {
  /** 稳定引用 ID，只用小写字母、数字和连字符；案件通过 appearanceId 引用。 */
  id: string
  /** 编辑器展示的中文形象名，如“珊瑚短发”；不是案件内的人物姓名。 */
  name: string
  /** 头像源路径：assets/<id>/default.png，或独立的 assets/<id>/avatar.png。 */
  avatar: string
  /** 默认立绘源路径，固定为 assets/<id>/default.png。 */
  portrait: string
  /** 展示主题色，格式 #RRGGBB；不代表人物可信度或罪责。 */
  accent: string
  /** 已配置的灵矽音色 ID，正式库必填非空；这是音色标识，不是 API key。 */
  voiceId: string
  /** 可选独立动画包；固定 assets/<id>/animation/package.json，缺省沿用静态四态。 */
  animation?: string
  /** 三种补充立绘；连同 portrait 构成当前四态，画布尺寸必须一致。 */
  portraits: {
    /** 人物聆听玩家时的立绘：assets/<id>/listening.png。 */
    listening: string
    /** 等待角色回答时的立绘：assets/<id>/waiting.png。 */
    waiting: string
    /** 人物说话时的立绘：assets/<id>/speaking.png。 */
    speaking: string
  }
}

/** 完整权威清单；非空、ID 唯一等跨条目约束由生成器校验。 */
export type AppearanceManifest = readonly AppearanceManifestEntry[]
