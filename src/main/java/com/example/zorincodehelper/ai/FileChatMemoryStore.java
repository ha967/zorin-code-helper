package com.example.zorincodehelper.ai;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.ChatMessageDeserializer;
import dev.langchain4j.data.message.ChatMessageSerializer;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;

/**
 * 基于本地 JSON 文件的会话记忆存储。
 * 每个 memoryId 对应一个 {@code <memoryId>.json} 文件，应用重启后记忆仍然存在。
 */
@Slf4j
@Component
public class FileChatMemoryStore implements ChatMemoryStore {

    private final Path directory;

    public FileChatMemoryStore(@Value("${app.chat-memory.dir:./data/chat-memory}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.directory);
        } catch (IOException e) {
            throw new UncheckedIOException("创建会话记忆目录失败: " + this.directory.toAbsolutePath(), e);
        }
        log.info("会话记忆保存目录: {}", this.directory.toAbsolutePath());
    }

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        Path file = fileOf(memoryId);
        if (Files.notExists(file)) {
            return List.of();
        }
        try {
            String json = Files.readString(file, StandardCharsets.UTF_8);
            return ChatMessageDeserializer.messagesFromJson(json);
        } catch (IOException e) {
            throw new UncheckedIOException("读取会话记忆失败: " + file, e);
        }
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        Path file = fileOf(memoryId);
        String json = ChatMessageSerializer.messagesToJson(messages);
        try {
            // 先写临时文件再原子替换，避免写到一半时进程退出导致 JSON 文件损坏
            Path tmp = Files.createTempFile(directory, "chat-memory-", ".tmp");
            Files.writeString(tmp, json, StandardCharsets.UTF_8);
            Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new UncheckedIOException("保存会话记忆失败: " + file, e);
        }
    }

    @Override
    public void deleteMessages(Object memoryId) {
        try {
            Files.deleteIfExists(fileOf(memoryId));
        } catch (IOException e) {
            throw new UncheckedIOException("删除会话记忆失败: " + fileOf(memoryId), e);
        }
    }

    private Path fileOf(Object memoryId) {
        // memoryId 可能包含 / 等不能用于文件名的字符，编码后再拼文件名
        String fileName = URLEncoder.encode(String.valueOf(memoryId), StandardCharsets.UTF_8) + ".json";
        return directory.resolve(fileName);
    }
}
