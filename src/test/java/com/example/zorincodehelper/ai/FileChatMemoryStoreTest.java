package com.example.zorincodehelper.ai;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileChatMemoryStoreTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldPersistMessagesAcrossStoreInstances() {
        FileChatMemoryStore store = new FileChatMemoryStore(tempDir.toString());
        List<ChatMessage> messages = List.of(
                UserMessage.from("你好，我是程序员 zorin"),
                AiMessage.from("你好 zorin，很高兴认识你")
        );

        store.updateMessages("user-1", messages);

        // 新建一个实例来读取，模拟应用重启后从磁盘恢复记忆
        FileChatMemoryStore reloaded = new FileChatMemoryStore(tempDir.toString());
        List<ChatMessage> loaded = reloaded.getMessages("user-1");

        assertEquals(2, loaded.size());
        assertEquals("你好，我是程序员 zorin", ((UserMessage) loaded.get(0)).singleText());
        assertEquals("你好 zorin，很高兴认识你", ((AiMessage) loaded.get(1)).text());

        // 不同 memoryId 之间互不影响
        assertTrue(store.getMessages("user-2").isEmpty());

        reloaded.deleteMessages("user-1");
        assertTrue(store.getMessages("user-1").isEmpty());
    }
}
