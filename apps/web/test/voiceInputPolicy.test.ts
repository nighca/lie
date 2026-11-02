import { expect, it } from 'vitest'

import { needsTurnTakingVoice } from '../src/application/voiceInputPolicy'

const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ipadDesktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'

it.each([
  { label: 'iPhone Safari', userAgent: iphone, platform: 'iPhone', maxTouchPoints: 5, expected: true },
  { label: 'iPad mobile Safari', userAgent: iphone.replaceAll('iPhone', 'iPad'), platform: 'iPad', maxTouchPoints: 5, expected: true },
  { label: 'iPad desktop Safari', userAgent: ipadDesktop, platform: 'MacIntel', maxTouchPoints: 5, expected: true },
  { label: 'Mac Safari', userAgent: ipadDesktop, platform: 'MacIntel', maxTouchPoints: 0, expected: false },
  ...['CriOS/140.0', 'FxiOS/140.0', 'EdgiOS/140.0', 'OPiOS/140.0', 'GSA/400.0', 'DuckDuckGo/7', 'Chrome/140.0'].map(browser => ({ label: browser, userAgent: iphone.replace('Version/18.0', browser), platform: 'iPhone', maxTouchPoints: 5, expected: false })),
  { label: 'iPad Chrome desktop', userAgent: ipadDesktop.replace('Version/18.0', 'Chrome/140.0'), platform: 'MacIntel', maxTouchPoints: 5, expected: false },
  { label: 'embedded webview', userAgent: iphone.replace('Version/18.0 ', ''), platform: 'iPhone', maxTouchPoints: 5, expected: false },
  { label: 'unknown', userAgent: '', platform: '', maxTouchPoints: 0, expected: false },
])('$label selects turn-taking=$expected', ({ expected, ...browser }) => {
  expect(needsTurnTakingVoice(browser)).toBe(expected)
})
