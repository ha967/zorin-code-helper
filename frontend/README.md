# Zorin 编程助手 · 前端

AI 编程助手的 Web 聊天界面：React + Vite + Axios，单页（主页即聊天室）。

## 开发运行

```bash
# 1. 先启动后端（项目根目录），默认 http://localhost:8081/api
./gradlew bootRun

# 2. 再启动前端（本目录）
cd frontend
npm install
npm run dev          # http://localhost:5173
```

`vite.config.js` 里把 `/api` 代理到 `http://localhost:8081`，所以前端代码只写相对路径，
也不会遇到跨域问题。后端地址不同时，用环境变量覆盖：

```bash
# cmd / PowerShell
set VITE_BACKEND_ORIGIN=http://localhost:9000 && npm run dev
```

生产构建：

```bash
npm run build        # 产物在 dist/
npm run preview
```

如果前端不是和后端同源部署，构建时用 `VITE_API_BASE_URL` 指定完整后端前缀
（例如 `https://api.example.com/api`）。

## 页面行为

- 进入页面自动生成一个**会话 id**（`src/utils/session.js`，正整数字符串，对应后端 `memoryId`），
  显示在右上角，点击「新会话」会重新生成并清空聊天记录。
- 发送消息后通过 SSE 消费 `GET /api/ai/chat?memoryId=&message=`，AI 回复逐字实时渲染。
- 流式输出过程中发送按钮变成「停止」，可随时中断。

## SSE 是怎么消费的

浏览器的 `EventSource` 只能发 GET 请求、无法带自定义参数，而这里需要按项目要求用 axios，
所以走的是 axios 的 XHR 适配器：

1. `axios.get(..., { responseType: 'text', onDownloadProgress })` —— 每次网络分片到达时，
   `event.target.responseText` 给出的是**累计**文本，`src/api/chat.js` 据此切出本次增量；
2. 增量交给 `src/api/sseParser.js` 做 `text/event-stream` 分帧解析（处理帧被切半、CRLF、
   `: ping` 心跳注释、一个 token 内换行被服务端拆成多行 `data:` 等情况）；
3. 解析出的每段文本追加到 AI 气泡里，实现打字机效果。

## 目录结构

```
frontend/
├─ index.html
├─ vite.config.js          # 开发代理 /api -> 8081
└─ src/
   ├─ main.jsx
   ├─ App.jsx              # 会话 id、消息状态、发送/新会话
   ├─ index.css            # 聊天室暗色主题
   ├─ api/
   │  ├─ chat.js           # streamChat()：axios 流式请求 + 中断
   │  └─ sseParser.js      # SSE 增量分帧解析
   ├─ hooks/useChat.js     # 一轮对话的状态机
   ├─ components/          # ChatHeader / MessageList / MessageBubble / ChatInput
   └─ utils/session.js     # 生成会话 id
```
