package com.example.zorincodehelper.controller.dto;

/**
 * 流式对话的请求体。
 */
public record ChatRequest(int memoryId, String message) {
}
