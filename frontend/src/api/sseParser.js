/**
 * 增量解析 text/event-stream 的解析器。
 *
 * SSE 的帧以空行分隔，每帧由若干 "field: value" 行组成。因为网络分片可能
 * 把一个帧切成两半，所以必须把未处理完的尾巴留到下一次 push 时继续拼接。
 */
export function createSseParser({ onData, onEvent } = {}) {
  let buffer = ''

  function dispatchFrame(frame) {
    const dataLines = []
    let eventName = 'message'

    for (const rawLine of frame.split('\n')) {
      // 空行 / 以冒号开头的是注释（心跳包常用 ": ping"）
      if (!rawLine || rawLine.startsWith(':')) continue

      const colon = rawLine.indexOf(':')
      const field = colon === -1 ? rawLine : rawLine.slice(0, colon)
      let value = colon === -1 ? '' : rawLine.slice(colon + 1)
      // 规范规定冒号后的第一个空格要去掉
      if (value.startsWith(' ')) value = value.slice(1)

      if (field === 'data') dataLines.push(value)
      else if (field === 'event') eventName = value
    }

    // 服务端把含换行的文本拆成了多个 data 行，这里重新拼回去
    if (dataLines.length > 0) {
      onData?.(dataLines.join('\n'), eventName)
    }
    onEvent?.(eventName)
  }

  return {
    push(chunk) {
      buffer += chunk.replace(/\r\n/g, '\n')
      let index = buffer.indexOf('\n\n')
      while (index !== -1) {
        const frame = buffer.slice(0, index)
        buffer = buffer.slice(index + 2)
        if (frame.trim()) dispatchFrame(frame)
        index = buffer.indexOf('\n\n')
      }
    },
    /** 流结束时把残留内容（末尾缺一个空行的帧）也吐出去 */
    flush() {
      const rest = buffer
      buffer = ''
      if (rest.trim()) dispatchFrame(rest)
    },
  }
}
