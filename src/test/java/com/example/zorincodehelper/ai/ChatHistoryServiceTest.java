package com.example.zorincodehelper.ai;

import com.example.zorincodehelper.controller.dto.HistoryMessage;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 离线测试：验证会话记忆确实落盘、历史接口的过滤规则，以及清空行为。
 * 不依赖 DashScope，也不消耗 token。
 */
class ChatHistoryServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void fileBackedMemorySurvivesStoreRecreation() {
        FileChatMemoryStore store = new FileChatMemoryStore(tempDir.toString());

        // 与 AiCodeHelperServiceFactory 中的 chatMemoryProvider 配置保持一致
        ChatMemory memory = MessageWindowChatMemory.builder()
                .id(42)
                .maxMessages(10)
                .chatMemoryStore(store)
                .build();
        memory.add(SystemMessage.from("你是编程助手"));
        memory.add(UserMessage.from("你好，我是 zorin"));
        memory.add(AiMessage.from("你好 zorin"));

        // 新建 store / memory，模拟应用重启后从磁盘恢复
        ChatHistoryService restarted = new ChatHistoryService(new FileChatMemoryStore(tempDir.toString()));
        List<HistoryMessage> history = restarted.history(42);

        assertEquals(List.of(
                new HistoryMessage("user", "你好，我是 zorin"),
                new HistoryMessage("assistant", "你好 zorin")
        ), history);
        assertTrue(restarted.history(43).isEmpty(), "不同会话之间不应互相影响");
    }

    @Test
    void clearRemovesHistoryFromDisk() {
        FileChatMemoryStore store = new FileChatMemoryStore(tempDir.toString());
        ChatHistoryService service = new ChatHistoryService(store);
        store.updateMessages(7, List.of(
                UserMessage.from("第一句"),
                AiMessage.from("第一答")
        ));

        assertEquals(2, service.history(7).size());

        service.clear(7);

        assertTrue(service.history(7).isEmpty());
        assertTrue(new ChatHistoryService(new FileChatMemoryStore(tempDir.toString())).history(7).isEmpty());
    }
}
