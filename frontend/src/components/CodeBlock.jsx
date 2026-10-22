import { useCallback, useEffect, useRef, useState } from 'react'

/** 从 react-markdown 的 React 节点树里提取纯文本，用于复制。 */
function extractText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node.props?.children !== undefined) return extractText(node.props.children)
  return ''
}

/**
 * 代码块：在 react-markdown 的默认 <pre> 外面加一条工具栏，提供语言标签和复制按钮。
 * 高亮仍由 rehype-highlight 生成的 span 完成。
 */
export default function CodeBlock({ node, children, ...props }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const codeElement = Array.isArray(children) ? children[0] : children
  const className = codeElement?.props?.className ?? ''
  const language = /language-([\w+#.-]+)/.exec(className)?.[1] ?? 'text'
  const code = extractText(children)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用（非安全上下文等）时静默失败
    }
  }, [code])

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{language}</span>
        <button type="button" className="code-block__copy" onClick={handleCopy}>
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre {...props}>{children}</pre>
    </div>
  )
}
