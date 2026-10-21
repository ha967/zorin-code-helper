# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Spring Boot service that wraps Alibaba DashScope's Qwen models through LangChain4j. It is currently an exploration playground for two LangChain4j integration styles — there are **no controllers or endpoints**; the `webmvc` starter is only there for runtime infrastructure. The only persistence is the file-backed chat memory described below.

- **Build tool:** Gradle (wrapper pinned to Gradle 9.8.1), `gradle-wrapper.properties`
- **Language:** Java 21 (via Gradle toolchain)
- **Framework:** Spring Boot 4.1.1
- **AI stack:** LangChain4j 1.1.0 + `langchain4j-community-dashscope-spring-boot-starter` 1.1.0-beta7
- **Package root:** `com.example.zorincodehelper`

## Commands

Run from the repo root. Use `./gradlew` in Git Bash; use `gradlew.bat` in cmd/PowerShell.

```bash
./gradlew build          # compile + test + assemble
./gradlew test           # run all tests
./gradlew bootRun        # run the application locally
./gradlew test --tests "com.example.zorincodehelper.ai.AiCodeHelperServiceTest"   # run a single test class
```

**Tests hit the live model.** All `@SpringBootTest` classes make real DashScope calls (no mocks, no assertions — they print responses) and consume real tokens. They require a valid API key and network access. `AiCodeHelperTest` is the exception: it only loads the context. Do not treat these as regression tests.

## Configuration

- `application.yml` sets the active profile to `local`, so `application-local.yml` is layered on top at runtime.
- The app needs `langchain4j.community.dashscope.chat-model.api-key` and `model-name` (currently `qwen-plus`) in `application-local.yml`.
- **`application-local.yml` is gitignored** (`.gitignore` CUSTOM section) because it holds the API key. A fresh clone must create it, and its key must never be committed.
- **Spring Boot 4 naming:** the web dependency is `spring-boot-starter-webmvc` and the test starter is `spring-boot-starter-webmvc-test`. These replaced `spring-boot-starter-web` / `spring-boot-starter-test`; use the `-webmvc` names when adding dependencies.
- **Lombok** is configured (`compileOnly` + `annotationProcessor`), so `@Data`/`@Builder`/`@Slf4j` etc. need no extra setup.
- `app.chat-memory.dir` (default `./data/chat-memory`, set in `application.yml`) controls where chat memory JSON files are written. The `data/` directory is gitignored.

## AI Integration Architecture

The DashScope starter auto-configures a `QwenChatModel` bean named **`qwenChatModel`**, conditional on the `api-key` property. Both injection points use `@Resource` (field-name injection), so the field must stay named `qwenChatModel` — renaming it or adding a second `ChatModel` bean breaks/ambiguates wiring.

There are two coexisting integration styles in `com.example.zorincodehelper.ai`:

1. **Low-level, functional (`AiCodeHelper`)** — injects the `ChatModel` and calls `chat(...)` directly, constructing `SystemMessage`/`UserMessage` by hand. `chatWithMessage(UserMessage)` accepts a prebuilt message, which is how multimodal content works (the test sends `TextContent` + `ImageContent`).
2. **Declarative AI service (`AiCodeHelperService` + `AiCodeHelperServiceFactory`)** — the interface is a LangChain4j `AiServices` proxy built in the factory. Its system prompt is externalized to `system-prompt.txt` (`@SystemMessage(fromResource = ...)`), and it is given `MessageWindowChatMemory` capped at 10 messages. Instead of the default in-memory store, its `ChatMemoryStore` is `FileChatMemoryStore`, which serializes messages to `<app.chat-memory.dir>/<memoryId>.json` — so history survives restarts. The memory still lives on the singleton bean under the fixed id `default`, so **all callers share one conversation window**; the service test demonstrates this by having the second call recall a name from the first (even across runs).

The persona prompt exists in two places (inline `SYSTEM_MESSAGE` in `AiCodeHelper`, and `system-prompt.txt` for the service). Keep them aligned when editing the assistant's role.

`.mcp.json` declares an `idea` MCP server (HTTP stream on `127.0.0.1:64342`); it is disabled in `.claude/settings.local.json` (`disabledMcpjsonServers`). `HELP.md` is the auto-generated Spring Boot getting-started reference and can be ignored.
