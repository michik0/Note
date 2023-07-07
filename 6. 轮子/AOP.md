# 实操一： AOP 记录接口访问日志

第一步，在 Spring Boot 项目的 pom.xml 文件中添加 `spring-boot-starter-aop` 依赖。

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

第二步，添加日志信息封装类 WebLog，用于记录什么样的操作、操作的人是谁、开始时间、花费的时间、操作的路径、操作的方法名、操作主机的 IP、请求参数、返回结果等。

```
/**
 * Controller层的日志封装类
 * Created by macro on 2018/4/26.
 */
public class WebLog {
    private String description;
    private String username;
    private Long startTime;
    private Integer spendTime;
    private String basePath;
    private String uri;
    private String url;
    private String method;
    private String ip;
    private Object parameter;
    private Object result;
    //省略了getter,setter方法
}
```

第三步，添加统一日志处理切面 WebLogAspect。

```
/**
 * 统一日志处理切面
 * Created by 石磊
 */
@Aspect
@Component
@Order(1)
public class WebLogAspect {
    private static final Logger LOGGER = LoggerFactory.getLogger(WebLogAspect.class);

    @Pointcut("execution(public * com.codingmore.controller.*.*(..))")
    public void webLog() {
    }

    @Before("webLog()")
    public void doBefore(JoinPoint joinPoint) throws Throwable {
    }

    @AfterReturning(value = "webLog()", returning = "ret")
    public void doAfterReturning(Object ret) throws Throwable {
    }

    @Around("webLog()")
    public Object doAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        //获取当前请求对象
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes.getRequest();
        //记录请求信息(通过Logstash传入Elasticsearch)
        WebLog webLog = new WebLog();
        Object result = joinPoint.proceed();
        Signature signature = joinPoint.getSignature();
        MethodSignature methodSignature = (MethodSignature) signature;
        Method method = methodSignature.getMethod();
        if (method.isAnnotationPresent(ApiOperation.class)) {
            ApiOperation log = method.getAnnotation(ApiOperation.class);
            webLog.setDescription(log.value());
        }
        long endTime = System.currentTimeMillis();
        String urlStr = request.getRequestURL().toString();
        webLog.setBasePath(StrUtil.removeSuffix(urlStr, URLUtil.url(urlStr).getPath()));
        webLog.setIp(request.getRemoteUser());
        Map<String,Object> logMap = new HashMap<>();
        logMap.put("spendTime",webLog.getSpendTime());
        logMap.put("description",webLog.getDescription());
        LOGGER.info("{}", JSONUtil.parse(webLog));
        return result;
    }
}
```

# 实操二：Spring实现多数据源切换

## 总体流程

**图描述**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230607235722.png)

**详细文字描述**

1. 我们在想要使用其它数据源的方法或者类上加上@DataSource注解并给对设置注解中value为数据源的名称。

2. 执行该方法时加有该注解的方法或类就会被DataSourceAspect切面类拦截到，在这个AOP切面类中会拿到@DataSource中的value值，这个值就是我们想要切换的数据源的名称。

3. 拿到这个值之后我们就将这个值存入到DynamicDataSourceContextHolder中的静态变量ThreadLocal中（这部分涉及到ThreadLocal的知识）。

4. mybatis去执SQL会去调AbstractRoutingDataSource中的getConnection( )方法，该方法中首先会获取要调用的数据源，我们自定义的DynamicDataSource类在此时就会被调用。

5. DynamicDataSource类中有重写的AbstractRoutingDataSource类中的方法所以能决定调用哪个数据源的规则，DynamicDataSource类回去调用当时切面放入DynamicDataSourceContextHolder中数据源的名称。

6. 到此mybatis终于拿到要调用的数据源并获取到连接，可以进行SQL操作。

## 代码实现

**1. Druid配置类**

```java
@Configuration
public class DruidConfig
{
	// 创建主数据源
    @Bean
    @ConfigurationProperties("spring.datasource.druid.master")
    public DataSource masterDataSource(DruidProperties druidProperties)
    {
        DruidDataSource dataSource = DruidDataSourceBuilder.create().build();
        return druidProperties.dataSource(dataSource);
    }

	// 创建第二个数据源
    @Bean
    @ConfigurationProperties("spring.datasource.druid.slave")
    @ConditionalOnProperty(prefix = "spring.datasource.druid.slave", name = "enabled", havingValue = "true")
    public DataSource slaveDataSource(DruidProperties druidProperties)
    {
        DruidDataSource dataSource = DruidDataSourceBuilder.create().build();
        return druidProperties.dataSource(dataSource);
    }

	// 配置动态数据源
    @Bean(name = "dynamicDataSource")
    @Primary
    public DynamicDataSource dataSource(DataSource masterDataSource)
    {
        Map<Object, Object> targetDataSources = new HashMap<>();
        
        // 设置数据源映射
        targetDataSources.put(DataSourceType.MASTER.name(), masterDataSource);
        setDataSource(targetDataSources, DataSourceType.SLAVE.name(), "slaveDataSource");
        
        return new DynamicDataSource(masterDataSource, targetDataSources);
    }
 
    /**
     * 设置数据源
     * 
     * @param targetDataSources 备选数据源集合
     * @param sourceName 数据源名称
     * @param beanName bean名称
     */
    public void setDataSource(Map<Object, Object> targetDataSources, String sourceName, String beanName)
    {
        try
        {
            DataSource dataSource = SpringUtils.getBean(beanName);
            targetDataSources.put(sourceName, dataSource);
        }
        catch (Exception e)
        {
        }
    }
}
```

```yml
druid:
	# 主库数据源
	master:
		url: jdbc:mysql://192.168.5.132:3306/ccd?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
		username: root
		password: abc123.
	# 从库数据源
	slave:
		# 从数据源开关/默认关闭
		enabled: true
		jdbc:mysql://192.168.5.215:3306/aaaad?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
		username: root
		password: 123456.
```

**2. 切面相关类**

枚举DataSourceType

```java
public enum DataSourceType
{
    /**
     * 主库
     */
    MASTER,
 
    /**
     * 从库
     */
    SLAVE
}
```

注解DataSource

```java
/**
 * 自定义多数据源切换注解
 *
 * 优先级：先方法，后类，如果方法覆盖了类上的数据源类型，以方法的为准，否则以类上的为准
 *
 */
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface DataSource
{
    /**
     * 切换数据源名称
     */
    public DataSourceType value() default DataSourceType.MASTER;
}
```

切面DataSourceAspect

```java
/**
 * 多数据源处理
 * 
 * @author ruoyi
 */
@Aspect
@Order(1)
@Component
public class DataSourceAspect
{
    protected Logger logger = LoggerFactory.getLogger(getClass());
 
    @Pointcut("@annotation(com.ruoyi.common.annotation.DataSource)"
            + "|| @within(com.ruoyi.common.annotation.DataSource)")
    public void dsPointCut()
    {
 
    }
 
    @Around("dsPointCut()")
    public Object around(ProceedingJoinPoint point) throws Throwable
    {
	    // 获取注解上的数据源
        DataSource dataSource = getDataSource(point);
 
        if (StringUtils.isNotNull(dataSource))
        {
            DynamicDataSourceContextHolder.setDataSourceType(dataSource.value().name());
        }
 
        try
        {
	        // 执行方法
            return point.proceed();
        }
        finally
        {
            // 销毁数据源 在执行方法之后
            DynamicDataSourceContextHolder.clearDataSourceType();
        }
    }
 
    /**
     * 获取需要切换的数据源
     */
    public DataSource getDataSource(ProceedingJoinPoint point)
    {
        MethodSignature signature = (MethodSignature) point.getSignature();
        DataSource dataSource = AnnotationUtils.findAnnotation(signature.getMethod(), DataSource.class);
        if (Objects.nonNull(dataSource))
        {
            return dataSource;
        }
 
        return AnnotationUtils.findAnnotation(signature.getDeclaringType(), DataSource.class);
    }
}
```

数据源切换处理DynamicDataSourceContextHolder

```java
/**
 * 数据源切换处理
 * 
 */
public class DynamicDataSourceContextHolder
{
    public static final Logger log = LoggerFactory.getLogger(DynamicDataSourceContextHolder.class);
 
    /**
     * 使用ThreadLocal维护变量，ThreadLocal为每个使用该变量的线程提供独立的变量副本，
     *  所以每一个线程都可以独立地改变自己的副本，而不会影响其它线程所对应的副本。
     */
    private static final ThreadLocal<String> CONTEXT_HOLDER = new ThreadLocal<>();
 
    /**
     * 设置数据源的变量
     */
    public static void setDataSourceType(String dsType)
    {
        log.info("切换到{}数据源", dsType);
        CONTEXT_HOLDER.set(dsType);
    }
 
    /**
     * 获得数据源的变量
     */
    public static String getDataSourceType()
    {
        return CONTEXT_HOLDER.get();
    }
 
    /**
     * 清空数据源变量
     */
    public static void clearDataSourceType()
    {
        CONTEXT_HOLDER.remove();
    }
}
```

**3. 数据源切换自定义类**

```java
/**
 * 动态数据源
 * 
 */
public class DynamicDataSource extends AbstractRoutingDataSource
{
    public DynamicDataSource(DataSource defaultTargetDataSource, Map<Object, Object> targetDataSources)
    {
        super.setDefaultTargetDataSource(defaultTargetDataSource);
        super.setTargetDataSources(targetDataSources);
        super.afterPropertiesSet();
    }
 
    @Override
    protected Object determineCurrentLookupKey()
    {
        return DynamicDataSourceContextHolder.getDataSourceType();
    }
}
```

