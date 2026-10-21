package com.example.zorincodehelper.ai;

import com.example.zorincodehelper.ai.tools.TodayWeatherTool;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.service.AiServices;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiCodeHelperServiceFactory {

    @Resource
    private ChatModel qwenChatModel;

    @Resource
    private FileChatMemoryStore fileChatMemoryStore;

    @Resource
    private ContentRetriever contentRetriever;

    @Resource
    private TodayWeatherTool todayWeatherTool;

    @Bean
    public AiCodeHelperService aiCodeHelperService() {
        // 会话记忆，默认存储在内存中
        ChatMemory chatMemoryDefault = MessageWindowChatMemory.withMaxMessages(10);
        // 会话记忆：保留最近 10 条消息，并通过 FileChatMemoryStore 持久化到磁盘
        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .id("default")
                .maxMessages(10)
                .chatMemoryStore(fileChatMemoryStore)
                .build();
        return AiServices.builder(AiCodeHelperService.class)
                .chatModel(qwenChatModel)
                .chatMemory(chatMemoryDefault)
                // RAG检索增强生成
//                .contentRetriever(contentRetriever)
                // 注册工具，让大模型可以调用 getTodayWeather 等方法
                .tools(todayWeatherTool)
                .build();
    }
}
