/**
 * 原创的几何图形：品牌标记和工作区头像。
 * 全部用内联 SVG 绘制，不依赖任何远程图片。
 */
export function BrandMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M5 23C8.5 13.5 15 9 23.5 9.5"
        stroke="var(--mark-primary, var(--coral))"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M10 26.5C13.5 17 20 12.5 28.5 13"
        stroke="var(--mark-secondary, currentColor)"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

/** 抽象几何头像，用作本机成员 / 工作区的标识。 */
export function MemberAvatar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="10" fill="var(--avatar-plate, var(--blush))" />
      <circle cx="12.4" cy="13.2" r="5.1" fill="var(--coral)" />
      <path d="M17.6 9.4 25 23H10.2z" fill="var(--avatar-shape, var(--plum))" opacity="0.86" />
      <circle cx="22.2" cy="9.6" r="1.9" fill="var(--avatar-accent, var(--muted))" opacity="0.5" />
    </svg>
  );
}
