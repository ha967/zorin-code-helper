import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { COPY, STARTER_PROMPTS } from '../content';
import { BrandMark } from './Marks';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, onPickSuggestion, onSendSuggestion }) {
  const scrollRef = useRef(null);
  // 用户往上翻看历史时不要强行把视图拽到底部
  const stickToBottomRef = useRef(true);

  // 追问建议只挂在最新一条 AI 回答下面，避免历史消息里堆满过期的建议
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  return (
    <main className="chat-list" ref={scrollRef} onScroll={handleScroll}>
      <div className="chat-list__inner">
        {messages.length === 0 ? (
          <section className="empty-state">
            <span className="empty-state__mark">
              <BrandMark />
            </span>
            <h2>{COPY.emptyTitle}</h2>
            <p className="empty-state__lead">{COPY.emptyLead}</p>

            <p className="empty-state__label">{COPY.emptyPromptsLabel}</p>
            <div className="starter-list">
              {STARTER_PROMPTS.map((text) => (
                <button
                  key={text}
                  type="button"
                  className="starter-card"
                  onClick={() => onPickSuggestion(text)}
                >
                  <span>{text}</span>
                  <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showSuggestions={message.id === lastAssistantId}
              onSendSuggestion={onSendSuggestion}
            />
          ))
        )}
      </div>
    </main>
  );
}
