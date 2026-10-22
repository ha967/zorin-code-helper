package com.example.zorincodehelper.controller.dto;

/**
 * 会话历史中的一条消息，只保留前端需要展示的字段。
 *
 * @param role    user 或 assistant
 * @param content 消息文本
 */
public record HistoryMessage(String role, String content) {
}
