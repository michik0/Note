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
import org.slf4j.MDC;

public class TraceInterceptor extends HandlerInterceptorAdapter {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // "traceId"
        MDC.put(Constants.LOG_TRACE_ID, TraceLogUtils.getTraceId());
        return true;
    }
}
```

2. 然后在日志配置xml文件中添加traceId打印：

```xml
<property name="normal-pattern" value="[%p][%d{yyyy-MM-dd'T'HH:mm:ss.SSSZ,Asia/Shanghai}][%X{traceid}][%15.15t][%c:%L] %msg%n"/>
```

**但是仅仅这样的改造在实际使用过程中会遇到以下问题：**

- 线程池中的线程会打印错误的traceId
- 调用下游服务后会生成新的traceId，无法继续跟踪

# 支持线程池跟踪

MDC使用的 `InheritableThreadLocal` 只是在线程被创建时继承，但是线程池中的线程是复用的，后续请求使用已有的线程将打印出之前请求的traceId。这时候就需要对线程池进行一定的包装，在线程在执行时读取之前保存的MDC内容。不仅自身业务会用到线程池，spring项目也使用到了很多线程池，比如@Async异步调用，zookeeper线程池、kafka线程池等。不管是哪种线程池都大都支持传入指定的线程池实现，拿@Async举例：

```java
@Bean("SpExecutor")
public Executor getAsyncExecutor() {
    // 对线程池进行包装，使之支持traceId透传
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor() {
        @Override
        public <T> Future<T> submit(Callable<T> task) {
	        // 传入线程池之前先复制当前线程的MDC
            return super.submit(ThreadMdcUtil.wrap(task, MDC.getCopyOfContextMap()));
        }
        @Override
        public void execute(Runnable task) {
            super.execute(ThreadMdcUtil.wrap(task, MDC.getCopyOfContextMap()));
        }
    };
    executor.setCorePoolSize(config.getPoolCoreSize());
    ... // 其他配置
    executor.initialize();
    return executor;
}

public static <T> Callable<T> wrap(final Callable<T> callable, final Map<String, String> context) {
    return new Callable<T>() {
        @Override
        public T call() throws Exception {
	        // 实际执行前导入对应请求的MDC副本
            if (context == null) {
                MDC.clear();
            } else {
                MDC.setContextMap(context);
            }
	        if (MDC.get(Constants.LOG_TRACE_ID) == null) {
	            MDC.put(Constants.LOG_TRACE_ID, TraceLogUtils.getTraceId());
	        }
            try {
                return callable.call();
            } finally {
                MDC.clear();
            }
        }
    };
}
```

ThreadPoolExecutor的包装也类似，注意为了严谨考虑，需要对连接池中的所有调用方法进行封装。

**在ThreadPoolExecutor中有：**

```java
public void execute(Runnable command)
public <T> Future<T> submit(Callable<T> task)
public Future<?> submit(Runnable task)
public <T> Future<T> submit(Runnable task, T result)
```

**在ThreadPoolTaskExecutor中有：**

```java
public void execute(Runnable command)
public void execute(Runnable task, long startTimeout)
public Future<?> submit(Runnable task)
public <T> Future<T> submit(Runnable task, T result)
public <T> ListenableFuture<T> submitListenable(Callable<T> task)
public ListenableFuture<?> submitListenable(Runnable task)
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