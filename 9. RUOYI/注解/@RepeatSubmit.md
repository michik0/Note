# 作用

自定义注解，规定时间内无法重复提交

# @RepeatSubmit

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RepeatSubmit
{
    /**
     * 间隔时间(ms)，小于此时间视为重复提交
     */
    public int interval() default 5000;

    /**
     * 提示消息
     */
    public String message() default "不允许重复提交，请稍后再试";
}
```

# 重复提交拦截器（父类）

1. 定义了通用的模版方法，让其有统一的返回结果，如果请求方法有被`@RepeatSubmit`注解修饰，那么会进行是否重复提交判断，否则放行。
2. 定义了需要子类实现的抽象方法`isRepeatSubmit`

```java
/**
 * 防止重复提交拦截器
 *
 * @author ruoyi
 */
@Component
public abstract class RepeatSubmitInterceptor implements HandlerInterceptor
{
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception
    {
        if (handler instanceof HandlerMethod)
        {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            Method method = handlerMethod.getMethod();
            RepeatSubmit annotation = method.getAnnotation(RepeatSubmit.class);
            if (annotation != null)
            {
                if (this.isRepeatSubmit(request, annotation))
                {
                    AjaxResult ajaxResult = AjaxResult.error(annotation.message());
                    ServletUtils.renderString(response, JSON.marshal(ajaxResult));
                    return false;
                }
            }
            return true;
        }
        else
        {
            return true;
        }
    }

    /**
     * 验证是否重复提交由子类实现具体的防重复提交的规则
     *
     * @param request 请求对象
     * @param annotation 防复注解
     * @return 结果
     */
    public abstract boolean isRepeatSubmit(HttpServletRequest request, RepeatSubmit annotation) throws Exception;
}
```

3. 可以针对不同的请求地址配置不同的重复提交实现类

```java
@Configuration
public class ResourcesConfig implements WebMvcConfigurer
{
     * 重复提交过滤器
     */
    @Resource
    private RepeatSubmitInterceptor sameUrlDataInterceptor;
    @Resource
    private SameUserTimeInterceptor sameUserTimeInterceptor;

    /**
     * 自定义拦截规则
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry)
    {
        registry.addInterceptor(sameUrlDataInterceptor).addPathPatterns("/**")
                .excludePathPatterns("/system/user/test");
        registry.addInterceptor(sameUserTimeInterceptor).addPathPatterns("/system/user/test");
    }
}
```

