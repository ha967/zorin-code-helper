/**
 * 本机会话列表。
 *
 * 后端只按 memoryId 保存对话内容，没有「列出所有会话」的接口，
 * 所以在 localStorage 里记一份轻量索引：id、标题、更新时间。
 * 点击某条记录时仍然向后端请求该 memoryId 的历史。
 */
const SESSIONS_KEY = 'zorin-chat-sessions';
const MAX_SESSIONS = 30;

const isValidEntry = (entry) =>
  Number.isInteger(entry?.id) && entry.id > 0 && Number.isFinite(entry?.updatedAt);

function readSessions() {
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    const list = JSON.parse(raw ?? '[]');
    return Array.isArray(list) ? list.filter(isValidEntry) : [];
  } catch {
    // 隐私模式或脏数据时退回空列表，不影响聊天
    return [];
  }
}

function writeSessions(list) {
  try {
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
  } catch {
    // 存储不可用时只影响侧栏，不影响对话
  }
}

/** 按更新时间倒序返回会话索引。 */
export function listSessions() {
  return readSessions().sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 写入或更新一条会话索引。
 * 标题只在第一次创建时确定，后续发送消息只刷新时间。
 */
export function saveSession({ id, title, at = Date.now() }) {
  const list = readSessions();
  const index = list.findIndex((entry) => entry.id === id);

  if (index === -1) {
    list.push({ id, title: title || '', updatedAt: at });
  } else {
    const entry = list[index];
    list[index] = { ...entry, title: entry.title || title || '', updatedAt: at };
  }

  const trimmed = list
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_SESSIONS);
  writeSessions(trimmed);
  return trimmed;
}

/** 从用户的第一句话里截一个会话标题。 */
export function sessionTitleFrom(text) {
  const flat = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!flat) return '';
  return flat.length > 36 ? `${flat.slice(0, 36)}…` : flat;
}

/** 侧栏里的时间：今天显示时分，最近一周显示相对天数，更早显示日期。 */
export function formatSessionTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const startOfDay = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (days <= 0) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
