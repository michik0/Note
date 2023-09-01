# 1.MQ引言

## 1.1 什么是MQ

`MQ`(Message Queue) 翻译为 `消息队列` ，通过典型的 `生产者` 和 `消费者` 模型,生产者不断向消息队列中生产消息，消费者不断的从队列中获取消息。因为消息的生产和消费都是异步的，而且只关心消息的发送和接收，没有业务逻辑的侵入，轻松的实现系统间解耦。别名为 `消息中间件` 通过利用高效可靠的消息传递机制进行平台无关的数据交流，并基于数据通信来进行分布式系统的集成。

## 1.2 MQ有哪些

当今市面上有很多主流的消息中间件，如老牌的 `ActiveMQ`、`RabbitMQ`，炙手可热的 `Kafka`，阿里巴巴自主开发 `RocketMQ` 等。

## 1.3 不同MQ特点

**1. ActiveMQ**

ActiveMQ 是Apache出品，最流行的，能力强劲的开源消息总线。它是一个完全支持JMS规范的的消息中间件。丰富的API,多种集群架构模式让ActiveMQ在业界成为老牌的消息中间件,在中小型企业颇受欢迎!

**2. Kafka**

Kafka是LinkedIn开源的分布式发布-订阅消息系统，目前归属于Apache顶级项目。Kafka主要特点是基于Pull的模式来处理消息消费，追求高吞吐量，一开始的目的就是用于日志收集和传输。0.8版本开始支持复制，不支持事务，对消息的重复、丢失、错误没有严格要求，适合产生大量数据的互联网服务的数据收集业务。

**3. RocketMQ**

RocketMQ是阿里开源的消息中间件，它是纯Java开发，具有高吞吐量、高可用性、适合大规模分布式系统应用的特点。RocketMQ思路起源于Kafka，但并不是Kafka的一个Copy，它对消息的可靠传输及事务性做了优化，目前在阿里集团被广泛应用于交易、充值、流计算、消息推送、日志流式处理、binglog分发等场景。

**4.RabbitMQ**

RabbitMQ是使用Erlang语言开发的开源消息队列系统，基于AMQP协议来实现。AMQP的主要特征是面向消息、队列、路由（包括点对点和发布/订阅）、可靠性、安全。AMQP协议更多用在企业系统内对数据一致性、稳定性和可靠性要求很高的场景，对性能和吞吐量的要求还在

>RabbitMQ比Kafka可靠，Kafka更适合IO高吞吐的处理，一般应用在大数据日志处理或对实时性（少量延迟），可靠性（少量丢数据）要求稍低的场景使用，比如ELK日志收集。

# RabbitMQ 介绍与安装

## 2.1 RabbitMQ

RabbitMQ基于 `AMQP` 协议，`erlang` 语言开发，是部署最广泛的开源消息中间件,是最受欢迎的开源消息中间件之一。

>AMQP（advanced message queuing protocol）在2003年时被提出，最早用于解决金融领不同平台之间的消息传递交互问题。顾名思义，AMQP是一种协议，更准确的说是一种binary wire-level protocol（链接协议）。这是其和JMS的本质差别，AMQP不从API层进行限定，而是直接定义网络交换的数据格式。这使得实现了AMQP的provider天然性就是跨平台的。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230425220656.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426002715.png)

## 2.2 安装 RabbitMQ

**1. 运行 Docker 命令，启动 RabbitMQ**

```bash
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.11-management
```

**2. 创建新的用户**

>创建账号

```bash
rabbitmqctl add_user root 12345678
```

>设置用户角色

```bash
rabbitmqctl set_user_tags root administrator
```

>设置用户权限

```bash
# rabbitmqctl set_permissions [-p <vhostpath>] <user> <conf> <write> <read>
rabbitmqctl set_permissions -p "/" root ".*" ".*" ".*"
```

>查看用户与角色

```bash
rabbitmqctl list_users
```

>在后台设置权限（如果不设置，该账号将无法用于Java程序访问）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230425211918.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230425211926.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230425211933.png)
  
# 3. RabbitMQ 配置

## 3.1RabbitMQ 管理命令行

```bash

# 1. 服务启动相关
systemctl start|restart|stop|status rabbitmq-server

# 2. 可以查看更多命令，用来在不使用web管理界面情况下命令操作RabbitMQ
rabbitmqctl help 

# 3. 插件管理命令行
rabbitmq-plugins enable|list|disable
```

## 3.2 web管理界面介绍

### 3.2.1 overview概览

![image-20191126162026720.png](https://raw.githubusercontent.com/michik0/notes-image/master/image-20191126162026720.png)  

**connections**

无论生产者还是消费者，都需要与RabbitMQ建立连接后才可以完成消息的生产和消费，在这里可以查看连接情况`

**channels**

通道，建立连接后，会形成通道，消息的投递获取依赖通道。`

**Exchanges**

交换机，用来实现消息的路由`

**Queues**

队列，即消息队列，消息存放在队列中，等待消费，消费后被移除队列。`

### 3.2.2 Admin用户和虚拟主机管理

#### 1. 添加用户

![image-20191126162617280.png](https://raw.githubusercontent.com/michik0/notes-image/master/image-20191126162617280.png)

上面的Tags选项，其实是指定用户的角色，可选的有以下几个：

**超级管理员(Administrator)**

可登陆管理控制台，可查看所有的信息，并且可以对用户，策略(policy)进行操作。

**监控者(Monitoring)**

可登陆管理控制台，同时可以查看 rabbitmq 节点的相关信息(进程数，内存使用情况，磁盘使用情况等)

**策略制定者(Policymaker)**

可登陆管理控制台, 同时可以对policy进行管理。但无法查看节点的相关信息(上图红框标识的部分)。

**普通管理者(Management)**

仅可登陆管理控制台，无法看到节点信息，也无法对策略进行管理。

**其他**

无法登陆管理控制台，通常就是普通的生产者和消费者。

#### 2. 创建虚拟主机

>为了让各个用户可以互不干扰的工作，`RabbitMQ` 添加了虚拟主机（Virtual Hosts）的概念。其实就是一个独立的访问路径，不同用户使用不同路径，各自有自己的队列、交换机，互相不会影响。

![image-20191126163023153.png](https://raw.githubusercontent.com/michik0/notes-image/master/image-20191126163023153.png)

#### 3. 绑定虚拟主机和用户

创建好虚拟主机，我们还要给用户添加访问权限：

点击添加好的虚拟主机：

![image-20191126163506795.png](https://raw.githubusercontent.com/michik0/notes-image/master/image-20191126163506795.png)  

进入虚拟机设置界面:

![image-20191126163631889.png](https://raw.githubusercontent.com/michik0/notes-image/master/image-20191126163631889.png)  

# 4.RabbitMQ 编程

## 4.0 AMQP协议的回顾

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426001230.png)  

## 4.1 RabbitMQ支持的消息模型

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426001556.png)
  
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426001621.png)

## 4.2 引入依赖

```XML
<dependency>
	<groupId>com.rabbitmq</groupId>
	<artifactId>amqp-client</artifactId>
	<version>5.7.2</version>
</dependency>
```

## 4.3 RabbitMQ的API参数细节

```java

// 【生产者】生成队列
// 参数1：queue：队列名称，如果队列不存在自动创建
// 参数2：durable：是否持久化，如果设置为false，队列将在服务重启后删除
// 参数3：exclusive：表示是否为独占队列（只允许当前的连接可用，其他连接不可用该队列）。true：独占队列，false：非独占队列
// 参数4：autoDelete：当所有消费客户端连接断开后，是否自动删除队列，true：自动删除，false：不自动删除
// 参数5：arguments：其它参数
Channel.queueDeclare(String queue, boolean durable, boolean exclusive, 
					 boolean autoDelete,  Map<String, Object> arguments);  

// 【生产者】发送消息
// 参数1：exchange：交换机
// 参数2：routingKey：路由Key
// 参数3：props：额外参数，比如说可以设置发送持久化消息（MessageProperties.PERSISTENT_TEXT_PLAIN）
// 参数4：body：消息体
Channel.basicPublish(String exchange, String routingKey, BasicProperties props, byte[] body);
```

## 4.3 第一种模型(直连)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426001836.png)

在上图的模型中，有以下概念：

- P：生产者，也就是要发送消息的程序
- C：消费者：消息的接受者，会一直等待消息到来。
- queue：消息队列，图中红色部分。类似一个邮箱，可以缓存消息；生产者向其中投递消息，消费者从其中取出消息。

### 1. 生产者

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
// 3. 生成队列  
// 参数1：queue：队列名称，如果队列不存在自动创建  
// 参数2：durable：是否持久化，如果设置为false，队列将在服务重启后删除  
// 参数3：exclusive：表示是否为独占队列（只允许当前的连接可用，其他连接不可用该队列）。true：独占队列，false：非独占队列  
// 参数4：autoDelete：当所有消费客户端连接断开后，是否自动删除队列，true：自动删除，false：不自动删除  
// 参数5：arguments：其它参数  
channel.queueDeclare(QUEUE_NAME, true, false, true, null);  
  
// 4. 发送消息  
// 参数1：exchange：交换机  
// 参数2：routingKey：路由Key  
// 参数3：props：额外参数，比如说可以设置发送持久化消息（MessageProperties.PERSISTENT_TEXT_PLAIN）  
// 参数4：body：消息体  
channel.basicPublish("", QUEUE_NAME, MessageProperties.PERSISTENT_TEXT_PLAIN, "Hey!".getBytes());  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

### 2. 消费者  

```java
// 1. 创建 RabbitMQ 连接工厂  
ConnectionFactory factory = new ConnectionFactory();  
// 设置连接rabbitmq主机  
factory.setHost("10.0.0.5");  
// 设置用户名  
factory.setUsername("ems");  
// 设置密码  
factory.setPassword("12345678");  
// 设置连接哪个虚拟主机  
factory.setVirtualHost("/ems");  
  
// 2. 创建连接  
Connection connection = factory.newConnection();  
// 3. 获取信道  
Channel channel = connection.createChannel();  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消息消费失败：" + consumerTag + ", " + message);  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 5. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(QUEUE_NAME, true,  deliverCallback, cancelCallback);
```

### 工具类

```java
public class RabbitMQUtils {  
  
    private static ConnectionFactory factory;  
  
    static {  
        factory = new ConnectionFactory();  
    }  
  
    public static Connection getConnection(String host, String userName, String pwd, String virtualHost) throws IOException, TimeoutException {  
        try {  
            // 设置连接rabbitmq主机  
            factory.setHost(host);  
            // 设置用户名  
            factory.setUsername(userName);  
            // 设置密码  
            factory.setPassword(pwd);  
            // 设置连接哪个虚拟主机  
            factory.setVirtualHost(virtualHost);  
  
            // 2. 创建连接  
            return factory.newConnection();  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }  
    }  
  
    public static void closeConnectionAndChannel(Connection connection, Channel channel) throws IOException, TimeoutException {  
        try {  
            if (channel != null) channel.close();  
            if (connection != null) connection.close();  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        } catch (TimeoutException e) {  
            throw new RuntimeException(e);  
        }  
    }  
}
```

## 4.4 第二种模型(Work Queue)

`Work Queues`，也被称为（`Task queues`），任务模型。当消息处理比较耗时的时候，可能生产消息的速度会远远大于消息的消费速度。长此以往，消息就会堆积越来越多，无法及时处理。此时就可以使用 work 模型：**让多个消费者绑定到一个队列，共同消费队列中的消息**。队列中的消息一旦消费，就会消失，因此任务是不会被重复执行的。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426090808.png)

角色：

- P：生产者：任务的发布者
- C1：消费者-1，领取任务并且完成任务，假设完成速度较慢
- C2：消费者-2：领取任务并完成任务，假设完成速度快

#### 1. 生产者

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
  
// 3. 生成队列  
// 参数1：queue：队列名称，如果队列不存在自动创建  
// 参数2：durable：是否持久化，如果设置为false，队列将在服务重启后删除  
// 参数3：exclusive：表示是否为独占队列（只允许当前的连接可用，其他连接不可用该队列）。true：独占队列，false：非独占队列  
// 参数4：autoDelete：当所有消费客户端连接断开后，是否自动删除队列，true：自动删除，false：不自动删除  
// 参数5：arguments：其它参数  
channel.queueDeclare(QUEUE_NAME, true, false, false, null);  
  
// 4. 发送消息  
for (int i = 0; i < 10; i++) {  
    // 参数1：exchange：交换机  
    // 参数2：routingKey：路由Key  
    // 参数3：props：额外参数，比如说可以设置发送持久化消息（MessageProperties.PERSISTENT_TEXT_PLAIN）  
    // 参数4：body：消息体  
    channel.basicPublish("", QUEUE_NAME, MessageProperties.PERSISTENT_TEXT_PLAIN, ("消息[" + i + "]").getBytes());  
}  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

#### 2. 消费者-1

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()));  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(QUEUE_NAME, true,  deliverCallback, cancelCallback);
```

#### 3. 消费者-2

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()));  
    try {  
        TimeUnit.SECONDS.sleep(10);  
    } catch (InterruptedException e) {  
        throw new RuntimeException(e);  
    }  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(QUEUE_NAME, true,  deliverCallback, cancelCallback);
```

#### 4. 测试结果

```java
【消费者1】
消费消息：amq.ctag-XJTzKdLr4Co3eQ0WeeKh1g, 消息[0]
消费消息：amq.ctag-XJTzKdLr4Co3eQ0WeeKh1g, 消息[2]
消费消息：amq.ctag-XJTzKdLr4Co3eQ0WeeKh1g, 消息[4]
消费消息：amq.ctag-XJTzKdLr4Co3eQ0WeeKh1g, 消息[6]
消费消息：amq.ctag-XJTzKdLr4Co3eQ0WeeKh1g, 消息[8]

【消费者2】
消费消息：amq.ctag-dhYn5iL7iZMOBYcn35J0QA, 消息[1]
消费消息：amq.ctag-dhYn5iL7iZMOBYcn35J0QA, 消息[3]
消费消息：amq.ctag-dhYn5iL7iZMOBYcn35J0QA, 消息[5]
消费消息：amq.ctag-dhYn5iL7iZMOBYcn35J0QA, 消息[7]
消费消息：amq.ctag-dhYn5iL7iZMOBYcn35J0QA, 消息[9]
```

> 总结
> 
> 默认情况下，RabbitMQ将按顺序将每个消息发送给下一个使用者。平均而言，每个消费者都会收到相同数量的消息。这种分发消息的方式称为**循环**。

#### 5. 消息自动确认机制（能者多劳）

> Doing a task can take a few seconds. You may wonder what happens if one of the consumers starts a long task and dies with it only partly done. With our current code, once RabbitMQ delivers a message to the consumer it immediately marks it for deletion. In this case, if you kill a worker we will lose the message it was just processing. We'll also lose all the messages that were dispatched to this particular worker but were not yet handled.
> 
> 完成一项任务可能需要几秒钟。您可能想知道，如果其中一个消费者启动了一个长任务，并且只完成了一部分就结束了，会发生什么。在我们当前的代码中，一旦RabbitMQ将消息传递给消费者，它会立即将其标记为删除。在这种情况下，如果杀死一个worker，我们将丢失它正在处理的消息。我们还会丢失所有发送给这个特定worker但尚未处理的消息。
> 
> But we don't want to lose any tasks. If a worker dies, we'd like the task to be delivered to another worker.
> 
> 但是我们不想丢掉任何任务。如果一个 worker 死了，我们希望把任务交给另一个 worker。

**官方并不推荐自动ACK，即收到消息后还未处理完就进行ACK**

**手动ACK步骤：**

1. 设置通道一次只能消费一个消息
2. 关闭消息的自动确认,开启手动确认消息

```java
Channel channel = connection.createChannel();  
// 设置通道一次只能消费一个消息（用于手动ACK）  
channel.basicQos(1);

DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()));  
    // 参数1：确认队列中哪个具体的消息  
    // 参数2：是否开启多个消息同时确认  
    channel.basicAck(message.getEnvelope().getDeliveryTag(), true);  
};

// 采用手动ACK
channel.basicConsume(QUEUE_NAME, false,  deliverCallback, cancelCallback);
```

## 4.5 第三种模型(Fanout)

Fanout（扇出）也称为广播

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426110759.png)
 
在广播模式下，消息发送流程是这样的：

- 可以有多个消费者
- 每个**消费者有自己的queue**（队列）
- 每个**队列都要绑定到Exchange**（交换机）
- **生产者发送的消息，只能发送到交换机**，交换机来决定要发给哪个队列，生产者无法决定。
- 交换机把消息发送给绑定过的所有队列
- 队列的消费者都能拿到消息。实现一条消息被多个消费者消费

#### 1. 生产者

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
  
// 3. 将通道声明给指定交换机  
// 参数1：交换机名称  
// 参数2：fanout 广播类型  
channel.exchangeDeclare(EXCHANGE_NAME, "fanout");  
  
// 3. 向交换机发送消息  
// 参数1：exchange：交换机  
// 参数2：routingKey：路由Key  
// 参数3：props：额外参数，比如说可以设置发送持久化消息（MessageProperties.PERSISTENT_TEXT_PLAIN）  
// 参数4：body：消息体  
channel.basicPublish(EXCHANGE_NAME, "", MessageProperties.PERSISTENT_TEXT_PLAIN, "fanout".getBytes());  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

#### 2. 开发消费者-1

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
channel.exchangeDeclare(EXCHANGE_NAME, "fanout");  
  
// 3. 创建临时队列  
String queueName = channel.queueDeclare().getQueue();  
  
// 4. 绑定交换机和队列  
channel.queueBind(queueName, EXCHANGE_NAME, "");  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()) + ", " + System.currentTimeMillis());  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(queueName, true,  deliverCallback, cancelCallback);
```

#### 3. 开发消费者-2

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
channel.exchangeDeclare(EXCHANGE_NAME, "fanout");  
  
// 3. 创建临时队列  
String queueName = channel.queueDeclare().getQueue();  
  
// 4. 绑定交换机和队列  
channel.queueBind(queueName, EXCHANGE_NAME, "");  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()) + ", " + System.currentTimeMillis());  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(queueName, true,  deliverCallback, cancelCallback);
```

#### 4. 测试结果

**生成临时队列**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426115834.png)

**2个消费者均收到消息**

```java
【消费者1】
消费消息：amq.ctag-1V5k0FR4ak2ftnRNNAZyRQ, fanout, 1682481464540
【消费者2】
消费消息：amq.ctag--ERR41VTgaDxDqduyYqu1g, fanout, 1682481464540
```


## 4.6 第四种模型(Routing)

### 4.6.1 Routing 之订阅模型-Direct(直连)

在Fanout模式中，一条消息，会被所有订阅的队列都消费。但是，在某些场景下，我们希望**不同的消息被不同的队列消费**。这时就要用到Direct类型的Exchange。

在Direct模型下：

- 队列与交换机的绑定，不能是任意绑定了，而是要指定一个 `RoutingKey`（路由key）
- 消息的发送方在向 Exchange发送消息时，也必须指定消息的 `RoutingKey`。
- `Exchange` 不再把消息交给每一个绑定的队列，而是根据消息的 `Routing Key` 进行判断，只有队列的 `Routingkey` 与消息的 `Routing key` 完全一致，才会接收到消息

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426140157.png)

- P：生产者，向 `Exchange` 发送消息，发送消息时，会指定一个 `Routing Key`。
- X：`Exchange` 接收生产者的消息，然后把消息递交给 与 `Routing Key` 完全匹配的队列
- C1：消费者，其所在队列指定了需要 `Routing Key` 为 `error` 的消息
- C2：消费者，其所在队列指定了需要 `Routing Key` 为 `info、error、warning` 的消息

#### 1. 生产者

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
  
// 3. 将通道声明给指定交换机  
// 参数1：交换机名称  
// 参数2：direct 类型  
channel.exchangeDeclare(EXCHANGE_NAME, "direct");  
  
// 3. 向交换机发送消息  
// 参数1：exchange：交换机  
// 参数2：routingKey：路由Key  
// 参数3：props：额外参数，比如说可以设置发送持久化消息（MessageProperties.PERSISTENT_TEXT_PLAIN）  
// 参数4：body：消息体  
channel.basicPublish(EXCHANGE_NAME, "error", MessageProperties.PERSISTENT_TEXT_PLAIN, "error消息!".getBytes());  
channel.basicPublish(EXCHANGE_NAME, "info", MessageProperties.PERSISTENT_TEXT_PLAIN, "info消息!".getBytes());  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

#### 2. 消费者-1

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
channel.exchangeDeclare(EXCHANGE_NAME, "direct");  
  
// 3. 创建临时队列  
String queueName = channel.queueDeclare().getQueue();  
  
// 4. 绑定交换机和队列  
channel.queueBind(queueName, EXCHANGE_NAME, "info");  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()) + ", " + System.currentTimeMillis());  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(queueName, true,  deliverCallback, cancelCallback);
```

#### 3.开发消费者-2

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
channel.exchangeDeclare(EXCHANGE_NAME, "direct");  
  
// 3. 创建临时队列  
String queueName = channel.queueDeclare().getQueue();  
  
// 4. 绑定交换机和队列  
// 这里绑定了三个 Routing Keychannel.queueBind(queueName, EXCHANGE_NAME, "info");  
channel.queueBind(queueName, EXCHANGE_NAME, "warning");  
channel.queueBind(queueName, EXCHANGE_NAME, "error");  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()) + ", " + System.currentTimeMillis());  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(queueName, true,  deliverCallback, cancelCallback);
```

#### 4.测试生产者发送Routing Key为error的消息时

```java
【消费者1】
无
【消费者2】
消费消息：amq.ctag-fRcxoBbVl4oh1IxrhvViZA, error消息!, 1682490655841
```

#### 5.测试生产者发送Route key为info的消息时

```java
【消费者1】
消费消息：amq.ctag-E7l3opSE1MyjYc7xZn4FzA, info消息!, 1682490655844
【消费者2】
消费消息：amq.ctag-fRcxoBbVl4oh1IxrhvViZA, info消息!, 1682490655842
```

### 4.6.2 Routing 之订阅模型-Topic

`Topic` 类型的 `Exchange` 与 `Direct` 相比，都是可以根据 `Routing Key` 把消息路由到不同的队列。只不过 `Topic` 类型 `Exchange` 可以让队列在绑定 `Routing Key` 的时候使用通配符，这种模型  `Routing Key` 一般都是由一个或多个单词组成，多个单词之间以 `.` 分割，例如： `item.insert`

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230426144009.png)

**通配符**

```other
*：恰好匹配一个单词

#：匹配0个或者多个单词

[举个例子]

audit.# ：匹配 audit 或 audit.irs.corporate 或 udit.irs 等

audit.* ：匹配 audit.irs

```

#### 1. 生产者

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
  
// 3. 将通道声明给指定交换机  
// 参数1：交换机名称  
// 参数2：direct 类型  
channel.exchangeDeclare(EXCHANGE_NAME, "topic");  
  
// 3. 向交换机发送消息  
// 参数1：exchange：交换机  
// 参数2：routingKey：路由Key  
// 参数3：props：额外参数，比如说可以设置发送持久化消息（MessageProperties.PERSISTENT_TEXT_PLAIN）  
// 参数4：body：消息体  
channel.basicPublish(EXCHANGE_NAME, "user.hey", MessageProperties.PERSISTENT_TEXT_PLAIN, "user.hey消息!".getBytes());  
channel.basicPublish(EXCHANGE_NAME, "user.hey.yo", MessageProperties.PERSISTENT_TEXT_PLAIN, "user.hey.yo消息!".getBytes());  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

#### 2. 消费者-1

Routing Key中使用 * 通配符方式

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
channel.exchangeDeclare(EXCHANGE_NAME, "topic");  
  
// 3. 创建临时队列  
String queueName = channel.queueDeclare().getQueue();  
  
// 4. 绑定交换机和队列  
channel.queueBind(queueName, EXCHANGE_NAME, "user.*");  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()) + ", " + System.currentTimeMillis());  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(queueName, true,  deliverCallback, cancelCallback);
```

#### 3. 消费者-2

`Routing Key` 中使用 # 通配符方式

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
channel.exchangeDeclare(EXCHANGE_NAME, "topic");  
  
// 3. 创建临时队列  
String queueName = channel.queueDeclare().getQueue();  
  
// 4. 绑定交换机和队列  
// 这里绑定了三个 Routing Keychannel.queueBind(queueName, EXCHANGE_NAME, "user.#");  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("消费消息：" + consumerTag + ", " + new String(message.getBody()) + ", " + System.currentTimeMillis());  
};  
  
CancelCallback cancelCallback = (message) -> {  
    System.out.println("消息消费被取消：" + message);  
};  
  
// 3. 消费消息  
// - 参数1：消费哪个队列  
// - 参数2：消费成功后，是否自动应答？true：自动应答，false：手动应答  
// - 参数3：消费时的回调接口  
// - 参数4：消费被取消时调用的接口  
channel.basicConsume(queueName, true,  deliverCallback, cancelCallback);
```

#### 4.测试结果

```java
【消费者1】
消费消息：amq.ctag-X5HymlQOQ4SPuEKkibjHyA, user.hey消息!, 1682492539448
【消费者2】
消费消息：amq.ctag-4tXGiGlSLs_mnLSGalxmLw, user.hey消息!, 1682492539448
消费消息：amq.ctag-4tXGiGlSLs_mnLSGalxmLw, user.hey.yo消息!, 1682492539511

```


# 5. SpringBoot中使用RabbitMQ

## 5.0 搭建初始环境

### 1. 引入依赖

```xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-amqp</artifactId>  
</dependency>
```

#### 2. 配置配置文件
 
```yml
spring:  
  application:  
    name: springboot_rabbitmq  
  rabbitmq:  
    host: 10.0.0.5  
    port: 5672  
    username: ems  
    password: 12345678  
    virtual-host: /ems
```

## 5.1 第一种：Hello World模型

  

### 1. 生产者

```java
@Autowired  
RabbitTemplate rabbitTemplate;  
  
@Test  
public void testHelloWorld() {  
    rabbitTemplate.convertAndSend("hello", "hello world");  
    log.info("产生消息：{}", "hello world");  
}
```

### 2. 消费者

```java
@Slf4j  
@Component  
// 当 hello 队列不存在时，自动创建  
@RabbitListener(queuesToDeclare = @Queue("hello"))  
public class HelloConsumer {  
    @RabbitHandler  
    public void receive(String message) {  
        log.info("消费消息:{}", message);  
    }  
}
```
  
## 5.2 第二种：Work Queue模型

### 1. 生产者

```java
@Autowired  
private RabbitTemplate rabbitTemplate;  
  
@Test  
public void testWorkQueue() {  
    for (int i = 0; i < 10; i++) {  
        rabbitTemplate.convertAndSend("work", "work queue message");  
    }  
}
```

### 2. 消费者

```java
@RabbitListener(queuesToDeclare = @Queue("work"))  
public void consume1(String message) {  
    log.info("【消费者1】消费消息：{}", message);  
}  
  
@RabbitListener(queuesToDeclare = @Queue("work"))  
public void consume2(String message) {  
    log.info("【消费者2】消费消息：{}", message);  
}
```
  
>说明

默认在Spring AMQP实现中Work这种方式就是公平调度，如果需要实现能者多劳需要额外配置，参考：[[#^2f5b47|实战中手动ACK配置]]

## 5.3 Fanout 广播模型

### 1. 生产者

```java
@Autowired  
RabbitTemplate rabbitTemplate;  
  
@Test  
public void testFanout() {  
    rabbitTemplate.convertAndSend("logs", "", "Fanout模型发送的消息");  
}
```

### 2. 消费者

```java
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue,  // 创建临时队列  
                exchange = @Exchange(value = "logs", type = "fanout")   // 绑定的交换机  
        )  
})  
public void consume1(String message) {  
    log.info("【fanout】【消费者1】消费：{}", message);  
}  
  
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue,  // 创建临时队列  
                exchange = @Exchange(value = "logs", type = "fanout")   // 绑定的交换机  
        )  
})  
public void consume2(String message) {  
    log.info("【fanout】【消费者2】消费：{}", message);  
}
```

## 5.4 Route 路由模型

### 1. 生产者

```java
@Autowired  
RabbitTemplate rabbitTemplate;  
  
@Test  
public void testDirect() {  
    rabbitTemplate.convertAndSend("direct_exchange", "info", "info消息");  
}
```

### 2. 消费者

```java
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue,      // 创建临时队列  
                exchange = @Exchange(value = "direct_exchange", type = "direct"),     // 绑定交换机  
                key = {"info"}      // Routing Key  
        )  
})  
public void consume1(String message) {  
    log.info("【direct】【消费者1】消费信息：{}", message);  
}  
  
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue,      // 创建临时队列  
                exchange = @Exchange(value = "direct_exchange", type = "direct"),     // 绑定交换机  
                key = {"error"}      // Routing Key  
        )  
})  
public void consume2(String message) {  
    log.info("【direct】【消费者2】消费信息：{}", message);  
}
```

## 5.5 Topic 订阅模型(动态路由模型)

### 1. 生产者

```java
@Autowired  
RabbitTemplate rabbitTemplate;  
  
@Test  
public void testDirect() {  
    rabbitTemplate.convertAndSend("topic_exchange", "user", "[user]");  
    rabbitTemplate.convertAndSend("topic_exchange", "user.hey", "[user.hey]");  
    rabbitTemplate.convertAndSend("topic_exchange", "user.hey.cool!", "[user.hey.cool!]");  
}
```

### 2. 消费者

```java
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue,      // 创建临时队列  
                exchange = @Exchange(value = "topic_exchange", type = "topic"),     // 绑定交换机  
                key = {"user.*"}      // Routing Key  
        )  
})  
public void consume1(String message) {  
    log.info("【topic】【消费者1】消费信息：{}", message);  
}  
  
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue,      // 创建临时队列  
                exchange = @Exchange(value = "topic_exchange", type = "topic"),     // 绑定交换机  
                key = {"user.#"}      // Routing Key  
        )  
})  
public void consume2(String message) {  
    log.info("【topic】【消费者2】消费信息：{}", message);  
}
```

## 5.6 死信队列

### 1. 生产者

```java
@Slf4j  
@RestController  
public class Producer {  
  
    @Resource  
    RabbitTemplate rabbitTemplate;  
  
    private final String EXCHANGE_NAME = "normal_exchange";  
    private final String ROUTING_KEY = "info";  
  
    @RequestMapping("/sendMsg/{msgCount}")  
    public String genMessage(@PathVariable("msgCount") int msgCount) {  

	// 默认是持久化消息，这里不写也没事
	MessagePostProcessor messagePostProcessor = (message -> {  
	   message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);  
	   return message;  
	});
  
        for (int i = 0; i < msgCount; i++) {  
            String message = "消息[" + i + "]" + UUID.randomUUID();  
            log.info("[生产者]生成消息：{}", message);  
            rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY, message, messagePostProcessor);  
        }  
        return "消息发送完成!";  
    }  
}
```

### 2. 正常队列消费者

```java
@Slf4j  
public class NormalConsumer {  
  
    private final String NORMAL_EXCHANGE = "normal_exchange";  
  
    private final String NORMAL_ROUTING_KEY = "info";  
  
    @RabbitListener(  
        ackMode = "MANUAL",       // 设置手动ACK  
        bindings = {  
            @QueueBinding(  
                exchange = @Exchange(value = "normal_exchange", type = "direct"),       // 定义普通交换机  
                value = @Queue(  
                    value = "normal_queue",     // 定义普通队列  
                    durable = "true",  
                    exclusive = "false",  
                    autoDelete = "false",  
                    arguments = {  
                        @Argument(name = "x-dead-letter-exchange", value = "dead_letter_exchange"),     // 定正常队列与死信交换机的绑定  
                        @Argument(name = "x-dead-letter-routing-key", value = "dead"),      // 定义正常队列与死信交换机的路由key  
                        @Argument(name = "x-max-length", value = "6", type = "java.lang.Long")     // 定义队列最大长度为6  
                    }  
                ),  
                key = "info"        // 定义普通交换机与普通队列的路由KEY  
            )  
        }  
    )  
    public void consume(String message, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag, Channel channel) throws InterruptedException, IOException {  
        log.info("[正常消费者]接收到消息:{}", message);  
        TimeUnit.SECONDS.sleep(2);  
        channel.basicAck(deliveryTag, false);  
        log.info("[正常消费者]消费消息：{}", message);  
    }  
  
}
```

### 3. 死信队列消费者

```java
@Slf4j  
public class DeadLetterConsumer {  
  
    @RabbitListener(  
        ackMode = "MANUAL",       // 设置手动ACK  
        bindings = {  
            @QueueBinding(  
                exchange = @Exchange(value = "dead_letter_exchange", type = "direct"),  // 定义死信交换机  
                value = @Queue(  
                    value = "dead_letter_queue",    // 定义死信队列  
                    durable = "true",  
                    exclusive = "false",  
                    autoDelete = "false"  
                ),  
                key = "dead"    // 定义死信交换机与死信队列的路由KEY  
            )  
        }  
    )  
    public void consume(String message, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag, Channel channel) throws InterruptedException, IOException {  
        log.info("[死信消费者]消费消息：{}", message);  
        channel.basicAck(deliveryTag, false);  
    }  
}
```

### 4. 测试结果

**情况一：不开放正常消费者、不开放死信消费者**

1. 不开放正常消费者（取消正常消费者中的@Component，即不监听正常队列）
2. 不开放死信消费者（取消死信消费者中的@Component，即不监听死信队列）
3. 生产者进行消息的生成，向正常队列发送10条消息

结果发现：正常队列中有6条消息，死信队列中包含了4条消息

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428153939.png)

**情况二：不开放正常消费者、开放死信消费者**

1. 不开放正常消费者（取消正常消费者中的@Component，即不监听正常队列）
2. 开放死信消费者
3. 生产者进行消息的生成，向正常队列发送10条消息

结果发现：正常队列有6条消息，死信队列中的消息被死信消费者消费

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428154143.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428154206.png)

# 6. 死信队列

## 6.1 死信的概念

先从概念解释上搞清楚这个定义，死信，顾名思义就是无法被消费的消息，字面意思可以这样理解，一般来说，producer 将消息投递到 broker 或者直接到 queue 里了，consumer 从 queue 取出消息进行消费，但某些时候由于特定的原因导致 queue 中的某些消息无法被消费，这样的消息如果没有后续的处理，就变成了死信，有死信自然就有了**死信队列**。

**应用场景：**

为了保证订单业务的消息数据不丢失，需要使用到 RabbitMQ 的死信队列机制，当消息消费发生异常时，将消息投入死信队列中.还有比如说：用户在商城下单成功并点击去支付后在指定时间未支付时自动失效。

## 6.2 死信队列的来源

- 消息TTL过期
- 队列达到最大长度（队列满了，无法再添加数据到 MQ 中)
- 消息被拒绝（`basic.reject` 或 `basic.nack`）并且 `requeue=false`

## 6.3 死信队列架构

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427174658.png)


## 6.4 死信队列实战（什么时候会将消息存入死信队列？）

### 情况一：消息TTL过期

当消息设置了TTL时间时，如果超过TTL时间还未被消费，那么将会加入死信队列。

**生产者**

```java
// 1. 获取连接  
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
// 死信消息（设置TTL时间）  
AMQP.BasicProperties properties = MessageProperties.PERSISTENT_TEXT_PLAIN       // 持久化消息  
        .builder()  
        .expiration(TEN_SECONDS)        // 设置消息TTL  
        .build();  
  
// 3. 将通道声明给指定交换机  
channel.exchangeDeclare(EXCHANGE_NAME, "direct");  
  
// 3. 向交换机发送消息  
for (int i = 0; i < 10; i++) {  
    channel.basicPublish(EXCHANGE_NAME, NORMAL_ROUTING_KEY, properties, ("[消息" + i + "!]").getBytes());  
}  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

**消费者**

```java
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
Channel channel = connection.createChannel();  
  
// 声明死信交换机和普通交换机  
channel.exchangeDeclare(DEAD_EXCHANGE, "direct");  
channel.exchangeDeclare(NORMAL_EXCHANGE, "direct");  
  
  
// 声明普通队列  
// 这里需要额外参数中配置死信的参数  
Map<String, Object> arguments = new HashMap<>();  
// 正常队列设置死信交换机  
arguments.put("x-dead-letter-exchange", DEAD_EXCHANGE);  
// 设置死信Routing Key  
arguments.put("x-dead-letter-routing-key", DEAD_ROUTING_KEY);  
channel.queueDeclare(NORMAL_QUEUE, true, false, false, arguments);  
  
// 声明死信队列  
channel.queueDeclare(DEAD_QUEUE, true, false, false, null);  
  
// 绑定普通交换机与普通队列  
channel.queueBind(NORMAL_QUEUE, NORMAL_EXCHANGE, NORMAL_ROUTING_KEY);  
// 绑定死信交换机与死信队列  
channel.queueBind(DEAD_QUEUE, DEAD_EXCHANGE, DEAD_ROUTING_KEY);  
  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("[消费者1]消费消息:" + new String(message.getBody()));  
};  
  
channel.basicConsume(NORMAL_QUEUE, true, deliverCallback, (consumerTag, message) -> {});
```

**测试结果**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427234819.png)

由于发送的消息带有10S的TTL，所以10S后，消息从消息队列到了死信队列

### 情况二：队列到达最大长度

当队列中的**未被消费的消息个数**到达了最大的长度，那么将会将多余的消息放到死信队列。

**注意：** 未被ACK的消息不计入限制

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428151604.png)

**生产者**

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
// 死信消息  
AMQP.BasicProperties properties = MessageProperties.PERSISTENT_TEXT_PLAIN;       // 持久化消息  
  
// 3. 将通道声明给指定交换机  
channel.exchangeDeclare(EXCHANGE_NAME, "direct");  
  
// 3. 向交换机发送消息  
for (int i = 0; i < 10; i++) {  
    channel.basicPublish(EXCHANGE_NAME, NORMAL_ROUTING_KEY, properties, ("[消息" + i + "!]").getBytes());  
}  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

**消费者**

```java
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
Channel channel = connection.createChannel();  
  
// 声明死信交换机和普通交换机  
channel.exchangeDeclare(DEAD_EXCHANGE, "direct");  
channel.exchangeDeclare(NORMAL_EXCHANGE, "direct");  
  
  
// 声明普通队列  
// 这里需要额外参数中配置死信的参数  
Map<String, Object> arguments = new HashMap<>();  
// 正常队列设置死信交换机  
arguments.put("x-dead-letter-exchange", DEAD_EXCHANGE);  
// 设置死信Routing Key  
arguments.put("x-dead-letter-routing-key", DEAD_ROUTING_KEY);  
// 设定正常队列长度限制  
arguments.put("x-max-length", 6);  

channel.queueDeclare(NORMAL_QUEUE, true, false, false, arguments);  
  
// 声明死信队列  
channel.queueDeclare(DEAD_QUEUE, true, false, false, null);  
  
// 绑定普通交换机与普通队列  
channel.queueBind(NORMAL_QUEUE, NORMAL_EXCHANGE, NORMAL_ROUTING_KEY);  
// 绑定死信交换机与死信队列  
channel.queueBind(DEAD_QUEUE, DEAD_EXCHANGE, DEAD_ROUTING_KEY);  
  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    System.out.println("[消费者1]消费消息:" + new String(message.getBody()));  
};  
  
channel.basicConsume(NORMAL_QUEUE, true, deliverCallback, (consumerTag, message) -> {});
```

**测试结果**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428004303.png)

总共有10条消息，由于正常队列通过设置队列长度最多为6，所以剩下的4条消息进入了死信队列。

### 情况三：消息被拒绝

**生产者**

```java
// 1. 获取连接  
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
  
// 2. 获取信道  
Channel channel = connection.createChannel();  
// 死信消息  
AMQP.BasicProperties properties = MessageProperties.PERSISTENT_TEXT_PLAIN;       // 持久化消息  
  
// 3. 将通道声明给指定交换机  
channel.exchangeDeclare(EXCHANGE_NAME, "direct");  
  
// 3. 向交换机发送消息  
for (int i = 0; i < 10; i++) {  
    channel.basicPublish(EXCHANGE_NAME, NORMAL_ROUTING_KEY, properties, ("[消息" + i + "!]").getBytes());  
}  
  
// 5. 关闭连接  
RabbitMQUtils.closeConnectionAndChannel(connection, channel);
```

**消费者**

```java
Connection connection = RabbitMQUtils.getConnection("10.0.0.5", "ems", "12345678", "/ems");  
Channel channel = connection.createChannel();  
  
// 声明死信交换机和普通交换机  
channel.exchangeDeclare(DEAD_EXCHANGE, "direct");  
channel.exchangeDeclare(NORMAL_EXCHANGE, "direct");  
  
  
// 声明普通队列  
// 这里需要额外参数中配置死信的参数  
Map<String, Object> arguments = new HashMap<>();  
// 正常队列设置死信交换机  
arguments.put("x-dead-letter-exchange", DEAD_EXCHANGE);  
// 设置死信Routing Key  
arguments.put("x-dead-letter-routing-key", DEAD_ROUTING_KEY);  
  
channel.queueDeclare(NORMAL_QUEUE, true, false, false, arguments);  
  
// 声明死信队列  
channel.queueDeclare(DEAD_QUEUE, true, false, false, null);  
  
// 绑定普通交换机与普通队列  
channel.queueBind(NORMAL_QUEUE, NORMAL_EXCHANGE, NORMAL_ROUTING_KEY);  
// 绑定死信交换机与死信队列  
channel.queueBind(DEAD_QUEUE, DEAD_EXCHANGE, DEAD_ROUTING_KEY);  
  
  
DeliverCallback deliverCallback = (consumerTag, message) -> {  
    if (new String(message.getBody()).equals("[消息5!]")) {  
        channel.basicReject(message.getEnvelope().getDeliveryTag(), false);  
    }  
    else {  
        System.out.println("[消费者1]消费消息:" + new String(message.getBody()));  
        channel.basicAck(message.getEnvelope().getDeliveryTag(), false);  
    }  
};  
  
channel.basicConsume(NORMAL_QUEUE, false, deliverCallback, (consumerTag, message) -> {});
```

**测试结果**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428005634.png)

发现由于消息5被拒绝，所以直接加入到死信队列，其余消息均被消费

# 7. 延迟队列

### 7.1 什么是延迟队列

延时队列，队列内部是有序的，最重要的特性就体现在它的延时属性上，延时队列中的元素是希望在指定时间到了以后或之前取出和处理，简单来说，延时队列就是用来存放需要在指定时间被处理的元素的队列。

	延迟队列就是死信队列中TTL情况的变种，但是死信队列中，有一个正常队列消费者进行消费。在延迟队列中，正常队列没有消费者进行消费，而是等待消息过期后，加入延迟队列进行消息的消费。

### 7.2 延迟队列的使用场景

1. 订单在十分钟之内未支付则自动取消。
2. 新创建的店铺，如果在十天内都没有上传过商品，则自动发送消息提醒。 
3. 用户注册成功后，如果三天内没有登陆则进行短信提醒。
4. 用户发起退款，如果三天内没有得到处理则通知相关运营人员。
5. 预定会议后，需要在预定的时间点前十分钟通知各个与会人员参加会议。

这些场景都有一个特点，需要在某个事件发生之后或者之前的指定时间点完成媒某一项任务，如：发生订单生成事件，在十分钟之后检查该订单支付状态，然后将未支付的订单进行关闭；看起来似乎使用定时任务，一直轮询数据，每秒查一次，取出需要被处理的数据，然后处理不就完事了吗？如果数据量比较少，确实可以这样做，比如：对于 `如果账单一周内未支付则进行自动结算` 这样的需求，如果对于时间不是严格限制，而是宽松意义上的一周，那么每天晚上跑个定时任务检查一下所有未支付的账单，确实也是一个可行的方案。但对于数据量比较大，并且时效性较强的场景，如：`订单十分钟内未支付则关闭`，短期内未支付的订单数据可能会有很多，活动期间甚至会达到百万甚至千万。

## 7.3 基于死信实现延迟队列

这边通过一个需求来引入实战编码，我们利用RabbitMQ来实现订单超过15分钟未付款就自动取消订单。

**逻辑架构图**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428203613.png)

**生产者（订单系统）**

```java
@Slf4j  
@RestController  
public class OrderController {  
  
    @Resource  
    RabbitTemplate rabbitTemplate;  
  
    private final String EXCHANGE_NAME = "order_exchange";  
    private final String ROUTING_KEY = "order";  
  
    @RequestMapping("/order/{id}")  
    public String genMessage(@PathVariable("id") Integer id) {  
  
        MessagePostProcessor messagePostProcessor = (message -> {  
            message.getMessageProperties().setExpiration("5000");  
            return message;  
        });  
  
        log.info("产生订单:{}", id);  
        rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY, id, messagePostProcessor);  
  
        return "产生订单!";  
    }  
}
```

**消费者（取消订单系统）**

```java
@Slf4j  
@Component  
@RabbitListener(  
        bindings = @QueueBinding(  
            exchange = @Exchange(value = "not_pay_exchange"),  
            value = @Queue(  
                value = "not_pay_queue",  
                durable = "true",  
                exclusive = "false",  
                autoDelete = "false"  
            ),  
            key = {"cancel"}  
        )  
)  
public class NotPayConsumer {  
  
    @RabbitHandler  
    public void cancelOrder(Integer message) {  
        log.info("取消订单:{}", message);  
    }  
}
```

**队列配置文件**

由于需要创建一个中间队列（无消费者进行消费），只是用于存放消息，等待消息TTL之后，自动存放在死信队列（需取消订单的队列）进行消费，所以我们需要创建额外的配置文件，只是用于进行项目启动时候队列的初始化（如果不存在该队列会自动创建）。

```java
@Configuration  
public class OrderQueueConfig {  
  
    @Bean  
    public DirectExchange orderExchange() {  
        return ExchangeBuilder.directExchange("order_exchange").build();  
    }  
  
    @Bean  
    public Queue orderQueue() {  
        Map<String, Object> arguments = new HashMap<>();  
        arguments.put("x-dead-letter-exchange", "not_pay_exchange");  
        arguments.put("x-dead-letter-routing-key", "cancel");  
        return QueueBuilder.durable("order_queue").withArguments(arguments).build();  
    }  
  
    @Bean  
    public Binding orderBinding(DirectExchange orderExchange, Queue orderQueue) {  
        return BindingBuilder.bind(orderQueue).to(orderExchange).with("order");  
    }  
}
```

## 7.4 延迟队列的缺陷

^af3ce2

7.3 实战中的代码似乎能够完美匹配，在生产者发送消息的时候，能够根据业务的需要指定TTL，但是真的完美吗？

我们按顺序连着发送2个消息，如下伪代码：

```java
// 发送第一笔消息（10s过期）
rabbitTemplate.send("订单1", TEN_SECONDS_TTL);  
// 发送第二笔消息（5s过期）
rabbitTemplate.send("订单2", FIVE_SECONDS_TTL);  
```

我们会发现结果为：

```java
[20:43:01] 产生订单1
[20:43:01] 产生订单2
......
[20:43:11] 取消订单1
[20:43:11] 取消订单2
```

正常情况下，订单2是5s过期，那么应该在 `20:43:06` 的时候就取消订单了，但是因为订单1在前面，所以就会先等订单1执行完后，才会进行后面的TTL判断。

**如何解决？**

RabbitMQ 插件实现延迟队列

## 7.5 RabbitMQ 插件实现延迟队列

>[[#^af3ce2|为什么使用 RabbitMQ 插件实现延迟队列？]]

### 1. 安装插件

前往[官网](https://rabbitmq.com/community-plugins.html)下载 `rabbitmq_delayed_message_exchange-3.11.1.ez` 插件，然后解压到 RabbitMQ 的插件目录（`/opt/rabbitmq/plugins`）

>备注
>
>如果是采用Docker，可以用 `docker cp <本地文件路径> <容器名称或ID>:<容器路径>` 命令将文件放入安装目录

### 2. 启用插件

```bash
rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428210523.png)

### 3. 查看插件是否安装成功

前往 RabbitMQ 后台，查看新增交换机的时候是否有 `x-delayed-message` 选项，如果有那么就说明插件启用成功

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428210659.png)

## 7.6 基于插件的延迟队列实现

在我们自定义的交换机中，这是一种新的交换类型，该类型消息支持延迟投递机制消息传递后并不会立即投递到目标队列中，而是存储在mnesia(一个分布式数据系统)表中，当达到投递时间时，才投递到目标队列中。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230428210853.png)

**延迟队列配置类**

```java
@Configuration  
public class DelayedQueueConfig {  
  
    // 延迟队列  
    public static final String DELAYED_QUEUE_NAME = "delayed.queue";  
    // 延迟交换机  
    public static final String DELAYED_EXCHANGE_NAME = "delayed.exchange";  
    // 延迟队列路由  
    public static final String DELAYED_ROUTING_KEY = "delayed.routingKey";  
  
    @Bean  
    public Queue delayedQueue() {  
        return QueueBuilder.durable(DELAYED_QUEUE_NAME).build();  
    }  
  
    // 声明交换机  
    @Bean  
    public CustomExchange delayedExchange() {  
        // 自定义参数  
        Map<String, Object> arguments = new HashMap<>();  
        // 设置交换机与队列的绑定类型为direct  
        arguments.put("x-delayed-type", "direct");  
        return new CustomExchange(DELAYED_EXCHANGE_NAME, "x-delayed-message", true, false, arguments);  
    }  
  
    @Bean  
    public Binding delayedQueueBinding(Queue delayedQueue, Exchange delayedExchange) {  
        return BindingBuilder.bind(delayedQueue).to(delayedExchange).with(DELAYED_ROUTING_KEY).noargs();  
    }  
}
```

**消费者**

```java
@Slf4j  
@Component  
public class DelayedConsumer {  
  
    @RabbitListener(  
            queues = {DelayedQueueConfig.DELAYED_QUEUE_NAME}  
    )  
    public void consume(String message) {  
        log.info("收到消息：" + message);  
    }  
}
```

**生产者**

```java
@Slf4j  
@Component  
@RestController  
public class DelayedProducer {  
  
    @Resource  
    RabbitTemplate rabbitTemplate;  
  
    @RequestMapping("/plugins/delayed/{message}/{delayTime}")  
    public String sendMessage(@PathVariable String message, @PathVariable Integer delayTime) {  
  
        MessagePostProcessor messagePostProcessor = msg -> {  
            // 注意这边是setDelay，而不是setExpiration方法  
            msg.getMessageProperties().setDelay(delayTime);  
            return msg;  
        };  
  
        rabbitTemplate.convertAndSend(DelayedQueueConfig.DELAYED_EXCHANGE_NAME, DelayedQueueConfig.DELAYED_ROUTING_KEY, message, messagePostProcessor);  
  
        log.info("完成消息的发送：{}", message);  
  
        return "完成消息的发送：" + message;  
    }  
}
```

## 7.7 总结

延时队列在需要延时处理的场景下非常有用，使用 RabbitMQ 来实现延时队列可以很好的利用 RabbitMQ 的特性，如：消息可靠发送、消息可靠投递、死信队列来保障消息至少被消费一次以及未被正确处理的消息不会被丢弃。另外，通过 RabbitMQ 集群的特性，可以很好的解决单点故障问题，不会因为单个节点挂掉导致延时队列不可用或者消息丢失。

当然，延时队列还有很多其它选择，比如利用Java的DelayQueue，利用 Redis的 zset，利用 Quartz或者利用 kafka的时间轮，这些方式各有特点，看需要适用的场景。

# 8. 发布确认模式

在生产环境中由于一些不明原因，导致 RabbitMQ 重启，在 RabbitMQ 重启期间生产者消息投递失败（可能是生产者投递交换机消息失败，也可能是交换机投递队列失败），导致消息丢失，需要手动处理和恢复。于是，我们开始思考，如何才能进行 RabbitMQ 的消息可靠投递呢？特别是在这样比较极端的情况，RabbitMQ集群不可用的时候，无法投递的消息该如何处理呢：

## 8.1 架构图

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429103442.png)

## 8.2 交换机发布确认

	当生产者消息投递的时候，我们需要知道消息是否正确投放到交换机，因此我们需要一个回调用函数。

**步骤一：开启发布确认模式**

```properties
spring.rabbitmq.publisher-confirm-type=correlated
```

>三种类型

- NONE（默认）：禁用发布确认模式
- CORRELATED：发布消息到交换机后会触发回调方法
- SIMPLE：效果和CORRELATED一样，会触发回调方法。不过在发布消息成功后使用 RabbitTemplate 调用 waitForConfirms 或 waitForConfirmsOrDie 方法等待 broker 节点返回发送结果，根据返回结果来判定下一步的逻辑，要注意的点是 waitForConfirmsOrDie 方法如果返回 false 则会关闭 channel ,则接下来无法发送消息到 broker。

### 配置类

```java
@Configuration  
public class ConfirmConfig {  
  
    // 交换机  
    public static final String CONFIRM_EXCHANGE_NAME = "confirm_exchange";  
    // 队列  
    public static final String CONFIRM_QUEUE_NAME = "confirm_queue";  
    // Routing Key  
    public static final String CONFIRM_ROUTING_KEY = "confirm";  
  
    @Bean  
    public DirectExchange confirmExchange() {  
        return new DirectExchange(CONFIRM_EXCHANGE_NAME);  
    }  
  
    @Bean  
    public Queue confirmQueue() {  
        return new Queue(CONFIRM_QUEUE_NAME);  
    }  
  
    @Bean  
    public Binding queueBinding(Exchange confirmExchange, Queue confirmQueue) {  
        return BindingBuilder.bind(confirmQueue).to(confirmExchange).with(CONFIRM_ROUTING_KEY).noargs();  
    }  
}
```

### 生产者

```java
@Slf4j  
@RestController  
public class ConfirmProducer {  
  
    @Resource  
    private RabbitTemplate rabbitTemplate;  
  
    // 发消息  
    @GetMapping("/confirm/send/{message}")  
    public String sendMsg(@PathVariable String message) {  
        rabbitTemplate.convertAndSend(ConfirmConfig.CONFIRM_EXCHANGE_NAME,  
                ConfirmConfig.CONFIRM_ROUTING_KEY,  
                message,  
                new CorrelationData(UUID.randomUUID().toString()));  
        log.info("发送消息:{}", message);  
        return "发送消息:" + message;  
    }  
}
```

### 消费者

```java
@Slf4j  
@Component  
public class ConfirmConsumer {  
  
    @RabbitListener(  
            queues = ConfirmConfig.CONFIRM_QUEUE_NAME  
    )  
    public void consume(Message message) {  
        log.info("消费消息:{}", new String(message.getBody()));  
    }  
}
```

### 交换机接收到消息后回调函数

```java
@Slf4j  
@Component  
public class MyCallBack implements RabbitTemplate.ConfirmCallback {  
  
    @Resource  
    RabbitTemplate rabbitTemplate;  
  
    @PostConstruct  
    public void init() {  
        rabbitTemplate.setConfirmCallback(this);  
    }  
  
    /**  
     * 交换机确认回调方法  
     * @param correlationData 保存回调消息的 ID 及相关信息  
     * @param ack 交换机是否收到消息  
     * @param cause 失败的原因  
     */  
    @Override  
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {  
        if (ack) {  
            log.info("交换机确认收到消息：{}", correlationData.getId());  
        } else {  
            log.error("交换机还未收到消息：{}, 原因：{}", correlationData.getId(), cause);  
        }  
    }  
}
```

### 测试结果

**发送失败**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429114129.png)

**发送失败**

这里故意朝一个不存在的EXCHANGE发送消息

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429114252.png)

## 8.3 队列消息确认（回退函数）

在仅开启了生产者确认机制的情况下，交换机接收到消息后，会直接给消息生产者发送确认消息，如果发现该消息不可路由，那么消息会被直接丢弃，此时生产者是不知道消息被丢弃这个事件的。

[举个例子]

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429142626.png)

如上图所示，交换机成功接收到了消息，但是我们故意向不存在的队列发送了消息，导致正确队列无法消费，但是实际上消息却没有到正确的队列中。

**那么如何让无法被路由的消息帮我想办法处理一下？**

通过设置 `mandatory` 参数可以在**当消息传递过程中不可达目的地时将消息返回给生产者**。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429143839.png)

### 开启发送失败退回

**配置文件**

```yml
spring:
	rabbitmq:
		# 开启发布确认模式  
		publisher-confirm-type: correlated  
		# 开启消息回退生产者或者通过 rabbitTemplate.setMandatory(true) 设置  
		publisher-returns: true
```

**生产者**

```java
@Slf4j  
@RestController  
public class ConfirmProducer {  
  
    @Resource  
    private RabbitTemplate rabbitTemplate;  
  
    // 发消息  
    @GetMapping("/confirm/send/{message}")  
    public String sendMsg(@PathVariable String message) {  
        rabbitTemplate.convertAndSend(ConfirmConfig.CONFIRM_EXCHANGE_NAME,  
                ConfirmConfig.CONFIRM_ROUTING_KEY + "_TEST",  
                message,  
                new CorrelationData(UUID.randomUUID().toString()));  
        log.info("发送消息:{}", message);  
        return "发送消息:" + message;  
    }  
}
```

**消费者**

```java
@Slf4j  
@Component  
public class ConfirmConsumer {  
  
    @RabbitListener(  
            queues = ConfirmConfig.CONFIRM_QUEUE_NAME  
    )  
    public void consume(Message message) {  
        log.info("消费消息:{}", new String(message.getBody()));  
    }  
}
```

**回调函数**

```java
@Slf4j  
@Component  
public class MyCallBack implements RabbitTemplate.ConfirmCallback, RabbitTemplate.ReturnsCallback {  
  
    @Resource  
    RabbitTemplate rabbitTemplate;  
  
    @PostConstruct  
    public void init() {  
        rabbitTemplate.setConfirmCallback(this);  
        rabbitTemplate.setReturnsCallback(this);  
    }  
  
    /**  
     * 交换机确认回调方法  
     * @param correlationData 保存回调消息的 ID 及相关信息  
     * @param ack 交换机是否收到消息  
     * @param cause 失败的原因  
     */  
    @Override  
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {  
        log.info("交换机ACK结果为：{}，消息为：{}，失败原因为：{}", ack, correlationData.getId(), cause);  
    }  
  
    // 只有在当消息传递过程中不可达目的时将消息返回给生产者  
    @Override  
    public void returnedMessage(ReturnedMessage returnedMessage) {  
        log.error("消息{}，被交换机{}退回，退回原因为：{}，路由：{}",  
                new String(returnedMessage.getMessage().getBody()),  
                returnedMessage.getExchange(),  
                returnedMessage.getReplyText(),  
                returnedMessage.getRoutingKey());  
    }  
}
```

## 8.4 备份交换机

有了 `mandatory` 参数和回退消息，我们获得了对无法投递消息的感知能力，有机会在生产者的消息无法被投递时发现并处理。但有时候，我们并不知道该如何处理这些无法路由的消息，最多打个日志，然后触发报警，再来手动处理。而通过日志来处理这些无法路由的消息是很不优雅的做法，特别是当生产者所在的服务有多台机器的时候，手动复制日志会更加麻烦而且容易出错。而且设置 `mandatory` 参数会增加生产者的复杂性，需要添加处理这些被退回的消息的逻辑。如果既不想丢失消息，又不想增加生产者的复杂性，该怎么做呢？

前面在设置死信队列的文章中，我们提到，可以为队列设置死信交换机来存储那些处理失败的消息，可是这些不可路由消息根本没有机会进入到队列，因此无法使用死信队列来保存消息。在 `RabbitMQ` 中，有一种备份交换机的机制存在，可以很好的应对这个问题。什么是备份交换机呢？

备份交换机可以理解为 `RabbitMQ` 中交换机的“备胎”，当我们为某一个交换机声明一个对应的备份交换机时，就是为它创建一个备胎，当交换机接收到**一条不可路由消息**时，将会把这条消息转发到备份交换机中，由备份交换机来进行转发和处理，通常备份交换机的类型为 `Fanout` ，这样就能把所有消息都投递到与其绑定的队列中，然后我们在备份交换机下绑定一个队列，这样所有那些原交换机无法被路由的消息，就会都进入这个队列了。当然，我们还可以建立一个报警队列，用独立的消费者来进行监测和报警。

### 8.4.1 架构图

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429155839.png)

### 8.4.2 备份交换机编码

**交换机发布确认配置类**

```java
@Configuration  
public class ConfirmConfig {  
  
    // 交换机  
    public static final String CONFIRM_EXCHANGE_NAME = "confirm_exchange";  
    // 队列  
    public static final String CONFIRM_QUEUE_NAME = "confirm_queue";  
    // Routing Key  
    public static final String CONFIRM_ROUTING_KEY = "confirm";  
  
    // 确认交换机  
    @Bean  
    public DirectExchange confirmExchange() {  
        return ExchangeBuilder.directExchange(CONFIRM_EXCHANGE_NAME)  
                .durable(true)  
                // 设置备份交换机  
                .withArgument("alternate-exchange", BackupConfig.BACKUP_EXCHANGE_NAME)  
                .build();  
    }  
  
    // 确认队列  
    @Bean  
    public Queue confirmQueue() {  
        return new Queue(CONFIRM_QUEUE_NAME);  
    }  
  
    // 确认队列绑定  
    @Bean  
    public Binding confirmQueueBinding(Exchange confirmExchange, Queue confirmQueue) {  
        return BindingBuilder.bind(confirmQueue)  
                .to(confirmExchange)  
                .with(CONFIRM_ROUTING_KEY)  
                .noargs();  
    }  
}
```

**备份交换机配置**

```java
@Configuration  
public class BackupConfig {  
  
    // 备份交换机  
    public static final String BACKUP_EXCHANGE_NAME = "backup_exchange";  
    // 备份队列  
    public static final String BACKUP_QUEUE_NAME = "backup_queue";  
  
    // 报警队列  
    public static final String WARNING_QUEUE_NAME = "warning_queue";  
  
    // 备份交换机  
    @Bean  
    public FanoutExchange backupExchange() {  
        return new FanoutExchange(BACKUP_EXCHANGE_NAME);  
    }  
  
    // 备份队列  
    @Bean  
    public Queue backupQueue() {  
        return new Queue(BACKUP_QUEUE_NAME);  
    }  
  
    // 报警队列  
    @Bean  
    public Queue warningQueue() {  
        return new Queue(WARNING_QUEUE_NAME);  
    }  
  
    // 备份队列绑定  
    @Bean  
    public Binding backupQueueBinding(FanoutExchange backupExchange, Queue backupQueue) {  
        return BindingBuilder.bind(backupQueue).to(backupExchange);  
    }  
  
    // 报警队列绑定  
    @Bean  
    public Binding warningQueueBinding(FanoutExchange backupExchange, Queue warningQueue) {  
        return BindingBuilder.bind(warningQueue).to(backupExchange);  
    }  
}
```

**生产者**

```java
@Slf4j  
@RestController  
public class ConfirmProducer {  
  
    @Resource  
    private RabbitTemplate rabbitTemplate;  
  
    // 发消息  
    @GetMapping("/confirm/send/{message}")  
    public String sendMsg(@PathVariable String message) {  
        rabbitTemplate.convertAndSend(ConfirmConfig.CONFIRM_EXCHANGE_NAME,  
		        // 这边故意制造不可路由消息
                ConfirmConfig.CONFIRM_ROUTING_KEY + "_TEST",  
                message,  
                new CorrelationData(UUID.randomUUID().toString()));  
        log.info("发送消息:{}", message);  
        return "发送消息:" + message;  
    }  
}
```

**正常队列消费者**

```java
@Slf4j  
@Component  
public class ConfirmConsumer {  
  
    @RabbitListener(  
            queues = ConfirmConfig.CONFIRM_QUEUE_NAME  
    )  
    public void consume(Message message) {  
        log.info("消费消息:{}", new String(message.getBody()));  
    }  
}
```

**备份队列消费者**

```java
@Slf4j  
@Component  
public class BackupConsumer {  
  
    @RabbitListener(  
        queues = {BackupConfig.BACKUP_QUEUE_NAME}  
    )  
    public void backup(Message message) {  
        log.error("开始进行丢失消息的备份：{}", new String( message.getBody()));  
    }  
}
```

**警告队列消费者**

```java
@Slf4j  
@Component  
public class WarningConsumer {  
  
    @RabbitListener(  
        queues = {BackupConfig.WARNING_QUEUE_NAME}  
    )  
    public void backup(Message message) {  
        log.error("开始进行丢失数据的报警：{}", new String( message.getBody()));  
    }  
}
```

**交换机/队列消息确认回调函数**

```java
@Slf4j  
@Component  
public class MyCallBack implements RabbitTemplate.ConfirmCallback, RabbitTemplate.ReturnsCallback {  
  
    @Resource  
    RabbitTemplate rabbitTemplate;  
  
    @PostConstruct  
    public void init() {  
        rabbitTemplate.setConfirmCallback(this);  
        rabbitTemplate.setReturnsCallback(this);  
    }  
  
    /**  
     * 交换机确认回调方法  
     * @param correlationData 保存回调消息的 ID 及相关信息  
     * @param ack 交换机是否收到消息  
     * @param cause 失败的原因  
     */  
    @Override  
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {  
        log.info("交换机ACK结果为：{}，消息为：{}，失败原因为：{}", ack, correlationData.getId(), cause);  
    }  
  
    // 只有在当消息传递过程中不可达目的时将消息返回给生产者  
    @Override  
    public void returnedMessage(ReturnedMessage returnedMessage) {  
        log.error("消息{}，被交换机{}退回，退回原因为：{}，路由：{}",  
                new String(returnedMessage.getMessage().getBody()),  
                returnedMessage.getExchange(),  
                returnedMessage.getReplyText(),  
                returnedMessage.getRoutingKey());  
    }  
}
```

**测试结果**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429160536.png)

>mandatory 参数与备份交换机可以一起使用的时候，如果两者同时开启，谁优先级高
>
>**经过上面结果显示答案是备份交换机优先级高。**

# 9. RabbitMQ 其他知识点

## 9.1 幂等性

### 9.1.1 概念

用户对于同一操作发起的一次请求或者多次请求的结果是一致的，不会因为多次点击而产生了副作用。举个最简单的例子，那就是支付，用户购买商品后支付，支付扣款成功，但是返回结果的时候网络异常，此时钱已经扣了，用户再次点击按钮，此时会进行第二次扣款，返回结果成功，用户查询余额发现多扣钱了，流水记录也变成了两条。在以前的单应用系统中，我们只需要把数据操作放入事务中即可，发生错误立即回滚，但是再响应客户端的时候也有可能出现网络中断或者异常等等。

### 9.1.2 消息重复消费

消费者在消费MQ中的消息时，MQ已把消息发送给消费者，消费者在给MQ返回ACK时网络中断，故MQ未收到确认信息，该条消息会重新发给其他的消费者，或者在网络重连后再次发送给该消费者，但实际上该消费者已成功消费了该条消息，造成消费者消费了重复的消息。

### 9.1.3 解决思路

MQ消费者的幂等性的解决一般使用全局ID或者写个唯一标识比如时间戳或者UUID 或者订单消费者消费MQ中的消息也可利用MQ的该ID来判断，或者可按自己的规则生成一个全局唯一ID，每次消费消息时用该ID先判断该消息是否已消费过。

在海量订单生成的业务高峰期，生产端有可能就会重复发生了消息，这时候消费端就要实现幂等性，这就意味着我们的消息永远不会被消费多次，即使我们收到了一样的消息。业界主流的幂等性有两种操作：

**1. 唯一ID + 指纹码机制，利用数据库主键去重**

指纹码就是一些规则或者时间戳加别的服务给到的**唯一信息码**，它并不一定是我们系统生成的，基本都是由我们的业务规则拼接而来，但是一定要保证唯一性，然后就利用查询语句进行判断这个id是否存在数据库中，

>优势

实现简单就一个拼接，然后查询判断是否重复；

>劣势

在高并发时，如果是单个数据库就会有写入性能瓶颈当然也可以采用分库分表提升性能，但也不是我们最推荐的方式。

**2. 利用 Redis 的原子性去实现**

利用 `Redis` 执行 `setnx` 命令，天然具有幂等性。从而实现不重复消费

## 9.2 优先级队列

### 9.2.1 定义

在我们系统中有一个**订单催付**的场景，我们的客户在天猫下的订单，淘宝会及时将订单推送给我们，如果在用户设定的时间内未付款那么就会给用户推送一条短信提醒，很简单的一个功能对吧，但是，天猫商家对我们来说，肯定是要分大客户和小客户的对吧，比如像苹果，小米这样大商家一年起码能给我们创造很大的利润，所以理应当然，他们的订单必须得到**优先处理**，而曾经我们的后端系统是使用 Redis 来存放的定时轮询，大家都知道 Redis 只能用 List 做一个简简单单的消息队列，并不能实现一个优先级的场景，所以订单量大了后采用 RabbitMQ 进行改造和优化，如果发现是大客户的订单给一个相对比较高的优先级，否则就是默认优先级。

>普通队列 VS 优先级队列

RabbitMQ 是 FIFO（先进先出）

- **普通队列**

优先级都一样，先入队的消息先消费，后入队的消息后消费。

- **优先级队列**

在进行消费的消息前，会先将消息根据优先级进行排序，优先级越大，越先出队。

### 9.2.2 编码

**测试结果**

1. 先关闭消费者，发送2条消息

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429171217.png)


2. 开启消费者，发现后面优先级高的消息先消费了

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429191857.png)

## 9.3 惰性队列

### 9.3.1 使用场景

RabbitMQ从3.6.0版本开始引入了惰性队列的概念。惰性队列会尽可能的将消息存入磁盘中，而在消费者消费到相应的消息时才会被加载到内存中，它的一个重要的设计目标是能够支持更长的队列，即支持更多的消息存储。当消费者由于各种各样的原因(比如消费者下线、宕机亦或者是由于维护而关闭等)而致使长时间内不能消费消息造成堆积时，惰性队列就很有必要了。

默认情况下，当生产者将消息发送到 RabbitMQ的时候，队列中的消息会尽可能的存储在内存之中，这样可以更加快速的将消息发送给消费者。即使是持久化的消息，在被写入磁盘的同时也会在内存中驻留一份备份。当RabbitMQ需要释放内存的时候，会将内存中的消息换页至磁盘中，这个操作会耗费较长的时间，也会阻塞队列的操作，进而无法接收新的消息。虽然RabbitMQ的开发者们一直在升级相关的算法，但是效果始终不太理想，尤其是在消息量特别大的时候。

### 9.3.2 两种模式

队列具备两种模式: `default` 和 `lazy` 。默认为 `default` 模式，在3.6.0之前的版本无需做任何变更。`lazy` 模式即为惰性队列的模式，可以通过调用 `channel.queueDeclare` 方法的时候在参数中设置，也可以通过 `Policy` 的方式设置，如果一个队列同时使用这两种方式设置的话，那么 `Policy` 的方式具备更高的优先级。 如果要通过声明的方式改变已有队列的模式的话，那么只能先删除队列，然后再重新声明一个新的。

在队列声明的时候可以通过 `x-queue-mode `参数来设置队列的模式，取值为 `default` 和 `lazy` 。下面示例中演示了一个惰性队列的声明细节：

```java
Map<String, Object> args = new HashMap<String, Object>();
args.put("x-queue-mode", "lazy");
channel.queueDeclare("queue", false, false, false, args);
```

### 9.3.3 内存开销对比

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429193821.png)

在发送1百万条消息，每条消息大概占1KB的情况下，普通队列占用内存是1.2GB，而惰性队列仅仅占用15MB

# 10. RabbitMQ 标准集群搭建

略

# 11. RabbitMQ 镜像集群搭建

在标准集群模式下，一旦创建队列的主机宕机，队列就会不可用。不具备高可用能力。如果要解决这个问题，**必须使用镜像集群方案**。

镜像模式下，创建队列的节点被称为该队列的**主节点**，队列还会拷贝到集群中的其它节点，也叫做该队列的镜像节点。

队列的所有操作都在**主节点**上完成，**镜像节点**仅仅起到**备份数据作用**。如果是从节点接收到操作请求，也会路由到主节点去完成。
当主节点接收到消费者的ACK时，所有镜像都会删除节点中的数据。

**镜像集群模式是对队列的一种主从复制操作，需要通过一定规则对指定的队列实现主从同步操作。**

**镜像模式的配置有3种模式：**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230429195857.png)

>Docker 安装参考：https://blog.csdn.net/zhuocailing3390/article/details/122510135

# 6. MQ的应用场景

## 6.1 异步处理

场景说明：用户注册后，需要发注册邮件和注册短信，传统的做法有两种：1.串行的方式 2.并行的方式

**串行方式：**

将注册信息写入数据库后，发送注册邮件，再发送注册短信，以上三个任务全部完成后才返回给客户端。 这有一个问题是，邮件，短信并不是必须的，它只是一个通知，而这种做法让客户端等待没有必要等待的东西。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427011514.png)

**并行方式：**

将注册信息写入数据库后，发送邮件的同时，发送短信，以上三个任务完成后,返回给客户端，并行的方式能提高处理的时间。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427011559.png)  

**消息队列：**

假设三个业务节点分别使用50ms，串行方式使用时间150ms，并行使用时间100ms。虽然并行已经提高的处理时间，但是，前面说过，邮件和短信对我正常的使用网站没有任何影响，客户端没有必要等着其发送完成才显示注册成功,应该是写入数据库后就返回。引入消息队列后，把发送邮件，短信不是必须的业务逻辑异步处理。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427011720.png)  

由此可以看出,引入消息队列后，用户的响应时间就等于写入数据库的时间+写入消息队列的时间(可以忽略不计)，引入消息队列后处理后，响应时间是串行的3倍，是并行的2倍。

## 6.2 应用解耦

场景：双11是购物狂节，用户下单后，订单系统需要通知库存系统，传统的做法就是订单系统调用库存系统的接口。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427011936.png)

这种做法有一个缺点：

当库存系统出现故障时，订单就会失败。订单系统和库存系统高耦合。

**引入消息队列**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427012025.png)

- `订单系统`：用户下单后，订单系统完成持久化处理，将消息写入消息队列，返回用户订单下单成功。

- `库存系统`：订阅下单的消息，获取下单消息，进行库操作。就算库存系统出现故障，消息队列也能保证消息的可靠投递，不会导致消息丢失。

## 6.3 流量削峰

**场景：**

秒杀活动，一般会因为流量过大，导致应用挂掉，为了解决这个问题，一般在应用前端加入消息队列。

**作用:**

1. 可以控制活动人数，超过此一定阀值的订单直接丢弃
2. 可以缓解短时间的高流量压垮应用(应用程序按自己的最大处理能力获取订单)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427012315.png)  

1. 用户的请求，服务器收到之后，首先写入消息队列，加入消息队列长度超过最大值，则直接抛弃用户请求或跳转到错误页面。
2. 秒杀业务根据消息队列中的请求信息，再做后续处理。

# 7. RabbitMQ的集群

## 7.1 集群架构

  

### 7.1.1 普通集群(副本集群)

  

> All data/state required for the operation of a RabbitMQ broker is replicated across all nodes. An exception to this are message queues, which by default reside on one node, though they are visible and reachable from all nodes. To replicate queues across nodes in a cluster --摘自官网

  

`默认情况下:RabbitMQ代理操作所需的所有数据/状态都将跨所有节点复制。这方面的一个例外是消息队列，默认情况下，消息队列位于一个节点上，尽管它们可以从所有节点看到和访问`

  

1. #### 架构图

  

![image-20200320094147471](RibbitMQ 实战教程.assets/image-20200320094147471.png)

  

​ 核心解决问题: `当集群中某一时刻master节点宕机,可以对Quene中信息,进行备份`

  

2. #### 集群搭建

  

```markdown

# 0.集群规划

node1: 10.15.0.3 mq1 master 主节点

node2: 10.15.0.4 mq2 repl1 副本节点

node3: 10.15.0.5 mq3 repl2 副本节点

# 1.克隆三台机器主机名和ip映射

vim /etc/hosts加入:

10.15.0.3 mq1

10.15.0.4 mq2

10.15.0.5 mq3

node1: vim /etc/hostname 加入: mq1

node2: vim /etc/hostname 加入: mq2

node3: vim /etc/hostname 加入: mq3

# 2.三个机器安装rabbitmq,并同步cookie文件,在node1上执行:

scp /var/lib/rabbitmq/.erlang.cookie root@mq2:/var/lib/rabbitmq/

scp /var/lib/rabbitmq/.erlang.cookie root@mq3:/var/lib/rabbitmq/

# 3.查看cookie是否一致:

node1: cat /var/lib/rabbitmq/.erlang.cookie

node2: cat /var/lib/rabbitmq/.erlang.cookie

node3: cat /var/lib/rabbitmq/.erlang.cookie

# 4.后台启动rabbitmq所有节点执行如下命令,启动成功访问管理界面:

rabbitmq-server -detached

# 5.在node2和node3执行加入集群命令:

1.关闭 rabbitmqctl stop_app

2.加入集群 rabbitmqctl join_cluster rabbit@mq1

3.启动服务 rabbitmqctl start_app

# 6.查看集群状态,任意节点执行:

rabbitmqctl cluster_status

# 7.如果出现如下显示,集群搭建成功:

Cluster status of node rabbit@mq3 ...

[{nodes,[{disc,[rabbit@mq1,rabbit@mq2,rabbit@mq3]}]},

{running_nodes,[rabbit@mq1,rabbit@mq2,rabbit@mq3]},

{cluster_name,<<"rabbit@mq1">>},

{partitions,[]},

{alarms,[{rabbit@mq1,[]},{rabbit@mq2,[]},{rabbit@mq3,[]}]}]

# 8.登录管理界面,展示如下状态:

```

  

![image-20200320095613586](RibbitMQ 实战教程.assets/image-20200320095613586.png)

  

```markdown

# 9.测试集群在node1上,创建队列

```

  

![image-20200320095743935](RibbitMQ 实战教程.assets/image-20200320095743935.png)

  

```markdown

# 10.查看node2和node3节点:

```

  

![image-20200320095827688](RibbitMQ 实战教程.assets/image-20200320095827688.png)

  

![image-20200320095843370](RibbitMQ 实战教程.assets/image-20200320095843370.png)

  

```markdown

# 11.关闭node1节点,执行如下命令,查看node2和node3:

rabbitmqctl stop_app

```

  

![image-20200320100000347](RibbitMQ 实战教程.assets/image-20200320100000347.png)

  

![image-20200320100010968](RibbitMQ 实战教程.assets/image-20200320100010968.png)

  

---

  

### 7.1.2 镜像集群

  

> This guide covers mirroring (queue contents replication) of classic queues --摘自官网

>

> By default, contents of a queue within a RabbitMQ cluster are located on a single node (the node on which the queue was declared). This is in contrast to exchanges and bindings, which can always be considered to be on all nodes. Queues can optionally be made *mirrored* across multiple nodes. --摘自官网

  

`镜像队列机制就是将队列在三个节点之间设置主从关系，消息会在三个节点之间进行自动同步，且如果其中一个节点不可用，并不会导致消息丢失或服务不可用的情况，提升MQ集群的整体高可用性。`

  
  
  

1. #### 集群架构图

  

![image-20200320113423235](RibbitMQ 实战教程.assets/image-20200320113423235.png)

  

  

2. #### 配置集群架构

  

```markdown

# 0.策略说明

rabbitmqctl set_policy [-p <vhost>] [--priority <priority>] [--apply-to <apply-to>] <name> <pattern> <definition>

-p Vhost： 可选参数，针对指定vhost下的queue进行设置

Name: policy的名称

Pattern: queue的匹配模式(正则表达式)

Definition：镜像定义，包括三个部分ha-mode, ha-params, ha-sync-mode

ha-mode:指明镜像队列的模式，有效值为 all/exactly/nodes

all：表示在集群中所有的节点上进行镜像

exactly：表示在指定个数的节点上进行镜像，节点的个数由ha-params指定

nodes：表示在指定的节点上进行镜像，节点名称通过ha-params指定

ha-params：ha-mode模式需要用到的参数

ha-sync-mode：进行队列中消息的同步方式，有效值为automatic和manual

priority：可选参数，policy的优先级

# 1.查看当前策略

rabbitmqctl list_policies

# 2.添加策略

rabbitmqctl set_policy ha-all '^hello' '{"ha-mode":"all","ha-sync-mode":"automatic"}'

说明:策略正则表达式为 “^” 表示所有匹配所有队列名称 ^hello:匹配hello开头队列

# 3.删除策略

rabbitmqctl clear_policy ha-all

# 4.测试集群

```

# 8. 实战（订单库存交互）

^2f5b47

本实战包含1个生产者（订单系统生产消息）、3个消费者（消费者1需要10s才能消费完，消费者2正常消费，消费者3抛出异常）

## 8.1 生产者

```java
@Autowired  
RabbitTemplate rabbitTemplate;  
  
@RequestMapping("")  
public void genOrder() {  
    List<String> items = getItems();  
    rabbitTemplate.convertAndSend("shopping", "order", items.toString());  
}  
  
private List<String> getItems() {  
    return Arrays.asList("螺蛳粉", "无糖可乐", "大老板海苔");  
}
```

## 8.2 消费者

### 消费者1（需要10s才能处理完）

```java
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue(value = "reduce_inventory_1", durable = "true", autoDelete = "true"),  
                exchange = @Exchange(value = "shopping", type = "direct"),  
                key = {"order"}  
        )  
    },  
    // 手动ACK  
    ackMode = "MANUAL",  
    // 错误处理类，用于消息消费异常时，进行处理
    errorHandler = "inventoryErrorHandler"  
)  
// deliveryTag: 相当于消息的唯一标识，用于 mq 辨别是哪个消息被 ack/nak 了  
// channel: mq 和 consumer 之间的管道，通过它来 ack/nak
public void reduceInventory(String message, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag, Channel channel) throws IOException, InterruptedException {  
    log.info("[消费者1]：{}", message);  
    TimeUnit.SECONDS.sleep(10);  
    // 参数2：是否需要给其他消费者重复消费  
    channel.basicAck(deliveryTag, false);  
    log.info("[消费者1]：消费完成");  
}
```

### 消费者2（火速处理完）

```java
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue(value = "reduce_inventory_2", durable = "true", autoDelete = "true"),  
                exchange = @Exchange(value = "shopping", type = "direct"),  
                key = {"order"}  
        )  
},  
        // 手动ACK  
        ackMode = "MANUAL",  
        // 错误处理类，用于消息消费异常时，进行处理
        errorHandler = "inventoryErrorHandler"  
)  
public void reduceInventory2(String message, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag, Channel channel) throws IOException {  
    log.info("[消费者2]：{}", message);  
    // 参数2：是否需要给其他消费者重复消费  
    channel.basicAck(deliveryTag, false);  
    log.info("[消费者2]：消费完成");  
}
```

### 消费者3（抛出异常）

```java
@RabbitListener(bindings = {  
        @QueueBinding(  
                value = @Queue(value = "reduce_inventory_3", durable = "true", autoDelete = "true"),  
                exchange = @Exchange(value = "shopping", type = "direct"),  
                key = {"order"}  
        )  
},  
        // 手动ACK  
        ackMode = "MANUAL",  
        // 错误处理类，用于消息消费异常时，进行处理
        errorHandler = "inventoryErrorHandler"  
)  
public void reduceInventory3(String message, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag, Channel channel) throws IOException {  
    log.info("[消费者3]：{}", message);  
    throw new RuntimeException("消费失败！");  
}
```

## 8.3 错误处理类

```java
@Slf4j  
@Component  
public class InventoryErrorHandler implements RabbitListenerErrorHandler {  
  
    @Override  
    public Object handleError(Message amqpMessage, org.springframework.messaging.Message<?> message1, ListenerExecutionFailedException e) throws Exception {  
        log.error("库存队列抛出异常");  
        log.error("[消息信息]deliveryTag：{}，body：{}", amqpMessage.getMessageProperties().getDeliveryTag(), new String(amqpMessage.getBody()));  
        log.error("[异常信息]", e);  
        message1.getHeaders().get(AmqpHeaders.CHANNEL, Channel.class)  
                // 这里requeue设置为false，不重新入队，避免消息一直消费并且抛出异常，导致死循环。  
                .basicReject(message1.getHeaders().get(AmqpHeaders.DELIVERY_TAG, Long.class), false);  
        return null;  
    }  
}
```

## 8.4 测试结果

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427115928.png)

发现消费者3，抛出异常后，被错误处理类进行处理，另外由于采用了手动ACK，能够实现消费者2（处理任务快）多消费，消费者1（处理任务较久）少消费

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230427120336.png)