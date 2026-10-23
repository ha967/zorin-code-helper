# Zorin Code Helper

基于 **Spring Boot + LangChain4j + 阿里云百炼（DashScope / 千问）** 的 AI 编程助手学习项目，配套一个 **React + Vite** 的聊天页面。

项目以「边学边用」的方式覆盖 LangChain4j 的常用能力：ChatModel 初始化、多模态、系统提示词、AI Service 声明式封装、会话记忆持久化、结构化输出、RAG、工具调用、输入 Guardrail、流式输出，以及 MCP 接入实验。前端则演示了如何用 axios 消费 SSE、逐字渲染 Markdown 回复。

---

## 功能特性

| 能力 | 说明 | 对应代码 |
| --- | --- | --- |
| 流式对话 | 后端以 SSE 逐段推送，前端打字机效果渲染 | [`AiController`](src/main/java/com/example/zorincodehelper/controller/AiController.java) |
| 会话记忆 | 每个 `memoryId` 独立记忆，保留最近 10 条，落盘为 JSON，重启不丢 | [`AiCodeHelperServiceFactory`](src/main/java/com/example/zorincodehelper/ai/AiCodeHelperServiceFactory.java) / [`FileChatMemoryStore`](src/main/java/com/example/zorincodehelper/ai/FileChatMemoryStore.java) |
| 历史恢复 | 刷新页面 / 分享链接可按 `memoryId` 拉回历史 | [`ChatHistoryService`](src/main/java/com/example/zorincodehelper/ai/ChatHistoryService.java) |
| 工具调用 | 注册「查天气」示例工具，由模型自行决定是否调用 | [`TodayWeatherTool`](src/main/java/com/example/zorincodehelper/ai/tools/TodayWeatherTool.java) |
| RAG | 加载 `docs/` 下的文档，切分、向量化并检索 | [`RagConfig`](src/main/java/com/example/zorincodehelper/ai/rag/RagConfig.java) |
| 输入拦截 | 敏感词命中时返回 `GUARDRAIL_BLOCKED` 错误帧 | [`SafeInputGuardrail`](src/main/java/com/example/zorincodehelper/ai/guardrail/SafeInputGuardrail.java) |
| 结构化输出 | 让模型直接返回 Java `record` | [`AiCodeHelperService`](src/main/java/com/example/zorincodehelper/ai/AiCodeHelperService.java) |
| 追问建议 | 每轮回答结束后生成 3 条可点击直接发送的后续问题 | [`FollowUpSuggestionService`](src/main/java/com/example/zorincodehelper/ai/FollowUpSuggestionService.java) |
| Markdown 渲染 | GFM 表格、代码高亮、代码块一键复制 | [`MarkdownContent.jsx`](frontend/src/components/MarkdownContent.jsx) |

## 技术栈

- **后端**：Spring Boot 4.1.1、Java 21、Gradle 9.8.1、LangChain4j 1.1.0（DashScope starter 1.1.0-beta7）、Lombok
- **大模型**：阿里云百炼 DashScope，对话 `qwen-plus`，向量 `text-embedding-v4`
- **前端**：React 19、Vite 8、axios、react-markdown、remark-gfm、rehype-highlight

## 项目结构

```text
zorin-code-helper/
├─ src/main/java/com/example/zorincodehelper/
│  ├─ ai/
│  │  ├─ AiCodeHelper.java              # 底层用法：直接调用 ChatModel
│  │  ├─ AiCodeHelperService.java       # 声明式 AI Service 接口
│  │  ├─ AiCodeHelperServiceFactory.java# 构建 AiServices 代理（记忆、工具等）
│  │  ├─ FileChatMemoryStore.java       # 基于 JSON 文件的会话记忆存储
│  │  ├─ ChatHistoryService.java        # 读取 / 清空会话历史
│  │  ├─ FollowUpSuggestionService.java # 追问建议（无记忆的旁路 AI Service）
│  │  ├─ guardrail/                     # 输入 Guardrail
│  │  ├─ rag/RagConfig.java             # RAG 向量库与检索器
│  │  ├─ tools/TodayWeatherTool.java    # 工具调用示例
│  │  └─ mcp/MapConfig.java             # MCP 接入实验（未启用）
│  ├─ config/CorsConfig.java
│  └─ controller/                       # SSE 对话、历史接口、全局异常处理
├─ src/main/resources/
│  ├─ application.yml                   # 端口 8081，context-path /api
│  ├─ system-prompt.txt                 # 系统提示词
│  ├─ follow-up-prompt.txt              # 追问建议提示词
│  └─ docs/                             # RAG 知识库文档
├─ src/test/java/...                    # 测试（大部分会真实调用模型）
├─ frontend/                            # React 聊天页面
├─ build.gradle
└─ README.md
```

---

## 快速开始

### 环境要求

- JDK 21+
- Node.js 18+（需要支持 Vite 8）
- 一个可用的阿里云百炼 DashScope API Key

### 1. 创建本地配置

`src/main/resources/application-local.yml` 已被 `.gitignore` 忽略，需要自己创建。以下三个模型都要配置，应用启动时都会用到：

```yaml
langchain4j:
  community:
    dashscope:
      chat-model:
        api-key: ${DASHSCOPE_API_KEY}
        model-name: qwen-plus
      streaming-chat-model:
        api-key: ${DASHSCOPE_API_KEY}
        model-name: qwen-plus
      embedding-model:
        api-key: ${DASHSCOPE_API_KEY}
        model-name: text-embedding-v4
```

> `streaming-chat-model` 是流式对话必需的，`embedding-model` 是启动时构建 RAG 检索器必需的；缺任意一个都会导致启动失败。也可以把 `${DASHSCOPE_API_KEY}` 直接替换成真实 Key，但**不要提交该文件**。

### 2. 启动后端

在**仓库根目录**执行（RAG 使用相对路径 `src/main/resources/docs` 加载文档）：

```bash
./gradlew bootRun        # Git Bash
gradlew.bat bootRun      # cmd / PowerShell
```

服务地址：`http://localhost:8081/api`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Vite 会把 `/api` 代理到 `http://localhost:8081`，因此开发时不存在跨域问题。若后端地址不同：

```bash
# Git Bash
VITE_BACKEND_ORIGIN=http://localhost:9000 npm run dev

# cmd / PowerShell
set VITE_BACKEND_ORIGIN=http://localhost:9000 && npm run dev
```

生产构建：

```bash
npm run build            # 产物输出到 frontend/dist
npm run preview
```

如果构建产物与后端不同源部署，用 `VITE_API_BASE_URL` 指定完整 API 前缀（如 `https://api.example.com/api`）。

---

## 配置说明

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `server.port` | `8081` | 后端端口 |
| `server.servlet.context-path` | `/api` | 所有接口都带 `/api` 前缀 |
| `spring.profiles.active` | `local` | 加载被忽略的 `application-local.yml` |
| `app.chat-memory.dir` | `./data/chat-memory` | 会话记忆 JSON 文件目录，相对启动时的工作目录 |
| `VITE_BACKEND_ORIGIN` | `http://localhost:8081` | 前端开发代理的后端地址 |
| `VITE_API_BASE_URL` | `/api` | 前端请求的 API 前缀 |

每个会话在 `app.chat-memory.dir` 下保存为 `<memoryId>.json`。`data/` 已加入 `.gitignore`，因为其中可能包含对话内容。

---

## 接口文档

### 流式对话

```http
POST /api/ai/chat
Content-Type: application/json
Accept: text/event-stream

{"memoryId": 1, "message": "北京今天天气怎么样？"}
```

- `memoryId`：正整数，用于隔离会话记忆（前端把会话 id 放在 `?session=` 里）
- `message`：非空，最长 8000 字符

响应为 `200 text/event-stream`，每个 `data:` 是一帧紧凑 JSON：

```text
data:{"type":"delta","text":"北京"}
data:{"type":"delta","text":"今天"}
data:{"type":"done"}
```

| 类型 | 字段 | 含义 |
| --- | --- | --- |
| `delta` | `text` | 一段增量文本 |
| `error` | `code`、`message` | 本轮失败并结束，`code` 为 `GUARDRAIL_BLOCKED` 或 `MODEL_ERROR` |
| `done` | 无 | 正常结束；出错时由 `error` 取代 |

用 curl 试一下：

```bash
curl -N -X POST http://localhost:8081/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"memoryId":1,"message":"你好，介绍一下你自己"}'
```

### 追问建议

```http
POST /api/ai/suggestions
Content-Type: application/json

{
  "question": "ArrayList 和 LinkedList 有什么区别？",
  "answer": "ArrayList 基于动态数组……LinkedList 基于双向链表……"
}
```

```json
{"questions": ["ArrayList 的扩容机制是怎样的？", "LinkedList 的 remove(Object) 为什么是 O(n)？"]}
```

前端在 `done` 帧之后自动调用这个接口，把建议挂到最后一条回答下面，点击即发送。

- 这是独立于对话流的**旁路调用**：不读写会话记忆，也不会出现在历史记录里；
- `answer` 超过 6000 字符会被截断，控制 token 消耗；
- 模型输出会去掉序号 / 项目符号、去重、限 3 条、单条不超过 60 字符；
- 生成失败返回 `{"questions":[]}` 而不是报错——没有建议不影响对话。

### 读取会话历史

```http
GET /api/ai/history?memoryId=1
```

```json
{
  "memoryId": 1,
  "messages": [
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "你好！有什么可以帮你？"}
  ]
}
```

只返回用户与助手的文本消息；系统消息、纯工具调用消息会被过滤。该接口读取的就是 `FileChatMemoryStore` 落盘的内容，与模型上下文一致。

### 清空会话历史

```http
DELETE /api/ai/history?memoryId=1
```

删除该会话的记忆文件，返回 `{"memoryId":1,"messages":[]}`。

### 错误响应

非流式接口的参数错误统一返回 `400`：

```json
{"code": "BAD_REQUEST", "message": "memoryId 必须是正整数"}
```

流式接口的错误不会走这个处理器，而是以 SSE `error` 帧返回。

---

## LangChain4j 学习路线

代码里同时保留了两种集成风格，方便对比：

1. **底层 / 函数式**（[`AiCodeHelper`](src/main/java/com/example/zorincodehelper/ai/AiCodeHelper.java)）：自己注入 `ChatModel`、自己拼 `SystemMessage` / `UserMessage`，控制力更强。
2. **声明式 AI Service**（[`AiCodeHelperService`](src/main/java/com/example/zorincodehelper/ai/AiCodeHelperService.java) + [`AiCodeHelperServiceFactory`](src/main/java/com/example/zorincodehelper/ai/AiCodeHelperServiceFactory.java)）：只写接口，由 `AiServices` 生成代理，系统提示词、记忆、工具都由注解或 builder 配置。

### 1. 初始化 ChatModel

在 `build.gradle` 引入 DashScope starter 后，自动配置会提供 `qwenChatModel`，用 `@Resource` 按字段名注入即可：

```java
@Service
@Slf4j
public class AiCodeHelper {
    @Resource
    private ChatModel qwenChatModel;

    private final String SYSTEM_MESSAGE = """
            我是编程领域的小助手
            """;

    public String chat(String message) {
        UserMessage userMessage = UserMessage.from(message);
        SystemMessage systemMessage = SystemMessage.from(SYSTEM_MESSAGE);
        ChatResponse chatResponse = qwenChatModel.chat(systemMessage, userMessage);
        AiMessage aiMessage = chatResponse.aiMessage();
        log.info("AI 输出" + aiMessage);
        return aiMessage.text();
    }
}
```

对应测试见 [`ZorinCodeHelperApplicationTests`](src/test/java/com/example/zorincodehelper/ZorinCodeHelperApplicationTests.java)。

> 自动配置同时提供 `qwenChatModel` 和 `qwenStreamingChatModel`，请保持这两个字段名，也不要再额外定义同类型的 Bean，否则注入会冲突。

### 2. 多模态

`UserMessage` 可以同时包含文本、图片等内容。`chatWithMessage(UserMessage)` 就是为此预留的入口：

```java
public String chatWithMessage(UserMessage userMessage) {
    ChatResponse chatResponse = qwenChatModel.chat(userMessage);
    return chatResponse.aiMessage().text();
}

// 测试
UserMessage userMessage = UserMessage.from(
        TextContent.from("描述图片"),
        ImageContent.from("https://www.codefather.cn/logo.png")
);
aiCodeHelper.chatWithMessage(userMessage);
```

### 3. 系统提示词

声明式服务把提示词外置到资源文件，避免硬编码：

```java
public interface AiCodeHelperService {
    @SystemMessage(fromResource = "system-prompt.txt")
    String chat(String userMessage);
}
```

[`system-prompt.txt`](src/main/resources/system-prompt.txt) 定义了助手的角色（编程学习路线、项目建议、求职指南、面试题）。注意 `AiCodeHelper.SYSTEM_MESSAGE` 与它是两份独立的角色设定，修改人设时建议同步。

### 4. 会话记忆

会话记忆可以存在内存、文件或数据库。本项目实现了 `ChatMemoryStore` 的文件版本：

```java
public class FileChatMemoryStore implements ChatMemoryStore {
    @Override
    public List<ChatMessage> getMessages(Object memoryId) { ... }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) { ... }

    @Override
    public void deleteMessages(Object memoryId) { ... }
}
```

写文件时先写临时文件再原子替换，避免进程中断留下半个 JSON。记忆按 `memoryId` 隔离，持久化配置在工厂里：

```java
AiServices.builder(AiCodeHelperService.class)
        .chatModel(qwenChatModel)
        .streamingChatModel(qwenStreamingChatModel)
        .chatMemoryProvider(memoryId -> MessageWindowChatMemory.builder()
                .id(memoryId)
                .maxMessages(10)
                .chatMemoryStore(fileChatMemoryStore)
                .build())
        .tools(todayWeatherTool)
        .build();
```

> LangChain4j 1.1.0 中 `chatMemoryProvider` 会覆盖 `chatMemory`，所以只在这里配置一次。`MessageWindowChatMemory` 在每个 `memoryId` 下保留最近 10 条消息；没有 `@MemoryId` 的调用会共用 `"default"`。

### 5. 结构化输出

方法返回值是 POJO / record 时，LangChain4j 会要求模型按结构输出并自动反序列化：

```java
@SystemMessage(fromResource = "system-prompt.txt")
Report chatForReport(String userMessage);

record Report(String name, List<String> suggestionList) {
}
```

调用 `aiCodeHelperService.chatForReport("我是程序员 Zorin，学习前端两年半，请帮我制定学习报告")` 即可得到 `Report` 对象。

### 6. RAG 知识库

[`RagConfig`](src/main/java/com/example/zorincodehelper/ai/rag/RagConfig.java) 在启动时完成整条链路：

1. 从 `src/main/resources/docs` 加载文档（因此必须在仓库根目录启动）；
2. 用 `DocumentByParagraphSplitter(1000, 200)` 按段落切分，最大 1000 字符、重叠 200 字符；
3. 把文件名拼进每个片段，再用 `text-embedding-v4` 向量化，存入 `InMemoryEmbeddingStore`；
4. 构建 `EmbeddingStoreContentRetriever`：`maxResults(5)`、`minScore(0.75)`。

服务接口里也预留了回归结果的方法 `Result<String> chatWithRag(String)`，但工厂中的 `.contentRetriever(...)` 目前是注释状态，即 RAG 尚未挂到对话链路上。需要启用时取消该行注释即可。

> 每次启动都会重新加载文档并调用真实的 embedding 接口；向量库是内存实现，重启后重建。

### 7. 工具调用（Function Calling）

给方法加 `@Tool`、给参数加 `@P`，LangChain4j 会把方法签名转成工具定义发给模型；模型判断需要时自动调用，并把返回值作为上下文继续生成：

```java
@Tool(name = "getTodayWeather",
      value = "获取指定城市当天的天气，返回天气现象、气温、风力等信息。当用户询问某地今天或现在的天气时调用。")
public String getTodayWeather(@P("要查询天气的城市名称，例如：北京、上海、深圳") String city) {
    // 占位实现，返回模拟数据
    return "【占位数据】" + city + " ...";
}
```

工具已通过 `.tools(todayWeatherTool)` 注册。描述写得越具体，模型调用得越准。注意 `build.gradle` 开启了 `-parameters`，否则参数名会退化成 `arg0`。

### 8. 输入 Guardrail

`AiCodeHelperService` 接口上标注了 `@InputGuardrails(SafeInputGuardrail.class)`，对所有方法（含 `chatStream`）生效。命中敏感词时抛 `InputGuardrailException`，`AiController` 会捕获并转成：

```json
{"type":"error","code":"GUARDRAIL_BLOCKED","message":"输入包含敏感内容，请调整后重试"}
```

Guardrail 内部做的是小写后的子串匹配，而不是按词切分——Java 的 `\W` 会把汉字当成非单词字符，切词会导致中文敏感词永远匹配不到。

### 9. 流式输出

接口方法返回 `Flux<String>`，由 `langchain4j-reactor` 桥接模型的流式响应：

```java
@SystemMessage(fromResource = "system-prompt.txt")
Flux<String> chatStream(@MemoryId int memory, @UserMessage String message);
```

`AiController` 把每个 token 包装成 `{"type":"delta","text":...}`，结束时补 `done`，异常时发 `error`。响应头带 `Cache-Control: no-cache` 和 `X-Accel-Buffering: no`，避免代理缓冲导致「流式」变成一次性返回。

### 10. MCP（实验）

[`MapConfig`](src/main/java/com/example/zorincodehelper/ai/mcp/MapConfig.java) 演示了通过 HTTP/SSE 连接外部 MCP 服务并构建 `McpToolProvider` 的写法，包括 `mcpClients` 注册与工具注入。该类目前**不是** `@Configuration`，工厂里的 `.toolProvider(...)` 也处于注释状态，属于未启用的实验代码。

---

## 前端实现

单页应用，进入页面即聊天室：

- **会话 id**：`?session=<int>` 优先，其次 `localStorage`，都没有才随机生成；点击「新会话」会生成新 id 并清空视图（旧会话文件仍保留在磁盘）。相关逻辑在 [`session.js`](frontend/src/utils/session.js)。
- **状态管理**：[`useChat.js`](frontend/src/hooks/useChat.js) 负责一轮对话——先插入用户消息和空的助手消息，收到 `delta` 就追加内容，`AbortController` 支持「停止」，切换会话时拉取 `GET /ai/history` 恢复记录。
- **SSE 消费**：因为请求是 POST + JSON body，且需要中断控制，所以没有使用 `EventSource`。axios 走 XHR 适配器，`responseType: 'text'` + `onDownloadProgress` 拿到**累计**的 `responseText`，[`chat.js`](frontend/src/api/chat.js) 切出增量后交给 [`sseParser.js`](frontend/src/api/sseParser.js) 做增量分帧（处理帧被切半、CRLF、`: ping` 注释、多行 `data:`）。
- **渲染**：AI 回复经 [`MarkdownContent.jsx`](frontend/src/components/MarkdownContent.jsx) 渲染 GFM，代码块带语言标签和复制按钮；用户消息保持纯文本。生成中显示打字光标，出错/中止分别有提示。

前端更细的说明见 [`frontend/README.md`](frontend/README.md)。

---

## 测试

```bash
./gradlew test                                      # 全部测试
./gradlew test --tests "com.example.zorincodehelper.ai.AiCodeHelperServiceTest"   # 单个类
./gradlew test --tests "com.example.zorincodehelper.ai.AiCodeHelperServiceTest.chat" # 单个方法
```

- **离线、有断言**：`FileChatMemoryStoreTest` 与 `ChatHistoryServiceTest` 使用 `@TempDir` 验证落盘、会话隔离与清空逻辑，不消耗 token。
- **在线、无断言**：其余 `@SpringBootTest` 类（`ZorinCodeHelperApplicationTests`、`AiCodeHelperServiceTest`）会真实调用 DashScope 并打印结果，需要有效 API Key 和网络，请把它们当作演示而非回归测试。

> 即使运行离线测试，如果使用了 `@SpringBootTest` 的上下文，也要保证 `application-local.yml` 中的三个模型配置齐全。

---

## 已知限制与注意事项

- **必须在仓库根目录启动后端**，因为 RAG 用相对路径加载 `src/main/resources/docs`，且会话记忆默认写到 `./data/chat-memory`。
- **RAG 尚未接入对话**：检索器已构建，但 `.contentRetriever(...)` 被注释；向量库是内存实现，每次启动都会重新 embedding。
- **天气工具是占位实现**，返回模拟数据，接入真实 API 的示例写在方法注释里。
- **MCP 未启用**：`MapConfig` 不是配置类，工厂中的 `toolProvider` 也是注释状态。
- **单轮历史窗口**：每个会话只保留最近 10 条消息；文件的保留不受此限制，但模型上下文只看最近 10 条。
- **Jackson 版本**：Spring Boot 4 默认提供 Jackson 3 的 `tools.jackson.databind.ObjectMapper`（SSE 帧使用它），LangChain4j 内部仍使用 Jackson 2，两者不要混用。
- **Spring Boot 4 依赖名**：Web 相关 starter 为 `spring-boot-starter-webmvc` / `spring-boot-starter-webmvc-test`，新增依赖时注意名称。
- `CorsConfig` 对所有来源开放，仅建议用于本地学习/演示，生产环境请收紧来源。

## 参考

- [LangChain4j 官方文档](https://docs.langchain4j.dev/)
- [阿里云百炼 DashScope](https://help.aliyun.com/zh/model-studio/)
- [仓库内的 CLAUDE.md](CLAUDE.md)：面向 Claude Code 的开发说明，包含更多实现细节
