import { Menu, Moon, Sun } from 'lucide-react';
import { COPY } from '../content';

export default function ChatHeader({
  title,
  sessionId,
  isStreaming,
  theme,
  onToggleTheme,
  onOpenSidebar,
}) {
  return (
    <header className="chat-header">
      <button
        type="button"
        className="icon-button chat-header__menu"
        onClick={onOpenSidebar}
        aria-label={COPY.openSidebar}
      >
        <Menu size={18} strokeWidth={1.8} />
      </button>

      <div className="chat-header__titles">
        <h1 title={title}>{title}</h1>
        <p className="chat-header__status">
          <span className={`status-dot ${isStreaming ? 'status-dot--busy' : ''}`} />
          <span>{isStreaming ? COPY.busy : COPY.online}</span>
          <span className="chat-header__divider" aria-hidden="true" />
          <span className="mono-meta">
            {COPY.sessionLabel} #{sessionId}
          </span>
        </p>
      </div>

      <div className="chat-header__actions">
        <button
          type="button"
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={theme === 'light' ? COPY.themeToDark : COPY.themeToLight}
          title={theme === 'light' ? COPY.themeToDark : COPY.themeToLight}
        >
          {theme === 'light' ? (
            <Moon size={17} strokeWidth={1.8} />
          ) : (
            <Sun size={17} strokeWidth={1.8} />
          )}
        </button>
      </div>
    </header>
  );
}
