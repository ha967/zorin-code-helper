## 简介

本仓库是主要用来学习LangChain4j的相关特性，主要包含初始化AI ChatModel、多模态、系统提示词、AI Service高层封装、会话记忆、结构化输出、RAG知识库、工具调用、MCP协议

### 初始化AI ChatModel

本次使用的大模型为阿里的千问大模型,在build.gradle中引入依赖，通过Resource注解自动注入chatModel，调用chat方法传入用户消息，获取大模型的输出结果
示例：

```java
@Service
@Slf4j
public class AiCodeHelper {
    @Resource
    private ChatModel qwenChatModel;

    public String chat(String userMessage) {
        ChatResponse chatResponse = qwenChatModel.chat(userMessage);
        AiMessage aiMessage = chatResponse.aiMessage();
        log.info("AI 输出" + aiMessage);
        return aiMessage.text();
    }
}

// 测试
@SpringBootTest
class ZorinCodeHelperApplicationTests {

    @Resource
    private AiCodeHelper aiCodeHelper;

    @Test
    void chat() {
        aiCodeHelper.chat("你好，我是Zorin");
    }
}
```

### 多模态

我们给chatModel.chat传递的userMessage中可以包含文本信息，也可以包含图片、文档等等。

具体使用示例：

```java
@Service
@Slf4j
public class AiCodeHelper {
    @Resource
    private ChatModel qwenChatModel;

    public String chat(UserMessage userMessage) {
        ChatResponse chatResponse = qwenChatModel.chat(userMessage);
        AiMessage aiMessage = chatResponse.aiMessage();
        log.info("AI 输出" + aiMessage);
        return aiMessage.text();
    }
}

// 测试
@SpringBootTest
class ZorinCodeHelperApplicationTests {

    @Resource
    private AiCodeHelper aiCodeHelper;

    @Test
    void chat() {
        UserMessage userMessage = UserMessage.from(
                TextContent.from("描述图片"),
                ImageContent.from("https://www.xxx.cn/logo.png")
        );
        aiCodeHelper.chat(userMessage);
    }
}
```

### 系统提示词

```java

public interface AiCodeHelperService {
    @SystemMessage(fromResource = "system-prompt.txt")
    String chat(String userMessage);
}
```

### 会话记忆
会话记忆有多种存储方式，比如内存、文件、数据库等等，LangChain4j默认提供了内存存储的方式，我们也可以自己会话记忆的存储
在FileChatMemoryStore中实现getMessage,updateMessage,deleteMessage

### 结构化输出

```java
public interface AiCodeHelperService {
    // 结构化输出学习建议
    @SystemMessage(fromResource = "system-prompt.txt")
    Report chatForReport(String userMessage);

    record Report(String name, List<String> suggestionList) {
    };
}
```

### RAG
RagConfig类中定义了Rag,在AiCodeHelperServiceFactory工厂中使用
