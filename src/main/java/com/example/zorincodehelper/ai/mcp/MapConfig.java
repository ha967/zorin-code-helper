package com.example.zorincodehelper.ai.mcp;

import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.mcp.client.DefaultMcpClient;
import dev.langchain4j.mcp.client.McpClient;
import dev.langchain4j.mcp.client.transport.McpTransport;
import dev.langchain4j.mcp.client.transport.http.HttpMcpTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

//@Configuration
public class MapConfig {
    @Value("${bigModel.api-key}")
    private String apiKey;

    @Bean
    public McpToolProvider mcpToolProvider() {
        /**
         * 和Mcp服务通讯,这里有两种简历通讯的方式
         * 1. 通过SSE方式，实时接收Mcp服务的响应数据
         * 2. 把别人提供的Mcp服务的代码在本地安装并启动，通过new
         * StdioMcpTransport.Builder().command()的方式和Mcp服务通讯
         **/
        McpTransport mcpTransport = new HttpMcpTransport.Builder()
                .sseUrl("xxx" + apiKey)
                .logRequests(true)
                .logResponses(true)
                .build();
        // 创建MCP客户端
        McpClient mcpClient = new DefaultMcpClient.Builder()
                .key("zorinMcpClient")
                .transport(mcpTransport)
                .build();
        // 从Mcp客户端获取工具
        McpToolProvider toolProvider = McpToolProvider.builder()
                .mcpClients(mcpClient)
                .build();
        return toolProvider;
    }

}
