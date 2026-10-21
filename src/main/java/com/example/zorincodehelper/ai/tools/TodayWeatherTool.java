package com.example.zorincodehelper.ai.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * 获取当天天气的工具。
 *
 * <p>这是 langchain4j 的 <b>工具调用（Function Calling）</b>示例：
 * 方法上标注 {@link Tool} 后，langchain4j 会把方法签名和描述转成工具定义发给大模型；
 * 当模型判断“用户的问题需要查天气”时，就会触发调用本方法，并把返回值作为上下文继续回答。</p>
 */
@Component
public class TodayWeatherTool {

    /**
     * 获取指定城市当天的天气。
     *
     * <p>{@link Tool} 里的描述会直接告诉大模型这个工具是干什么的、什么时候该调用它，
     * 所以描述写得越清楚，模型调用得越准。</p>
     */
    @Tool(name = "getTodayWeather", value = "获取指定城市当天的天气，返回天气现象、气温、风力等信息。当用户询问某地今天或现在的天气时调用。")
    public String getTodayWeather(@P("要查询天气的城市名称，例如：北京、上海、深圳") String city) {
        // TODO 接入真实天气 API（如和风天气、OpenWeatherMap 等）。
        //  本项目已引入 spring-boot-starter-webmvc，可以直接用 RestClient 发 HTTP 请求，例如：
        //
        //  RestClient client = RestClient.create();
        //  return client.get()
        //          .uri("https://api.example.com/weather?city={city}", city)
        //          .retrieve()
        //          .body(String.class);
        //
        // 下面是占位实现，方便本地演示工具调用流程，返回的是模拟数据。
        return "【占位数据】" + city + " " + LocalDate.now() + " 的天气：晴，气温 8℃ ~ 18℃，东北风 2 级，空气质量良。";
    }
}
