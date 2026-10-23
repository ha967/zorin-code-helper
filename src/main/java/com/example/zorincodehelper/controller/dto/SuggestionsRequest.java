package com.example.zorincodehelper.controller.dto;

/**
 * 追问建议的请求体：刚结束的一轮问答。
 *
 * <p>不带 memoryId —— 建议只依赖这一轮问答本身，后端也不读写会话记忆。</p>
 */
public record SuggestionsRequest(String question, String answer) {
}
