interface BackgroundCharacter {
  name: string
  accent: string | null
}

interface BackgroundTextSegment {
  text: string
  highlighted: boolean
  accent: string | null
}

/** Splits literal names without changing the text; longer names take precedence. */
export function splitBackgroundCharacterNames(text: string, characters: readonly BackgroundCharacter[]): readonly BackgroundTextSegment[] {
  const accents = new Map<string, string | null>()
  for (const { name, accent } of characters) {
    if (name.length === 0) continue
    accents.set(name, accents.has(name) && accents.get(name) !== accent ? null : accent)
  }

  let segments: BackgroundTextSegment[] = text.length === 0 ? [] : [{ text, highlighted: false, accent: null }]
  for (const [name, accent] of [...accents].sort(([a], [b]) => b.length - a.length)) {
    segments = segments.flatMap((segment) => {
      if (segment.highlighted) return [segment]
      const parts: BackgroundTextSegment[] = []
      let start = 0
      let match = segment.text.indexOf(name)
      while (match !== -1) {
        if (match > start) parts.push({ text: segment.text.slice(start, match), highlighted: false, accent: null })
        parts.push({ text: name, highlighted: true, accent })
        start = match + name.length
        match = segment.text.indexOf(name, start)
      }
      if (start < segment.text.length) parts.push({ text: segment.text.slice(start), highlighted: false, accent: null })
      return parts
    })
  }
  return segments
}
