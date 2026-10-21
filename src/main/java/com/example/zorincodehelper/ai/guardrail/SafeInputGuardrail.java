package com.example.zorincodehelper.ai.guardrail;

import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.guardrail.InputGuardrail;
import dev.langchain4j.guardrail.InputGuardrailResult;

import java.util.Locale;
import java.util.Set;

public class SafeInputGuardrail implements InputGuardrail {
    private static final Set<String> sensitiveWords = Set.of("黄色", "暴力");

    // 检测用户输入是否有敏感词
    @Override
    public InputGuardrailResult validate(UserMessage userMessage) {
        String inputText = userMessage.singleText().toLowerCase(Locale.ROOT);
        String[] words = inputText.split("\\W+");
        for (String word : words) {
            if (sensitiveWords.contains(word)) {
                return fatal("Sensitive word detected" + word);
            }
        }
        return success();
    }
}
