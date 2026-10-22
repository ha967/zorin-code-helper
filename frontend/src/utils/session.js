const STORAGE_KEY = 'zorin-chat-session'

/**
 * 生成会话 id。
 *
 * 后端 /ai/chat 的 memoryId 是 int，并且用它做会话隔离（chatMemoryProvider），
 * 所以这里生成一个正整数字即可，不需要 UUID。
 */
export function createSessionId() {
  return Math.floor(Math.random() * 1_000_000_000) + 1
}

function parseSessionId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * 恢复会话 id：优先读 URL 上的 ?session=，其次读 localStorage。
 * 两者都没有时才新建。这样刷新页面、收藏链接都能找回后端保存的会话。
 */
export function resolveSessionId() {
  const fromUrl = parseSessionId(new URL(window.location.href).searchParams.get('session'))
  if (fromUrl) return fromUrl

  try {
    const fromStorage = parseSessionId(window.localStorage.getItem(STORAGE_KEY))
    if (fromStorage) return fromStorage
  } catch {
    // 隐私模式下 localStorage 可能不可用，忽略即可
  }

  return createSessionId()
}

/** 把当前会话 id 同步到 localStorage 和地址栏，方便刷新或分享。 */
export function rememberSessionId(sessionId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(sessionId))
  } catch {
    // 忽略存储不可用
  }

  const url = new URL(window.location.href)
  url.searchParams.set('session', String(sessionId))
  window.history.replaceState(null, '', url)
}
