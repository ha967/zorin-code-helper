# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A LangChain4j learning playground that wraps Alibaba DashScope's Qwen models, plus a small React chat UI built on one of its endpoints. `README.md` walks through the LangChain4j topics the repo explores (ChatModel init, multimodal, system prompt, AiServices, chat memory, structured output, RAG, tool calling, MCP).

- **Backend:** Spring Boot 4.1.1, Java 21 (Gradle toolchain), Gradle wrapper 9.8.1, LangChain4j 1.1.0 + `langchain4j-community-dashscope-spring-boot-starter` 1.1.0-beta7, package root `com.example.zorincodehelper`
- **Frontend:** `frontend/` — React 19 + Vite + axios; one page, a chat room

## Commands

Backend, from the repo root (`./gradlew` in Git Bash, `gradlew.bat` in cmd/PowerShell):

```bash
./gradlew build          # compile + test + assemble
./gradlew test           # run all tests
./gradlew bootRun        # serve the API at http://localhost:8081/api
./gradlew test --tests "com.example.zorincodehelper.ai.AiCodeHelperServiceTest"        # single class
./gradlew test --tests "com.example.zorincodehelper.ai.AiCodeHelperServiceTest.chat"   # single method
```

Frontend, from `frontend/`:

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api -> http://localhost:8081
npm run build    # production build into frontend/dist
```

Start the backend first, then the frontend. The Vite dev server proxies `/api` to `localhost:8081` (override with `VITE_BACKEND_ORIGIN`), so dev traffic never exercises CORS; `CorsConfig` only matters for other origins/deployments.

**Tests:** most `@SpringBootTest` classes make real DashScope calls (no mocks, no assertions — they print the response) and burn tokens; they need a valid API key plus network. `AiCodeHelperTest` only loads the context. `ai.FileChatMemoryStoreTest` is the one offline, assertion-based test (plain JUnit + `@TempDir`). Do not treat the live-model classes as regression tests.

## Configuration

- `application.yml` activates the `local` profile, sets `server.port: 8081` and `server.servlet.context-path: /api` — every URL is prefixed with `/api`.
- **`application-local.yml` is gitignored** (`.gitignore` CUSTOM section) because it holds the API keys; a fresh clone must create it and must never commit it. Under `langchain4j.community.dashscope` it needs three model blocks, all consumed at startup:
  - `chat-model` (`api-key`, `model-name: qwen-plus`)
  - `streaming-chat-model` — required by `AiCodeHelperServiceFactory`'s `StreamingChatModel`; without it `chatStream` wiring fails
  - `embedding-model` (`text-embedding-v4`) — required by `RagConfig`, which builds its `ContentRetriever` eagerly at startup
- **Spring Boot 4 naming:** the web dependency is `spring-boot-starter-webmvc` and the test starter is `spring-boot-starter-webmvc-test` (they replaced `-web` / `-test`); use the `-webmvc` names when adding dependencies.
- **Lombok** is wired (`compileOnly` + `annotationProcessor`), so `@Data`/`@Builder`/`@Slf4j` need no extra setup.
- `app.chat-memory.dir` (default `./data/chat-memory`, set in `application.yml`) is the directory `FileChatMemoryStore` uses; `data/` is gitignored. Each session is persisted as `<memoryId>.json` and survives restarts.
- **Jackson:** Spring Boot 4 auto-configures **Jackson 3** (`tools.jackson.databind.ObjectMapper`), while LangChain4j still brings Jackson 2 for its own serialization. Inject the `tools.jackson` mapper when serializing app payloads (the SSE frames use it); do not expect a `com.fasterxml.jackson.databind.ObjectMapper` bean.

## Backend Architecture

`AiController` exposes:

- `POST /ai/chat` (body `{"memoryId": <int>, "message": "<string>"}`), returning `200 text/event-stream` with `Flux<String>` JSON frames;
- `GET /ai/history?memoryId=<int>` and `DELETE /ai/history?memoryId=<int>` for restoring / clearing a session.

`CorsConfig` opens `/**` to all origins. `GlobalExceptionHandler` turns `IllegalArgumentException` into `400 {"code","message"}` for the non-streaming endpoints.

Two coexisting LangChain4j integration styles live in `com.example.zorincodehelper.ai`:

1. **Low-level / functional (`AiCodeHelper`)** — injects `ChatModel` and calls `chat(...)` directly, building `SystemMessage`/`UserMessage` by hand. `chatWithMessage(UserMessage)` takes a prebuilt message, which is how multimodal content works (`TextContent` + `ImageContent` in `ZorinCodeHelperApplicationTests`).
2. **Declarative AI service (`AiCodeHelperService` + `AiCodeHelperServiceFactory`)** — the interface is an `AiServices` proxy built in the factory, with the system prompt externalized to `system-prompt.txt` (`@SystemMessage(fromResource = ...)`), `tools(todayWeatherTool)` registered for function calling, and `contentRetriever`/`toolProvider` deliberately commented out (RAG and MCP are not attached to the service).

The persona exists in two places (inline `SYSTEM_MESSAGE` in `AiCodeHelper`, `system-prompt.txt` for the service) — keep them aligned when changing the assistant's role.

Bean wiring: the DashScope starter auto-configures `qwenChatModel` and `qwenStreamingChatModel` (conditional on `api-key`), and both injection points use `@Resource` field-name injection — keep those field names, and do not add a second `ChatModel`/`StreamingChatModel` bean or wiring becomes ambiguous.

### Chat memory: persisted per `memoryId`

`AiCodeHelperServiceFactory` configures **only** `.chatMemoryProvider(...)`, and the provider builds `MessageWindowChatMemory` with `.id(memoryId).maxMessages(10).chatMemoryStore(fileChatMemoryStore)` for every session. Do not add `.chatMemory(...)` back: in LangChain4j 1.1.0 the provider replaces it. `MessageWindowChatMemory` in this version is stateless (it reads/writes the store on every `messages()` / `add()`), so once the provider is file-backed, history survives restarts and `ChatHistoryService` can read the same JSON files. Calls without `@MemoryId` share the `"default"` id.

### Guardrails

`@InputGuardrails(SafeInputGuardrail.class)` on the `AiCodeHelperService` interface applies to *all* its methods, including `chatStream`. A blocked input throws `InputGuardrailException` synchronously; `AiController` catches it (both around the call and via `onErrorResume`) and emits `{"type":"error","code":"GUARDRAIL_BLOCKED",...}` as an SSE frame instead of breaking the stream. The guardrail deliberately does substring matching rather than `split("\\W+")` — Java's `\W` treats CJK as non-word chars, so word splitting never matches Chinese keywords.

### RAG / tools / MCP

- `RagConfig` loads `src/main/resources/docs` through a **relative** path and ingests it into an `InMemoryEmbeddingStore` at startup — the app must be launched with the repo root as working directory, and every boot costs real embedding calls.
- `TodayWeatherTool` is a placeholder `@Tool` (returns fake data); its `@Tool`/`@P` descriptions are what steer the model, so keep them accurate. `-parameters` is enabled in `build.gradle` so tool parameter names survive compilation.
- `ai/mcp/MapConfig.java` is intentionally not a `@Configuration` (disabled experiment, injects the unused `bigModel.api-key`).

### SSE wire format (verified against the running app)

Spring MVC streams `200 text/event-stream` (chunked) with bare `data:` lines separated by blank lines. Each `data:` value is one compact JSON object:

```text
data:{"type":"delta","text":"Hi"}
data:{"type":"done"}
```

- `delta` carries a text increment; a token containing newlines gets JSON-escaped (`\n`), so one frame still occupies one `data:` line.
- `error` carries `code` + `message` and ends the turn (`GUARDRAIL_BLOCKED` / `MODEL_ERROR`).
- `done` is the explicit terminal frame; `error` replaces it when generation fails.
- The MVC writer does **not** emit `event:` / `id:` / comment lines, so don't rely on them. Response headers include `Cache-Control: no-cache` and `X-Accel-Buffering: no`; there is no heartbeat yet, so a long silent tool call can look idle to proxies.

## Frontend Architecture (`frontend/`)

- The session id lives in `?session=<int>` and `localStorage` (`src/utils/session.js`), so a reload restores the transcript from `GET /ai/history`; 「新会话」 generates a new id (the old session's JSON file is left on disk) and clears the view.
- SSE is consumed through axios' XHR adapter: `responseType: 'text'` + `onDownloadProgress` yields the *cumulative* `responseText`, which `src/api/chat.js` diffs into deltas before handing them to `src/api/sseParser.js` — an incremental frame parser that handles frames split across network chunks, CRLF, `: ping` comments and multi-line `data:`. Each frame's `data` is JSON-decoded into `delta` / `error` / `done`. `EventSource` is not used because the request is POST with a JSON body and needs custom abort handling; keep the XHR path in mind (axios' fetch adapter does not expose `responseText` this way).
- `src/hooks/useChat.js` owns a turn: append user message + empty assistant message, patch the assistant message per `delta`, `AbortController` for the 停止 button, error/aborted statuses, and loads history when `sessionId` changes.
- AI replies render through `src/components/MarkdownContent.jsx` (`react-markdown` + `remark-gfm` + `rehype-highlight`); fenced code blocks get a language label and copy button in `CodeBlock.jsx`. User messages stay plain text with `white-space: pre-wrap`.
- Base URL is `/api` by default; set `VITE_API_BASE_URL` when the built app is served from a different origin than the backend.

## Repo Conventions / Misc

- `.mcp.json` declares an `idea` MCP server (HTTP stream on `127.0.0.1:64342`); it is disabled in `.claude/settings.local.json` (`disabledMcpjsonServers`). `HELP.md` is the auto-generated Spring Boot getting-started reference and can be ignored.
- `build.gradle` pins JVM UTF-8 args for `test`/`bootRun` because Windows consoles default to GBK and Chinese logs would otherwise be mojibake.
- `frontend/.gitignore` covers `node_modules/`, `dist/` and `.env`.
