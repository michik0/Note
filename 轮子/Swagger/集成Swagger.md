**POM**

```xml
<!--swagger2-->  
<dependency>  
    <groupId>io.springfox</groupId>  
    <artifactId>springfox-swagger2</artifactId>  
    <version>2.9.2</version>  
</dependency>  
<dependency>  
    <groupId>io.springfox</groupId>  
    <artifactId>springfox-swagger-ui</artifactId>  
    <version>2.9.2</version>  
</dependency>
```

**配置类**

```java
@Configuration  
@EnableSwagger2  
public class SwaggerConfig  
{  
    @Value("${spring.swagger2.enabled}")  
    private Boolean enabled;  
  
    @Bean  
    public Docket createRestApi() {  
        return new Docket(DocumentationType.SWAGGER_2)  
                .apiInfo(apiInfo())  
                .enable(enabled)  
                .select()  
                .apis(RequestHandlerSelectors.basePackage("com.duoduo.redistemplate"))  
                .paths(PathSelectors.any())  
                .build();  
    }  
    public ApiInfo apiInfo() {  
        return new ApiInfoBuilder()  
                .title("标题")  
                .description("描述")  
                .version("1.0")  
                .build();  
    }  
}
```