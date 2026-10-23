package com.example.zorincodehelper.ai;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

import java.util.List;

/**
 * 根据一轮问答生成「接下来可以问什么」的追问建议。
 *
 * <p>刻意不配置 chatMemory：这是一次性的旁路调用，建议内容不能写进主对话记忆，
 * 否则会挤占 MessageWindowChatMemory 的窗口、也会让模型把「建议」当成对话内容。</p>
 */
public interface FollowUpSuggestionService {

    @SystemMessage(fromResource = "follow-up-prompt.txt")
    Suggestions suggestions(@UserMessage String conversation);

    /** 结构化输出：模型按 JSON 返回 {@code {"questions": ["...", "..."]}}。 */
    record Suggestions(List<String> questions) {
    }
}
