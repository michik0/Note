**POM**

```xml
<dependency>  
   <groupId>org.apache.lucene</groupId>  
   <artifactId>lucene-core</artifactId>  
   <version>4.0.0</version>  
</dependency>  
<dependency>  
   <groupId>org.apache.commons</groupId>  
   <artifactId>commons-lang3</artifactId>  
   <version>3.12.0</version>  
</dependency>
```

**计算占用大小**

```java
Map<String, String> map = new HashMap<>();
System.out.println("map大小：" + RamUsageEstimator.humanSizeOf(map));
```