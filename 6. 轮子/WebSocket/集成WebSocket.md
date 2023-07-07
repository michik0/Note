>[需求]实现前端能够每隔一段时间，获取到服务器的信息

# 1. 编码

## WebSocketConfig

```java
@Configuration  
public class WebSocketConfig {  
  
    // 会自动注册使用了 @ServerEndpoint 注解声明的 Websocket endpoint    // 要注意，如果使用独立的servlet容器，  
    // 而不是直接使用springboot的内置容器，  
    // 就不要注入ServerEndpointExporter，因为它将由容器自己提供和管理。  
    @Bean  
    public ServerEndpointExporter serverEndpointExporter () {  
        return new ServerEndpointExporter();  
    }  
  
}
```

## WebSocketServer

核心类，用于进行WebSocket连接，以及消息的发送

```java
@Slf4j  
@Component  
@ServerEndpoint("/websocket")  
public class WebSocketServer {  
  
    private static final Map<String, Session> clients = new ConcurrentHashMap<>();  
  
    /**  
     * 连接事件  
     * @param session 客户端session  
     */    
     @OnOpen  
    public void onOpen(Session session) throws IOException {  
        log.info("onOpen!");  
        clients.put(session.getId(), session);  
    }  
  
    /**  
     * 关闭事件  
     * @param session 客户端session  
     */    
     @OnClose  
    public void onClose(Session session) {  
        log.info("onClose");  
        clients.remove(session.getId());  
    }  
  
    /**  
     * 接收到用户上传的消息  
     * @param session 客户端session  
     */    
     @OnMessage  
    public void onMessage(Session session, String message) {  
        log.info("onMessage");  
    }  
  
    /**  
     * 处理用户连接异常  
     * @param session 客户端session  
     * @param throwable 异常  
     */  
    @OnError  
    public void onError(Session session, Throwable throwable) {  
        log.info("onError");  
    }  
  
    /**  
     * 发送信息  
     * @param session 客户端session  
     * @param message 消息  
     * @throws IOException  
     */  
    public static void sendMessage(Session session, String message) throws IOException {  
        session.getBasicRemote().sendText(message);  
    }  
  
    public static void sendAllMessage(String message) {  
        clients.forEach((id, session) -> {  
            try {  
                sendMessage(session, message + id);  
            } catch (IOException e) {  
                throw new RuntimeException(e);  
            }  
        });  
    }  
}
```

## WebSocketSchedule

用于定期向客户端发送消息

```java
@Component  
public class WebSocketSchedule {  
  
    @Scheduled(cron = "0/5 * * * * ? ")  
    private void schedule() {  
        WebSocketServer.sendAllMessage("[消息]");  
    }  
  
}
```

## 主启动类

```java
// 开启定时任务
@EnableScheduling  
@SpringBootApplication  
public class WebsocketStudyApplication {  
    public static void main(String[] args) {  
        SpringApplication.run(WebsocketStudyApplication.class, args);  
    }  
}
```

## 代码效果

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230430190801.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230430190833.png)

# 拓展

1. [在线WebSocket测试地址](http://www.jsons.cn/websocket/)

2. [如何在Postman中测试WebSocket](https://blog.csdn.net/qq_34330916/article/details/122339251)
