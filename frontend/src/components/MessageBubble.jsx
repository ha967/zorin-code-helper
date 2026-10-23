import MarkdownContent from './MarkdownContent'

export default function MessageBubble({ message, showSuggestions, onSendSuggestion }) {
  const isUser = message.role === 'user'
  const isThinking = !isUser && message.status === 'streaming' && !message.content
  const suggestions = showSuggestions && message.status === 'done' ? message.suggestions : null

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

        {suggestions?.length > 0 && (
          <div className="bubble-suggestions">
            <p className="bubble-suggestions__title">继续追问</p>
            <div className="bubble-suggestions__list">
              {suggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="suggestion suggestion--chip"
                  onClick={() => onSendSuggestion?.(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
