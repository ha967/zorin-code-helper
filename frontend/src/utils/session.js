/**
 * 生成会话 id。
 *
 * 后端 /ai/chat 的 memoryId 是 int，并且用它做会话隔离（chatMemoryProvider），
 * 所以这里生成一个正整数字符即可，不需要 UUID。
 */
export function createSessionId() {
  return Math.floor(Math.random() * 1_000_000_000) + 1
}
