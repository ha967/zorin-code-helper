import { useCallback, useEffect, useState } from 'react';
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import Sidebar from './components/Sidebar';
import { COPY } from './content';
import { useChat } from './hooks/useChat';
import { createSessionId, rememberSessionId, resolveSessionId } from './utils/session';
import { listSessions, saveSession, sessionTitleFrom } from './utils/sessions';
import { rememberTheme, resolveTheme } from './utils/theme';

export default function App() {
  // 优先恢复地址栏 / localStorage 里的会话，找不到才新建
  const [sessionId, setSessionId] = useState(resolveSessionId);
  const [draft, setDraft] = useState('');
  const [sessions, setSessions] = useState(listSessions);
  const [theme, setTheme] = useState(resolveTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 从后端恢复历史时，顺手把会话登记进本机索引（侧栏只显示这里记过的会话）
  const handleHistory = useCallback(
    (history) => {
      const firstUser = history.find((message) => message.role === 'user');
      if (!firstUser?.content) return;
      setSessions(saveSession({ id: sessionId, title: sessionTitleFrom(firstUser.content) }));
    },
    [sessionId],
  );

  const { messages, isStreaming, send, stop, clear } = useChat(sessionId, {
    onHistory: handleHistory,
  });

  useEffect(() => {
    rememberSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    rememberTheme(theme);
  }, [theme]);

  // 窄屏侧栏打开时支持 Esc 关闭
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handleSend = useCallback(
    (text) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      // 第一次发消息时用这句话做侧栏标题，之后只刷新时间
      setSessions(saveSession({ id: sessionId, title: sessionTitleFrom(content) }));
      send(content);
      setDraft('');
      setSidebarOpen(false);
    },
    [isStreaming, send, sessionId],
  );

  const handleNewSession = useCallback(() => {
    clear();
    setDraft('');
    setSessionId(createSessionId());
    setSidebarOpen(false);
  }, [clear]);

  const handleSelectSession = useCallback(
    (id) => {
      setDraft('');
      setSidebarOpen(false);
      if (id !== sessionId) setSessionId(id);
    },
    [sessionId],
  );

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const activeTitle =
    sessions.find((session) => session.id === sessionId)?.title || COPY.newConversation;

  return (
    <div className={`app-shell ${sidebarOpen ? 'is-sidebar-open' : ''}`}>
      <Sidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label={COPY.closeSidebar}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <ChatHeader
          title={activeTitle}
          sessionId={sessionId}
          isStreaming={isStreaming}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <MessageList
          messages={messages}
          onPickSuggestion={setDraft}
          onSendSuggestion={handleSend}
        />

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          onStop={stop}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
