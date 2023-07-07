# 作用

用于数据源的切换

# SpringBoot切换数据源

### 步骤

1. 分别设置所有数据源

```java
// 设置主数据源
@Bean
@ConfigurationProperties("spring.datasource.druid.master")
public DataSource masterDataSource(DruidProperties druidProperties)
{
    DruidDataSource dataSource = DruidDataSourceBuilder.create().build();
    return druidProperties.dataSource(dataSource);
}

// 设置从数据源
@Bean
@ConfigurationProperties("spring.datasource.druid.slave")
@ConditionalOnProperty(prefix = "spring.datasource.druid.slave", name = "enabled", havingValue = "true")
public DataSource slaveDataSource(DruidProperties druidProperties)
{
    DruidDataSource dataSource = DruidDataSourceBuilder.create().build();
    return druidProperties.dataSource(dataSource);
}
```

2. 设置总的动态数据源
   1. 创建动态数据源类
      1. 创建`AbstractRoutingDataSource`子类
      2. 重写`determineCurrentLookupKey`方法，返回结果为数据源名称（动态数据源中存放的名称）

```java
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
        // 在进行数据库连接时，会调用该方法，并且根据key获取数据库实例
        return DynamicDataSourceContextHolder.getDataSourceType();
    }
}
```

1. 设置动态数据源

```java
@Bean
@ConfigurationProperties("spring.datasource.druid.slave")
@ConditionalOnProperty(prefix = "spring.datasource.druid.slave", name = "enabled", havingValue = "true")
public DataSource slaveDataSource(DruidProperties druidProperties)
{
    DruidDataSource dataSource = DruidDataSourceBuilder.create().build();
    return druidProperties.dataSource(dataSource);
}

@Bean(name = "dynamicDataSource")
@Primary
public DynamicDataSource dataSource(DataSource masterDataSource)
{
    Map<Object, Object> targetDataSources = new HashMap<>();
    // 设置主数据源
    targetDataSources.put(DataSourceType.MASTER.name(), masterDataSource);
    // 设置从数据源
    setDataSource(targetDataSources, DataSourceType.SLAVE.name(), "slaveDataSource");
	// 创建动态数据源，里面包含了默认数据源以及所有数据源
	// 这里默认是masterDataSource数据源，所有的数据源存放在targetDataSources中
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
```

1. Mybatis配置数据源为动态数据源

```java
@Bean
// 先按DataSource类型进行注入，若发现多个DataSource，则按名称注入
// 这边IOC容器中共有dataSource（多数据源）、masterDataSource、slaveDatasource三个DataSource类型的实例，但是由于参数名为dataSource，所以注入dataSource实例
public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception
{
    String typeAliasesPackage = env.getProperty("mybatis.typeAliasesPackage");
    String mapperLocations = env.getProperty("mybatis.mapperLocations");
    String configLocation = env.getProperty("mybatis.configLocation");
    typeAliasesPackage = setTypeAliasesPackage(typeAliasesPackage);
    VFS.addImplClass(SpringBootVFS.class);

    final SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
    sessionFactory.setDataSource(dataSource);
    sessionFactory.setTypeAliasesPackage(typeAliasesPackage);
    sessionFactory.setMapperLocations(resolveMapperLocations(StringUtils.split(mapperLocations, ",")));
    sessionFactory.setConfigLocation(new DefaultResourceLoader().getResource(configLocation));
    return sessionFactory.getObject();
}
```

4. 通过AOP设置数据源

```java
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
        DataSource dataSource = getDataSource(point);

        if (StringUtils.isNotNull(dataSource))
        {
            // 设置数据源，在执行SQL时候，会调用dataSource.getConnection()方法，从而执行实现类determineCurrentLookupKey方法，
            // 而我们实现类中重写的方法就是通过DynamicDataSourceContextHolder.getDataSourceType(dataSource.value().name());获得
            DynamicDataSourceContextHolder.setDataSourceType(dataSource.value().name());
        }

        try
        {
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

