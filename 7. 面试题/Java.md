#Java #面试题 

# 1. `equals` 与 `==` 的区别

**`==`**

- 如果是基本类型，`==` 表示判断它们值是否相等；
- 如果是引用对象，`==` 表示判断两个对象指向的内存地址是否相同。

**equals**

- 如果是字符串，表示判断字符串内容是否相同；
- 如果是 object 对象的方法，比较的也是引用的内存地址值；
- 如果自己的类重写 equals 方法，可以自定义两个对象是否相等。

# 2. final，finally，finalize 的区别

- final 用于修饰属性，方法和类，分别表示属性不能被重新赋值，方法不可被覆盖，类不可被继承。
- finally 是异常处理语句结构的一部分，一般以 try-catch-finally 出现，finally 代码块表示总是被执行。
- finalize 是 Object 类的一个方法，该方法一般由垃圾回收器来调用，当我们调用 System.gc() 方法的时候，由垃圾回收器调用 finalize() 方法，回收垃圾，JVM 并不保证此方法总被调用。

# 3. 重载和重写的区别

- 重写必须继承，重载不用。
- 重载表示同一个类中可以有多个名称相同的方法，但这些方法的参数列表各不相同（即参数个数或类型不同）。
- 重写表示子类中的方法与父类中的某个方法的名称和参数完全相同，通过子类实例对象调用这个方法时，将调用子类中的定义方法，这相当于把父类中定义的那个完全相同的方法给覆盖了，这是面向对象编程的**多态性的一种表现**。
- 重写的方法修饰符大于等于父类的方法，即访问权限只能比父类的更大，不能更小，而重载和修饰符无关。 重写覆盖的方法中，只能比父类抛出更少的异常，或者是抛出父类抛出的异常的子异常。

# 4. 两个对象的 hashCode()相同，则 equals()是否也一定为 true？

两个对象 equals 相等，则它们的 hashCode 必须相等，如果两个对象的 hashCode()相同，则 equals() 不一定为 true。

**hashCode 的常规协定：**

- 在 Java 应用程序执行期间，在对同一对象多次调用 hashCode() 方法时，必须一致地返回相同的整数，前提是将对象进行 equals 比较时所用的信息没有被修改。 从某一应用程序的一次执行到同一应用程序的另一次执行，该整数无需保持一致。
- 两个对象的 equals() 相等，那么对这两个对象中的每个对象调用 hashCode() 方法都必须生成相同的整数结果。
- 两个对象的 equals()不相等，那么对这两个对象中的任一对象上调用 hashCode() 方法不要求一定生成不同的整数结果。但是，为不相等的对象生成不同整数结果可以提高哈希表的性能。

# 5. 抽象类和接口有什么区别

- 抽象类要被子类继承，接口要被子类实现。
- 抽象类可以有构造方法，接口中不能有构造方法。
- 抽象类中可以有普通成员变量，接口中没有普通成员变量，它的变量只能是公共的静态的常量。
- 一个类可以实现多个接口，但是只能继承一个父类，这个父类可以是抽象类。
- 接口只能做方法声明，抽象类中可以作方法声明，也可以做方法实现。**（Java8之后接口也支持方法实现）**
- 抽象级别（从高到低）：接口>抽象类>实现类。
- 抽象类主要是用来抽象类别，接口主要是用来抽象方法功能。
- 抽象类的关键字是 abstract，接口的关键字是 interface。

# 6. BIO、NIO、AIO 有什么区别？

**# 同步阻塞的BIO**

在JDK1.4之前，我们建立网络连接的时候采用BIO模式，需要先在服务端启动一个serverSocket，然后在客户端启动socket来对服务端进行通信，默认情况下服务端需要对每个请求建立一堆线程等待请求，而客户端发送请求后，先咨询服务端是否有线程响应，如果没有则会一直等待或者遭到拒绝请求，如果有的话，客户端线程会等待请求结束后才继续执行。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230517131343.png)

在此种方式下，用户进程在发起一个IO操作以后，必须等待IO操作的完成，只有当真正完成了IO操作以后，用户进程才能运行。JAVA传统的IO模型属于此种方式！

服务器实现模式为一个连接一个线程，即客户端有连接请求时服务器端需要启动一个线程进行处理，如果这个连接不做任何事情会造成不必要的线程开销，当然可以通过线程池机制改善。

**# 同步非阻塞的NIO**

NIO本身是基于事件驱动思想来完成的，其主要想解决的是BIO的大并发问题，在使用同步I/O的网络应用中，如果要同时处理多个客户端请求，或是在客户端要同时和多个服务器进行通讯，就必须使用多线程来处理。也就是说，将每一个客户端请求分配给一个线程来单独处理。这样做虽然可以达到我们的要求，但同时又带来另外一个问题。由于每创建一个线程，就要为这个线程分配一定的内存空间，而且操作系统本身对线程的总数有一定的限制。如果客户端的请求过多，服务端程序可能会因为不堪重负而拒绝客户端的请求，甚至服务器可能会因此而瘫痪。

NIO基于Reactor，当socket有流可读或可写入socket时，操作系统会相应的通知引用程序进行处理，应用再将流读取到缓冲区或写入操作系统。也就是说，这个时候，已经不是一个连接就要对应一个处理线程了，而是有效的请求，对应一个线程，当连接没有数据时，是没有工作线程来处理的。

BIO和NIO一个比较重要的不同，是我们使用BIO的时候往往会引入多线程，每个连接一个单独的线程；而NIO则是使用单线程或者使用少量线程，每个连接公用一个线程。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230517131840.png)

在此种方式下，用户进程发起一个IO操作以后边可返回做其它事情，但是用户进程需要时不时的询问IO操作是否就绪，这就要求用户进程不停的去询问，从而引入不必要的CPU资源浪费。其中目前JAVA的NIO就属于同步非阻塞IO。

服务器实现模式为一个请求一个线程，即客户端发送的连接请求都会注册到多路复用器上，多路复用器轮询到连接有I/O请求时才启动一个线程进行处理。

**# 异步非阻塞AIO**

与NIO不同，当进行读写操作时，只需直接调用API的read或write方法即可。这两种方法均为异步的，对于读操作而言，当有流可读取时，操作系统会将可读的流传入read方法的缓冲区，并通知应用程序；对于写操作而言，当操作系统将write方法传递的流写入完毕时，操作系统主动通知应用程序。即可以理解为， read/write方法都是异步的，完成后会主动调用回调函数。在JDK1.7中，这部分内容成为AIO。

在此种模式下，用户进程只需要发起一个IO操作然后立即返回，等IO操作真正的完成以后，应用程序会得到IO操作完成的通知，此时用户进程只需要对数据进行处理就好了，不需要进行实际的IO读写操作，因为真正的IO读取或者写入操作已经由内核完成了。目前Java中还没有支持此种IO模型。 

服务器实现模式为一个有效请求一个线程，客户端的I/O请求都是有OS先完成了再通知服务器应用去启动线程进行处理。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230517132829.png)

# 7. String，StringBuffer，StringBuilder 的区别

**String：**

- String 类是一个不可变的类，一旦创建就不可以修改。
- String 是 final 类，不能被继承 
- String 实现了 equals()方法和 hashCode()方法

**StringBuffer：**

- 继承自 AbstractStringBuilder，是可变类。
- StringBuffer 是线程安全的
- 可以通过 append 方法动态构造数据。

**StringBuilder：**

- 继承自 AbstractStringBuilder，是可变类。
- StringBuilder 是非线性安全的。
- 执行效率比 StringBuffer 高。

# 8. JAVA 中的几种基本数据类型是什么，各自占用多少字节

| 基本类型 | 位数 | 字节 |
| -------- | ---- | ---- |
| int      | 32   | 4    |
| short    | 16   | 2    |
| long     | 64   | 8    |
| byte     | 8    | 1    |
| char     | 16   | 2    |
| double   | 64   | 8    |
| boolean  | ?    | ?     |

对于 boolean，官方文档未明确定义，它依赖于 JVM 厂商的具体实现。逻辑上理解是占用 1 位，但是实际中会考虑计算机高效存储因素。

# 9. Comparator 与 Comparable 有什么区别？

- Comparable & Comparator 都是用来实现集合中元素的比较、排序的，只是 Comparable 是在集合内部定义的方法实现的排序，Comparator 是在集合外部实现的排序，所以，如想实现排序，就需要在集合外定义 Comparator 接口的方法或在集合内实现 Comparable 接口的方法。
- Comparator 位于包 java.util 下，而 Comparable 位于包 java.lang 下。
- Comparable 是一个对象本身就已经支持自比较所需要实现的接口（如 String、Integer 自己就可以完成比较大小操作，已经实现了 Comparable 接口） 自定义的类要在加入 list 容器中后能够排序，可以实现 Comparable 接口，在用 Collections 类的 sort 方法排序时，如果不指定 Comparator，那么就以自然顺序排序， 这里的自然顺序就是实现 Comparable 接口设定的排序方式。而 Comparator 是一个专用的比较器，当这个对象不支持自比较或者自比较函数不能满足你的要求时，你可以写一个比较器来完成两个对象之间大小的比较。
- 一个是自已完成比较，一个是外部程序实现比较的差别而已。 用 Comparator 是策略模式（strategy design pattern），就是不改变对象自身，而用一个策略对象（strategy object）来改变它的行为。 比如：你想对整数采用绝对值大小来排序，Integer 是不符合要求的，你不需要去修改 Integer 类（实际上你也不能这么做）去改变它的排序行为，只要使用一个实现了 Comparator 接口的对象来实现控制它的排序就行了。

# 10. String 类能被继承吗，为什么？

```java
public final class String  
    implements java.io.Serializable, Comparable<String>, CharSequence{

}
```

**String 类为什么不能被继承呢？**

- **原因1：线程安全**

不可变对象始终是线程安全的，因为线程必须完全构建它们，然后才能将它们传递给其他人——并且在构建之后，它们不能再被更改。因为字符串是不可变的，所以是多线程安全的，同一个字符串实例可以被多个线程共享。这样便不用因为线程安全问题而使用同步。如果字符串是可变的，那么会引起很严重的安全问题。譬如，数据库的用户名、密码都是以字符串的形式传入来获得数据库的连接，或者在socket编程中，主机名和端口都是以字符串的形式传入。

- **原因2：效率**

final 类无法被继承，这使得 JIT（Just In Time Compiler，一般翻译为即时编译器）在处理字符串时可以进行各种优化，永远不需要检查被覆盖的方法。

# 11. 说说 Java 中多态的实现原理

- 多态机制包括静态多态（编译时多态）和动态多态（运行时多态） 
- 静态多态比如说重载，动态多态一般指在运行时才能确定调用哪个方法。
- 我们通常所说的多态一般指运行时多态，也就是编译时不确定究竟调用哪个具体方法，一直等到运行时才能确定。
- 多态实现方式：子类继承父类（extends）和类实现接口（implements） 多态核心之处就在于对父类方法的改写或对接口方法的实现，以取得在运行时不同的执行效果。
- Java 里对象方法的调用是依靠类信息里的方法表实现的，对象方法引用调用和接口方法引用调用的大致思想是一样的。当调用对象的某个方法时，JVM 查找该对象类的方法表以确定该方法的直接引用地址，有了地址后才真正调用该方法。

```java
abstract class Fruit {
	abstract String taste()
}

class Apple extends Fruit {
	@Override
	String taste() {
		return "酸酸的";
	}
}
 
class Pear extends  Fruit  {
	@Override
	String taste()
	return "甜甜的";
}

public class Test {
	public static void main(String[] args) {
		Fruit f = new Apple();
		System.out.println(f.taste());
	}
}
```

程序运行，当调用对象 Fruit 的方法 taste 时，JVM 查找 Fruit 对象类的方法表以确定 taste 方法的直接引用地址，到底来自 Apple 还是 Pear，确定后才 真正调用对应子类的 taste 方法

# 12. 在 jdk1.5 中，引入了泛型，泛型的存在是用来解决什么问题。

Java 泛型（generics）是 JDK 5 中引入的一个新特性，其本质是参数化类型，解决不确定具体对象类型的问题。其所操作的数据类型被指定为一个参数（type parameter）这种参数类型可以用在类、接口和方法的创建中，分别称为泛型类、泛型接口、泛型方法。

[参考：泛型解析](https://juejin.cn/post/6844904050673057799)

# 13. int 和 Integer 有什么区别，还有 Integer 缓存的实现

这里考察 3 个知识点吧：

- int 是基本数据类型，Integer 是 int 的封装类 int 默认值为 0，而 Integer 默认值为 null， Integer 使用需要判空处理
- Integer 的缓存机制：为了节省内存和提高性能，Integer 类在内部通过使用相同的对象引用实现缓存和重用，Integer 类默认在-128 ~ 127 之间，可以通过 XX:AutoBoxCacheMax 进行修改，且这种机制仅在自动装箱的时候有用，在使用构造器创建 Integer 对象时无用。

```java
Integer a = 10;
Integer b = -10;
Integer c= 129;
Integer d= 129;
System.out.println(a == b);
System.out.println(c== d);

// 输出结果
true
false
```

# 14. 说说反射的用途及实现原理，Java 获取反射的三种方法

[谈谈Java反射：从入门到实践，再到原理](https://juejin.cn/post/6844904025607897096)

# 15. 面向对象的特征

- 封装
- 继承
- 多态

# 16. &和&&的区别

- 按位与，a&b 表示把 a 和 b 都转换成二进制数，再进行与的运算；
- &和&&都是逻辑运算符号，&&又叫短路运算符（如果&&前判断为false，不执行&&后的判断）
- 逻辑与，a&&b，a&b 都表示当且仅当两个操作数均为 true 时，其结果才为true，否则为 false。

# 17. Java 中 IO 流分为几种？

- Java 中的流分为两种：一种是字节流，另一种是字符流。
- IO 流分别由四个抽象类来表示：
	- InputStream、OutputStream（字节流）
	- Reader，Writer（字符流）

# 18. 讲讲类的实例化顺序，比如父类静态数据，构造函数， 子类静态数据，构造函数。

```java
public class Parent {
	{
		System.out. println("父类非静态代码块");
	}

	static {
		System.out.println("父类静态块");
	}
	
	public Parent() {
		System.out.println("父类构造器");
	}
}

public class Son extends Parent {
	{
		System.out. println("子类非静态代码块");
	}

	static {
		System.out.println("子类静态块");
	}
	
	public Son() {
		System.out.println("子类构造器");
	}
}

public class Test {
	public static void main(String[] args) {
		Son son = new Son();
	}
}

```

**运行结果：**

```运行结果
父类静态块
子类静态代码块
父类非静态代码块
父类构造器
子类非静态代码
```

所以，类实例化顺序为： 父类静态代码块/静态域->子类静态代码块/静态域 > 父类非静态代码块 -> 父类构造器 -> 子类非静态代码块 -> 子类构造器

# 19. Java 创建对象有几种方式

Java 创建对象有 5 种方式

- 用 new 语句创建对象。
- 使用反射，使用 Class.newInstance() 创建对象/调用类对象的构造方法
- 调用对象的 clone()方法。 运用反序列化手段，调用 java.io.ObjectInputStream 对象的 readObject()方法
- 使用 Unsafe

# 20. 如何将 GB2312 编码的字符串转换为 ISO-8859-1 编码的字符串呢？

```java
public class Test {
	public static void main(String[] args) throws UnsupportedEncodingException {
	String str = "Michiko";
	String strIso = new String(str.getBytes("GB2312"), "IS0-8859-1");
	System.out.println(strIso);
	}
}
```

# 21. Java 语言是如何处理异常的，关键字throws、throw、try、catch、finally 怎么使用？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230526123610.png)

**Error** 

表示编译时或者系统错误，如虚拟机相关的错误，OutOfMemoryError 等， error 是无法处理的。 

**Exception**

代码异常，Java 程序员关心的基类型通常是 Exception。它能被程序本身可以处理，这也是它跟 Error 的区别。 它可以分为 RuntimeException（运行时异常）和 CheckedException（可检查的异常）。

**常见的 RuntimeException 异常：**

- NullPointerException：空指针异常
- ArithmeticException：出现异常的运算条件（例如除0）时，抛出此异常
- IndexOutOfBoundsException：数组索引越界异常
- ClassNotFoundException：找不到类异常
- illegalArgumentException：非法参数异常

**常见的 Checked Exception 异常：**

- IOException：操作输入流和输出流时可能出现的异常
- ClassCastException：类型转换异常类

>Checked Exception ：编译器要求你必须处置的异常。
>
>Unchecked Exceptions：它指编译器不要求强制处置的异常， 它包括 Error 和 RuntimeException 以及他们的子类。

[Java程序员必备：异常的十个关键知识点](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247487956&idx=1&sn=16a29e7d689058dfc053a06451924567&chksm=cf21cefdf85647eb9fcb6a0f466aeed5cb4a41a3d5a45b7923121c50eec57a33d850807a633a&token=1712314640&lang=zh_CN#rd)

# 22. 静态内部类与非静态内部类有什么区别

- 静态内部类可以有静态成员(方法，属性)，而非静态内部类则不能有静态成员(方法，属性)。
- 静态内部类只能够访问外部类的静态成员和静态方法，而非静态内部类则可以访问外部类的所有成员(方法，属性)。
- 实例化静态内部类与非静态内部类的方式不同：调用内部静态类的方法或静态变量，可以通过类名直接调用。

[Java程序员必备基础：内部类解析](https://juejin.cn/post/6844904045476315149)

# 23. String s 与 new String 与有什么区别

```java
String str = "test";
String newStr = new String("test");
```

**String str = "test"**

先在常量池中查找有没有 "test" 这个对象，如果有，就让 str 指向那个"test"，如果没有，在常量池中新建一个 "test" 对象，并让 str 指向在常量池中新建的对象 "test"。

**String newStr =new String ("test");**

是在堆中建立的对象 "whx"，在栈中创建堆中 "string" 对象的内存地址。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230528094802.png)

# 24. 反射中，Class.forName 和 ClassLoader 的区别

Class.forName 和 ClassLoader 都可以对类进行加载。

- ClassLoader 负责加载 Java 类的字节代码到 Java 虚拟机中。

- Class.forName 其实是调用了 ClassLoader，如下：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230528095108.png)

这里面，forName0 的第二个参数为 true，表示对加载的类进行初始化化。其 实还可以调用 `Class<?> forName(String name, boolean initialize,ClassLoader loader)` 方法实现一样的功能，它的源码如下：

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230528095130.png)

所以，Class.forName 和 ClassLoader 的区别，就是在类加载的时候， class.forName 有参数控制是否对类进行初始化。

# 25. JDK 动态代理与 cglib 实现的区别

- java 动态代理是利用反射机制生成一个实现代理接口的匿名类，在调用具体方法前调用 InvokeHandler 来处理。
- cglib 动态代理是利用 asm 开源包，对代理对象类的 class 文件加载进来，通过修改其字节码生成子类来处理。

>JDK 动态代理只能对实现了接口的类生成代理，而不能针对类。
>
>cglib 是针对类实现代理，主要是对指定的类生成一个子类，覆盖其中的方法。因为是继承，所以该类或方法最好不要声明成 final（因为被 final 修饰的类无法生成子类）。

# 26. 深拷贝和浅拷贝区别

**浅拷贝**

复制了对象的引用地址，两个对象指向同一个内存地址，所以修改其中任意的值，另一个值都会随之变化。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230528110250.png)

**深拷贝**

将对象及值复制过来，两个对象修改其中任意的值另一个值不会改变

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230528110407.png)

# 27. JDK 和 JRE 有什么区别？

**JDK：** Java Development Kit 的简称，Java 开发工具包，提供了 Java 的开发环 境和运行环境。 
**JRE：** Java Runtime Environment 的简称，Java 运行环境，为 Java 的运行提 供了所需环境。

# 28. String 类的常用方法都有那些呢？

- indexOf()：返回指定字符的索引。
- charAt()：返回指定索引处的字符。
- replace()：字符串替换。
- trim()：去除字符串两端空白。
- split()：分割字符串,返回一个分割后的字符串数组。
- getBytes()：返回字符串的byte类型数组。
- length()：返回字符串长度。
- toLowerCase()：将字符串转成小写字母。
- toUpperCase()：将字符串转成大写字符。
- substring()：截取字符串。
- equals()：字符串比较。

# 29. 什么是值传递和引用传递？

- 值传递是对基本型变量而言的，传递的是该变量的一个副本，改变副本不影响原变量。
- 引用传递一般是对于对象型变量而言的，传递的是该对象地址的一个副本，并不是原对象本身。所以对引用对象进行操作会同时改变原对象。

# 30. 可以在 static 环境中访问非 static 变量吗？

static 变量在 Java 中是属于类的，它在所有的实例中的值是一样的。当类被 Java 虚拟机载入的时候，会对 static 变量进行初始化。因为静态的成员属于类，随着类的加载而加载到静态方法区内存，当类加载时，此时不一定有实例创建， 没有实例，就不可以访问非静态的成员。类的加载先于实例的创建，因此静态环境中，不可以访问非静态！

# 31. Java 支持多继承么，为什么？

不支持多继承，原因：

- 安全性的考虑，如果子类继承的多个父类里面有相同的方法或者属性，子类将不知道具体要继承哪个。
- Java提供了接口和内部类以达到实现多继承功能，弥补单继承的缺陷。

# 32. 用最有效率的方法计算 2 乘以 8？

2 << 3

# 33. char 型变量中能否存贮一个中文汉字？

在 Java 中，char 类型占 2 个字节，而且 Java 默认采用 Unicode 编码，一个 Unicode 码是 16 位，所以一个 Unicode 码占两个字节，Java 中无论汉子还 是英文字母都是用 Unicode 编码来表示的。所以，在 Java 中，char 类型变量 可以存储一个中文汉字。

# 34. 如何实现对象克隆？

**浅拷贝**

- 实现 `Cloneable` 接口，重写 `clone()` 方法。

Object 的 `clone()` 方法是浅拷贝，即如果类中属性有自定义引用类型，只拷贝引用，不拷贝引用指向的对象。

**深拷贝**

- 递归调用 clone() 方法

```java
@Override public Object clone() { 
	Student stu = null; 
	try{ 
		//浅复制 
		stu = (Student)super.clone(); 
	}catch(CloneNotSupportedException e) { 
		e.printStackTrace(); 
	} 
	stu.addr = (Address)addr.clone(); 
	//深度复制 
	return stu; 
}
```

- 将对象序列化后，反序列化回来，实现对象的深拷贝

```java
public class CloneUtil {
    private CloneUtil(){
        throw new AssertionError();
    }

    public static <T extends Serializable> T clone(T obj) throws Exception{
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(obj);

        ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());
        ObjectInputStream ois = new ObjectInputStream(bis);
        return (T)ois.readObject();

    }
}
```

# 35. object 中定义了哪些方法？

- getClass()：获取类结构信息
- hashCode()：获取哈希码
- equals(Object)：默认比较对象的地址值是否相等，子类可以重写比较规则
- clone()：用于对象克隆
- toString()：把对象转变成字符串
- notify()：多线程中唤醒功能
- notifyAll()：多线程中唤醒所有等待线程的功能
- wait()：让持有对象锁的线程进入等待
- wait(long timeout)：让持有对象锁的线程进入等待，设置超时毫秒数时间
- wait(long timeout, int nanos)：让持有对象锁的线程进入等待，设置超时纳秒数时间
- finalize()：垃圾回收前执行的方法

# 36. hashCode 的作用是什么？

- hashCode 的存在主要是用于查找的快捷性，如 Hashtable、HashMap 等， hashCode 是用来在散列存储结构中确定对象的存储地址的。
- 如果两个对象相同，就是适用于 equals(java.lang.Object) 方法，那么这两个对象的 hashCode 一定要相同。
- 如果对象的 equals 方法被重写，那么对象的 hashCode 也尽量重写，并且产生 hashCode 使用的对象，一定要和 equals 方法中使用的一致，否则就会违反上面提到的第2点。
- 两个对象的 hashCode 相同，并不一定表示两个对象就相同，也就是不一定适用于 equals(java.lang.Object) 方法，只能够说明这两个对象在散列存储结构中。

# 37. for-each 与常规 for 循环的效率对比

使用 for-each 循环与常规的 for 循环相比，并不存在性能损失，即使对数组进行迭代也是如此。实际上，在有些场合下它还能带来微小的性能提升，因为它只计算一次数组索引的上限。

# 38. 访问修饰符 public，private，protected 以及 default 的区别？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230529005822.png)

# 39. 谈谈 final 在 java 中的作用？

^098ecf

- final 修饰的类叫最终类，**不能生成子类****。
- final 修饰的方法**不能被重写**。
- final 修饰的变量叫常量，常量必须初始化，**初始化之后值就不能被修改**。

# 40. java 中的 Math.round(-1.5) 等于多少呢？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230529010915.png)

JDK 中的 java.lang.Math 类：

- round()：返回四舍五入，-1.5 小数返回较大整数，如 -1.5 返回 -1。
- ceil()：返回小数所在两整数间的较大值，如 -1.5 返回 -1.0。
- floor()：返回小数所在两整数间的较小值，如 -1.5 返回 -2.0。

# 41. String 属于基础的数据类型吗？

String 不属于基础类型，基础类型有 8 种：byte、boolean、char、short、int、float、long、double，而 String 属于对象。

# 42. 如何将字符串反转呢？

- 使用 StringBuilder 或 StringBuffer 的 reverse 方法，本质都调用了它们的父类AbstractStringBuilder 的 reverse 方法实现。(JDK1.8)
- 使用 charAt 函数，倒过来输出

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230529011443.png)

# 43. 在自己的代码中，如果创建一个 java.lang.String 类， 这个类是否可以被类加载器加载？为什么？

不可以。

因为 JDK 处于安全性的考虑，基于双亲委派模型，优先加载 JDK 的 String 类，如果 java.lang.String 已经加载，便不会再次被加载。

>双亲委派模型：当某个类加载器需要加载某个 `.class` 文件时，它首先把这个任务委托给他的上级类加载器，递归这个操作，如果上级的类加载器没有加载，自己才会去加载这个类。

# 44. 被 final 修饰的类可以被 Spring 代理吗？

Java 采用的是 JDK动态代理 和 CGLIB动态代理 两种方式进行动态代理的

如果委托类没有实现接口的话，就不能使用newProxyInstance方法，进而不能使用JDK动态代理

Cglib是针对类来实现代理的，对指定的目标类生成一个子类，通过方法拦截技术拦截所有父类方法的调用。因为是生成子类，所以就不能用在final修饰的类上。

[[#^098ecf|final 在 java 中的作用]]

# 45. 谈谈你对 java.lang.Object 对象中 hashCode 和 equals 方法的理解。在什么场景下需要重新实现这两个方法。

在我们的业务系统中判断对象时有时候需要的不是一种严格意义上的相等，而是一种业务上的对象相等。在这种情况下，原生的 equals 方法就不能满足我们的需求了，所以这个时候我们需要重写 equals 方法，来满足我们的业务系统上的需求。

**Object.Hashcode 规定**

1. 在一个应用程序执行期间，如果一个对象的 equals 方法做比较所用到的信息没有被修改的话，那么，对该对象调用 hashCode 方法多次，它必须始终如一地返回同一个整数。在同一个应用程序的多次执行过程中，这个整数可以不同，即这个应用程序这次执行返回的整数与下一次执行返回的整数可以不一致。

2. 如果两个对象根据 equals(Object) 方法是相等的，那么调用这两个对象中任一个对象的 hashCode 方法必须产生同样的整数结果。

3. 如果两个对象根据 **equals(Object) 方法是不相等的**，那么调用这两个对象中任一个对象的 hashCode 方法，**不要求必须产生不同的整数结果**。然而，程序员应该意识到这样的事实，对于**不相等的对象产生截然不同的整数结果，有可能提高散列表（hash table）的性能。**

**为什么在重写 equals方法的时候需要重写 hashCode方法呢？**

如果只重写了equals方法而没有重写 hashCode方法的话，则会违反约定的第二条：相等的对象必须具有相等的散列码所以hashCode 和 equals 方法都需要重写。

>可以通过 `org.apache.commons.Iang.builder.HashCodeBuilder` 这个工具类来方便的重写
 hashCode 方法。

```java
public class Admin {

    private Long id;
    private String userName;

    public String getUserName() {
        return userName;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Admin)) {
            return false;
        }
        Admin otherAdmin  = (Admin) o;
        EqualsBuilder builder = new EqualsBuilder();
        builder.append(getUserName(), otherAdmin.getUserName());
        return builder.isEquals();
    }

    @Override
    public int hashCode() {
        HashCodeBuilder builder = new HashCodeBuilder();
        builder.append(getUserName());
        return builder.toHashCode();
    }
}
```

# 46. 什么是序列化，怎么序列化，反序列呢？

- 序列化：把Java对象转换为字节序列的过程

- 反序列：把字节序列恢复为Java对象的过程

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230529094459.png)

**序列化时，如何让某些成员不要序列化？**

可以用 transient 关键字修饰，它可以阻止修饰的字段被序列化到文件中，在被反序列化后，transient 字段的值被设为初始值，比如int型的值会被设置为 0，对象型初始值会被设置为null。

**在 Java 中，Serializable 和 Externalizable 有什么区别**

Externalizable 继承了 Serializable，给我们提供 writeExternal() 和 readExternal() 方法，让我们可以控制 Java的序列化机制，不依赖于Java的默认序列化。正确实现 Externalizable 接口可以显著提高应用程序的性能。

**serialVersionUID有什么用？**

JAVA 序列化的机制是通过判断类的 serialVersionUID 来验证版本是否一致的。在进行反序列化时，JVM 会把传来的字节流中的 serialVersionUID 和本地相应实体类的 serialVersionUID 进行比较，如果相同，反序列化成功，如果不相同，就抛出 InvalidClassException 异常。

**是否可以自定义序列化过程, 或者是否可以覆盖 Java 中的默认序列化过程？**

可以的

对于序列化一个对象需调用 ObjectOutputStream.writeObject(saveThisObject)，并用 ObjectInputStream.readObject() 读取对象, 但 Java 虚拟机为你提供的还有一件事，是定义这两个方法。如果在类中定义这两种方法, 则 JVM 将调用这两种方法，而不是应用默认序列化机制。同时，可以声明这些方法为私有方法，以避免被继承、重写或重载。

**在 Java 序列化期间，哪些变量未序列化？**

static 静态变量和 transient 修饰的字段是不会被序列化的。静态（static）成员变量是属于类级别的，而序列化是针对对象的。transient 关键字修字段饰，可以阻止该字段被序列化到文件中。

[Java程序员必备：序列化全方位解析](https://juejin.cn/post/6844904131312746509)

# 47. java8 的新特性

- Lambda 表达式：Lambda 允许把函数作为一个方法的参数
- Stream API：新添加的 Stream API（java.util.stream）把真正的函数式编程风格引入到 Java 中
- 方法引用：方法引用提供了非常有用的语法，可以直接引用已有 Java 类或对象 （实例）的方法或构造器。
- 默认方法：默认方法就是一个在接口里面有了一个实现的方法。
- Optional 类 ：Optional 类已经成为 Java 8 类库的一部分，用来解决空指针异常。
- Date Time API ：加强对日期与时间的处理。

# 48. 匿名内部类是什么？如何访问在其外面定义的变量呢？

匿名内部类就是没有名字的内部类，日常开发中使用的比较多。

```java
public class Outer {
	private void test(final int i) {
		new Service() {
			public void method() {
				for (int j = 0; j < i; j++) {
					System.out.println("匿名内部类");
				}
			}
		}.method();
	}
}

// 匿名内部类必须继承或实现一个已有的接口
interface Service{
	void method();
}
```

匿名内部类还有以下特点：

- 没有名字。
- 匿名内部类必须继承一个抽象类或者实现一个接口。
- 匿名内部类不能定义任何静态成员和静态方法。
- 当所在的方法的形参需要被匿名内部类使用时，必须声明为final。
- 匿名内部类不能是抽象的，它必须要实现继承的类或者实现的接口的所有抽象方法。
- 匿名内部类不能访问外部类方法中的局部变量，除非该变量被声明为final类型。

# 49. break 和 continue 有什么区别？

- break 可以使流程跳出 switch 语句体，也可以在循环结构终止本层循环体，从而提前结束本层循环。

- continue的作用是跳过本次循环体中余下尚未执行的语句，立即进行下一次的循环条件判定，可以理解为仅结束本次循环。

# 50. String s = "Hello"; s = s + " world!" 这两行代码执行后，原始的 String 对象中的内容是否会改变？

没有。因为 String 被设计成不可变(immutable)类，所以它的所有对象都是不可变对象。

# 51. String s="a"+"b"+"c"+"d" 创建了几个对象？

1个

Java 编译器对字符串常量直接相加的表达式进行优化，不等到运行期去进行加法运算，在**编译**时就去掉了加号，直接将其编译成一个这些常量相连的结果。 所以 "a"+"b"+"c"+"d" 相当于直接定义一个 "abcd" 的字符串。

# 52. try-catch-finally-return 执行顺序

- 如果不发生异常，不会执行 catch 部分。
- 不管有没有发生异常，finally 都会执行到。
- 即使 try 和 catch 中有 return 时，finally 仍然会执行 finally 是在 return 后面的表达式运算完后再执行的。(此时并没有返回运算后的值，而是**先把要返回的值保存起来**，若 finally 中无 return，则**不管 finally 中的代码怎么样，返回的值都不会改变**，仍然是之前保存的值)
- finally 部分就不要 return 了，要不然，就回不去 try 或者 catch 的 return 了。

```java
public static void main(String[] args) throws IOException {
	System.out.println("result:" + test());
	private static int test()
	int temp = 1;
	try {
		System.out.println("start execute try, temp is:"+temp); 
		return ++temp;
	} catch (Exception e) {
		System.out.println("start execute catch temp is: "+temp); 
		return ++temp;
	}
	finally {
	System.out.println("start execute finally,temp is:" + temp); 
	++temp;
	}
}
```

```结果
start execute try, temp is:1 
start execute finally,temp is:2
result:2
```

# 53. Java 7 新的 try-with-resources 语句，平时有使用吗？

try-with-resources，是 Java7 提供的一个新功能，它用于自动资源管理。

- 资源是指在程序用完了之后必须要关闭的对象。
- try-with-resources保证了每个声明了的资源在语句结束的时候会被关闭

**什么样的对象才能当做资源使用呢?**

只要实现了 `java.lang.AutoCloseable` 接口或者 `java.io.Closeable` 接口的对象，都OK。

```java
public class Java7TryResourceTest {
	public static void main(String[] args) {
		try (BufferedReader br = new BufferedReader(new FileReader
		"C:/jaywei.txt"))) {
			System.out.println(br.readLine());
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
```

**try-with-resources 的好处**

- 代码更加优雅，行数更少。
- 资源自动管理，不用担心内存泄漏问题。

# 54. 简述一下面向对象的”六原则一法则”。

- 单一职责原则：一个类只做它该做的事情。
- 开闭原则：软件实体应当对扩展开放，对修改关闭。
- 依赖倒转原则：面向接口编程。
- 接口隔离原则：接口要小而专，绝不能大而全。
- 合成聚合复用原则：优先使用聚合或合成关系复用代码。
- 迪米特法则：迪米特法则又叫最少知识原则，一个对象应当对其他对象有尽可能少的了解。

# 55. switch 是否能作用在 byte 上，是否能作用在 long 上，是否能作用在 String 上？

- switch 可作用于 char byte short int 
- switch 可作用于 char byte short int 对应的包装类 
- switch 不可作用于 long double float boolean，以及他们的包装类

# 56. 数组有没有 length() 方法？String 有没有 length() 方法？

- 数组没有 length() 方法，而是 length；
- String 有 length()方法

```java
String[] strings = new String[]{};  
// 数组长度
int arraySize = strings.length;  
// 字符串长度
int strLength = strings[0].length();
```

# 57. 是否可以从一个静态（static）方法内部发出对非静态（non-static）方法的调用？

**不可以。**

非 static 方法是要与对象实例息息相关的，必须在创建一个对象后，才可以在该对象上进行非 static 方法调用，而 static 方法跟类相关的，不需要创建对象，可 以由类直接调用。

当一个 static 方法被调用时，可能还没有创建任何实例对象，如果从一个 static 方法中发出对非 static 方法的调用，那个非 static 方法是关联到哪个对象上的呢？这个逻辑是不成立的。

因此，一个 static 方法内部不可以发出对非 static 方法的调用。

# 58. String s = new String("jay") 创建了几个字符串对象？

**一个或两个**

- 第一次调用 `new String("jay");` 时，会在堆内存中创建一个字符串对象，同时在字符串常量池中创建一个对象 `"jay"`
- 第二次调用 `new String("jay");` 时，只会在堆内存中创建一个字符串对象，指向之前在字符串常量池中创建的"jay"

# 59. this 和 super 关键字的作用

**this**

- 对象内部指代自身的引用
- 解决成员变量和局部变量同名问题
- 可以调用成员变量，不能调用局部变量
- 可以调用成员方法
- 在普通方法中可以省略 this
- 在静态方法当中不允许出现 this 关键字

**super**

- 调用父类的成员或者方法
- 调用父类的构造函数

# 60. 我们能将 int 强制转换为 byte 类型的变量吗？如果该值大于 byte 类型的范围，将会出现什么现象？

可以，我们可以做强制转换，但是在 Java 中，int 是 32 位，byte 是 8 位，如 果强制做转化，int 类型的高 24 位将会被丢弃。

```java
public class Test {
	public static void main(String[] args) {
		int a = 129;
		byte b = (byte) a;
		System.out.println(b);
		int c = 10;
		byte d = (byte) c;
		System.out.println(d);
}
```

```
输出：
-127
10
```

>**为什么会是-127？**

首先要搞清楚的是计算机对数据的存储方式，在这里有两个概念大家要清楚；

1、反码：反码就是对一个二进制数据逐个取反 如1011010的反码就是0100101。

2、补码：补码很简单，就是在反码的基础上加1，比如上面的反码是0100101，那补码就是0100110

**计算机对数据的存储方式是以补码的形式存储的**，正数的反码和补码都是他的源码，是不不变的，负数的反码补码算法就是上面的1和2规则，且存储的时候**高位为符号位，1表示负数，0表示正数**。

回到问题本身：

129的二进制是010000001，高位为0是正数，转成byte后，应该byte的长度为8位，所以截取了后面8位，变成了10000001，高位就变成了1成了负数，在存储的时候先取反码，取反码时符号位是不变的 即：111111110，补码就是11111111，高位符号位不参与运算，其他的位数算出来是127加上符号就是-127

# 61. float f=3.4 正确吗？

不正确，正确写法：`float f = 3.4f`

# 62. 接口可否继承接口？抽象类是否可实现接口？抽象类是否可继承实体类？

都可以

- 接口可继承接口
- 抽象类可实现接口
- 抽象类可继承实体类

# 63. JDK 7 有哪些新特性

- Try-with-resource 语句 
- NIO2 文件处理 Files 
- switch 可以支持字符串判断条件 
- 泛型推导 
- 多异常统一处理

[Java 程序员必备基础：JDK 5-15 都有哪些经典新特性](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247488058&idx=1&sn=aab4d0dc9020cb62710086474ca90baf&chksm=cf21cd13f8564405040593daa45c62aec218e13f5ff42d679c59f768dd4fcc53ddcf34e0a454&token=162724582&lang=zh_CN&scene=21#wechat_redirect)

# 64. HashMap 是怎样实现的？为什么要用红黑树，而不是二叉树？HashMap 是线程安全的吗？如何保证安全？

## 64.1 HashMap 是怎样实现的？

- JDK1.7 HashMap 的底层数据结构是数组+链表
- JDK1.8 HashMap 的底层数据结构是数组+链表+红黑树

数据元素通过映射关系，即散列函数，映射到桶数组对应索引的位置，插入该位置时，如果发生冲突，从冲突的位置拉一个链表，把冲突元素放到链表。**如果链表长度>8且数组大小>=64，链表转为红黑树。如果红黑树节点个数<6，转为链表。**

>为什么在 1.8 中链表大于 8 时会转为红黑树？

红黑树的平均查找长度是 log(n)，如果长度为 8，平均查找长度为 log(8)=3， 链表的平均查找长度为 n/2，当长度为 8 时，平均查找长度为 8/2=4，这才有转换成树的必要；

>为什么在 1.8 中红黑树节点个数小于 6 时会转为链表？

链表长度如果是小于等于6，6/2=3，而 log(6)=2.6，虽然速度也很快的，但是Hash冲突时转化为树结构和生成树的时间也要花费一定的时间。

## 64.2 为什么要用红黑树，为什么不用二叉树？为什么不用平衡二叉树？

**为什么不用二叉树？**

红黑树是一种平衡的二叉树，其插入、删除、查找的最坏时间复杂度都为 O(logn)，避免了二叉树最坏情况下的 O(n)时间复杂度。

**为什么不用平衡二叉树？**

平衡二叉树是比红黑树更严格的平衡树，为了保持保持平衡，需要旋转的次数更多，也就是说平衡二叉树保持平衡的效率更低，所以平衡二叉树插入和删除的效率比红黑树要低。

# 64.3 HashMap 是线程安全的嘛？如何保证安全？

HashMap 不是线程安全的，多线程下扩容死循环。可以使用 HashTable、Collections.synchronizedMap、以及 ConcurrentHashMap 可以实现线程安全。

- HashTable 是在每个方法加上 synchronized 关键字，粒度比较大；

```java
public synchronized V put(K key, V value) {  
	...
}
```

- Collections.synchronizedMap 是使用 Collections 集合工具的内部类，通过传入 Map 封装出一个 SynchronizedMap 对象，内部定义了一个对象锁，方法内通过对象锁实现；

```java
private static class SynchronizedMap<K,V>  implements Map<K,V>, Serializable {  
    private static final long serialVersionUID = 1978198479659022715L;  
    private final Map<K,V> m;     // Backing Map  
    final Object      mutex;

	...

	public void putAll(Map<? extends K, ? extends V> map) {  
	    synchronized (mutex) {m.putAll(map);}  
	}
}
```

- ConcurrentHashMap 在 JDK1.7 中使用分段锁，在 JDK1.8 中使用 CAS+synchronized。

# 65. HashMap 原理？

[HashMap原理](https://blog.csdn.net/weixin_44360895/article/details/126820361)