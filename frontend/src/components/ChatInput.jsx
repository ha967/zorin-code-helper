import { useEffect, useRef } from 'react'

export default function ChatInput({ value, onChange, onSend, onStop, isStreaming }) {
  const textareaRef = useRef(null)

  // 跟随内容自动增高（最高 160px，超出内部滚动）
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const submit = () => {
    if (isStreaming) return
    if (!value.trim()) return
    onSend(value)
  }

  const handleKeyDown = (event) => {
    // Enter 发送，Shift + Enter 换行；输入法组合状态下不拦截
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <footer className="chat-input">
      <div className="chat-input__box">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          autoFocus
          placeholder="输入你的问题，Enter 发送，Shift + Enter 换行"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button type="button" className="send-button send-button--stop" onClick={onStop}>
            停止
          </button>
        ) : (
          <button
            type="button"
            className="send-button"
            onClick={submit}
            disabled={!value.trim()}
          >
            发送
          </button>
        )}
      </div>
      <p className="chat-input__tip">内容由 AI 生成，请注意甄别</p>
    </footer>
  )
}
