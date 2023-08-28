最近在项目开发中遇到了一些问题，项目为多机部署，使用kibana收集日志，但并发大时使用日志定位比较麻烦，大量日志输出导致很难筛出指定请求的全部相关日志，以及下游服务调用对应的日志。因此计划对项目日志打印进行一些小改造，使用一个traceId跟踪请求的全部路径，前提是不修改原有的打印方式。

# 简单的解决思路

想要跟踪请求，第一个想到的就是当请求来时生成一个traceId放在ThreadLocal里，然后打印时去取就行了。但在不改动原有输出语句的前提下自然需要日志框架的支持了，搜索的一番发现主流日志框架都提供了MDC功能。

# MDC 介绍

MDC（Mapped Diagnostic Context，映射调试上下文）是 log4j 和 logback 提供的一种方便在多线程条件下记录日志的功能。MDC 可以看成是一个与当前线程绑定的Map，可以往其中添加键值对。MDC 中包含的内容可以被同一线程中执行的代码所访问。当前线程的子线程会继承其父线程中的 MDC 的内容。当需要记录日志时，只需要从 MDC 中获取所需的信息即可。MDC 的内容则由程序在适当的时候保存进去。对于一个 Web 应用来说，通常是在请求被处理的最开始保存这些数据。

简而言之，MDC就是日志框架提供的一个 `InheritableThreadLocal` ，项目代码中可以将键值对放入其中，然后使用指定方式取出打印即可。

# 初步实现

1. 首先创建拦截器，加入拦截列表中，在请求到达时生成traceId。当然你还可以根据需求在此处后或后续流程中放入spanId、订单流水号等需要打印的信息。

```java
public class Constants {

    /**
     * 日志跟踪id名。
     */
    public static final String LOG_TRACE_ID = "traceid";

    /**
     * 请求头跟踪id名。
     */
    public static final String HTTP_HEADER_TRACE_ID = "app_trace_id";
}

```

```java
@Slf4j  
@Component  
public class TraceInterceptor implements HandlerInterceptor {  
	@Override  
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
	String uuid = UUID.randomUUID().toString();  
	log.info("记录请求 uuid -> {}", uuid);  
	MDC.put(Constants.LOG_TRACE_ID, uuid);  
	return true;  
	}  
}
```

2. 然后在日志配置xml文件中添加traceId打印：

```xml
<pattern>[%X{trace_id}]-%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{30} - %msg%n</pattern>
```

**但是仅仅这样的改造在实际使用过程中会遇到以下问题：**

- 线程池中的线程会打印错误的traceId
- 调用下游服务后会生成新的traceId，无法继续跟踪

# 支持线程池跟踪

在线程在执行时读取之前保存的MDC内容。不仅自身业务会用到线程池，spring项目也使用到了很多线程池，比如@Async异步调用，zookeeper线程池、kafka线程池等。不管是哪种线程池都大都支持传入指定的线程池实现，拿@Async举例：

## Executor

```java
@EnableAsync  
@Configuration  
public class ThreadPoolConfig {  
	  
	@Bean("commonExecutor")  
	public Executor getAsyncExecutor() {  
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();  
		// 装饰器：在执行任务前进行TRACE_ID设置
		executor.setTaskDecorator(new MdcDecorator());  
		//设置核心线程数  
		executor.setCorePoolSize(5);  
		//设置最大线程数  
		executor.setMaxPoolSize(5);  
		//除核心线程外的线程存活时间  
		executor.setKeepAliveSeconds(60);  
		//如果传入值大于0，底层队列使用的是LinkedBlockingQueue,否则默认使用SynchronousQueue  
		executor.setQueueCapacity(1);  
		//线程名称前缀  
		executor.setThreadNamePrefix("global-thread-");  
		//设置拒绝策略  
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());  
		return executor;  
	}  
}
```

## MdcDecorator

```java
@Slf4j  
public class MdcDecorator implements TaskDecorator {  
	@Override  
	public Runnable decorate(Runnable runnable) {  
		// 当前请求ThreadLocalMap  
		Map<String, String> contextMap = MDC.getCopyOfContextMap();  
		return () -> {  
			try {  
				if (contextMap != null) {  
				// 将当前ThreadLocalMap，复制给线程池中的线程  
				MDC.setContextMap(contextMap);  
				}  
				if (MDC.get(Constants.LOG_TRACE_ID) == null) {  
				MDC.put(Constants.LOG_TRACE_ID, new String(new byte[1024*1024*5]));  
				}  
				runnable.run();  
				}  
			finally {  
				// 【注意】清除 ThreadLocal 中的数据，避免内存泄漏  
				MDC.clear();  
			}  
		};  
	}  
}
```

## 性能分析

编写测试类进行测试，测试结果发现如果有清除 MDC 中的数据，JVM堆占用将会少100多M

```java
@RequestMapping("/test")  
public void testMDCPool() throws InterruptedException {  
	for (int i = 0; i < 100; i++) {  
		log.info("接到请求");  
		asyncService.test1();  
		asyncService.test2();  
		Thread.sleep(500);  
	}  
}

@Async("commonExecutor")  
public void test1() throws InterruptedException {  
	Thread.sleep(1000);  
	log.info("async[test1]");  
}  
  
@Async("commonExecutor")  
public void test2() throws InterruptedException {  
	Thread.sleep(1000);  
	log.info("async[test2]");  
}
```

# 下游服务使用相同 traceId

以上方式在多级服务调用中每个服务都会生成新的traceId，导致无法衔接跟踪。这时就需要对http调用工具进行相应的改造了，在发送http请求时自动将traceId添加到header中，以RestTemplate为例，注册拦截器：

```java
// 以下省略其他相关配置
RestTemplate restTemplate = new RestTemplate();
// 使用拦截器包装http header
restTemplate.setInterceptors(new ArrayList<ClientHttpRequestInterceptor>() {
    {
        add((request, body, execution) -> {
            String traceId = MDC.get(Constants.LOG_TRACE_ID);
            if (StringUtils.isNotEmpty(traceId)) {
                request.getHeaders().add(Constants.HTTP_HEADER_TRACE_ID, traceId);
            }
            return execution.execute(request, body);
        });
    }
});

HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
// 注意此处需开启缓存，否则会报getBodyInternal方法“getBody not supported”错误
factory.setBufferRequestBody(true);
restTemplate.setRequestFactory(factory);
```

下游服务的拦截器改为：

```java
public class TraceInterceptor extends HandlerInterceptorAdapter {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String traceId = request.getHeader(Constants.HTTP_HEADER_TRACE_ID);
        if (StringUtils.isEmpty(traceId)) {
            traceId = TraceLogUtils.getTraceId();
        }
        MDC.put(Constants.LOG_TRACE_ID, traceId);
        return true;
    }
}
```

若使用自定义的http客户端，则直接修改其工具类即可。

针对其他协议的调用暂无实践经验，可以借鉴上面的思路，通过拦截器插入特定字段，再在下游读取指定字段加入MDC中。