## 思考

servlet规范中中引入的filter是非常有用的，因为它引入了一个功能强大的拦截模式。

filter是这样的一种java对象。它可以在request到达servlet之前拦截HttpServletRequest对象，也可以在服务方法转移控制后拦截HttpServletResponse对象。

我们可以使用filter对象完成的任务有：检查用户的输入、以及压缩web内容。

但是，当我们在使用filter的时候却会发现至少有一半的时间我们都想改变HttpServletRequest对象的参数。如：用filter在HttpServletRequest对象到达Servlet之前将用户输入的空格去掉。但是由于java.util.Map包装的HttpServletRequest对象的参数是不可改变的，那要怎么办呢？

幸运的是，尽管我们不能改变对象本身，但是可以通过装饰模式来改变其状态。

## HttpServletRequestWrapper 介绍

HttpServletRequestWrapper类是HttpServletRequest类的装饰类，我们可以通过在装饰类中重写HttpServletRequest的方法来改变HttpServletRequest对象的状态。

比如说：

1. 在请求参数中加入一些参数，或者针对一些请求数据进行处理。
2. 在请求头中将Authorization中的Bearer Token去掉，只留下Token，我们可以使用HttpServletRequestWrapper装饰类，重写父类的getHeader()方法、getParameter()方法。

## HttpServletRequestWrapper 具体实战

### 请求头处理

#### 请求头装饰类

```java
@Slf4j  
public class RequestHeaderWrapper extends HttpServletRequestWrapper {  
	// 用于存放请求头（比如：存放处理后的token）
	private final Map<String, String> headerMap;  
	  
	public RequestHeaderWrapper(HttpServletRequest request) {  
	super(request);  
	headerMap = new HashMap<>();  
	}  
	  
	/**  
	* 重写请求头方法：获取经过处理的请求头地址
	* @param name  
	* @return  
	*/  
	@Override  
	public String getHeader(String name) {  
		// 先从自身的map中进行查找是否包含该key，如果不包含则直接返回父类中的值
		if (headerMap.get(name) == null) return super.getHeader(name);
		// 如果包含，返回自身的map中的值  
		return headerMap.get(name);  
	}  
	  
	/**  
	* 往自身map中塞入额外参数  
	* @param name  
	* @param value  
	*/  
	public void setHeader(String name, String value) {  
		headerMap.put(name, value);  
	}  
}
```

#### 请求头过滤器

```java
@Slf4j  
@Component  
@WebFilter(filterName = "myRequestParamFilter", urlPatterns = "/*")  
public class MyRequestHeaderFilter implements Filter {  
	@Override  
	public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {  
	// 获取请求头装饰类
	RequestHeaderWrapper headerWrapper = new RequestHeaderWrapper((HttpServletRequest) servletRequest);  
	// 如果请求头包含有Authorization，那么将处理后的Token塞入请求头装饰类的map中
	String authorizaton = ((HttpServletRequest) servletRequest).getHeader(HttpHeaders.AUTHORIZATION);  
	if (authorizaton != null) {  
	headerWrapper.setHeader(HttpHeaders.AUTHORIZATION, authorizaton.substring("Bearer ".length()));  
	}  
	// 将请求头装饰类传给下一个过滤器
	filterChain.doFilter(headerWrapper, servletResponse);  
	}  
}
```

### 请求参数处理

#### 请求参数装饰类

```java
@Slf4j  
public class RequestParamWrapper extends HttpServletRequestWrapper {  
	  
	private final Map<String, String> parameterMap;  
	  
	public RequestParamWrapper(HttpServletRequest request) {  
	super(request);  
	parameterMap = new HashMap<>();  
	}  
	  
	/**  
	* 重写获取请求参数方法：获取经过处理的请求参数 
	* @param name  
	* @return  
	*/  
	@Override  
	public String getParameter(String name) {  
	if (parameterMap.get(name) == null) return super.getParameter(name);  
	return parameterMap.get(name);  
	}  
	  
	/**  
	* 往自身map中塞入额外参数  
	* @param name  
	* @param value  
	*/  
	public void setParamter(String name, String value) {  
	parameterMap.put(name, value);  
	}  
}
```

#### 请求参数过滤器

```java
@Slf4j  
@Component  
@WebFilter(filterName = "myRequestParamFilter", urlPatterns = "/*")  
public class MyRequestParamFilter implements Filter {  
	@Override  
	public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {  
	// 获取请求参数装饰类
	RequestParamWrapper paramWrapper = new RequestParamWrapper((HttpServletRequest) servletRequest);  
	// 将"test"塞入请求参数装饰器中
	paramWrapper.setParamter("test", "1");  
	// 将请求参数装饰类传给下一个过滤器
	filterChain.doFilter(paramWrapper, servletResponse);  
	}  
}
```

