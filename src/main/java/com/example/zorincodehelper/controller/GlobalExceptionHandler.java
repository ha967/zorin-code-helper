package com.example.zorincodehelper.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

/**
 * 非流式接口（/ai/history 等）的参数错误统一返回 400 JSON。
 * 流式接口的错误由 {@link AiController} 以 SSE error 帧返回，不经过这里。
 *
 * <p>这里不捕获 {@code Exception}，避免把 Spring 自己的 404 / 405 等异常也转成 500。</p>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException error) {
        return badRequest(error.getMessage());
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
    })
    public ResponseEntity<Map<String, String>> handleMalformedRequest(Exception error) {
        log.debug("请求参数不合法: {}", error.getMessage());
        return badRequest("请求参数格式不正确");
    }

    private static ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest()
                .body(Map.of("code", "BAD_REQUEST", "message", message));
    }
}
