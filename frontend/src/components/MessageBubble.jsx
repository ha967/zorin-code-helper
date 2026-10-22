import MarkdownContent from './MarkdownContent'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isThinking = !isUser && message.status === 'streaming' && !message.content

  return (
    <div className={`bubble-row ${isUser ? 'bubble-row--user' : 'bubble-row--ai'}`}>
      <div className="bubble-avatar" aria-hidden="true">
        {isUser ? '我' : 'AI'}
      </div>

      <div className="bubble-body">
        <div className={`bubble ${isUser ? '' : 'bubble--markdown'}`}>
          {isThinking ? (
            <span className="typing" aria-label="正在生成">
              <i />
              <i />
              <i />
            </span>
          ) : isUser ? (
            <div className="bubble-text">{message.content}</div>
          ) : (
            <MarkdownContent content={message.content} />
          )}

          {!isUser && message.status === 'streaming' && message.content && (
            <span className="caret" aria-hidden="true" />
          )}
        </div>

        {message.status === 'error' && <p className="bubble-error">{message.error}</p>}
        {message.status === 'aborted' && <p className="bubble-hint">已停止生成</p>}
      </div>
    </div>
  )
}
