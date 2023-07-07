# 1. SpringMVC 处理请求的流程是什么？

1. 在启动Tomcat过程中，会创建DispatcherServlet对象，并执行它的初始化逻辑
2. DispatcherServlet初始化过程中会创建Spring容器（根据用户的Spring配置）
3. 然后初始化过程中还是初始化HandlerMapping、HandlerAdapter等等
4. SpringMVC中默认提供了好几个HandlerMapping，其中有一个为RequestMappingHandlerMapping
5. RequestMappingHandlerMapping的作用是去寻找Spring容器中有哪些加了@RequestMapping的方法
6. 找到这些方法后，就会解析该注解上的信息，包含了指定的path，然后就把path作为key，Method作为value存到一个map中
7. 当DispatcherServlet接收到请求后，**RequestMappingHandlerMapping** 就会负责根据请求路径从map中找到对应的Method
8. 然后准备执行Method，只不过，在执行Method之前，会解析该方法的各个参数
9. 比如参数前面加了@RequestParam注解，那SpringMVC就会解析该注解，并从请求中取出对应request param中的数据传给该参数
10. 解析完各个参数并从请求中拿到了对应的值之后，就会执行方法了
11. 执行完方法得到了方法返回值后，SpringMVC会进一步解析
12. 比如方法上如果加了@ResponseBody，那么就直接把返回值返回给浏览器
13. 如果方法上没有加@ResponseBody，那么就要根据返回值找到对应的页面，并进行服务端渲染，再把渲染结果返回给浏览器

## 2. SpringMVC中的重定向和转发分别是如何实现的？

1. 我们可以使用 `forward: ` 来对当前请求进行转发
2. 可以用 `redirect:` 来对当前请求进行重定向
3. 当SpringMVC接收到一个请求后，会先处理请求，如果后续方法要进行转发，就会利用RequestDispatcher将当前请求转发到指定地址，这种情况下，**一直是同一个请求**，只不过两次请求的路径不一样，并且转发对于浏览器而言是透明的
4. 而如果SpringMVC接收到一个请求，并进行处理后，发现要进行重定向，此时SpringMVC会向浏览器响应303，同时会告诉浏览器要重定向的路径，表示告诉浏览器要访问另外一个路径，由浏览器自己来访问，所以重定向是需要浏览器参与的，**是不同的两个请求**

# 3. 拦截器原理

动态代理类的invoke方法中，加入拦截器的逻辑，代理类的invoke逻辑图如下：其中第二参数的拦截器中的before函数的返回值，就是下图中的true或false

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142656.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142704.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142710.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142720.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142726.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142737.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142743.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142754.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142805.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230602142815.png)
