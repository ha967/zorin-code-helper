package com.example.zorincodehelper.controller;

import com.example.zorincodehelper.ai.AiCodeHelperService;
import com.example.zorincodehelper.ai.ChatHistoryService;
import com.example.zorincodehelper.controller.dto.ChatHistoryResponse;
import com.example.zorincodehelper.controller.dto.ChatRequest;
import com.example.zorincodehelper.controller.dto.ChatStreamEvent;
import dev.langchain4j.guardrail.GuardrailException;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/ai")
public class AiController {

    private static final int MAX_MESSAGE_LENGTH = 8000;

    @Resource
    private AiCodeHelperService aiCodeHelperService;

    @Resource
    private ChatHistoryService chatHistoryService;

    @Resource
    private ObjectMapper objectMapper;

    /**
     * 流式对话。用 POST 而不是 GET，避免长消息超出 URL 长度限制、也避免把用户输入写进访问日志。
     */
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<String>> chat(@RequestBody ChatRequest request) {
        int memoryId = request == null ? 0 : request.memoryId();
        String message = request == null || request.message() == null ? "" : request.message().trim();
        requireValidMemoryId(memoryId);
        if (message.isEmpty()) {
            throw new IllegalArgumentException("message 不能为空");
        }
        if (message.length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("message 长度不能超过 " + MAX_MESSAGE_LENGTH + " 个字符");
        }

        Flux<ChatStreamEvent> events;
        try {
            events = aiCodeHelperService.chatStream(memoryId, message)
                    .map(ChatStreamEvent::delta)
                    .concatWith(Flux.just(ChatStreamEvent.done()))
                    .onErrorResume(error -> Flux.just(toErrorEvent(memoryId, error)));
        } catch (RuntimeException error) {
            // Guardrail 在返回 Flux 之前就会同步抛异常（比如输入包含敏感词）
            events = Flux.just(toErrorEvent(memoryId, error));
        }

        Flux<String> body = events
                .map(this::toJson)
                .doOnCancel(() -> log.info("客户端取消了流式对话, memoryId={}", memoryId))
                .doOnComplete(() -> log.debug("流式对话结束, memoryId={}", memoryId));

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .cacheControl(CacheControl.noCache())
                // 反向代理（如 nginx）默认会缓冲响应，会让流式输出变成一次性返回
                .header("X-Accel-Buffering", "no")
                .body(body);
    }

    /** 读取某个会话的历史消息，用于页面刷新后恢复对话。 */
    @GetMapping("/history")
    public ChatHistoryResponse history(@RequestParam int memoryId) {
        requireValidMemoryId(memoryId);
        return new ChatHistoryResponse(memoryId, chatHistoryService.history(memoryId));
    }

    /** 清空某个会话的记忆。 */
    @DeleteMapping("/history")
    public ChatHistoryResponse clearHistory(@RequestParam int memoryId) {
        requireValidMemoryId(memoryId);
        chatHistoryService.clear(memoryId);
        return new ChatHistoryResponse(memoryId, List.of());
    }

    private static void requireValidMemoryId(int memoryId) {
        if (memoryId <= 0) {
            throw new IllegalArgumentException("memoryId 必须是正整数");
        }
    }

    private ChatStreamEvent toErrorEvent(int memoryId, Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof GuardrailException) {
                log.warn("输入被 Guardrail 拦截, memoryId={}: {}", memoryId, cause.getMessage());
                return ChatStreamEvent.error("GUARDRAIL_BLOCKED", "输入包含敏感内容，请调整后重试");
            }
            if (cause.getCause() == cause) {
                break;
            }
        }
        log.error("流式对话失败, memoryId={}", memoryId, error);
        return ChatStreamEvent.error("MODEL_ERROR", "AI 服务暂时不可用，请稍后重试");
    }

    private String toJson(ChatStreamEvent event) {
        // Spring Boot 4 默认使用 Jackson 3，writeValueAsString 抛出的是非受检异常
        return objectMapper.writeValueAsString(event);
    }
}
