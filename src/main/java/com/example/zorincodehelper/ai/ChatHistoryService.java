package com.example.zorincodehelper.ai;

import com.example.zorincodehelper.controller.dto.HistoryMessage;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 读取 / 清理会话历史。
 *
 * <p>{@link FileChatMemoryStore} 保存的正是 LangChain4j 写入的记忆，所以这里直接读它即可，
 * 不需要再维护一份会话数据。系统消息和工具调用消息不返回给前端。</p>
 */
@Service
public class ChatHistoryService {

    private final FileChatMemoryStore chatMemoryStore;

    public ChatHistoryService(FileChatMemoryStore chatMemoryStore) {
        this.chatMemoryStore = chatMemoryStore;
    }

    public List<HistoryMessage> history(Object memoryId) {
        return chatMemoryStore.getMessages(memoryId).stream()
                .map(ChatHistoryService::toHistoryMessage)
                .filter(Objects::nonNull)
                .toList();
    }

    public void clear(Object memoryId) {
        chatMemoryStore.deleteMessages(memoryId);
    }

    private static HistoryMessage toHistoryMessage(ChatMessage message) {
        if (message instanceof UserMessage userMessage) {
            String text = userMessage.contents().stream()
                    .filter(TextContent.class::isInstance)
                    .map(content -> ((TextContent) content).text())
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining("\n"));
            return text.isBlank() ? null : new HistoryMessage("user", text);
        }
        if (message instanceof AiMessage aiMessage) {
            // 只包含工具调用、没有文本的 AI 消息不展示
            String text = aiMessage.text();
            return text == null || text.isBlank() ? null : new HistoryMessage("assistant", text);
        }
        return null;
    }
}
