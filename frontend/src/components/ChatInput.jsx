import { useEffect, useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { COPY } from '../content';

export default function ChatInput({ value, onChange, onSend, onStop, isStreaming }) {
  const textareaRef = useRef(null);

  // 跟随内容自动增高（最高 180px，超出内部滚动）
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  const submit = () => {
    if (isStreaming) return;
    if (!value.trim()) return;
    onSend(value);
  };

  const handleKeyDown = (event) => {
    // Enter 发送，Shift + Enter 换行；输入法组合状态下不拦截
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <footer className="composer">
      <div className="composer__inner">
        <div className="composer__box">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            autoFocus
            placeholder={COPY.placeholder}
            aria-label={COPY.placeholderFull}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />

          {isStreaming ? (
            <button
              type="button"
              className="send-button send-button--stop"
              onClick={onStop}
              aria-label={COPY.stop}
              title={COPY.stop}
            >
              <Square size={13} strokeWidth={2.4} fill="currentColor" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="send-button"
              onClick={submit}
              disabled={!value.trim()}
              aria-label={COPY.send}
              title={COPY.send}
            >
              <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="composer__foot">
          <span className="composer__hint">{COPY.inputHint}</span>
          <span className="composer__meta">
            <span>{COPY.disclaimer}</span>
            <span className="dot-separator" aria-hidden="true" />
            <a href={COPY.creditHref} target="_blank" rel="noreferrer noopener">
              {COPY.creditPrefix}
              {COPY.creditLabel}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
