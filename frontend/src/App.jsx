import { useCallback, useEffect, useState } from 'react'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import MessageList from './components/MessageList'
import { useChat } from './hooks/useChat'
import { createSessionId, rememberSessionId, resolveSessionId } from './utils/session'

export default function App() {
  // 优先恢复地址栏 / localStorage 里的会话，找不到才新建
  const [sessionId, setSessionId] = useState(resolveSessionId)
  const [draft, setDraft] = useState('')
  const { messages, isStreaming, send, stop, clear } = useChat(sessionId)

  useEffect(() => {
    rememberSessionId(sessionId)
  }, [sessionId])

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
