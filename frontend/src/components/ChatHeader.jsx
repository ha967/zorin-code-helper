export default function ChatHeader({ sessionId, onNewSession, isStreaming }) {
  return (
    <header className="chat-header">
      <div className="chat-header__brand">
        <div className="chat-header__logo" aria-hidden="true">
          Z
        </div>
        <div className="chat-header__titles">
          <h1>Zorin 编程助手</h1>
          <p>
            <span className={`status-dot ${isStreaming ? 'status-dot--busy' : ''}`} />
            {isStreaming ? '正在思考…' : '在线，随时提问'}
          </p>
        </div>
      </div>

      <div className="chat-header__actions">
        <span className="session-badge" title="当前会话 id（后端按它隔离会话记忆）">
          会话 #{sessionId}
        </span>
        <button type="button" className="ghost-button" onClick={onNewSession}>
          新会话
        </button>
      </div>
    </header>
  )
}
