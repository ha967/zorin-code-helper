package com.example.zorincodehelper.ai;

import com.example.zorincodehelper.ai.tools.TodayWeatherTool;
//import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.service.AiServices;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// AiCodeHelperService的构建类,Configuration会在Spring容器启动时被扫描到，自动创建AiCodeHelperService的Bean
@Configuration
public class AiCodeHelperServiceFactory {

    @Resource
    private ChatModel qwenChatModel;

    @Resource
    private StreamingChatModel qwenStreamingChatModel;

    @Resource
    private FileChatMemoryStore fileChatMemoryStore;

    @Resource
    private ContentRetriever contentRetriever;

    @Resource
    private TodayWeatherTool todayWeatherTool;

//    @Resource
//    private McpToolProvider mcpToolProvider;

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
                .streamingChatModel(qwenStreamingChatModel) // 流式输出
                .chatMemory(chatMemoryDefault)
                .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(10)) // 每个会话独立存储
                // .contentRetriever(contentRetriever) // RAG检索增强生成
                .tools(todayWeatherTool) // 注册工具，让大模型可以调用 getTodayWeather 等方法
//                .toolProvider(mcpToolProvider) // 注册MCP工具，让大模型可以调用MCP服务提供的工具
                .build();
    }
}
