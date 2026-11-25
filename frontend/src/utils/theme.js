const THEME_KEY = 'zorin-chat-theme';

/**
 * 主题优先级：本机记住的选择 > 系统偏好 > 浅色（模板首屏是暖白挑色）。
 */
export function resolveTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // 忽略存储不可用
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function rememberTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // 忽略存储不可用
  }
}
