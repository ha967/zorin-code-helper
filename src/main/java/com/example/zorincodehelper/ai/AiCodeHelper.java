package com.example.zorincodehelper.ai;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

// 函数式调用chat模型，使用系统消息和用户消息进行对话，并返回AI的响应文本。
// 自己调用chatModel.chat方法，灵活性会比AiCodeHelperService + AiCodeHelperServiceFactory好一点
@Service
@Slf4j
public class AiCodeHelper {
    @Resource
    private ChatModel qwenChatModel;

    private final String SYSTEM_MESSAGE = """
            我是编程领域的小助手
            """;

    public String chat(String message) {
        UserMessage userMessage = UserMessage.from(message);
        SystemMessage systemMessage = SystemMessage.from(SYSTEM_MESSAGE);
        ChatResponse chatResponse = qwenChatModel.chat(systemMessage, userMessage);
        AiMessage aiMessage = chatResponse.aiMessage();
        log.info("AI 输出" + aiMessage);
        return aiMessage.text();
    }

    public String chatWithMessage(UserMessage userMessage) {
        ChatResponse chatResponse = qwenChatModel.chat(userMessage);
        AiMessage aiMessage = chatResponse.aiMessage();
        log.info("AI 输出" + aiMessage);
        return aiMessage.text();
    }
}
