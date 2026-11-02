export function needsTurnTakingVoice(browser: Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  const { userAgent, platform, maxTouchPoints } = browser
  const mobileAppleDevice = /iPhone|iPad/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
  return mobileAppleDevice && /Version\//.test(userAgent) && /Safari\//.test(userAgent)
    && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Firefox|Edg\/|OPR\/|GSA|DuckDuckGo/.test(userAgent)
}
