package com.example.zorincodehelper.ai;

import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AiCodeHelperServiceTest {

    @Resource
    private AiCodeHelperService aiCodeHelperService;

    @Test
    void chat() {
        String result = aiCodeHelperService.chat("你好，我是程序员Zorin");
        System.out.println(result);
        result = aiCodeHelperService.chat("你好，我是谁来着?");
        System.out.println(result);
    }

    @Test
    void chatForReport() {
        String userMessage = "我是程序员Zorin，学习前端两年半，请帮我制定学习报告";
        AiCodeHelperService.Report report = aiCodeHelperService.chatForReport(userMessage);
        System.out.println(report);
    }

    @Test
    void chatWithRag() {
        String result = aiCodeHelperService.chat("我要制定公司团建聚餐，怎么考虑饮食？");
        System.out.println(result);
    }

    @Test
    void chatWithTools() {
        String result = aiCodeHelperService.chat("北京今天天气怎么样？");
        System.out.println(result);
    }

    @Test
    void chatWithGuardrail() {
        String result = aiCodeHelperService.chat("暴力行为");
        System.out.println(result);
    }
}