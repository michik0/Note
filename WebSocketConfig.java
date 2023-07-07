package com.duoduo.websocketstudy.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

/**
 * @author lianwenda
 * @description description
 * @since 2023/4/30
 */
@Configuration
public class WebSocketConfig {

    // 会自动注册使用了 @ServerEndpoint 注解声明的 Websocket endpoint
    // 要注意，如果使用独立的servlet容器，
    // 而不是直接使用springboot的内置容器，
    // 就不要注入ServerEndpointExporter，因为它将由容器自己提供和管理。
    @Bean
    public ServerEndpointExporter serverEndpointExporter () {
        return new ServerEndpointExporter();
    }

}
