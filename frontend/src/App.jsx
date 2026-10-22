import { useCallback, useState } from 'react'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import MessageList from './components/MessageList'
import { useChat } from './hooks/useChat'
import { createSessionId } from './utils/session'

export default function App() {
  // 进入页面即生成一个会话 id，用于区分不同会话（后端按 memoryId 隔离记忆）
  const [sessionId, setSessionId] = useState(createSessionId)
  const [draft, setDraft] = useState('')
  const { messages, isStreaming, send, stop, clear } = useChat(sessionId)

  const handleSend = useCallback(
    (text) => {
      send(text)
      setDraft('')
    },
    [send],
  )

  const handleNewSession = useCallback(() => {
    clear()
    setDraft('')
    setSessionId(createSessionId())
  }, [clear])

  return (
    <div className="app">
      <ChatHeader
        sessionId={sessionId}
        isStreaming={isStreaming}
        onNewSession={handleNewSession}
      />

      <MessageList messages={messages} onPickSuggestion={setDraft} />

      <ChatInput
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        onStop={stop}
        isStreaming={isStreaming}
      />
    </div>
  )
}
