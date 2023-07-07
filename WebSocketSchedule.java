package com.duoduo.websocketstudy.scheduled;

import com.duoduo.websocketstudy.controller.WebSocketServer;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * @author lianwenda
 * @description 用来定时向WebSocket发送消息
 * @since 2023/4/30
 */
@Component
public class WebSocketSchedule {

    @Scheduled(cron = "0/5 * * * * ? ")
    private void schedule() {
        WebSocketServer.sendAllMessage("[消息]");
    }

}
