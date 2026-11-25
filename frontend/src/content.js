/**
 * 界面文案与品牌信息集中在这里，组件只引用不重复定义。
 * 换名字、换工作区、换招呼语时只改这个文件。
 */
export const APP = {
  brand: 'Zorin',
  role: '编程助手',
  fullName: 'Zorin 编程助手',
  workspace: 'Juniper Studio',
  workspaceMeta: '本机工作区',
  assistantName: 'Zorin',
  assistantRole: '编程助手',
};

export const COPY = {
  newChat: '新会话',
  openSidebar: '打开会话列表',
  closeSidebar: '收起会话列表',
  historyTitle: '会话记录',
  historyEmpty: '还没有保存的会话',
  historyHint: '发出第一条消息后，这段对话会保存在本机。',
  online: '在线',
  busy: '正在回答…',
  sessionLabel: '会话',
  newConversation: '新的对话',
  emptyTitle: '今天想写点什么？',
  emptyLead:
    '我是 Zorin，你的 AI 编程助手。写代码、解释报错、做代码评审，直接说就行。',
  emptyPromptsLabel: '试试这些',
  followUps: '继续追问',
  thinking: '正在整理思路…',
  placeholder: '输入你的问题…',
  placeholderFull: '输入你的问题，Enter 发送，Shift + Enter 换行',
  send: '发送',
  stop: '停止生成',
  inputHint: 'Enter 发送 · Shift + Enter 换行',
  disclaimer: '内容由 AI 生成，请注意甄别',
  aborted: '已停止生成',
  errorFallback: '请求失败，请稍后重试',
  themeToLight: '切换到浅色主题',
  themeToDark: '切换到深色主题',
  copy: '复制',
  copied: '已复制',
  creditPrefix: 'Template by ',
  creditLabel: 'VibeFather',
  creditHref: 'https://vibefather.ai/t/ai-chat-app-interface',
};

export const STARTER_PROMPTS = [
  '用 Java 写一个快速排序，并解释时间复杂度',
  'Spring Boot 里 SSE 和 WebSocket 该怎么选？',
  '帮我 review 这段代码：List<User> list = new ArrayList<>()',
  '解释一下 Spring 里 @Resource 和 @Autowired 的区别',
];
