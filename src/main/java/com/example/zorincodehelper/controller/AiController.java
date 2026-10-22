package com.example.zorincodehelper.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.zorincodehelper.ai.AiCodeHelperService;

import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;

import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/ai")
public class AiController {
    @Resource
    private AiCodeHelperService aiCodeHelperService;

    @GetMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(@RequestParam int memoryId, @RequestParam String message) {
        // 自增序号写进 SSE 的 id 字段，便于客户端断线续传时定位已收到的位置
        AtomicLong seq = new AtomicLong();
        return aiCodeHelperService.chatStream(memoryId, message)
                .map(text -> ServerSentEvent.<String>builder()
                        .id(String.valueOf(seq.incrementAndGet()))
                        .event("message")
                        .data(text)
                        .build());
    }

}
