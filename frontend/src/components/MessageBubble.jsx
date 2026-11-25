import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { APP, COPY } from '../content';
import MarkdownContent from './MarkdownContent';
import { BrandMark, MemberAvatar } from './Marks';

export default function MessageBubble({ message, showSuggestions, onSendSuggestion }) {
  const isUser = message.role === 'user';
  const isThinking = !isUser && message.status === 'streaming' && !message.content;
  const suggestions = showSuggestions && message.status === 'done' ? message.suggestions : null;

  return (
    <article className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--ai'}`}>
      {isUser ? (
        <MemberAvatar className="msg-avatar" />
      ) : (
        <span className="msg-avatar msg-avatar--ai">
          <BrandMark />
        </span>
      )}

      <div className="msg-body">
        {!isUser && (
          <div className="msg-meta">
            <span className="msg-author">{APP.assistantName}</span>
            <span className="msg-role">{APP.assistantRole}</span>
          </div>
        )}

        {isThinking ? (
          <div className="thinking">
            <span className="thinking__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>{COPY.thinking}</span>
          </div>
        ) : isUser ? (
          <div className="msg-bubble">{message.content}</div>
        ) : (
          <div className="msg-content">
            <MarkdownContent content={message.content} />
            {message.status === 'streaming' && message.content && (
              <span className="caret" aria-hidden="true" />
            )}
          </div>
        )}

        {message.status === 'error' && (
          <p className="msg-note msg-note--error">
            <AlertCircle size={14} strokeWidth={1.9} aria-hidden="true" />
            <span>{message.error || COPY.errorFallback}</span>
          </p>
        )}
        {message.status === 'aborted' && <p className="msg-note msg-note--muted">{COPY.aborted}</p>}

        {suggestions?.length > 0 && (
          <div className="follow-ups">
            <p className="follow-ups__title">{COPY.followUps}</p>
            <div className="follow-ups__list">
              {suggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="follow-up"
                  onClick={() => onSendSuggestion?.(question)}
                >
                  <span>{question}</span>
                  <ArrowUpRight size={14} strokeWidth={1.9} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
