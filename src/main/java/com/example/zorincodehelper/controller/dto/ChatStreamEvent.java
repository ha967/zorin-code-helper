package com.example.zorincodehelper.controller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * SSE 数据帧的应用层协议。每一帧都是一个 JSON 对象，放在 {@code data:} 里传输。
 *
 * <ul>
 *   <li>{@code delta} —— 一段增量文本</li>
 *   <li>{@code error} —— 生成失败，前端应结束本轮并展示 message</li>
 *   <li>{@code done}  —— 正常结束</li>
 * </ul>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatStreamEvent(String type, String text, String code, String message) {

    public static ChatStreamEvent delta(String text) {
        return new ChatStreamEvent("delta", text, null, null);
    }

    public static ChatStreamEvent error(String code, String message) {
        return new ChatStreamEvent("error", null, code, message);
    }

    public static ChatStreamEvent done() {
        return new ChatStreamEvent("done", null, null, null);
    }
}
