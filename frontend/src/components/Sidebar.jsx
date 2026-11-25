import { Plus, X } from 'lucide-react';
import { APP, COPY } from '../content';
import { formatSessionTime } from '../utils/sessions';
import { BrandMark, MemberAvatar } from './Marks';

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onClose,
}) {
  return (
    <aside className="sidebar" aria-label={COPY.historyTitle}>
      <div className="sidebar__top">
        <div className="wordmark">
          <BrandMark className="wordmark__mark" />
          <div className="wordmark__text">
            <span className="wordmark__name">{APP.brand}</span>
            <span className="wordmark__sub">{APP.role}</span>
          </div>
        </div>
        <button
          type="button"
          className="icon-button sidebar__close"
          onClick={onClose}
          aria-label={COPY.closeSidebar}
        >
          <X size={17} strokeWidth={1.8} />
        </button>
      </div>

      <button type="button" className="new-chat-button" onClick={onNewSession}>
        <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
        <span>{COPY.newChat}</span>
      </button>

      <div className="sidebar__section">
        <div className="sidebar__section-head">
          <span>{COPY.historyTitle}</span>
          <span className="mono-meta">{String(sessions.length).padStart(2, '0')}</span>
        </div>

        {sessions.length === 0 ? (
          <div className="sidebar__empty">
            <p>{COPY.historyEmpty}</p>
            <p>{COPY.historyHint}</p>
          </div>
        ) : (
          <nav className="session-list" aria-label={COPY.historyTitle}>
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  className={`session-row ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => onSelectSession(session.id)}
                >
                  <span className="session-row__title">
                    {session.title || `${COPY.sessionLabel} #${session.id}`}
                  </span>
                  <span className="session-row__meta mono-meta">
                    {formatSessionTime(session.updatedAt)}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <div className="sidebar__foot">
        <MemberAvatar className="workspace-avatar" />
        <div className="workspace">
          <span className="workspace__name">{APP.workspace}</span>
          <span className="workspace__meta">{APP.workspaceMeta}</span>
        </div>
      </div>
    </aside>
  );
}
