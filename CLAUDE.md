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
- `app.chat-memory.dir` (default `./data/chat-memory`, set in `application.yml`) is the directory `FileChatMemoryStore` uses; `data/` is gitignored. See the memory caveat below — nothing currently writes there.

## Backend Architecture

`AiController` exposes `GET /ai/chat?memoryId=<int>&message=<string>`, producing `Flux<ServerSentEvent<String>>` from `AiCodeHelperService.chatStream(memoryId, message)`; `CorsConfig` opens `/**` to all origins.

Two coexisting LangChain4j integration styles live in `com.example.zorincodehelper.ai`:

1. **Low-level / functional (`AiCodeHelper`)** — injects `ChatModel` and calls `chat(...)` directly, building `SystemMessage`/`UserMessage` by hand. `chatWithMessage(UserMessage)` takes a prebuilt message, which is how multimodal content works (`TextContent` + `ImageContent` in `ZorinCodeHelperApplicationTests`).
2. **Declarative AI service (`AiCodeHelperService` + `AiCodeHelperServiceFactory`)** — the interface is an `AiServices` proxy built in the factory, with the system prompt externalized to `system-prompt.txt` (`@SystemMessage(fromResource = ...)`), `tools(todayWeatherTool)` registered for function calling, and `contentRetriever`/`toolProvider` deliberately commented out (RAG and MCP are not attached to the service).

The persona exists in two places (inline `SYSTEM_MESSAGE` in `AiCodeHelper`, `system-prompt.txt` for the service) — keep them aligned when changing the assistant's role.

Bean wiring: the DashScope starter auto-configures `qwenChatModel` and `qwenStreamingChatModel` (conditional on `api-key`), and both injection points use `@Resource` field-name injection — keep those field names, and do not add a second `ChatModel`/`StreamingChatModel` bean or wiring becomes ambiguous.

### Chat memory: the file store is currently inactive

`AiCodeHelperServiceFactory` passes both `.chatMemory(file-backed, id "default")` and then `.chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(10))`. In LangChain4j 1.1.0 the provider call replaces the memory service (`AiServiceContext.initChatMemories`), so **the provider wins for every method**: each `memoryId` gets its own in-memory 10-message window, calls without `@MemoryId` share the id `"default"`, `FileChatMemoryStore` is never called, and history does **not** survive a restart. To actually get persistence, drop the `chatMemoryProvider` or make it return file-store-backed memories.

### Guardrails

`@InputGuardrails(SafeInputGuardrail.class)` on the `AiCodeHelperService` interface applies to *all* its methods, including `chatStream`. A blocked input aborts the request (an already-200 SSE stream just errors out). The guardrail deliberately does substring matching rather than `split("\\W+")` — Java's `\W` treats CJK as non-word chars, so word splitting never matches Chinese keywords.

### RAG / tools / MCP

- `RagConfig` loads `src/main/resources/docs` through a **relative** path and ingests it into an `InMemoryEmbeddingStore` at startup — the app must be launched with the repo root as working directory, and every boot costs real embedding calls.
- `TodayWeatherTool` is a placeholder `@Tool` (returns fake data); its `@Tool`/`@P` descriptions are what steer the model, so keep them accurate. `-parameters` is enabled in `build.gradle` so tool parameter names survive compilation.
- `ai/mcp/MapConfig.java` is intentionally not a `@Configuration` (disabled experiment, injects the unused `bigModel.api-key`).

### SSE wire format (verified against the running app)

Spring MVC streams `200 text/event-stream` (chunked) with bare `data:` lines separated by blank lines. The `event`/`id` fields the controller sets are **not** emitted by the MVC writer, and a token containing newlines arrives split across several `data:` lines that must be re-joined with `\n`. There is no heartbeat comment and no explicit terminal event — the stream simply ends.

## Frontend Architecture (`frontend/`)

- A session id is generated on page load (`src/utils/session.js`, positive int because the backend's `memoryId` is an `int`), shown in the header; 「新会话」 regenerates it and clears the transcript.
- SSE is consumed through axios' XHR adapter: `responseType: 'text'` + `onDownloadProgress` yields the *cumulative* `responseText`, which `src/api/chat.js` diffs into deltas before handing them to `src/api/sseParser.js` — an incremental frame parser that handles frames split across network chunks, CRLF, `: ping` comments and multi-line `data:`. `EventSource` is not used because the request needs custom params/abort handling; keep the XHR path in mind (axios' fetch adapter does not expose `responseText` this way).
- `src/hooks/useChat.js` owns a turn: append user message + empty assistant message, patch the assistant message per chunk, `AbortController` for the 停止 button, error/aborted statuses.
- Base URL is `/api` by default; set `VITE_API_BASE_URL` when the built app is served from a different origin than the backend.

## Repo Conventions / Misc

- `.mcp.json` declares an `idea` MCP server (HTTP stream on `127.0.0.1:64342`); it is disabled in `.claude/settings.local.json` (`disabledMcpjsonServers`). `HELP.md` is the auto-generated Spring Boot getting-started reference and can be ignored.
- `build.gradle` pins JVM UTF-8 args for `test`/`bootRun` because Windows consoles default to GBK and Chinese logs would otherwise be mojibake.
- `frontend/.gitignore` covers `node_modules/`, `dist/` and `.env`.
