package com.example.zorincodehelper.ai.guardrail;

import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.guardrail.InputGuardrail;
import dev.langchain4j.guardrail.InputGuardrailResult;

import java.util.Locale;
import java.util.Set;

public class SafeInputGuardrail implements InputGuardrail {
    private static final Set<String> sensitiveWords = Set.of("黄色", "暴力");

    // 检测用户输入是否有敏感词
    // 注意：不能先 split("\\W+") 再比对。Java 默认的 \W 认为汉字也是“非单词字符”，
    // 纯中文输入会被切成一堆空串，中文敏感词永远匹配不到；而且按词切分会漏掉“很暴力的内容”这类内嵌场景。
    // 这里统一做小写化后直接做子串包含判断。
    @Override
    public InputGuardrailResult validate(UserMessage userMessage) {
        String inputText = userMessage.singleText().toLowerCase(Locale.ROOT);
        for (String word : sensitiveWords) {
            if (inputText.contains(word.toLowerCase(Locale.ROOT))) {
                return fatal("Sensitive word detected: " + word);
            }
        }
        return success();
    }
}
