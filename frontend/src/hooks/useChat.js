import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchHistory, fetchSuggestions, streamChat } from '../api/chat';

let messageSeq = 0;
const nextMessageId = () => ++messageSeq;

const toMessage = (message) => ({
  id: nextMessageId(),
  role: message.role,
  content: message.content,
  status: 'done',
});

/**
 * 一轮对话的状态管理：用户消息 + 一条正在流式填充的 AI 消息。
 * 切换会话时也会从后端拉取该会话的历史记录。
 *
 * @param {number} sessionId 后端用来隔离记忆的 memoryId
 * @param {{ onHistory?: (messages: Array<{role: string, content: string}>) => void }} [options]
 */
export function useChat(sessionId, options = {}) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);
  // 追问建议是副请求，切换会话 / 发新消息时要一并取消
  const suggestionAbortRef = useRef(null);
  // 历史加载完成前用户已经开始发消息时，不要把历史覆盖到当前对话上
  const touchedRef = useRef(false);

  // 回调放 ref 里，避免调用方每次渲染都触发重新拉取历史
  const onHistoryRef = useRef(options.onHistory);
  onHistoryRef.current = options.onHistory;

  useEffect(() => {
    let cancelled = false;
    touchedRef.current = false;
    setMessages([]);

    fetchHistory(sessionId)
      .then((history) => {
        if (cancelled || touchedRef.current) return;
        setMessages(history.map(toMessage));
        onHistoryRef.current?.(history);
      })
      .catch(() => {
        // 历史加载失败不阻塞聊天，用户可以继续发消息
      });

    return () => {
      cancelled = true;
      suggestionAbortRef.current?.abort();
      suggestionAbortRef.current = null;
    };
  }, [sessionId]);

  const patchAiMessage = (id, updater) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));

  const send = useCallback(
    (rawText) => {
      const content = rawText.trim();
      if (!content || isStreaming) return;

      touchedRef.current = true;
      const userMessage = { id: nextMessageId(), role: 'user', content };
      const aiMessageId = nextMessageId();
      const aiMessage = { id: aiMessageId, role: 'assistant', content: '', status: 'streaming' };

      setMessages((prev) => [...prev, userMessage, aiMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // 上一轮的追问建议还没回来就发了新消息，旧建议已经没人看，直接取消
      suggestionAbortRef.current?.abort();
      suggestionAbortRef.current = null;

      // 累计本轮完整回答，流结束后用它生成追问建议
      let answer = '';

      // 系统开启「减少动态效果」时，正文按 150ms 一批刷新，避免文字快速闪动
      const reducedMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      let pendingText = '';
      let flushTimer = null;

      const flushPending = () => {
        if (flushTimer !== null) {
          window.clearTimeout(flushTimer);
          flushTimer = null;
        }
        if (!pendingText) return;
        const chunk = pendingText;
        pendingText = '';
        patchAiMessage(aiMessageId, (m) => ({ ...m, content: m.content + chunk }));
      };

      streamChat({
        memoryId: sessionId,
        message: content,
        signal: controller.signal,
        onDelta: (chunk) => {
          answer += chunk;

          if (!reducedMotion) {
            patchAiMessage(aiMessageId, (m) => ({ ...m, content: m.content + chunk }));
            return;
          }

          pendingText += chunk;
          if (flushTimer === null) {
            flushTimer = window.setTimeout(() => {
              flushTimer = null;
              flushPending();
            }, 150);
          }
        },
        onDone: ({ aborted } = {}) => {
          flushPending();
          abortRef.current = null;
          setIsStreaming(false);
          patchAiMessage(aiMessageId, (m) => ({
            ...m,
            status: aborted ? 'aborted' : 'done',
          }));

          // 回答结束后再单独请求追问建议：旁路调用，不阻塞输入，失败就静默放弃
          if (aborted || !answer.trim()) return;

          const suggestionController = new AbortController();
          suggestionAbortRef.current = suggestionController;
          fetchSuggestions({
            question: content,
            answer,
            signal: suggestionController.signal,
          })
            .then((questions) => {
              if (!questions.length) return;
              patchAiMessage(aiMessageId, (m) => ({ ...m, suggestions: questions }));
            })
            .catch(() => {
              // 没有建议不影响对话，保持不展示
            })
            .finally(() => {
              if (suggestionAbortRef.current === suggestionController) {
                suggestionAbortRef.current = null;
              }
            });
        },
        onError: (error) => {
          flushPending();
          abortRef.current = null;
          setIsStreaming(false);
          patchAiMessage(aiMessageId, (m) => ({
            ...m,
            status: 'error',
            error: error?.message || '请求失败，请稍后重试',
          }));
        },
      });
    },
    [isStreaming, sessionId],
  );

  /** 中断当前流式输出 */
  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** 切换会话时清空消息 */
  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    suggestionAbortRef.current?.abort();
    suggestionAbortRef.current = null;
    touchedRef.current = false;
    setIsStreaming(false);
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, stop, clear };
}
