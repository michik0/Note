#JUC #高并发

>学习地址：https://www.bilibili.com/video/BV16J411h7Rd/?spm_id_from=333.337.search-card.all.click&vd_source=7852af725225a90b80dc3f7755347ea1

# 1 进程与线程

## 1.1 进程与线程

### 进程

- 程序由指令和数据组成，但这些指令要运行，数据要读写，就必须将指令加载至CPU，数据加载至内存。在指令运行过程中还需要用到磁盘、网络等设备。进程就是用来加载指令、管理内存、管理IO的。
- 当一个程序被运行，从磁盘加载这个程序的代码至内存，这时就开启了一个进程。
- 进程就可以视为程序的一个实例。大部分程序可以同时运行多个实例进程（例如记事本、画图、浏览器等)，也有的程序只能启动一个实例进程（例如网易云音乐、360安全卫士等）

### 线程

- 一个进程之内可以分为一到多个线程。
- 一个线程就是一个指令流，将指令流中的一条条指令以一定的顺序交给CPU执行。
- Java中，线程作为最小调度单位，进程作为资源分配的最小单位。在windows中进程是不活动的，只是作为线程的容器。

### 进程与线程的对比

- 进程基本上相互独立的，而线程存在于进程内，是进程的一个子集。
- 进程拥有共享的资源，如内存空间等，供其内部的线程共享。
- 进程间通信较为复杂
  - 同一台计算机的进程通信称为IPC(Inter-process communication)
  - 不同计算机之间的进程通信，需要通过网络，并遵守共同的协议，例如HTTP
- 线程通信相对简单，因为它们共享进程内的内存，一个例子是多个线程可以访问同一个共享变量
- 线程更轻量，线程上下文切换成本一般上要比进程上下文切换低

## 1.2 并行与并发

### 并发

单核cpu下，线程实际还是 `串行执行` 的。操作系统中有一个组件叫做任务调度器，将cpu的时间片(windows下时间片最小约为I5毫秒)分给不同的线程使用，只是由于cpu在线程间（时间片很短）的切换非常快，人类感觉是同时运行的。总结为一句话就是：`微观串行，宏观并行` 。
一般会将这种线程轮流使用CPU的做法称为并发（concurrent）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230315231704.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230315231745.png)

### 并行

多核cpu下，每个核(core)都可以调度运行线程，这时候线程可以是并行的：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230315231906.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230315231810.png)

>并发(concurrent)是同一时间应对(dealing with)多件事情的能力
>并行(parallel)是同一时间动手做(doing)多件事情的能力

**例子**

- 家庭主妇做饭、打扫卫生、给孩子喂奶，她一个人轮流交替做这多件事，这时就是 `并发`
- 家庭主妇雇了个保姆，她们一起这些事，这时既有并发，也有 `并行`（这时会产生竞争，例如锅只有一口，一个人用锅时，另一个人就得等待)
- 雇了3个保姆，一个专做饭、一个专打扫卫生、一个专喂奶，互不干扰，这时是 `并行`

# 2 Java线程

## 2.1 创建和运行线程

### 方法一：new Thread()

```java
// 创建线程对象  
Thread thread = new Thread() {  
    @Override  
    public void run() {  
        // 要执行的任务  
    }  
};  
// 启动线程  
thread.start();
```

### 方法二：new Thread(Runnable runnable)

```java
Runnable runnable = new Runnable() {  
   @Override  
   public void run() {  
      log.info("running...");  
   }  
};  
Thread thread = new Thread(runnable, "t2");  
thread.start();
```

**简化写法（使用Lambda简化）：**

```java
Runnable runnable = () -> log.info("running...");  
Thread thread = new Thread(runnable, "t2");  
thread.start();
```

### 方法三 FutureTask

FutureTask能够接收Callable类型的参数，用来处理有返回结果的情况。

```java
FutureTask<Integer> futureTask = new FutureTask<>(new Callable<Integer>() {  
   @Override  
   public Integer call() throws Exception {  
      log.info("running...");  
      Thread.sleep(1000);  
      return 100;  
   }  
});  
// 参数1：任务对象；参数2：线程名  
Thread t1 = new Thread(futureTask, "t1");  
t1.start();  
  
// 主线程阻塞，同步等待 task 执行完毕的结果  
log.info(String.valueOf(futureTask.get()));
```

## 2.2 线程运行的原理

### 栈与栈帧

Java Virtual Machine Stacks(Java虚拟机栈)

我们都知道JVM中由堆、栈、方法区所组成，其中栈内存是给谁用的呢？其实就是线程，每个线程启动
后，虚拟机就会为其分配一块栈内存。
- 每个栈由多个栈帧(Frame)组成，对应着每次方法调用时所占用的内存
- 每个线程只能有一个活动栈帧，对应着当前正在执行的那个方法。

>每个线程都有自己的栈内存，栈内存由栈帧组成，每个栈帧对应一次方法的调用

#### 举个例子1：单线程

```java
@Test  
void testFrames() {  
   method1(10);  
}  
  
private void method1(int x) {  
   int y = x + 1;  
   Object m = method2();  
   System.out.println(m);  
}  
  
private Object method2() {  
   Object n = new Object();  
   return n;  
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230316100750.png)

**大致流程：**

1. 创建 `main` 栈帧
2. 程序计数器变为 `method1(10)`，运行至 `method1(10)`，创建 `method1` 栈帧，局部变量表 `x = 10`
3. 程序计数器变为 `int y = x + 1`，`method1` 栈帧局部变量 `y = 11` 
4. 程序计数器变为 `Object m = method2()` ，创建 `method2` 栈帧
5. 程序计数器变为 `Object n = new Object()`，在堆中创建Object对象，`method2` 栈帧局部变量n指向Object对象
6. 程序计数器变为 `return n` ，`method2` 栈帧占用的内存被释放
7. 程序计数器变为 `Object m = method2()` ，m指向堆中的Object对象
8. 程序计数器变为 `System.out.println(m)` ，执行 `System.out.println(m)`，`method1` 栈帧占用的内存被释放
9. 程序计数器变为 `method1(10)`，`main` 栈帧占用的内存被释放

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230316094547.png)

#### 举个例子2：多线程

```java
@Test  
void test() {  
   new Thread(() -> {  
      System.out.println("t thread running...");  
   }, "t").start();  
   System.out.println("thread main running...");  
}
```


**右键断点，变更为Thread才可以看到2个线程的格子栈帧**
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230316170746.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230316170911.png)

### 上下文切换

因为以下一些原因导致cpu不再执行当前的线程，转而执行另一个线程的代码：

- 线程的cpu时间片用完
- 垃圾回收
- 有更高优先级的线程需要运行
- 线程自己调用了sleep、yield、wait、join、park、synchronized、lock等方法

当Context Switch发生时，需要由操作系统保存当前线程的状态，并恢复另一个线程的状态，Java中对应的概念就是程序计数器(Program Counter Register)，它的作用是记住下一条jvm指令的执行地址，是线程私有的。

- 状态包括程序计数器、虚拟机栈中每个栈帧的信息，如局部变量、操作数栈、返回地址等
- Context Switch频繁发生会影响性能

## 2.3 线程常见方法

| 方法名                    | static | 功能说明                                    | 注意                                                                                                                                                                                   |
| ------------------------- | ------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| start()                   |        | 启动一个新线程在新的线程运行run方法中的代码 | start方法只是让线程进入就绪，里面代码不一定立刻运行(CPU的时间片还没分给它)。每个线程对象的start方法只能调用一次，如果调用了多次会出现IllegalThreadStateException                       |
| run()                     |        | 新线程启动后会调用的方法                    | 如果在构造Thread对象时传递了Runnable参数，则线程启动后会调用Runnable中的run方法，否则默认不执行任何操作。但可以创建Thread的子类对象，来覆盖默认行为                                    |
| join()                    |        | 等待线程运行结束                            |                                                                                                                                                                                        |
| join(long n)              |        | 等待线程运行结束，最多等待n秒               |                                                                                                                                                                                        |
| getId()                   |        | 获取线程长整形的id                          | id唯一                                                                                                                                                                                 |
| getName()                 |        | 获取线程名                                  |                                                                                                                                                                                        |
| setName(String name)      |        | 修改线程名                                  |                                                                                                                                                                                        |
| getPriority()             |        | 获取线程优先级                              |                                                                                                                                                                                        |
| setPriority(int priority) |        | 修改线程优先级                              | java中规定线程优先级是1~10的整数，较大的优先级能提高该线程被CPU调度的机率                                                                                                              |
| getState()                |        | 获取线程状态                                | Java中线程状态是用6个enum表示，分别为：NEW，RUNNABLE，BLOCKED，WAITING，TIMED WAITING                                                                                                  |
| isInterrupted()           |        | 线程是否被打断                              | 不会清除 `打断标记`                                                                                                                                                                    |
| isAlive()                 |        | 线程是否存活（还没有运行完毕)               |                                                                                                                                                                                        |
| interrupt()               |        | 打断线程                                    | 如果被打断线程正在sleep，wait，join会导致被打断的线程抛出InterruptedException，并清除 `打断标记`；如果打断的正在运行的线程，则会设置 `打断标记` ；pak的线程被打断，也会设置 `打断标记` |
| interrupted()             | static | 判断当前线程是否被打断                      | 会清除 `打断标记`                                                                                                                                                                      |
| currentThread()           | static | 获取当前正在执行的线程                      |                                                                                                                                                                                        |
| sleep(long n)             | static |                        让当前执行的线程休眠n毫秒，休眠时让出cpu的时间片给其它线程                     |                                                                                                                                                                                       |
| yield()                   | static       |       提示线程调度器让出当前线程对CPU的使用                                      |                                                                                                                                                                                        |

## 2.4 start 与 run

**run**

run称为线程体，包含了要执行的这个线程的内容，方法运行结束，此线程随即终止。直接调用 run 是在主线程中执行了 run，没有启动新的线程，需要顺序执行。

```java
@Test  
public void testRun() {  
    new Thread(() -> {  
        log.info("running...");  
    }, "t1").run();  
}
```

```java
// run 其实依旧是主线程执行
INFO 3544 --- [main] com.duoduo.basicstudy.StartAndRunTest    : running...
```

**start** 

使用 start 是启动新的线程，此线程处于就绪（可运行）状态，通过新的线程间接执行 run 中的代码。

```java
@Test  
public void testStart() {  
    new Thread(() -> {  
        log.info("running...");  
    }, "t2").start();  
}
```

```java
// t2线程执行
INFO 3544 --- [t2] com.duoduo.basicstudy.StartAndRunTest    : running...
```

**区别**

```java
@Test  
public void testRun() {  
        new Thread(() -> {  
            log.info("t1 running...");  
            int a = 1/0;  
        }, "t1").run();  
        log.info("main end...");  
}  
  
@Test  
public void testStart() {  
        new Thread(() -> {  
            log.info("t2 running...");  
            int a = 1/0;  
        }, "t2").start();  
        log.info("main end...");  
}
```

new Thread().run() 无法实现真正的多线程，抛出异常后直接阻断了线程的执行。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230316202546.png)

new Thread().start() 真正意义上的多线程，可以单独捕获异常。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230316202530.png)

## 2.5 sleep 与 yield

**sleep：**

1. 调用 sleep 会让当前线程从 `Running` 进入 `Timed Waiting` 状态
2. 其它线程可以使用 interrupt() 方法打断正在睡眠的线程，这时 sleep() 方法会抛出 InterruptedException
3. 睡眠结束后的线程未必会立刻得到执行
4. 建议用 TimeUnit 的 sleep 代替 Thread 的 sleep 来获得更好的可读性
5. ==sleep不释放锁资源！==

**yield：**

1. 调用 yield 会让当前线程从 Running 进入 Runnable 就绪状态，然后调度执行其他线程
2. 具体的实现依赖于操作系统的任务调度器

在没有利用cpu来计算时，不要让while(true)空转浪费cpu，这时可以使用yield或sleep来让出cpu的使用权给其他程序

```java
while(true) {
	try {
		Thread.sleep(50);
	} catch (InterruptedException e) {
		e.printStackTrace();
	}
}
```

>如果没有 Thread.sleep(50)，在单核情况下CPU会被这个应用程序占满。

## 2.6 线程优先级

- 线程优先级会提示(hint)调度器优先调度该线程，但它仅仅是一个提示，调度器可以忽略它
- 如果cpu比较忙，那么优先级高的线程会获得更多的时间片，但cpu闲时，优先级几乎没作用

设置线程优先级：
```java
thread.setPriority(int priority)
```

>具体是哪个线程优先运行，最终还是取决于操作系统的任务调度器

## 2.7 join 方法

join方法用来等带调用线程的执行结果。

```java
int r = 0;  
  
@Test  
public void testJoin() throws InterruptedException {  
    Thread t = new Thread(() -> {  
        try {  
            TimeUnit.SECONDS.sleep(1);  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
        r = 1;  
    });  
    t.start();  
    // 等待t线程的执行  
    t.join();  
    log.info("r => " + r);  
}
```

【输出】
```java
INFO 5835 --- [main] com.duoduo.basicstudy.JoinTests          : r => 1
```

## 2.8 interrupt 方法详解

### 打断 sleep，wait，join 的线程

```java
@Test  
public void testInterruptSleep() {  
   Thread t1 = new Thread(() -> {  
      try {  
         TimeUnit.SECONDS.sleep(1);  
      } catch (InterruptedException e) {  
         throw new RuntimeException(e);  
      }  
   }, "t1");  
   t1.start();  
   t1.interrupt();  
   log.info("t1线程被打断的状态:{}", t1.isInterrupted());  
}
```

⚠️upload failed, check dev console

### 打断正常运行的线程

```java
@Test  
public void testInterruptRunningThread() {  
   Thread t1 = new Thread(() -> {  
      while (true) {  
         log.info("t1线程正在运行中...");  
         if (Thread.currentThread().isInterrupted()) {  
            log.info("t1线程被打断...");  
            break;  
         }  
      }  
   }, "t1");  
   t1.start();  
   t1.interrupt();  
}
```

```java
2023-03-16 22:01:47.283  INFO 7634 --- [t1] c.d.b.BasicStudyApplicationTests         : t1线程正在运行中...
2023-03-16 22:01:47.283  INFO 7634 --- [t1] c.d.b.BasicStudyApplicationTests         : t1线程被打断...

```

### 两阶段终止模式

```java
@Test  
public void testTwoPhaseTermination() throws InterruptedException {  
   // 启动监控线程  
   monitor = new Thread(() -> {  
      while (true) {  
         Thread currentThread = Thread.currentThread();  
         if (currentThread.isInterrupted()) {  
            log.info("开始最后的业务处理...");  
            break;  
         }  
         try {  
            TimeUnit.SECONDS.sleep(1);  
            log.info("进行线程的监控...");  
         } catch (InterruptedException e) {  
            currentThread.interrupt();  
         }  
      }  
   }, "monitor");  
   monitor.start();  
  
   TimeUnit.SECONDS.sleep(5);  
   monitor.interrupt();  
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230316220319.png)

### 打断 park 线程

thread.park() 会使当前线程阻塞，被打断后，后续的 thread.park() 将不会阻塞

[[#^4eaca8|参考附录park()相关的所有知识]]

```java
@Test  
public void interruptPark() throws InterruptedException {  
   Thread t1 = new Thread(() -> {  
      log.info("park...");  
      LockSupport.park();  
      log.info("unpark...");  
      log.info("打断的状态为:{}", Thread.currentThread().isInterrupted());  
      LockSupport.park();  
   }, "t1");  
   t1.start();  
   TimeUnit.SECONDS.sleep(1);  
   t1.interrupt();  
}
```

## 2.9 不推荐的方法

下面这些方法已经过时，容易破坏同步代码块，造成线程死锁

| 方法名    | static | 功能说明             |
| --------- | ------ | -------------------- |
| stop()    |        | 停止线程运行        |
| suspend() |        | 挂起（暂停）线程运行 |
| resume()  |        | 恢复线程运行                     |

## 2.10 主线程与守护线程

默认情况下，Java进程需要等待所有线程都运行结束，才会结束。有一种特殊的线程叫做**守护线程**，只要其它非守护线程运行结束了，即使守护线程的代码没有执行完，也会强制结束。

```java
public static void main(String[] args) throws InterruptedException {  
    Thread t1 = new Thread(() -> {  
        while (true) {  
            log.info("running...");  
            if (Thread.currentThread().isInterrupted())  
                break;  
        }  
    }, "t1");  
    // Thread 默认是非守护线程
    t1.setDaemon(false);  
    t1.start();  
    TimeUnit.SECONDS.sleep(3);  
    log.info("main end...");  
}
```

**设置守护线程**

如果设置守护线程，那么主线程执行结束，其守护线程也将强制结束

```java
thread.setDaemon(true);  
```

**设置非守护线程**

如果设置非守护线程，那么主线程执行结束，该线程也不会结束

```java
thread.setDaemon(false);  
```




## 2.11 线程的五种状态（操作系统层面）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230317142449.png)

**初始状态**

仅是在语言层面创建了线程对象，还未与操作系统线程关联

**可运行状态（就绪状态）**

指该线程已经被创建（与操作系统线程关联），可以由CPU调度执行

**运行状态**

- 指获取了CPU时间片运行中的状态
- 当CPU时间片用完，会从【运行状态】转换至【可运行状态】，会导致线程的上下文切换

**阻塞状态**

- 如果调用了阻塞API，如BIO读写文件，这时该线程实际不会用到CPU，会导致线程上下文切换，进入【阻塞状态】
- 等BIO操作完毕，会由操作系统唤醒阻塞的线程，转换至【可运行状态】
- 与【可运行状态】的区别是，对【阻塞状态】的线程来说只要它们一直不唤醒，调度器就一直不会考虑调度它们

**终止状态**

表示线程已经执行完毕，生命周期已经结束，不会再转换为其他状态

## 2.12 线程的六种状态（Java API层面）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230317142753.png)

**NEW**

线程刚被创建，但是还没调用 `start()` 方法

**RUNNABLE**

`RUNNABLE` 当调用了 `start()` 方法之后，注意，`Java API` 层面的 `RUNNABLE` 状态涵盖了==操作系统层面==的
【可运行状态】、【运行状态】和【阻塞状态】（由于BIO导致的线程阻塞，在Java里无法区分，仍然认为是可运行)

**BLOCKED，WAITING，TIMED_WAITING**

BLOCKED，WAITING，TIMED_WAITING都是Java API层面对【阻塞状态】的细分，后面会在状态转换一节详述

**TERMINATED**

线程代码运行结束后，状态变为 TERMINATED

```java
public static void main(String[] args) throws InterruptedException {  
    // NEW状态  
    Thread t1 = new Thread(() -> {  
        log.info("t1 running...");  
    }, "t1");  
  
    Thread t2 = new Thread(() -> {  
        while (true) {  
  
        }  
    }, "t2");  
    t2.start();  
  
    // TERMINATED  
    Thread t3 = new Thread(() -> {  
    }, "t3");  
    t3.start();  
  
    Thread t4 = new Thread(() -> {  
        synchronized (TestThreadStatus.class) {  
            try {  
                TimeUnit.SECONDS.sleep(10000);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }  
    }, "t4");  
    t4.start();  
  
    Thread t5 = new Thread(() -> {  
        try {  
            t2.join();  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
    }, "t5");  
    t5.start();  
  
    Thread t6 = new Thread(() -> {  
        synchronized (TestThreadStatus.class) {  
            try {  
                TimeUnit.SECONDS.sleep(100000);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }  
    }, "t6");  
    t6.start();  
  
    TimeUnit.SECONDS.sleep(2);  
  
    log.info("t1 state:{}", t1.getState());  
    log.info("t2 state:{}", t2.getState());  
    log.info("t3 state:{}", t3.getState());  
    log.info("t4 state:{}", t4.getState());  
    log.info("t5 state:{}", t5.getState());  
    log.info("t6 state:{}", t6.getState());  
}
```

```java
22:24:13.599 [main] INFO com.duoduo.TestThreadStatus - t1 state:NEW
22:24:13.613 [main] INFO com.duoduo.TestThreadStatus - t2 state:RUNNABLE
22:24:13.614 [main] INFO com.duoduo.TestThreadStatus - t3 state:TERMINATED
22:24:13.614 [main] INFO com.duoduo.TestThreadStatus - t4 state:TIMED_WAITING
22:24:13.614 [main] INFO com.duoduo.TestThreadStatus - t5 state:WAITING
22:24:13.614 [main] INFO com.duoduo.TestThreadStatus - t6 state:BLOCKED

```

# 3 共享模型之管程

## 3.1 多线程下共享变量带来的问题

```java
int count = 0;

@Test  
public void test() throws InterruptedException {  
   Thread t1 = new Thread(() -> {  
      for (int i = 0; i < 5000; i++) {  
         count++;  
      }  
   }, "t1");  
  
   Thread t2 = new Thread(() -> {  
      for (int i = 0; i < 5000; i++) {  
         count--;  
      }  
   }, "t2");  
  
   t1.start();  
   t2.start();  
   t1.join();  
   t2.join();  
   log.info("count:{}", count);  
}
```

**发现输出结果并不为1**

```java
INFO 25677 --- [main] c.d.b.BasicStudyApplicationTests         : count:-748

```

### 1 问题分析

以上的结果可能是正数、负数、零，为什么呢？

因为Jav中对静态变量的自增，自减并不是原子操作，要彻底理解，必须从字节码来进行分析。

例如对于 i++ 而言（为静态变量），实际会产生如下的JVM字节码指令：

```java
getstatic     i     // 获取静态变量i的值
iconst_1             // 准备常量1
iadd                    // 自增
putstatic    i     // 将修改后的值存入静态变量
```

而对应 i-- 也类似

```java
getstatic     i     // 获取静态变量i的值
iconst_1             // 准备常量1
iadd                    // 自减
putstatic    i     // 将修改后的值存入静态变量
```

Java中的内存模型如下，完成静态变量的自增、自减需要再主存和工作内存中进行数据交换：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230317230536.png)

**单线程**

如果是单线程以上8行代码是顺序执行（不会交错）没有问题：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230317230615.png)

**多线程**

多线程下这8行代码可能交错运行，出现负数的情况:

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230317230918.png)

多线程下这8行代码可能交错运行，出现正数的情况:

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230317231019.png)

### 2 临界区（Critical Section）

- 一个程序运行多个线程本身是没有问题的
- 问题出在多个线程访问共享资源
	- 多个线程读共享资源其实也没有问题
	- 在多个线程对共享资源读写操作时发生**指令交错**，就会出现问题
- 一段代码块内如果存在对共享资源的多线程读写操作，称这段代码块为**临界区**

例如，下面代码中的临界区

```java
static int counter = 0;

static void increment() {
	// 临界区
	counter++;
}

static void decrement() {
	// 临界区
	counter--;
}
```

### 3 竞态条件（Race Condition）

多个线程在临界区内执行，由于代码的执行序列不同而导致结果无法预测，称之为发生了**竞态条件**

## 3.2 synchronized  解决方案

为了避免临界区的竞态条件发生，有多种手段可以达到目的。

- 阻塞式的解决方案：synchronized, Lock
- 非阻塞式的解决方案：原子变量

本次课使用阻塞式的解决方案：synchronized，来解决上述问题，即俗称的[对象锁]，它采用互斥的方式让同一时刻至多只有一个线程能持有[对象锁]，其它线程再想获取这个[对象锁]时就会阻塞住。这样就能保证拥有锁的线程可以安全的执行临界区内的代码，不用担心线程上下文切换

>注意

虽然java 中互斥和同步都可以采用 synchronized关键字来完成，但它们还是有区别的：

- 互斥是保证临界区的竞态条件发生，同一时刻只能有一个线程执行临界区代码
- 同步是由于线程执行的先后、顺序不同、需要一个线程等待其它线程运行到某个点

**synchronized 语法**

```java
synchronized(对象)
{
	// 临界区

}
```

**解决**

```java
@Test  
public void test() throws InterruptedException {  
   Thread t1 = new Thread(() -> {  
      for (int i = 0; i < 5000; i++) {  
         synchronized (lock) {  
            count++;  
         }  
      }  
   }, "t1");  
  
   Thread t2 = new Thread(() -> {  
      for (int i = 0; i < 5000; i++) {  
         synchronized (lock) {  
            count--;  
         }  
      }  
   }, "t2");  
  
   t1.start();  
   t2.start();  
   t1.join();  
   t2.join();  
   log.info("count:{}", count);  
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318085835.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318085913.png)

>思考

synchronized实际是用**对象锁**保证了**临界区内代码的原子性**，临界区内的代码对外是不可分割的，不会被线程切换所打断。

Q1：如果把 synchronized(obj)放在for循环的外面，如何理解?
A1：那么将会把所有循环变为原子操作，在循环期间其他线程无法正常执行。

Q2：如果t1 synchronized(obj1)而，t2 synchronized(obj2)会怎样运作?
A2：由于竞争的不是同一个对象，将不会相互影响。

Q3：如果t1 synchronized(obj)，t2没有加会怎么样?
A3：由于t2没加锁，还是会出现发生竞态条件。

## 3.3 方法上的 synchronized 

### synchronized 修饰非静态方法

synchronized 修饰非静态方法相当于给当前的类的实例对象上了个锁

```java
class Test{
	public synchronized void test() {
		// ...
	}
}

等价于

class Test{
	public void test() {
		synchronized(this) {
			// ...
		}
	}
}
```

**举个例子**

```java
@Slf4j  
public class TestSynchronized {  
  
    public static void main(String[] args) throws InterruptedException {  
        MyLock lock1 = new MyLock();  
        Thread t1 = new Thread(() -> {  
            // lock1 对象进行上锁  
            lock1.incr();  
        }, "t1");  
        t1.start();  
        TimeUnit.MILLISECONDS.sleep(1);  
  
        MyLock lock2 = new MyLock();  
        // lock2 未被上锁，所以不会被阻塞  
        lock2.getCount();  
  
        // lock1 由于被t1线程上锁，因此暂时会被阻塞  
        lock1.getCount();  
  
    }  
}  
  
@Slf4j  
class MyLock {  
    private static int count = 0;  
  
    public synchronized void incr() {  
        while(true) {  
            count++;  
        }  
    }  
  
    public synchronized int getCount() {  
        return count;  
    }  
}
```

### synchronized 修饰静态方法

synchronized 修饰静态方法相当于给当前的类上了个锁

```java
class Test{
	public synchronized static void test() {
		// ...
	}
}

等价于

class Test{
	public void test() {
		synchronized(Test.class) {
			// ...
		}
	}
}
```

**举个例子**

```java
@Slf4j  
public class TestSynchronized {  
  
    public static void main(String[] args) throws InterruptedException {  
        Thread t1 = new Thread(() -> {  
            MyLock.incr();  
        }, "t1");  
        t1.start();  
        TimeUnit.MILLISECONDS.sleep(1);  
        // 这个方法将会等线程t1释放后锁后才会执行
        MyLock.getCount();  
    }  
}  
  
@Slf4j  
class MyLock {  
    private static int count = 0;  
  
    public synchronized static void incr() {  
        while(true) {  
            count++;  
        }  
    }  
  
    public synchronized static int getCount() {  
        return count;
    }  
}
```

### 线程八锁

**情况一**

```java
@Slf4j(topic = "с.Number")
class Number{
	public synchronized void a() {
		log.debug("1");
	}
	
	public synchronized void b() {
		log.debug("2");
	}
	
	public static void main(String[] args) { 
		Number n1 = new Number();
	}
	new Thread(()->{ 
		n1.a(); 
	}).start(); 
	new Thread(()->{ 
		n1.b(); 
	}).start(); 
}
```

输出结果为：

- 1 -> 2
- 2 -> 1

**情况二**

```java
@Slf4j(topic = "с.Number")
class Number{
	public synchronized void a() {
		sleep(1);
		log.debug("1");
	}
	
	public synchronized void b() {
		log.debug("2");
	}
	
	public static void main(String[] args) { 
		Number n1 = new Number();
	}
	new Thread(()->{ 
		n1.a(); 
	}).start(); 
	new Thread(()->{ 
		n1.b(); 
	}).start(); 
}

```

输出结果为：

- （1秒后）1 -> 2
- 2（1秒后） -> 1

**情况三**

```java
@slf4j(topic = "с.Number")
class Number{
	public synchronized void a() { 
		sleep(1);
		log.debug("1");
	}
	public synchronized void b() {
		log.debug("2");
	}
	public void c() {
	log.debug("3");
	}
}

public static void main(String[] args) { 
	Number n1 = new Number();
	new Thread(()->{
		n1.a(); 
	}).start(); 
	
	new Thread(()->{ 
		n1.b(); 
	}).start(); 
	
	new Thread(()->{ 
		n1.c(); 
	}).start();
}
```

输出结果为：

- 3（1秒后）-> 1 -> 2
- 3 -> 2（1秒后）-> 1
- 2 -> 3 -> （1秒后）1

**情况四**

```java
@slf4j(topic = "c. Number")
class Number{
	public synchronized void a() { 
		sleep(1);
		log.debug("1");
	}
	public synchronized void b() { 
		log.debug("2");
	}

public static void main(String[] args) { 
	Number n1 = new Number();
	Number n2 = new Number();
	new Thread(()->{ 
		n1.a(); 
	}).start(); 
	new Thread(()->{ 
		n2.b(); 
	}).start();
}
```

输出结果：

- 2（1秒后） -> 1

**情况五**

```java
@slf4j(topic = "c. Number")
class Number{
	public static synchronized void a() { 
		sleep(1);
		log.debug("1");
	}
	public synchronized void b() { 
		log.debug("2");
	}

public static void main(String[] args) { 
	Number n1 = new Number();
	new Thread(()->{ 
		n1.a(); 
	}).start(); 
	new Thread(()->{ 
		n1.b(); 
	}).start();
}
```

输出结果：

- 2（一秒后） -> 1

**情况六**

```java
@slf4j(topic = "c. Number")
class Number{
	public static synchronized void a() { 
		sleep(1);
		log.debug("1");
	}
	public static synchronized void b() { 
		log.debug("2");
	}

public static void main(String[] args) { 
	Number n1 = new Number();
	new Thread(()->{ 
		n1.a(); 
	}).start(); 
	new Thread(()->{ 
		n1.b(); 
	}).start();
}
```

输出结果：

- （1秒后）1 -> 2
- 2 （1秒后）-> 1

**情况七**

```java
@slf4j(topic = "c. Number")
class Number{
	public static synchronized void a() { 
		sleep(1);
		log.debug("1");
	}
	public synchronized void b() { 
		log.debug("2");
	}

public static void main(String[] args) { 
	Number n1 = new Number();
	Number n2 = new Number();
	new Thread(()->{ 
		n1.a(); 
	}).start(); 
	new Thread(()->{ 
		n2.b(); 
	}).start();
}
```

输出结果：

- 2 （1秒后）-> 1

**情况八**

```java
@slf4j(topic = "c. Number")
class Number{
	public static synchronized void a() { 
		sleep(1);
		log.debug("1");
	}
	public static synchronized void b() { 
		log.debug("2");
	}

public static void main(String[] args) { 
	Number n1 = new Number();
	Number n2 = new Number();
	new Thread(()->{ 
		n1.a(); 
	}).start(); 
	new Thread(()->{ 
		n2.b(); 
	}).start();
}
```

输出结果：
- （1秒后）1 -> 2
- 2（1秒后）-> 1

## 3.4 变量的线程安全分析

### 1 成员变量与静态变量是否线程安全？

- 如果它们没有共享，则线程安全
- 如果它们被共享，根据它们的状态是否能够改变，又分两种情况：
	- 如果只有读操作，则线程安全
	- 如果有读写操作，则这段代码是临界区，需要考虑线程安全

### 2 局部变量是否线程安全？

局部变量是线程安全的，但局部变量引用的对象则未必：
- 如果该对象没有逃离方法的作用访问，它是线程安全的。
- 如果该对象逃离方法的作用范围，需要考虑线程安全。

### 3 局部变量线程安全分析

```java
public static void test1() {
	int i= 10;
	i++;
}
```

每个线程调用test1()方法时局部变量i，会在每个线程的栈帧内存中被创建多份，因此不存在共享。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318104731.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318105017.png)

#### 局部变量引用安全分析

```java
static final int THREAD_NUMBER = 2;
static final int LOOP_NUMBER = 200;

public static void main(String[] args) {
	ThreadUnsafe test = new ThreadUnsafe(); 
	for (int i = 0; i < THREAD_NUMBER; i++) { 
		new Thread(() -> {
			test.methodl(LOOP_NUMBER);
		}, name: "Thread" + (i+1)).start();
	}
}

class ThreadUnsafe {
	ArrayList«String> list = new ArrayList<>(); 
	public void method1(int loopNumber) {
		for (int i = 0; i < loopNumber; i++) { 
			method2();
			method3();
		}
	}
	private void method2() { 
		list.add("1");
	}
	
	private void method3() { 
		list.remove(0);
	}
}
```

其中一种情况是，如果线程2还未add，线程1中remove就会报错

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318110508.png)

分析:
- 无论哪个线程中的 method2 引用的都是同一个对象中的 list 成员变量
- method3 与 method2 分析相同

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318105843.png)

**将 list 成员变量修改为局部变量**

```java
class ThreadSafe {
	public final void method1(int loopNumber) {
	ArrayList<String> list = new Arraylist<>(); 
	for (int i = 0; i< loopNumber; i++) {
		method2(list);
		method3(list);
	}
	private void method2(ArrayList<String> list) { 
		list.add("1");
	}
	private void method3(Arraylist<String> list) { 
		list.remove(0);
	}
}
```

那么就不会有上述问题了，分析：

- list 是局部变量，每个线程调用时会创建其不同实例，没有共享
- method2 的参数是从 method1 中传递过来的，与method1 中引用同一个对象；method3的参数分析与method2 相同

#### 局部变量暴露引用安全分析

方法访问修饰符带来的思考，如果把 method2 和 method3 的方法修改为 public 会不会代理线程安全问题？

**情况一：** 有其它线程调用 method2和 method3

该情况不会出现问题，因为由于 list 是局部变量，因此两个线程创建的局部变量是堆中的不同对象，所以==不会出现资源共享的问题==

**情况二：** 在情况1的基础上，为ThreadSafe类添加子类，子类覆盖method2或method3方法，即：

```java
class ThreadSafe {
	public void methodl(int loopNumber) {
	ArrayList<String> list = new ArrayList<>(); 
	for (int i = 0; i < loopNumber; i++) {
		method2(list);
		method3(list);
	}
	public void method2(ArrayList<String> list) {
		list.add("1");
	}
	public void method3(Arraylist<String> list) { 
		list.remove(0);
	}
}

class ThreadSafeSubclass extends ThreadSafe{ 
	@Override
	public void method3(Arraylist<String> list) {
		new Thread(() -> {
			list.remove(0);
		}).start();
	}
}
```

该情况会出现问题，即使 list 是局部变量，但是在 method3 中，将当前线程中的 list 对象的引用进行传递，在 method3 中又开启了一个线程，会发生多个线程针对同一个 list 资源的抢夺，==会发生竞态条件。==

==从这个例子可以看出 private 或 final提供【安全】的意义所在，请体会开闭原则中的【闭】==

### 4 常见的线程安全类

- String
- Integer
- StringBuffer
- Random
- Vector
- Hashtable
- java.util.concurrent包下的类

这里说它们是线程安全的是指，多个线程调用它们同一个实例的某个方法时，是线程安全的。也可以理解为
- 它们的每个方法是原子的
- ==但注意它们多个方法的组合不是原子的==，见后面分析

#### 线程安全类方法的组合

**举个例子**

Hashtable 中的 get() 与 put() 方法都是原子性的，但是组合不一定，比如：

```java
Hashtable table = new Hashtable(); 
if( table.get("key") == null) {
	table.put("key", value); 
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318112552.png)

导致线程2中的操作无效，会导致后续程序处理的错误！

#### 不可变类线程安全性

String、Integer 等都是不可变类，因为其内部的状态不可以改变，因此它们的方法都是线程安全的

有同学或许有疑问，String有replace()，substring()等方法可以改变值啊，那么这些方法又是如何保证线程安全的呢?

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318113222.png)



## 3.5 Monitor 概念

### Java 对象头

^ff3123

在 Java 对象模型中，每个对象的头部都有三部分组成：Mark Word 、Klass Word、数组长度。 每个对象的锁标识，就在 Mark Word这部分中。

以 32 位虚拟机为例

**普通对象**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318150504.png)

**数组对象**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318150535.png)

**其中 Mark Word 结构为**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318150720.png)

Monitor 被翻译为 **监视器** 或 **管程**

Java虚拟机给每个对象和class字节码都设置了一个监听器Monitor，用于检测并发代码的重入，同时在Object类中还提供了notify和wait方法来对线程进行控制。

### Monitor 机制

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318152705.png)

Monitor可以类比为一个特殊的房间，这个房间中有一些被保护的数据，Monitor保证每次只能有一个线程能进入这个房间进行访问被保护的数据，进入房间即为持有Monitor，退出房间即为释放Monitor。

当一个线程需要访问受保护的数据（即需要获取对象的Monitor）时，它会首先在entry-set入口队列中排队（这里并不是真正的按照排队顺序），如果没有其他线程正在持有对象的Monitor，那么它会和entry-set队列和wait-set队列中的被唤醒的其他线程进行竞争（即通过CPU调度），选出一个线程来获取对象的Monitor，执行受保护的代码段，执行完毕后释放Monitor，如果已经有线程持有对象的Monitor，那么需要等待其释放Monitor后再进行竞争。

再说一下wait-set队列。当一个线程拥有Monitor后，经过某些条件的判断（比如用户取钱发现账户没钱），这个时候需要调用Object的wait方法，线程就释放了Monitor，进入wait-set队列，等待Object的notify方法（比如用户向账户里面存钱）。当该对象调用了notify方法或者notifyAll方法后，wait-set中的线程就会被唤醒，然后在wait-set队列中被唤醒的线程和entry-set队列中的线程一起通过CPU调度来竞争对象的Monitor，最终只有一个线程能获取对象的Monitor。

>需要注意的是：
>
>-   **当一个线程在wait-set中被唤醒后，并不一定会立刻获取Monitor，它需要和其他线程去竞争**
>- **如果一个线程是从wait-set队列中唤醒后，获取到的Monitor，它会去读取它自己保存的PC计数器中的地址，从它调用wait方法的地方开始执行。[[#栈与栈帧|参考栈帧]]**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318144817.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318143725.png)

- 刚开始 Monitor 中 Owner 为 null
- 当 Thread-2 执行 synchronized(obj) 就会将 Monitor 的所有者 Owner 置为 Thread-2 ，Monitor 中只能有一个Owner
- 在 Thread-2 上锁的过程中，如果 Thread-3，Thread-4，Thread-5 也来执行 synchronized(obj) ，就会进入EntryList BLOCKED（阻塞状态）
- Thread-2 执行完同步代码块的内容，然后唤醒 EntryList 中等待的线程来竞争锁，竞争的时是非公平的
- 图中 WaitSet 中的Thread-0, Thread-1是之前获得过锁，但条件不满足进入 WAITING 状态的线程

>注意
>
>synchronized 必须是进入同一个对象的 monitor 才有上述的效果（synchronized(obj1) 与 synchronized(obj2) 的 monitor是不同的，互不干扰）
>
>不加 synchronized 的对象不会关联监视器，不遵从以上规则

[[#Monitor 上锁 / 释放锁过程分析|参考 ObjectMonitor.cpp 上锁 / 释放锁过程]]

## 3.6 synchronized 进阶原理

### 小故事

故事角色

- 老王：JVM
- 小南：线程1
- 小女：线程2
- 房间：竞争对象
- 房间门上（防盗锁）：Monitor
- 房间门上（小南书包）：轻量级锁
- 房间门上（刻上小南大名）：偏向锁
- 批量重刻名：一个类的偏向锁撤销到达20阈值
- 不能刻名字：批量撤销该类对象的偏向锁，设置该类不可偏向

小南要使用房间保证计算不被其它人干扰（原子性），最初，他用的是防盗锁，当上下文切换时，锁住门。这样，即使他离开了，别人也进不了门，他的工作就是安全的。

但是，很多情况下没人跟他来竞争房间的使用权。小女是要用房间，但使用的时间上是错开的，小南白天用，小女晚上用。每次上锁太麻烦了，有没有更简单的办法呢？

小南和小女商量了一下，约定不锁门了，而是谁用房间，谁把自己的书包挂在门口，但他们的书包样式都一样，因此每次进门前得翻翻书包，看课本是谁的，如果是自己的，那么就可以进门，这样省的上锁解锁了。万一书包不是自己的，那么就在门外等，并通知对方下次用锁门的方式。

后来，小女回老家了，很长一段时间都不会用这个房间。小南每次还是挂书包，翻书包，虽然比锁门省事，但是扔觉得麻烦。

于是，小南干脆在门上刻上了自己的名字:【小南专属房间，其它人勿用】，下次来用房间时，只要名字还在，那么说明没人打扰，还是可以安全地使用房间。如果这期间有其它人要用这个房间，那么由使用者将小南刻的名字擦掉，升级为挂书包的方式。

同学们都放假回老家了，小南就膨胀了，在20个房间刻上了自己的名字，想进哪个进哪个。后来他自己放假回老家了，这时小女回来了(她也要用这些房间)，结果就是得一个个地擦掉小南刻的名字，升级为挂书包的方式。老王觉得这成本有点高，提出了一种批量重刻名的方法，他让小女不用挂书包了，可以直接在门上刻上自己的名字。

后来，刻名的现象越来越频繁，老王受不了了，决定这些房间都不能刻名了，只能挂书包。

### 1 轻量级锁

轻量级锁的使用场景：如果一个对象虽然有多线程访问，但多线程访问的时间是错开的(也就是没有竞争)，那么可以使用轻量级锁来优化。

轻量级锁对使用者是透明的，即语法仍然是synchronized

假设有两个方法同步块，利用同一个对象加锁

```java
static final Object obj = new Object();
public static void method1() {
	synchronized(obj) {
		// 同步块A
		method2();
	}
}

public static void method2() {
	synchronized(obj) {
		// 同步块B
	}
}
```

- 创建锁记录(Lock Record)对象，每个线程的栈帧都会包含一个锁记录的结构，内部可以存储锁定对象的Mark Word

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318161502.png)

- 让锁记录中Object reference指向锁对象，并尝试用 CAS 替换 Object 的 Mark Word，将 Mark Word 的值存入锁记录，此时对象的 Mark Word 变为**轻量锁**状态

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318161533.png)

- 如果 CAS 替换成功，对象头中存储了锁记录地址和状态00，表示由该线程给对象加锁，这时图示如下

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318161640.png)

- 如果 CAS 失败，有两种情况：
	- 如果是其它线程已经持有了该Object的轻量级锁，这时表明有竞争，**进入锁膨胀过程**
	- 如果是自己执行了 synchronized 锁重入，那么再添加一条 Lock Record 作为重入的计数 ^2360e5

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319093140.png)

- 当退出 synchronized 代码块(解锁时)：
	- 如果锁记录为 null ，表示有重入，这时重置锁记录，重入计数减一。
	- 如果锁记录不为 null，这时使用 CAS 将 Mark Word 的值恢复给对象头
		- 成功：表示解锁成功
		- 失败：说明轻量级锁进行了锁膨胀或已经升级为重量级锁，**进入重量级锁**解锁流程

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319093209.png)

### 2 锁膨胀

如果在尝试加轻量级锁的过程中，CAS 操作无法成功，这时一种情况就是有其它线程为此对象加上了轻量级
锁（有竞争），这时需要进行锁膨胀，将轻量级锁变为重量级锁。

```java
static Object obj = new Object();
public static void method1() {
	synchronized(obj) {
		// 同步块
	}
}
```

- 当 Thread-1进行轻量级加锁时，Thread-0已经对该对象加了轻量级锁

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318163000.png)

- 这时 Thread-1 加轻量级锁失败，进入锁膨胀流程
	- 即为Object对象申请Monitor锁，让Object指向重量级锁地址
	- 然后自己进入 Monitor 的 EntryList BLOCKED

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318163217.png)

- 当 Thread-0 退出同步块解锁时，使用 CAS 将 Mark Word的值恢复给对象头，此时由于对象中记录头地址已经发生改变了，所以CAS失败。这时会进入重量级解锁流程，即按照 Monitor 地址找到 Monitor 对象，设置Owner 为 null，唤醒 EntryList 中 BLOCKED 线程。

### 3 自旋优化

重量级锁竞争的时候，还可以使用自旋来进行优化，如果当前线程自旋成功（即这时候持锁线程已经退出了
同步块，释放了锁），这时当前线程就可以避免阻塞（避免上下文切换）。

**自旋重试成功的情况**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318163907.png)

**自旋重试失败的情况**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318164331.png)

- 在Java 6之后自旋锁是自适应的，比如对象刚刚的一次自旋操作成功过，那么认为这次自旋成功的可能性会高，就多自旋几次；反之，就少自旋甚至不自旋，总之，比较智能。

- 自旋会占用CPU时间，单核CPU自旋就是浪费（因为单核CPU在某个时间片只能分配给1个线程），多核CPU自旋才能发挥优势。

- Java 7之后不能控制是否开启自旋功能

### 4 偏向锁

轻量级锁在没有竞争时（就自己这个线程），每次重入仍然需要执行CAS操作（[[#^2360e5|参考锁重入时进行CAS操作]]）。

Java 6 中引入了偏向锁来做进一步优化：只有第一次使用  CAS 将线程ID设置到对象的 Mark Word头，之后发现这个线程ID是自己的就表示没有竞争，不用重新CAS。以后只要不发生竞争，这个对象就归该线程所有。

```java
static final Object obj = new Object();
public static void m1() {
	synchronized(obj) {
		// 同步块A
		m2();
	}
}
public static void m2() {
	synchronized(obj) {
		// 同步块B
		m3();
	}
}
public static void m3() {
	synchronized(obj) {
		// 同步块C
	}
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318165340.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318165352.png)

#### 偏向状态

[[#^ff3123|回忆下对象头格式]]

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318165519.png)

一个对象创建时：

- 如果开启了偏向锁（默认开启），那么对象创建后，markword 值为 0x05 即最后3位为101，这时它的thread、epoch、age都为0
- 偏向锁是默认是延迟的，不会在程序启动时立即生效，如果想避免延迟，可以加VM参数 -XX:BiasedLockingStartupDelay=o 来禁用延迟
- 如果没有开启偏向锁，那么对象创建后，markword值为 0x01 即最后3位为001，这时它的 hashcode、age 都为0，第一次用到hashcode时才会赋值

**测试偏向锁**

```xml
<!-- https://mvnrepository.com/artifact/org.openjdk.jol/jol-core -->
<dependency>
    <groupId>org.openjdk.jol</groupId>
    <artifactId>jol-core</artifactId>
    <version>0.16</version>
    <scope>provided</scope>
</dependency>

```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319091810.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319091823.png)

处于偏向锁的对象解锁后，线程id（前54位）仍存储于对象头中

**测试禁用偏向锁**

在上面测试代码运行时在添加VM参数 `-XX:-UseBiasedLocking` 禁用偏向锁

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319092305.png)

#### 撤销偏向锁

##### 调用对象 hashcode 方法撤销偏向状态

调用了对象的hashCode，但偏向锁的对象MarkWord 中存储的是线程id，如果调用hashCode 会导致偏向锁被撤销
- 轻量级锁会在锁记录中记录 hashCode
- 重量级锁会在Monitor 中记录 hashCode

>在调用 hashCode后使用偏向锁，记得去掉 -xx:-UseBiasedLocking

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319093648.png)

##### 其他线程使用对象撤销偏向状态

当有其它线程使用偏向锁对象时，会将偏向锁升级为轻量级锁

```java
public static void main(String[] args) {  
    Dog d = new Dog();  
    ClassLayout classLayout = ClassLayout.parseInstance(d);  
    new Thread(() -> {  
        log.info("synchronized 前");  
        System.out.println(classLayout.toPrintable());  
        synchronized (d) {  
            log.info("synchronized 中");  
            System.out.println(classLayout.toPrintable());  
        }  
        log.info("synchronized 后");  
        System.out.println(classLayout.toPrintable());  
        synchronized (TestBiased.class) {  
            TestBiased.class.notify();  
        }  
    }, "t1").start();  
  
    new Thread(() -> {  
        synchronized (TestBiased.class) {  
            try {  
                TestBiased.class.wait();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }  
        log.info("synchronized 前");  
        System.out.println(classLayout.toPrintable());  
        synchronized (d) {  
            log.info("synchronized 中");  
            System.out.println(classLayout.toPrintable());  
        }  
        log.info("synchronized 后");  
        System.out.println(classLayout.toPrintable());  
    }, "t2").start();  
}
```

**输出结果（这里只抽取Mark Word信息）：**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319112734.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230319112902.png)

##### 调用 wait/notify 撤销偏向状态

```java
public class TestBiased {  
    public static void main(String[] args) {    
        Dog d = new Dog();  
        ClassLayout classLayout = ClassLayout.parseInstance(d);  
        Thread t1 = new Thread(() -> {  
  
            synchronized (d) {  
                try {  
                    log.info("t1线程wait()前Mark Word状态");  
                    log.info(classLayout.toPrintable(d));  
                    d.wait();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
            synchronized (TestBiased.class) {  
                TestBiased.class.notify();  
            }  
        }, "t1");  
        t1.start();  
  
        Thread t2 = new Thread(() -> {  
            try {  
                TimeUnit.SECONDS.sleep(1);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
            synchronized (d) {  
                log.info("t2线程wait()后Mark Word状态");  
                log.info(classLayout.toPrintable(d));  
            }  
        }, "t2");  
        t2.start();  
    }  
}
```

#### 批量重偏向

如果对象虽然被多个线程访问，但没有竞争，这时偏向了线程T1的对象仍有机会重新偏向T2，重偏向会重置对象的Thread ID。

当撤销偏向锁阈值超过20次后，jvm会觉得，我是不是偏向错了呢？于是会在给这些对象加锁时重新偏向至加锁线程。

```java
Vector<Dog> list = new Vector<>();  
new Thread(() -> {  
    for (int i = 0; i < 30; i++) {  
        Dog d = new Dog();  
        list.add(d);  
        synchronized (d) {  
            ClassLayout classLayout = ClassLayout.parseInstance(d);  
            log.info("[{}]", i);  
            log.info(classLayout.toPrintable(d));  
        }  
    }  
    synchronized (list) {  
        list.notify();  
    }  
}, "t1").start();  
  
new Thread(() -> {  
    synchronized (list) {  
        try {  
            list.wait();  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
    }  
    for (int i = 0; i < 30; i++) {  
        Dog d = list.get(i);  
        synchronized (d) {  
            log.info("[{}]", i);  
            log.info(ClassLayout.parseInstance(d).toPrintable());  
        }  
    }  
}, "t2").start();
```

**输出结果**

```java

-------------------t1-----------------

[0]
00000101 11001000 10001101 10010011
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

[1]
00000101 11001000 10001101 10010011
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

......

[30]
00000101 11001000 10001101 10010011
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

-------------------t2-----------------

【注意】撤销偏向，这边变更为轻量级锁
[0]
00010000 10111010 10110100 00001100
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

[1]
00010000 10111010 10110100 00001100
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

......

[18]
00010000 10111010 10110100 00001100
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

【注意】撤销偏向锁阈值超过20次后，这边重新变为了偏向锁，并且将线程id绑定为当前的线程
[19]
00000101 10001001 00001100 10010111
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

...
```

#### 批量撤销

当撤销偏向锁阈值超过40次后，jvm 会这样觉得，自己确实偏向错了，根本就不该偏向。于是整个类的所有对象都会变为不可偏向的，新建的对象也是不可偏向的。

```java
Vector<Dog> list = new Vector<>();  
  
Thread t3 = new Thread(() -> {  
    LockSupport.park();  
    for (int i = 0; i < 39; i++) {  
        Dog d = list.get(i);  
        synchronized (d) {  
            log.info("[{}]", i);  
            log.info(ClassLayout.parseInstance(d).toPrintable());  
        }  
    }  
}, "t3");  
  
  
Thread t2 = new Thread(() -> {  
    LockSupport.park();  
    for (int i = 0; i < 39; i++) {  
        Dog d = list.get(i);  
        synchronized (d) {  
            log.info("[{}]", i);  
            log.info(ClassLayout.parseInstance(d).toPrintable());  
        }  
    }  
    LockSupport.unpark(t3);  
}, "t2");  
t2.start();  
  
Thread t1 = new Thread(() -> {  
    for (int i = 0; i < 39; i++) {  
        Dog d = new Dog();  
        list.add(d);  
        synchronized (d) {  
            ClassLayout classLayout = ClassLayout.parseInstance(d);  
            log.info("[{}]", i);  
            log.info(classLayout.toPrintable(d));  
        }  
    }  
    LockSupport.unpark(t2);  
}, "t1");  
t1.start();  
  
t3.start();  
t3.join();  
  
Dog dog = new Dog();  
log.info(ClassLayout.parseInstance(dog).toPrintable());
```

**输出结果**

```java
-------------------t1-----------------

[0]
00000101 11001000 10001101 10010011
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

[1]
00000101 11001000 10001101 10010011
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

......

[38]
00000101 11001000 10001101 10010011
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

-------------------t2-----------------

【注意】撤销偏向，这边变更为轻量级锁
[0]
00010000 10111010 10110100 00001100
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

[1]
00010000 10111010 10110100 00001100
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

......

[18]
00010000 10111010 10110100 00001100
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

【注意】撤销偏向锁阈值超过20次后，这边重新变为了偏向锁，并且将线程id绑定为当前的线程
[19]
00000101 10001001 00001100 10010111
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

......

[38]
00000101 10001001 00001100 10010111
10010101 01111111 00000000 00000000
01011000 10111110 00001010 00000000

-------------------t3-----------------

【注意】t3前面20个都被t2线程变更为无锁了，所以这边前20个没有撤销操作

[0]
00010000 01001010 00001010 00000011
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

[1]
00010000 01001010 00001010 00000011
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

......

[18]
00010000 01001010 00001010 00000011
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

【注意】19到38均是撤销偏向操作，变为无锁，所以此时已经累计了39个撤销操作

[19]
00010000 01001010 00001010 00000011
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

......

[38]
00010000 01001010 00001010 00000011
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000

-------------------main---------------

【注意】main线程新生成的对象，变为无锁（原本new Dog的锁状态都是为偏向锁）

00100000 11101010 11101001 00000010
00000000 01110000 00000000 00000000
01011000 10111110 00001010 00000000
```


## 3.7 wait & notify

### 小故事：为什么需要 wait

由于条件不满足，小南不能继续进行计算

但小南如果一直占用着锁，其它人就得一直阻塞，效率太低

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321000955.png)

于是老王单开了一间休息室（调用wait方法），让小南到休息室（WaitSet）等着去了，但这时锁释放开，其他人可以由老王随机安排进屋。

直到小M将烟送来，大叫一声「你的烟到了」（调用notify方法）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321001305.png)

小南于是可以离开休息室，重新进入竞争锁的队列

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321001413.png)

### wait & notify 原理

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321001522.png)

- Owner 线程发现条件不满足，调用 wait 方法，即可进入 WaitSet 变为WAITING 状态

- BLOCKED 和 WAITING 的线程都处于阻塞状态，不占用CPU时间片

- BLOCKED 线程会在 Owner 线程释放锁时唤醒

- WAITING 线程会在 Owner 线程调用 notify 或  notifyAll 时唤醒，但唤醒后并不意味者立刻获得锁，仍需进入 EntryList 重新竞争

### API 介绍

- obj.wait() 让进入 object 监视器的线程到 waitSet 等待

- obj.notify() 在 object 上正在 waitSet 等待的线程中挑一个唤醒

- obj.notifyAll() 让 object 上正在 waitSet 等待的线程全部唤醒

它们都是线程之间进行协作的手段，都属于 Object 对象的方法。必须获得此对象的锁，才能调用这几个方法

```java
new Thread(() -> {  
    synchronized (obj) {  
        log.info("t1执行...");  
        try {  
            obj.wait();  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
        log.info("t1执行其他代码...");  
    }  
}, "t1").start();  
  
new Thread(() -> {  
    synchronized (obj) {  
        log.info("t2执行...");  
        try {  
            obj.wait();  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
        log.info("t2执行其他代码...");  
    }  
}, "t2").start();  
  
TimeUnit.SECONDS.sleep(1);  
  
synchronized (obj) {  
    obj.notify();  
}
```

#### notify() 与 notifyAll()

**notify()**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321003442.png)

**notifyAll()**

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230321003342.png)

#### wait() 与 wait(long n)

**wait()**

wait() 方法会释放对象的锁，进入 WaitSet 等待区，从而让其他线程就机会获取对象的锁。无限制等待，直到 notify 为止。

**wait(long n)**

wait(long n) 表示进行有时限的等待，到 n 毫秒后结束即使没被唤醒（notify）也会继续往下执行，若在等待时间内被唤醒，那么也将继续执行。

### wait 与 notify 正确用法

#### sleep(long n) 和 wait(long n) 的区别

1. sleep 是 Thread 方法，而 wait 是 Object 的方法
2. sleep 不需要强制和 synchronized 配合使用，但 wait 需要和 synchronized 一起用
3. sleep 在睡眠的同时，不会释放对象锁的，但 wait 在等待的时候会释放对象锁。

>sleep 与 wait 状态都是 TIMED_WAITING的

#### 实战

```java
private static final Object room = new Object();  
private static boolean hasCigarette = false;  
  
public static void main(String[] args) throws InterruptedException {  
  
    new Thread(() -> {  
        synchronized (room) {  
            log.info("有烟没？");  
            if (!hasCigarette) {  
                log.info("没烟，干不了活");  
                try {  
                    TimeUnit.SECONDS.sleep(2);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
            if (hasCigarette) log.info("有烟了，开始干活了");  
        }  
    }, "小南").start();  
  
    TimeUnit.MILLISECONDS.sleep(50);  
  
    for (int i = 0; i < 5; i++) {  
        new Thread(() -> {  
            synchronized (room) {  
                log.info("其他人员开始干活");  
            }  
        }, "其他人员").start();  
    }  
  
    new Thread(() -> {  
        synchronized (room) {  
            hasCigarette = true;  
            log.info("烟送到了...");  
        }  
    }, "送烟的").start();  
  
}
```

**输出结果**

```java
21:13:04.642 [小南] INFO com.duoduo.TestSleep - 有烟没？[false]
21:13:04.650 [小南] INFO com.duoduo.TestSleep - 没烟，干不了活
21:13:06.652 [小南] INFO com.duoduo.TestSleep - 有烟没？[false]
21:13:06.652 [送烟的] INFO com.duoduo.TestSleep - 烟送到了...
21:13:06.653 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:13:06.653 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:13:06.653 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:13:06.653 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:13:06.653 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
```

- 其它干活的线程，都要一直阻塞，效率太低
- 小南线程必须睡足2s后才能醒来，就算烟提前送到，也无法立刻醒来
- 加了 synchronized (room) 后，就好比小南在里面反锁了门睡觉，烟根本没法送进门，main 没加synchronized 就好像 main 线程是翻窗户进来的

>解决方法，使用 wait - notify机制

#### 优化实战1

```java
private static final Object room = new Object();  
private static boolean hasCigarette = false;  
  
public static void main(String[] args) throws InterruptedException {  
  
    new Thread(() -> {  
        synchronized (room) {  
            log.info("有烟没？[{}]", hasCigarette);  
            if (!hasCigarette) {  
                log.info("没烟，干不了活");  
                try {  
                    room.wait();  
                    log.info("有烟没？[{}]", hasCigarette);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
            if (hasCigarette) log.info("有烟了，开始干活了");  
        }  
    }, "小南").start();  
  
    TimeUnit.MILLISECONDS.sleep(50);  
  
    for (int i = 0; i < 5; i++) {  
        new Thread(() -> {  
            synchronized (room) {  
                log.info("其他人员开始干活");  
            }  
        }, "其他人员").start();  
    }  
  
    new Thread(() -> {  
        synchronized (room) {  
            hasCigarette = true;  
            log.info("烟送到了...");  
            room.notify();  
        }  
    }, "送烟的").start();  
}
```

**输出结果**

```java
21:15:26.655 [小南] INFO com.duoduo.TestSleep - 有烟没？[false]
21:15:26.665 [小南] INFO com.duoduo.TestSleep - 没烟，干不了活
21:15:26.704 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:15:26.705 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:15:26.705 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:15:26.705 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:15:26.706 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:15:26.706 [送烟的] INFO com.duoduo.TestSleep - 烟送到了...
21:15:26.706 [小南] INFO com.duoduo.TestSleep - 有烟没？[true]
21:15:26.707 [小南] INFO com.duoduo.TestSleep - 有烟了，开始干活了
```

>该方法还是有问题，因为存在着虚假唤醒的原因，查看以下的例子
>例子中新增了一个线程（等外卖才干活）

```java
private static final Object room = new Object();  
private static boolean hasCigarette = false;  
private static boolean hasTakeout = false;  
  
public static void main(String[] args) throws InterruptedException {  
  
    new Thread(() -> {  
        synchronized (room) {  
            log.info("有外卖没？[{}]", hasTakeout);  
            if (!hasTakeout) {  
                log.info("没外卖，干不了活");  
                try {  
                    room.wait();  
                    log.info("有外卖没？[{}]", hasTakeout);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
            if (hasCigarette) log.info("有外卖了，开始干活了");  
        }  
    }, "小女").start();  
  
    new Thread(() -> {  
        synchronized (room) {  
            log.info("有烟没？[{}]", hasCigarette);  
            if (!hasCigarette) {  
                log.info("没烟，干不了活");  
                try {  
                    room.wait();  
                    log.info("有烟没？[{}]", hasCigarette);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
            if (hasCigarette) log.info("有烟了，开始干活了");  
        }  
    }, "小南").start();  
    
    TimeUnit.MILLISECONDS.sleep(50);  
  
    for (int i = 0; i < 5; i++) {  
        new Thread(() -> {  
            synchronized (room) {  
                log.info("其他人员开始干活");  
            }  
        }, "其他人员").start();  
    }  
  
    new Thread(() -> {  
        synchronized (room) {  
            hasCigarette = true;  
            log.info("烟送到了...");  
            room.notify();  
        }  
    }, "送烟的").start();  
}
```

**输出结果**

```java
21:24:15.210 [小女] INFO com.duoduo.TestSleep - 有外卖没？[false]
21:24:15.216 [小女] INFO com.duoduo.TestSleep - 没外卖，干不了活
21:24:15.216 [小南] INFO com.duoduo.TestSleep - 有烟没？[false]
21:24:15.216 [小南] INFO com.duoduo.TestSleep - 没烟，干不了活
21:24:15.259 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:24:15.260 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:24:15.260 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:24:15.260 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:24:15.261 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:24:15.261 [送烟的] INFO com.duoduo.TestSleep - 烟送到了...

=== === === === === === === === === 【虚假唤醒】======= === === === === === === 
=== 注意：烟送到后发现激活的线程是等待外卖的线程，因此等待烟的线程相当于没做事就结束了====
21:24:15.261 [小女] INFO com.duoduo.TestSleep - 有外卖没？[false]
21:24:15.261 [小女] INFO com.duoduo.TestSleep - 有外卖了，开始干活了
```

>解决办法：用 notifyAll() 替换 notify()，用 while 替换 if

```java
private static final Object room = new Object();  
private static boolean hasCigarette = false;  
private static boolean hasTakeout = false;  
  
public static void main(String[] args) throws InterruptedException {  
  
    new Thread(() -> {  
        synchronized (room) {  
            log.info("有烟没？[{}]", hasCigarette);  
            while (!hasCigarette) {  
                log.info("没烟，干不了活");  
                try {  
                    room.wait();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
            log.info("有烟没？[{}]", hasCigarette);  
            if (hasCigarette) log.info("有烟了，开始干活了");  
        }  
    }, "小南").start();  
  
    new Thread(() -> {  
        synchronized (room) {  
            log.info("有外卖没？[{}]", hasTakeout);  
            while (!hasTakeout) {  
                log.info("没外卖，干不了活");  
                try {  
                    room.wait();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
            log.info("有外卖没？[{}]", hasTakeout);  
            if (hasTakeout) log.info("有外卖了，开始干活了");  
        }  
    }, "小女").start();  
  
    TimeUnit.MILLISECONDS.sleep(50);  
  
    for (int i = 0; i < 5; i++) {  
        new Thread(() -> {  
            synchronized (room) {  
                log.info("其他人员开始干活");  
            }  
        }, "其他人员").start();  
    }  
  
    new Thread(() -> {  
        synchronized (room) {  
            hasCigarette = true;  
            log.info("烟送到了...");  
            room.notifyAll();  
        }  
    }, "送烟的").start();  
}
```

**输出结果**

```java
21:41:49.736 [小南] INFO com.duoduo.TestSleep - 有烟没？[false]
21:41:49.742 [小南] INFO com.duoduo.TestSleep - 没烟，干不了活
21:41:49.742 [小女] INFO com.duoduo.TestSleep - 有外卖没？[false]
21:41:49.742 [小女] INFO com.duoduo.TestSleep - 没外卖，干不了活
21:41:49.785 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:41:49.786 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:41:49.786 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:41:49.786 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:41:49.786 [其他人员] INFO com.duoduo.TestSleep - 其他人员开始干活
21:41:49.787 [送烟的] INFO com.duoduo.TestSleep - 烟送到了...
21:41:49.787 [小南] INFO com.duoduo.TestSleep - 有烟没？[true]
21:41:49.787 [小南] INFO com.duoduo.TestSleep - 有烟了，开始干活了
21:41:49.787 [小女] INFO com.duoduo.TestSleep - 没外卖，干不了活
===========================这边等待外卖的线程继续等待===========================
```

#### 正确使用 notify 和 wait 的套路

```java
synchronized(lock) {
	while(条件不成立) {
		lock.wait();
	}
	// TODO 干活
}

// 另一个线程
synchronized(lock) {
	lock.notifyAll();
}
```

### 拓展补充：保护性暂停模式

[[#同步模式之保护性暂停]]

### 拓展补充：生产者/消费者模式

[[#异步模式之生产者/消费者]]

## 3.8 Park & Unpark

### 基本使用

他们是 LockSupport 类中的方法

```java
// 暂停当前线程
LockSupport.park();

// 恢复某个线程的运行
LockSupport.unpark(暂停线程对象);
```

```java
public static void main(String[] args) throws InterruptedException {  
    Thread t1 = new Thread(() -> {  
        log.info("start...");  
        try {  
            TimeUnit.SECONDS.sleep(1);  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
        log.info("park...");  
        LockSupport.park();  
        log.info("resume...");  
    }, "t1");  
    t1.start();  
  
    TimeUnit.SECONDS.sleep(2);  
    log.info("unpark...");  
    LockSupport.unpark(t1);  
}
```

**输出结果**

```java
09:07:45.136 [t1] INFO com.duoduo.TestPark - start...
09:07:46.146 [t1] INFO com.duoduo.TestPark - park...
09:07:47.137 [main] INFO com.duoduo.TestPark - unpark...
09:07:47.137 [t1] INFO com.duoduo.TestPark - resume...
```

### 特点

- wait，notify 和 notifyAll 必须配合 Object Monitor 一起使用，而park，unpark 不必
- park & unpark 是以线程为单位来【阻塞】和【唤醒】线程，而 notify 只能随机唤醒一个等待线程， notifyAll 是唤醒所有等待线程，就不那么【精确】
- park & unpark 可以先 unpark，而 wait & notify不能先notify

### 原理之 park & unpark

每个线程都有自己的一个Parker 对象，由三部分组成 `_counter`，`_cond` 和 `_mutex` 打个比喻

- 线程就像一个旅人，Parker 就像他随身携带的背包，条件变量就好比背包中的帐篷。`_counter` 就好比背包中的备用干粮（0为耗尽，1为充足）

- 调用 park 就是要看需不需要停下来歇息
	- 如果备用干粮耗尽，那么钻进帐篷歇息
	- 如果备用干粮充足，那么不需停留，继续前进

- 调用unpark，就好比令干粮充足
	- 如果这时线程还在帐篷，就唤醒让他继续前进
	- 如果这时线程还在运行，那么下次他调用park时，仅是消耗掉备用干粮，不需停留继续前进
	- 因为背包空间有限，多次调用 unpark 仅会补充一份备用干粮

**先调用park()，再调用unpark()**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322154253.png)

1. 当前线程调用Unsafe.park0方法
2. 检查 `_counter` ，本情况为0，这时，获得 `_mutex` 互斥锁
3. 线程进入 `_cond` 条件变量阻塞
4. 设置 `_counter = 0` 

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322154444.png)

1. 调用Unsafe.unpark(Thread_0)方法，设置 `_counter = 1` 
2. 唤醒 `_cond` 条件变量中的 `Thread_0`
3. `Thread_0` 恢复运行
4. 设置 `_counter` 为 0

**先调用unpark()，再调用park()**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322154725.png)

1. 调用 `Unsafe.unpark(Thread_0)` 方法，设置 `_counter` 为 1 
2. 当前线程调用 `Unsafe.park()` 方法
3. 检查 `_counter`，本情况为 `1`，这时线程无需阻塞，继续运行
4. 设置 `_counter` 为0

>拓展学习：[[#park()]]


## 3.9 重新理解线程状态转换

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322161359.png)

>Thread t = new Thread()

### 情况一：NEW --> RUNNABLE

当调用了 t.start() 方法时，由 NEW -> RUNNABLE

### 情况二：RUNNABLE <--> WAITING

当线程调用了 synchronized(obj) 获取了对象锁后

- 调用 obj.wait() 方法时，线程从 RUNNABLE --> WAITING

- 调用 obj.notify()，obj.notifyAll()，thread.interrupt() 时
	- 竞争锁**成功**时，t线程从 WAITING --> RUNNABLE
	- 竞争锁**失败**时，t线程从 WAITING --> BLOCKED

### 情况三：RUNNABLE <--> WAITING

- **当前线程**调用 t.join() 方法时，**当前线程**从 RUNNABLE --> WAITING

>注意：是当前线程在t线程对象的监视器上等待

- t线程运行结束，或调用了当前线程的 interrupt() 时，**当前线程**从 WAITING --> RUNNABLE

### 情况四：RUNNABLE <--> WAITING

- **当前线程**调用 LockSupport.park() 方法会让当前线程从 RUNNABLE --> WAITING

- 调用 LockSupport.unpark(目标线程) 或调用了线程的 interrupt()，会让目标线程从         WAITING -->RUNNABLE

### 情况五：RUNNABLE <--> TIMED_WAITING

**t线程**用 `synchronized(obj)` 获取了对象锁后

- 调用 `obj.wait(long n)` 方法时，t线程从 RUNNABLE --> TIMED_WAITING

- **t线程**等待时间超过了 n 毫秒，或调用 `obj.notify()`，`obj.notifyAll()`，`t.interrupt()` 时
	- 竞争锁**成功**，t线程从TIMED_WAITING --> RUNNABLE
	- 竞争锁**失败**，t线程从TIMED_WAITING -->BLOCKED

### 情况六：RUNNABLE <--> TIMED_WAITING

- **当前线程**调用 `t.join(long n)` 方法时，当前线程从 RUNNABLE -->TIMED_WAITING

>注意是**当前线程**在**t线程**对象的监视器上等待

- **当前线程**等待时间超过了 `n` 毫秒，或**t线程**运行结束，或调用了**当前线程**的interrupt()时，**当前线程**从TIMED_WAITING --> RUNNABLE

### 情况七：RUNNABLE <--> TIMED_WAITING

- **当前线程**调用 `Thread. sleep(long n)` ，**当前线程**从 RUNNABLE --> TIMED_WAITING
- **当前线程**等待时间超过了 `n` 毫秒，**当前线程**从 TIMED_WAITING --> RUNNABLE

### 情况八：RUNNABLE <--> TIMED_WAITING

- **当前线程**调用 `LockSupport.parkNanos(long nanos)` 或 `LockSupport.parkUntil(long millis)` 时，**当前线程**从RUNNABLE --> TIMED_WAITING
- 调用 `LockSupport.unpark(目标线程)` 或调用了线程的 `interrupt()`，或是等待超时，会让目标线程从 TIMED_WAITING--> RUNNABLE

### 情况九：RUNNABLE <--> BLOCKED

- **t线程**用 `synchronized(obj)` 获取了对象锁时如果竞争失败，从 RUNNABLE --> BLOCKED
- 持 obj 锁线程的同步代码块执行完毕，会唤醒该对象上所有 BLOCKED 的线程重新竞争，如果其中 **t线程** 竞争成功，从 BLOCKED --> RUNNABLE，其它失败的线程仍然 BLOCKED

### 情况十：RUNNABLE <--> TERMINATED

当前线程所有代码运行完毕，进入TERMINATED

## 3.10 多把锁

### 多把不相干的锁

一间大屋子有两个功能：睡觉、学习，互不相干。

现在小南要学习，小女要睡觉，但如果只用一间屋子（一个对象锁）的话，那么并发度很低，解决方法是：准备多个房间（多个对象锁）

```java
public class TestMultiLock {  
  
    public static void main(String[] args) {  
        BigRoom bigRoom = new BigRoom();  
  
        new Thread(() -> {  
            try {  
                bigRoom.study();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "小南").start();  
  
        new Thread(() -> {  
            try {  
                bigRoom.sleep();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "小女").start();  
  
    }  
  
}  
  
@Slf4j  
class BigRoom {  
  
    public void sleep() throws InterruptedException {  
        synchronized (this) {  
            log.info("sleep 2 小时");  
            TimeUnit.SECONDS.sleep(2);  
        }  
    }  
  
    public void study() throws InterruptedException {  
        synchronized (this) {  
            log.info("study 1 小时");  
            TimeUnit.SECONDS.sleep(1);  
        }  
    }  
  
}
```

**输出结果**

```java
19:28:49.372 [小南] INFO com.duoduo.BigRoom - study 1 小时
19:28:50.378 [小女] INFO com.duoduo.BigRoom - sleep 2 小时
```

>我们发现，本来睡觉和学习的动作互不相干，但是线程阻塞了，所以我们需要进行优化，解决办法就是准备多个房间

**优化改进**

```java
public class TestMultiLock {  
  
    public static void main(String[] args) {  
        BigRoom bigRoom = new BigRoom();  
  
        new Thread(() -> {  
            try {  
                bigRoom.study();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "小南").start();  
  
        new Thread(() -> {  
            try {  
                bigRoom.sleep();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "小女").start();  
  
    }  
  
}  
  
@Slf4j  
class BigRoom {  
  
    private final Object studyRoom = new Object();  
    private final Object badRoom = new Object();  
  
    public void sleep() throws InterruptedException {  
        synchronized (badRoom) {  
            log.info("sleep 2 小时");  
            TimeUnit.SECONDS.sleep(2);  
        }  
    }  
  
    public void study() throws InterruptedException {  
        synchronized (studyRoom) {  
            log.info("study 1 小时");  
            TimeUnit.SECONDS.sleep(1);  
        }  
    }  
  
}
```

**输出结果**

```java
19:30:46.209 [小南] INFO com.duoduo.BigRoom - study 1 小时
19:30:46.209 [小女] INFO com.duoduo.BigRoom - sleep 2 小时
```

**将锁的粒度细分的优缺点**

好处：是可以增强并发度
坏处：如果一个线程需要同时获得多把锁，就容易发生死锁

## 3.11 线程的活跃性

### 1 死锁

有这样的情况：一个线程需要同时获取多把锁，这时就容易发生死锁

- t1 线程获得A对象锁，接下来想获取B对象的锁
- t2线程获得B对象锁，接下来想获取A对象的锁

#### 复现死锁

```java
public static void main(String[] args) {  
  
    Object A = new Object();  
    Object B = new Object();  
  
    new Thread(() -> {  
        synchronized (A) {  
            try {  
                log.info("lock A");  
                TimeUnit.SECONDS.sleep(1);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
            synchronized (B) {  
                log.info("lock B");  
            }  
        }  
    }, "t1").start();  
  
    new Thread(() -> {  
        synchronized (B) {  
            log.info("lock B");  
            synchronized (A) {  
                log.info("lock A");  
            }  
        }  
    }, "t2").start();  
}
```

**输出结果**

```java
19:41:22.708 [t2] INFO com.duoduo.TestDeadLock - lock B
19:41:22.708 [t1] INFO com.duoduo.TestDeadLock - lock A
// 这边陷入了死锁
......
```

#### 定位死锁

检测死锁可以使用 `jconsole` 工具，或者使用 `jps` 定位进程 `id`，再用 `jstack` 定位死锁:

```bash
> jps

23426 Launcher
23427 TestDeadLock
1799 
23577 Jps
8937 TestPublicSub
6543 TestSleep

```

```shell
> jstack 8937

2023-03-22 19:49:30
Full thread dump Java HotSpot(TM) 64-Bit Server VM (11.0.14+8-LTS-263 mixed mode):

Threads class SMR info:
_java_thread_list=0x00007fb184d209c0, length=14, elements={
0x00007fb1840c5000, 0x00007fb184012800, 0x00007fb185015000, 0x00007fb185018000,
0x00007fb185836800, 0x00007fb18381b800, 0x00007fb18381c800, 0x00007fb187866800,
0x00007fb18300b000, 0x00007fb183019000, 0x00007fb183086000, 0x00007fb1850d0000,
0x00007fb1840e5800, 0x00007fb185809000
}

"Reference Handler" #2 daemon prio=10 os_prio=31 cpu=0.19ms elapsed=71257.69s tid=0x00007fb1840c5000 nid=0x4a03 waiting on condition  [0x00007000029f8000]
   java.lang.Thread.State: RUNNABLE
        at java.lang.ref.Reference.waitForReferencePendingList(java.base@11.0.14/Native Method)
        at java.lang.ref.Reference.processPendingReferences(java.base@11.0.14/Reference.java:241)
        at java.lang.ref.Reference$ReferenceHandler.run(java.base@11.0.14/Reference.java:213)

"Finalizer" #3 daemon prio=8 os_prio=31 cpu=0.29ms elapsed=71257.69s tid=0x00007fb184012800 nid=0x3903 in Object.wait()  [0x0000700002afb000]
   java.lang.Thread.State: WAITING (on object monitor)
        at java.lang.Object.wait(java.base@11.0.14/Native Method)
        - waiting on <0x000000070ff09018> (a java.lang.ref.ReferenceQueue$Lock)
        at java.lang.ref.ReferenceQueue.remove(java.base@11.0.14/ReferenceQueue.java:155)
        - waiting to re-lock in wait() <0x000000070ff09018> (a java.lang.ref.ReferenceQueue$Lock)
        at java.lang.ref.ReferenceQueue.remove(java.base@11.0.14/ReferenceQueue.java:176)
        at java.lang.ref.Finalizer$FinalizerThread.run(java.base@11.0.14/Finalizer.java:170)

"Signal Dispatcher" #4 daemon prio=9 os_prio=31 cpu=4.94ms elapsed=71257.68s tid=0x00007fb185015000 nid=0x4303 runnable  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"Service Thread" #5 daemon prio=9 os_prio=31 cpu=0.05ms elapsed=71257.68s tid=0x00007fb185018000 nid=0xa803 runnable  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"C2 CompilerThread0" #6 daemon prio=9 os_prio=31 cpu=248.38ms elapsed=71257.68s tid=0x00007fb185836800 nid=0xa603 waiting on condition  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE
   No compile task

"C1 CompilerThread0" #9 daemon prio=9 os_prio=31 cpu=266.66ms elapsed=71257.68s tid=0x00007fb18381b800 nid=0x5803 waiting on condition  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE
   No compile task

"Sweeper thread" #10 daemon prio=9 os_prio=31 cpu=0.04ms elapsed=71257.68s tid=0x00007fb18381c800 nid=0x5903 runnable  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"Common-Cleaner" #11 daemon prio=8 os_prio=31 cpu=31.89ms elapsed=71257.64s tid=0x00007fb187866800 nid=0xa003 in Object.wait()  [0x0000700003213000]
   java.lang.Thread.State: TIMED_WAITING (on object monitor)
        at java.lang.Object.wait(java.base@11.0.14/Native Method)
        - waiting on <no object reference available>
        at java.lang.ref.ReferenceQueue.remove(java.base@11.0.14/ReferenceQueue.java:155)
        - waiting to re-lock in wait() <0x000000070fe00538> (a java.lang.ref.ReferenceQueue$Lock)
        at jdk.internal.ref.CleanerImpl.run(java.base@11.0.14/CleanerImpl.java:148)
        at java.lang.Thread.run(java.base@11.0.14/Thread.java:834)
        at jdk.internal.misc.InnocuousThread.run(java.base@11.0.14/InnocuousThread.java:134)

"JDWP Transport Listener: dt_socket" #12 daemon prio=10 os_prio=31 cpu=8.18ms elapsed=71257.62s tid=0x00007fb18300b000 nid=0x5b03 runnable  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"JDWP Event Helper Thread" #13 daemon prio=10 os_prio=31 cpu=24.82ms elapsed=71257.62s tid=0x00007fb183019000 nid=0x5e03 runnable  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"JDWP Command Reader" #14 daemon prio=10 os_prio=31 cpu=5.21ms elapsed=71257.62s tid=0x00007fb183086000 nid=0x9c03 runnable  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"消费者" #18 prio=5 os_prio=31 cpu=1.71ms elapsed=71257.39s tid=0x00007fb1850d0000 nid=0x930n Object.wait()  [0x0000700003a2b000]
   java.lang.Thread.State: WAITING (on object monitor)
        at java.lang.Object.wait(java.base@11.0.14/Native Method)
        - waiting on <0x000000070f8f7e48> (a java.util.LinkedList)
        at java.lang.Object.wait(java.base@11.0.14/Object.java:328)
        at com.duoduo.MessageQueue.take(TestPublicSub.java:64)
        - waiting to re-lock in wait() <0x000000070f8f7e48> (a java.util.LinkedList)
        at com.duoduo.TestPublicSub.lambda$main$1(TestPublicSub.java:35)
        at com.duoduo.TestPublicSub$$Lambda$22/0x00000008000ba840.run(Unknown Source)
        at java.lang.Thread.run(java.base@11.0.14/Thread.java:834)

"DestroyJavaVM" #19 prio=5 os_prio=31 cpu=295.77ms elapsed=71257.40s tid=0x00007fb1840e5800 nid=0x2803 waiting on condition  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"Attach Listener" #20 daemon prio=9 os_prio=31 cpu=2.15ms elapsed=0.11s tid=0x00007fb185809000 nid=0x3e17 waiting on condition  [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"VM Thread" os_prio=31 cpu=654.53ms elapsed=71257.70s tid=0x00007fb183813800 nid=0x4b03 runnable  

"GC Thread#0" os_prio=31 cpu=2.02ms elapsed=71257.72s tid=0x00007fb185815800 nid=0x5403 runnable  

"G1 Main Marker" os_prio=31 cpu=0.33ms elapsed=71257.72s tid=0x00007fb18404a000 nid=0x5303 runnable  

"G1 Conc#0" os_prio=31 cpu=0.02ms elapsed=71257.72s tid=0x00007fb18404b000 nid=0x5103 runnable  

"G1 Refine#0" os_prio=31 cpu=0.30ms elapsed=71257.72s tid=0x00007fb187837000 nid=0x3303 runnable  

"G1 Young RemSet Sampling" os_prio=31 cpu=2585.68ms elapsed=71257.72s tid=0x00007fb187837800 nid=0x3403 runnable  
"VM Periodic Task Thread" os_prio=31 cpu=11741.54ms elapsed=71257.57s tid=0x00007fb185891000 nid=0x5f03 waiting on condition  

JNI global refs: 35, weak refs: 1200

```

#### 哲学家就餐问题

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322195350.png)

有五位哲学家，围坐在圆桌旁。

- 他们只做两件事，思考和吃饭，思考一会吃口饭，吃完饭后接着思考。

- 吃饭时要用两根筷子吃，桌上共有5根筷子，每位哲学家左右手边各有一根筷子。如果筷子被身边的人拿着，自己就得等待

##### 代码实现

```java
@Slf4j  
public class TestDinnerGames {  
  
    public static void main(String[] args) {  
  
        Chopstick chopstick1 = new Chopstick("1");  
        Chopstick chopstick2 = new Chopstick("2");  
        Chopstick chopstick3 = new Chopstick("3");  
        Chopstick chopstick4 = new Chopstick("4");  
        Chopstick chopstick5 = new Chopstick("5");  
  
        new Philosopher("苏格拉底", chopstick1, chopstick2).start();  
        new Philosopher("柏拉图", chopstick2, chopstick3).start();  
        new Philosopher("亚里士多德", chopstick3, chopstick4).start();  
        new Philosopher("赫拉克利特", chopstick4, chopstick5).start();  
        new Philosopher("阿基米德", chopstick5, chopstick1).start();  
  
  
    }  
  
}  
  
// 筷子类  
class Chopstick {  
    String name;  
  
    public Chopstick(String name) {  
        this.name = name;  
    }  
  
    @Override  
    public String toString() {  
        return "筷子{" + name + "}";  
    }  
}  
  
// 哲学家类  
@Slf4j  
class Philosopher extends Thread{  
    private Chopstick left;  
    private Chopstick right;  
  
    public Philosopher(String name, Chopstick left, Chopstick right) {  
        setName(name);  
        this.left = left;  
        this.right = right;  
    }  
  
    @Override  
    public void run() {  
        while(true) {  
            synchronized (left) {  
                log.info("左手得到{}", left);  
                synchronized (right) {  
                    log.info("右手得到{}", right);  
                    try {  
                        eat();  
                    } catch (InterruptedException e) {  
                        throw new RuntimeException(e);  
                    }  
                }  
            }  
        }  
    }  
  
    private void eat() throws InterruptedException {  
        log.info("[{}]" + "开始就餐!", getName());  
        TimeUnit.SECONDS.sleep(1);  
    }  
}
```

##### 输出结果

```java
20:25:26.253 [柏拉图] INFO com.duoduo.Philosopher - 左手得到筷子{2}
20:25:26.253 [阿基米德] INFO com.duoduo.Philosopher - 左手得到筷子{5}
20:25:26.253 [赫拉克利特] INFO com.duoduo.Philosopher - 左手得到筷子{4}
20:25:26.253 [亚里士多德] INFO com.duoduo.Philosopher - 左手得到筷子{3}
20:25:26.253 [苏格拉底] INFO com.duoduo.Philosopher - 左手得到筷子{1}
```

##### jconsole 结果分析

```java
名称: 柏拉图
状态: com.duoduo.Chopstick@2f1d88b7（筷子3）上的BLOCKED, 拥有者: 亚里士多德
总阻止数: 37, 总等待数: 0

堆栈跟踪: 
app//com.duoduo.Philosopher.run(TestDinnerGames.java:67)
   - 已锁定 com.duoduo.Chopstick@6df03e66（筷子2）

==========================================

名称: 阿基米德
状态: com.duoduo.Chopstick@5dce3fda（筷子1）上的BLOCKED, 拥有者: 苏格拉底
总阻止数: 42, 总等待数: 0

堆栈跟踪: 
app//com.duoduo.Philosopher.run(TestDinnerGames.java:67)
   - 已锁定 com.duoduo.Chopstick@71aaa71e（筷子5）

==========================================

名称: 赫拉克利特
状态: com.duoduo.Chopstick@71aaa71e（筷子5）上的BLOCKED, 拥有者: 阿基米德
总阻止数: 40, 总等待数: 0

堆栈跟踪: 
app//com.duoduo.Philosopher.run(TestDinnerGames.java:67)
   - 已锁定 com.duoduo.Chopstick@2866e616（筷子4）

==========================================

名称: 亚里士多德
状态: com.duoduo.Chopstick@2866e616（筷子4）上的BLOCKED, 拥有者: 赫拉克利特
总阻止数: 35, 总等待数: 0

堆栈跟踪: 
app//com.duoduo.Philosopher.run(TestDinnerGames.java:67)
   - 已锁定 com.duoduo.Chopstick@2f1d88b（筷子3）

==========================================

名称: 苏格拉底
状态: com.duoduo.Chopstick@6df03e66（筷子2）上的BLOCKED, 拥有者: 柏拉图
总阻止数: 41, 总等待数: 1

堆栈跟踪: 
app//com.duoduo.Philosopher.run(TestDinnerGames.java:67)
   - 已锁定 com.duoduo.Chopstick@5dce3fda（筷子1）

```

这种线程没有按预期结束，执行不下去的情况，归类为 **【活跃性】问题** ，除了死锁以外，还有活锁和饥饿者两种情况

### 2 活锁

活锁出现在两个线程互相改变对方的结束条件，最后谁也无法结束，例如

```java
public class LiveLock {  
  
    static int count = 10;  
  
    public static void main(String[] args) throws InterruptedException {  
  
        new Thread(() -> {  
            while (count > 0) {  
                try {  
                    TimeUnit.MILLISECONDS.sleep(200);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
                count--;  
                log.info("count:{}", count);  
            }  
        }, "t1").start();  
  
        new Thread(() -> {  
            while (count < 20) {  
                try {  
                    TimeUnit.MILLISECONDS.sleep(200);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
                count++;  
                log.info("count:{}", count);  
            }  
        }, "t2").start();  
    }  
}
```

**输出结果**

```java
20:51:40.432 [t1] INFO com.duoduo.LiveLock - count:11
20:51:40.432 [t2] INFO com.duoduo.LiveLock - count:11
20:51:40.639 [t1] INFO com.duoduo.LiveLock - count:10
20:51:40.640 [t2] INFO com.duoduo.LiveLock - count:11
20:51:40.843 [t2] INFO com.duoduo.LiveLock - count:12
20:51:40.843 [t1] INFO com.duoduo.LiveLock - count:12
20:51:41.048 [t1] INFO com.duoduo.LiveLock - count:12
20:51:41.048 [t2] INFO com.duoduo.LiveLock - count:13
20:51:41.251 [t1] INFO com.duoduo.LiveLock - count:13
20:51:41.251 [t2] INFO com.duoduo.LiveLock - count:13
20:51:41.453 [t1] INFO com.duoduo.LiveLock - count:12
20:51:41.453 [t2] INFO com.duoduo.LiveLock - count:12
================================
结果还在交替运行......
```

### 3 饥饿

很多教程中把饥饿定义为，一个线程由于优先级太低，始终得不到CPU调度执行，也不能够结束，饥饿的情况不易演示，讲读写锁时会涉及饥饿问题

#### 复现饥饿

先来回顾一下 [[#1 死锁|死锁]] 的内容，以及通过 **顺序加锁** 的方法解决加锁：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322205405.png)

**解决方法：顺序加锁**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322205441.png)

**复现饥饿**

我们在 [[#哲学家就餐问题|哲学家就餐问题]]  中，每个线程都是先拿左筷子，后拿有筷子，我们现在调换其中一个线程的顺序，原先是先拿A筷，后拿B筷；我们现在改为先拿A筷，再拿B筷子：

```java
@Slf4j  
public class TestDinnerGames {  
  
    public static void main(String[] args) {  
  
        Chopstick chopstick1 = new Chopstick("1");  
        Chopstick chopstick2 = new Chopstick("2");  
        Chopstick chopstick3 = new Chopstick("3");  
        Chopstick chopstick4 = new Chopstick("4");  
        Chopstick chopstick5 = new Chopstick("5");  
  
        new Philosopher("苏格拉底", chopstick1, chopstick2).start();  
        new Philosopher("柏拉图", chopstick2, chopstick3).start();  
        new Philosopher("亚里士多德", chopstick3, chopstick4).start();  
        new Philosopher("赫拉克利特", chopstick4, chopstick5).start(); 

// [!!!] 这里改变了获取筷子的顺序
        new Philosopher("阿基米德", chopstick1, chopstick5).start();  
  
  
    }  
  
}  
  
// 筷子类  
class Chopstick {  
    String name;  
  
    public Chopstick(String name) {  
        this.name = name;  
    }  
  
    @Override  
    public String toString() {  
        return "筷子{" + name + "}";  
    }  
}  
  
// 哲学家类  
@Slf4j  
class Philosopher extends Thread{  
    private Chopstick left;  
    private Chopstick right;  
  
    public Philosopher(String name, Chopstick left, Chopstick right) {  
        setName(name);  
        this.left = left;  
        this.right = right;  
    }  
  
    @Override  
    public void run() {  
        while(true) {  
            synchronized (left) {  
                log.info("左手得到{}", left);  
                synchronized (right) {  
                    log.info("右手得到{}", right);  
                    try {  
                        eat();  
                    } catch (InterruptedException e) {  
                        throw new RuntimeException(e);  
                    }  
                }  
            }  
        }  
    }  
  
    private void eat() throws InterruptedException {  
        log.info("[{}]" + "开始就餐!", getName());  
        TimeUnit.SECONDS.sleep(1);  
    }  
}
```

#### 分析结果

会发现，其中 `赫拉克利特` 线程在一直被调用，其他的线程就是处于**饥饿状态**。

```java
21:04:01.642 [苏格拉底] INFO com.duoduo.Philosopher - 左手得到筷子{1}
21:04:01.642 [柏拉图] INFO com.duoduo.Philosopher - 左手得到筷子{2}
21:04:01.642 [赫拉克利特] INFO com.duoduo.Philosopher - 左手得到筷子{4}
21:04:01.642 [亚里士多德] INFO com.duoduo.Philosopher - 左手得到筷子{3}
21:04:01.683 [赫拉克利特] INFO com.duoduo.Philosopher - 右手得到筷子{5}
21:04:01.683 [赫拉克利特] INFO com.duoduo.Philosopher - [赫拉克利特]开始就餐!
21:04:02.684 [赫拉克利特] INFO com.duoduo.Philosopher - 左手得到筷子{4}
21:04:02.684 [赫拉克利特] INFO com.duoduo.Philosopher - 右手得到筷子{5}
```

## 3.12 ReentrantLock

相对于 synchronized 他具备如下特点

- 可中断
- 可以设置超时时间
- 可以设置为公平锁（默认是不公平锁）
- 支持多个条件变量
- 可重入（与 synchronized 一样）

### 基本语法

```java
// 获取锁
ReentrantLock reentrantLock = new ReentrantLock();

reentrantLock.lock();
try{
	// 临界区
} finally {
	// 释放锁
	reentrantLock.unlock();
}
```

### 可重入

可重入是指同一个线程如果首次获得了这把锁，那么因为它是这把锁的拥有者，因此有权利再次获取这把锁

如果是不可重入锁，那么第二次获得锁时，自己也会被锁挡住

```java
@Slf4j  
public class TestReentrantLock {  
  
    private static ReentrantLock lock = new ReentrantLock();  
  
    public static void main(String[] args) {  
        lock.lock();  
        try {  
            m1();  
        } finally {  
            lock.unlock();  
        }  
    }  
  
    public static void m1() {  
        lock.lock();  
        try {  
            m2();  
        } finally {  
            lock.unlock();  
        }  
    }  
  
    public static void m2() {  
        lock.lock();  
        try {  
            log.info("m2...");  
        } finally {  
            lock.unlock();  
        }  
    }  
}
```

**输出结果**

可以输出结果，说明可重入

```java
23:45:14.679 [main] INFO com.duoduo.TestReentrantLock - m2...
```

### tryLock()：可打断（被动，需要其他线程打断）

```java
@Slf4j  
public class TestReentrantLock {  
  
    private static ReentrantLock lock = new ReentrantLock();  
    
    public static void main(String[] args) throws InterruptedException {  
        Thread t1 = new Thread(() -> {  
            try {  
                // 如果没有竞争，那么此方法就会获取 lock 对象的锁  
                // 如果有竞争就会进入阻塞队列，可以被其他线程用 interrupt 方法打断  
                lock.lockInterruptibly();  
            } catch (InterruptedException e) {  
                e.printStackTrace();  
                log.info("未获得锁");  
                return;  
            }  
            try {  
                log.info("获得锁");  
            } finally {  
                lock.unlock();  
            }  
        }, "t1");  
  
        lock.lock();  
        t1.start();  
        TimeUnit.SECONDS.sleep(1);  
        t1.interrupt();  
    }  
}
```

**输出结果**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230322235624.png)

### 锁超时（主动，线程自己释放锁）

```java
@Slf4j  
public class TestReentrantLock {  
  
    private static ReentrantLock lock = new ReentrantLock();  
    
    public static void main(String[] args) throws InterruptedException {  
        Thread t1 = new Thread(() -> {  
            log.info("尝试获得锁");  
            try {  
                if (!lock.tryLock(3, TimeUnit.SECONDS)) {  
                    log.info("获取不到锁");  
                    return;  
                }  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
            try {  
                log.info("获取得到锁");  
            } finally {  
                lock.unlock();  
            }  
        }, "t1");  
        lock.lock();  
        log.info("主线程获得到锁");  
        t1.start();  
        TimeUnit.SECONDS.sleep(1);  
        lock.unlock();  
    }  
}
```

**输出结果**

这边输出结果是指定时间内获取到了锁

```java
00:09:12.727 [main] INFO com.duoduo.TestReentrantLock - 主线程获得到锁
00:09:12.732 [t1] INFO com.duoduo.TestReentrantLock - 尝试获得锁
00:09:13.735 [t1] INFO com.duoduo.TestReentrantLock - 获取得到锁
```

>如果指定时间内未获取得到锁就会报异常

#### 解决哲学家就餐问题中的死锁

```java
public class DinnerGamesNoDeadLock {  
    public static void main(String[] args) {  
  
        ChopstickWithLock chopstick1 = new ChopstickWithLock("1");  
        ChopstickWithLock chopstick2 = new ChopstickWithLock("2");  
        ChopstickWithLock chopstick3 = new ChopstickWithLock("3");  
        ChopstickWithLock chopstick4 = new ChopstickWithLock("4");  
        ChopstickWithLock chopstick5 = new ChopstickWithLock("5");  
  
        new PhilosopherWithNoDeadLock("苏格拉底", chopstick1, chopstick2).start();  
        new PhilosopherWithNoDeadLock("柏拉图", chopstick2, chopstick3).start();  
        new PhilosopherWithNoDeadLock("亚里士多德", chopstick3, chopstick4).start();  
        new PhilosopherWithNoDeadLock("赫拉克利特", chopstick4, chopstick5).start();  
        new PhilosopherWithNoDeadLock("阿基米德", chopstick5, chopstick1).start();  
    }  
}  
  
// 筷子类  
class ChopstickWithLock extends ReentrantLock {  
    String name;  
  
    public ChopstickWithLock(String name) {  
        this.name = name;  
    }  
  
    @Override  
    public String toString() {  
        return "筷子{" + name + "}";  
    }  
}  
  
// 哲学家类  
@Slf4j  
class PhilosopherWithNoDeadLock extends Thread{  
    private ChopstickWithLock left;  
    private ChopstickWithLock right;  
  
    public PhilosopherWithNoDeadLock(String name, ChopstickWithLock left, ChopstickWithLock right) {  
        setName(name);  
        this.left = left;  
        this.right = right;  
    }  
  
    @Override  
    public void run() {  
        while(true) {  
            if (left.tryLock()) {  
                try {  
                    if (right.tryLock()) {  
                        try {  
                            eat();  
                        } finally {  
                            right.unlock();  
                        }  
                    }  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                } finally {  
                    left.unlock();  
                }  
            }  
        }  
    }  
  
    private void eat() throws InterruptedException {  
        log.info("[{}]" + "开始就餐!", getName());  
        TimeUnit.SECONDS.sleep(1);  
    }  
}
```

**输出结果**

```java
00:33:25.166 [苏格拉底] INFO com.duoduo.PhilosopherWithNoDeadLock - [苏格拉底]开始就餐!
00:33:25.166 [亚里士多德] INFO com.duoduo.PhilosopherWithNoDeadLock - [亚里士多德]开始就餐!
00:33:26.176 [柏拉图] INFO com.duoduo.PhilosopherWithNoDeadLock - [柏拉图]开始就餐!
00:33:26.176 [赫拉克利特] INFO com.duoduo.PhilosopherWithNoDeadLock - [赫拉克利特]开始就餐!
00:33:27.177 [苏格拉底] INFO com.duoduo.PhilosopherWithNoDeadLock - [苏格拉底]开始就餐!
00:33:27.177 [亚里士多德] INFO com.duoduo.PhilosopherWithNoDeadLock - [亚里士多德]开始就餐!
00:33:28.177 [赫拉克利特] INFO com.duoduo.PhilosopherWithNoDeadLock - [赫拉克利特]开始就餐!
00:33:28.177 [柏拉图] INFO com.duoduo.PhilosopherWithNoDeadLock - [柏拉图]开始就餐!
00:33:29.177 [赫拉克利特] INFO com.duoduo.PhilosopherWithNoDeadLock - [赫拉克利特]开始就餐!
00:33:29.177 [苏格拉底] INFO com.duoduo.PhilosopherWithNoDeadLock - [苏格拉底]开始就餐!
00:33:30.177 [亚里士多德] INFO com.duoduo.PhilosopherWithNoDeadLock - [亚里士多德]开始就餐!
======================= 还在继续，并且没有出现饥饿的情况 =======================
```


### 公平锁（ReentrantLock默认为不公平锁）

ReentrantLock默认为不公平锁

```java
public static void main(String[] args) throws InterruptedException {  
    ReentrantLock lock = new ReentrantLock(false);  
  
    lock.lock();  
  
    for (int i = 0; i < 50; i++) {  
        new Thread(() -> {  
            log.info("线程{}获取锁", Thread.currentThread().getName());  
            lock.lock();  
            try {  
                log.info("{} running", Thread.currentThread().getName());  
            } finally {  
                lock.unlock();  
            }  
        }, "t" + i).start();  
    }  
  
    TimeUnit.SECONDS.sleep(1);  
  
    new Thread(() -> {  
        log.info("线程{}获取锁", Thread.currentThread().getName());  
        lock.lock();  
        try {  
            log.info("{} running", Thread.currentThread().getName());  
        } finally {  
            lock.unlock();  
        }  
    }, "插入线程").start();  
  
    lock.unlock();  
}
```

**非公平锁**

```java
线程t2获取锁
线程t4获取锁
线程t3获取锁
线程插入线程获取锁
线程t1获取锁
线程t5获取锁
......
t4 running
插入线程 running
t1 running
t3 running
t2 running
t5 running
......
```

**公平锁**

```java
线程t2获取锁
线程t4获取锁
线程t3获取锁
线程插入线程获取锁
线程t1获取锁
线程t5获取锁
......
t2 running
t4 running
t3 running
插入线程 running
t1 running
t5 running
......
```

公平锁一般没有必要，会降低并发度，后面分析原理时会讲解

### 条件变量

synchronized 中也有条件变量，就是我们讲原理时那个waitSet 休息室，当条件不满足时进入 waitSet 等待
ReentrantLock 的条件变量比 synchronized 强大之处在于，它是支持多个条件变量的，这就好比
- synchronized 是那些不满足条件的线程都在一间休息室等消息
- 而 ReentrantLock 支持多间休息室，有专门等烟的休息室、专门等早餐的休息室、唤醒时也是按休息室来唤醒

#### 使用流程

1. await 前需要获得锁
2. await 执行后，会释放锁，进入 conditionObject 等待
3. await的线程被唤醒（或打断、或超时）取重新竞争lock锁
4. 竞争 lock 锁成功后，从 await 后继续执行

```java
@Slf4j  
public class TestCondition {  
    private static boolean hasCigarette = false;  
    private static boolean hasTakeout = false;  
  
    private static ReentrantLock room = new ReentrantLock();  
    private static Condition waitCigaretteRoom = room.newCondition();  
    private static Condition waitTakeoutRoom = room.newCondition();  
  
    public static void main(String[] args) throws InterruptedException {  
  
        new Thread(() -> {  
            room.lock();  
            try {  
                log.info("有烟没？[{}]", hasCigarette);  
                while (!hasCigarette) {  
                    log.info("没烟，干不了活");  
                    waitCigaretteRoom.await();  
                }  
                log.info("有烟了，干活！");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } finally {  
                room.unlock();  
            }  
        }, "小南").start();  
  
        new Thread(() -> {  
            room.lock();  
            try {  
                log.info("有外卖没？[{}]", hasTakeout);  
                while (!hasTakeout) {  
                    log.info("没外卖，干不了活");  
                    waitTakeoutRoom.await();  
                }  
                log.info("有外卖了，干活！");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } finally {  
                room.unlock();  
            }  
        }, "小女").start();  
  
        TimeUnit.MILLISECONDS.sleep(50);  
  
        new Thread(() -> {  
            room.lock();  
            try {  
                hasCigarette = true;  
                log.info("烟送到了...");  
                waitCigaretteRoom.signal();  
            } catch (Exception e) {  
                e.printStackTrace();  
            } finally {  
                room.unlock();  
            }  
        }, "送烟的").start();  
    }  
  
}
```

**输出结果**

```java
22:54:49.840 [小南] INFO com.duoduo.TestCondition - 有烟没？[false]
22:54:49.847 [小南] INFO com.duoduo.TestCondition - 没烟，干不了活
22:54:49.847 [小女] INFO com.duoduo.TestCondition - 有外卖没？[false]
22:54:49.847 [小女] INFO com.duoduo.TestCondition - 没外卖，干不了活
22:54:49.889 [送烟的] INFO com.duoduo.TestCondition - 烟送到了...
22:54:49.889 [小南] INFO com.duoduo.TestCondition - 有烟了，干活！
```


# 4 共享模型之内存

>上一章讲解的Monitor 主要关注的是访问共享变量时，保证临界区代码的原子性
>这一章我们进一步深入学习共享变量在多线程间的【可见性】问题与多条指令执行时的【有序性】问题

## 4.1 Java 内存模型（JMM）

JMM 即 Java Memory Model，它定义了主存（共享数据）、工作内存（私有数据）抽象概念，底层对应着CPU寄存器、缓存、硬件内存、CPU指令优化等。

JMM体现在以下几个方面：

- 原子性：保证指令不会受到线程上下文切换的影响
- 可见性：保证指令不会受cpu缓存的影响
- 有序性：保证指令不会受cpu指令并行优化的影响

## 4.2 可见性

### 退不出的循环

#### 现象

```java
public class TestThreadVisibility {  
  
    static boolean run = true;  
  
    public static void main(String[] args) throws InterruptedException {  
        new Thread(() -> {  
            while (run) {  
                // ...  
                if (!run) break;  
            }  
        }, "t").start();  
        TimeUnit.SECONDS.sleep(1);  
        // 试图停止t线程  
        run = false;  
    }  
}
```

糟糕！发现线程无法停止运行

#### 原因

1. 初始状态：t线程刚开始从主内存读取了 run 的值到工作内存

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325085941.png)

2. 因为t线程要频繁从主内存中读取run的值，JIT编译器会将run的值缓存至自己工作内存中的高速缓存中，减少对主存中run的访问，提高效率

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325090036.png)

3. 1秒之后，main线程修改了run的值，并同步至主存，而t是从自己工作内存中的高速缓存中读取这个变量的值，结果永远是旧值

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325090149.png)

#### 解决方法

**volatile 关键字**

它可以用来修饰成员变量和静态成员变量，他可以避免线程从自己的工作缓存中查找变量的值，必须到主存中获取它的值，线程操作 volatile 变量都是直接操作主存

```java
volatile static boolean run = true;
```

**synchronized 关键字**

```java
public class TestThreadVisibility {  
  
    static boolean run = true;  
  
    static Object lock = new Object();  
  
    public static void main(String[] args) throws InterruptedException {  
        new Thread(() -> {  
            while (run) {  
                // ...  
                synchronized (lock) {  
                    if (!run) break;  
                }  
            }  
        }, "t").start();  
        TimeUnit.SECONDS.sleep(1);  
        // 试图停止t线程  
        run = false;  
    }  
}
```

#### 可见性 VS 原子性

前面例子体现的实际就是可见性，它保证的是在多个线程之间，一个线程对 volatile 变量的修改对另一个线程可见，不能保证原子性，仅用在一个写线程，多个读线程的情况:
上例从字节码理解是这样的：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325091001.png)

比较一下之前我们将线程安全时举的例子：两个线程一个i++，一个i--，只能保证看到最新值，不能解决指令
交错

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325091015.png)

**注意**

synchronized 语句块既可以保证代码块的原子性，也同时保证代码块内变量的可见性。但缺点是 synchronized 是属于重量级操作，性能相对更低。

#### 拓展思考

如果在前面示例的死循环中加入 System.out.println() 会发现即使不加 volatile 修饰符，线程t也能正确看到对 run 变量的修改了，想一想为什么？

**查询 `System.out.println()` 源码**

```java
public void println(int x) {  
    synchronized (this) {  
        print(x);  
        newLine();  
    }  
}
```

发现其是有 synchronized 修饰的，所以也能解决可见性的问题。

#### 拓展学习：终止模式之两阶段终止模式

[[#终止模式之两阶段终止模式（Two Phase Termination）]]

## 4.3 有序性

JVM会在不影响正确性的前提下，可以调整语句的执行顺序，思考下面一段代码：

```java
static int i;
static int j;

// 在某个线程内执行如下赋值操作
i = ...;
j = ...;
```

可以看到，至于是先执行 i 还是先执行 j ，对最终的结果不会产生影响。所以，上面代码真正执行时，既可以是

```java
i = ...;
j = ...;
```

也可以是

```java
j = ...;
i = ...;
```

这种特性称之为 **「指令重排」**，多线程下 **「指令重排」** 会影响正确性。

参考：[[#CPU执行指令]]

### 指令重排序所引起的问题

#### 诡异的结果

```java
int num = 0;
boolean ready = false;

// 线程1执行此方法
public void actor1(I_Result r) {
	if(ready) {
		r.r1 = num + num;
	} else {
		r.r1 =1;
	}
}

// 线程2执行此方法
public void actor2(I_Result r) {
	num = 2;
	ready = true;
}
```

上述的代码中，r.r1 一共有几种结果？

**结果1：4**

线程调用顺序：线程2 -> 线程1

- 线程2运行结束，再运行线程1，未发生线程上下文切换
- 此时 `num = 2` ，并且 `ready = true` 
- 线程1运行结束，此时 `r.r1 = 4`

**结果2：1**

线程调用顺序：线程1 -> 线程2

- 线程1运行结束，未发生线程上下文切换
- 此时 r.r1 = 4
- 线程2运行结束，不影响 r.r1 的值，该情况 `r.r1 = 4`

**【注意】结果3：0**

>思考：
>如果 actor2 方法中发生了指定重排，会发生什么？

如果发生了指令重排，代码将变为：

```java
int num = 0;
boolean ready = false;

// 线程1执行此方法
public void actor1(I_Result r) {
	if(ready) {
		r.r1 = num + num;
	} else {
		r.r1 =1;
	}
}

// 线程2执行此方法
public void actor2(I_Result r) {
	ready = true;
	num = 2;
}
```

此时，如果按照以下的步骤，结果将变为0：

- 线程2先被CPU调度，执行完成 `ready = true`
- （此时发生线程上写文切换）
- 线程1被CPU调度，并且执行完成，此时 `num = 0` ，`r.r1 = 0`
- 线程2重新被CPU调度，此时犹豫线程1已经执行完毕，`r.r1 = 0`

#### 验证诡异的结果

```java
@JCStressTest
@Outcome(id = {"1", "4"}, expect = Expect.ACCEPTABLE, desc = "ok")
@Outcome(id = "0", expect = Expect.ACCEPTABLE_INTERESTING, desc = "!!!!")
@State
public class ConcurrencyTest {
	
	int num = 0;
	boolean ready = false;
	
	@Actor
	public void actor1(I_Result r) {
		if(ready) {
			r.r1 = num + num;
		} else {
			r.r1 =1;
		}
	}
	
	@Actor
	public void actor2(I_Result r) {
		num = 2;
		ready = true;
	}
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326105030.png)

#### 禁用重排序

**加上 volatile 关键字**

```java
volatile boolean ready = false;
```

加了 volatile 关键字，会使该赋值语句前面的代码不会被重排序

原理参考：[[#2 如何保证有序性|volatile如何保证有序性]]

### volatile 原理

volatile 的底层实现原理是内存屏障，Memory Barrier (Memory Fence)
- 对 volatile 变量的写指令后会加入写屏障
- 对 volatile 变量的读指令前会加入读屏障

#### 1 如何保证可见性

##### 写屏障（sfence）

写屏障保证在该屏障之前的，对共享变量的改动，都同步到主存当中

```java
public void actor(I_Result r) {
	num = 2;
	// ready 是 volatile 赋值带写屏障
	ready = true
}
```

##### 读屏障（lfence）

读屏障保证在该屏障之后，对共享变量的读取，加载的是主存中最新数据

```java
public void actor2(I_Result r) {
	// 读屏障
	// ready 是 volatile 读取值带读屏障
	if (ready) {
		r.r1 = num + num;
	}
	else {
		r.r1 = 1
	}
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326111313.png)

#### 2 如何保证有序性

##### 写屏障

写屏障会确保指令重排序时，不会将写屏障之前的代码排在写屏障之后

```java
public void actor(I_Result r) {
	num = 2;
	// ready 是 volatile 赋值带写屏障
	ready = true
	// 写屏障
}
```

##### 读屏障

读屏障会确保指令重排序时，不会将读屏障之后的代码排在读屏障之前

```java
public void actor2(I_Result r) {
	// 读屏障
	// ready 是 volatile 读取值带读屏障
	if (ready) {
		r.r1 = num + num;
	}
	else {
		r.r1 = 1
	}
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326112009.png)

>【注意】
>
>1. 写屏障仅仅是保证之后的读能够读到最新的结果，但不能保证读跑到它前面去
>
>2. 有序性的保证也只是保证了本线程内相关代码不被重排序

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326112319.png)

#### double-checked locking 问题

以著名的 double-checked locking 单例模式为例

```java
public final class Singleton {
	private Singleton() {}
	private static Singleton INSTANCE = null;
	public static synchronized Singleton getInstance() {
		if (INSTANCE == null) {
			// 首次访问会同步，而之后的使用没有 synchronized
			synchronized(Singleton.class) {
				if (INSTANCE == null) {
					INSTANCE = new Singleton();
				}
			}
		}
		return INSTANCE;
	}
}
```

以上实现的特点：

- 懒惰实例化
- 首次使用 getInstance 才使用 synchronized 加锁，后续使用时无需加锁

**【思考】不存在问题吗？**

有隐含的，很关键的一点：第一个 if 使用了 INSTANCE 变量，并且判断是在同步块之外

但在多线程环境下，上面的代码是有问题的，getInstance方法对应的字节码为：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326195237.png)

- 17表示创建对象，将对象引用入栈(new Singleton)
- 20表示复制一份对象引用（引用地址）
- 21表示利用一个对象引用，调用构造方法
- 24表示利用一个对象引用，赋值给 static INSTANCE

正常情况下，指令的顺序为 21 -> 24

但是，也存在一种可能，JVM会优化为先 24 -> 21；如果两个线程t1，t2按如下时间序列执行：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326195616.png)

关键在于0: getstatic这行代码在 monitor 控制之外，它就像之前举例中不守规则的人，可以越过 monitor 读取 INSTANCE 变量的值

这时 t1 还未完全将构造方法执行完毕，如果在构造方法中要执行很多初始化操作，那么 t2 拿到的是将是一个未初始化完毕的单例

对 INSTANCE 使用 volatile 修饰即可，可以禁用指令重排，但要注意在 JDK5 以上的版本的 volatile 才会真正有效


#### double-checked locking 解决

```java
public final class Singleton {
	private Singleton() {}
	private static volatile Singleton INSTANCE = null;
	public static synchronized Singleton getInstance() {
		// 实例没创建，才会进入内部的 synchronized 代码块
		if (INSTANCE == null) {
			synchronized(Singleton.class) {
				// 也许有其他线程已经创建实例，所以再次判断一次
				if (INSTANCE == null) {
					INSTANCE = new Singleton();
				}
			}
		}
		return INSTANCE;
	}
}
```

从字节码上看不出来 volatile 指令的效果

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326200424.png)

如上面的注释内容所示，读写 volatile 变量时会加入内存屏障，保证以下两点：

- 可见性
	- 写屏障(sfence)保证在该屏障之前的 t1 对共享变量的改动，都同步到主存当中
	- 而读屏障(lfence)保证在该屏障之后 t2 对共享变量的读取，加载的是主存中最新数据

- 有序性
	- 写屏障会确保指令重排序时，不会将写屏障之前的代码排在写屏障之后
	- 读屏障会确保指令重排序时，不会将读屏障之后的代码排在读屏障之前

>更底层是读写变量时使用 lock 指令来多核 CPU 之间的可见性与有序性

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326201343.png)

#### happens-before

happens-before 规定了对共享变量的写操作对其它线程的读操作可见，它是可见性与有序性的一套规则总结，抛开以下happens-before规则，JMM并不能保证一个线程对共享变量的写，对于其它线程对该共享变量的读可见

**线程解锁m之前对变量的写，对于接下来对m加锁的其它线程对该变量的读可见**

```java
static int x;
static Object m = new Object();

new Thread(() -> {
	synchronized(m) {
		x = 10;	
	}
}, "t1").start();

new Thread(() -> {
	synchronized(m) {
		System.out.println(x);
	}
}, "t2").start();
```

**线程对 volatile 变量的写，对接下来其他线程对该变量的读可见**

```java
volatile static int x;

new Thread(() -> {
		x = 10;	
}, "t1").start();

new Thread(() -> {
	System.out.println(x);
}, "t2").start();
```

**线程 start 前对变量的写，对该线程开始后对该变量的读可见**

```java
static int x;

x = 10;

new Thread(() -> {
	System.out.println(x);
}, "t2").start();
```

**线程结束前对变量的写，对其它线程得知它结束后的读可见（比如其它线程调用 t1.isAlive() 或 t1.join() 等待它结束)**

```java
static int x;

Thread t1 = new Thread(() -> {
	x = 10;
}, "t1");
t1.start();

t1.join();
System.out.println(x);

```

**线程 t1 打断 t2（interrupt）前对变量的写，对于其他线程得知 t2 被打断后对变量的读可见（通过t2.interrupt 或 t2.isInterrupted）**

```java
static int x;

public static void main(String[] args){
	Thread t2 = new Thread(()->{
		while(true){
			if(Thread.currentThread().isInterrupted()){ 
				System.out.println(x);
				break;
			}
		}
	},"t2");
	t2.start();
	
	new Thread(()->{
		sleep(1);
		X =10;
		t2.interrupt();
	},"t1").start();

	while(!t2.isInterrupted()){ 
		Thread.yield();
	}
	
	System.out.println(x);
}
```

**对变量默认值 0 (int) ，false （boolean) , null (引用对象) 的写，对其它线程对该变量的读可见**

**具有传递性，如果x hb->y并且y hb-> z那么有x hb-> z，配合 volatile 的防指令重排，有下面的例子**

```java
volatile static int x;
static int y;

new Thread(() -> {
	y = 10;
	x = 20;
}, "t1").start();

new Thread(() -> {
	// x = 20 对 t2 可见，同时 y = 10 也对 t2 可见
	System.out.println(x);
}, "t2").start();
```


#### 习题

##### balking 模式习题

希望 doInit() 方法仅被调用一次，下面的实现是否有问题，为什么？又该如何改正？

```java
public class TestVolatile {
	
	volatile boolean initialized = false;

	void init() {
		if (initialized) { 
			return;
		}
		doInit();
		initialized = true;
	}

	private void doInit() {
	
	}
}
```

**不正确，因为 volatile 只能保证有序性和可见性，无法保证原子性，还是会存在高并发下多个线程执行多次 doInit() 的行为**

**【解决方法】使用 synchronized 修饰**

##### 线程安全单例习题

单例模式有很多实现方法，饿汉、懒汉、静态内部类、枚举类，试分析每种实现下获取单例对象（即调用getInstance）时的线程安全，并思考注释中的问题

- 饿汉式：类加载就会导致该单实例对象被创建
- 懒汉式：类加载不会导致该单实例对象被创建，而是首次使用该对象时才会创建

###### 实现1

```java
// 问题1：为什么加final
// 问题2：如果实现了序列化接口，还要做什么来防止反序列化破坏单例
public final class Singleton implements Serializable {
	// 问题3：为什么设置为私有？是否能防止反射创建新的实例？ 
	private singleton() {}
	// 问题4：这样初始化是否能保证单例对象创建时的线程安全？
	private static final singleton INSTANCE = new singleton();
	// 问题5：为什么提供静态方法而不是直接将INSTANCE设置为pub1ic，说出你知道的理由
	public static singleton getInstance(){
		return INSTANCE;
	}
}
```

>问题1：为什么加 final

怕子类中不适当的覆盖了父类中的一些方法，破坏了单例模式

>问题2：如果实现了序列化接口，还要做什么来防止反序列化破坏单例

由于在反序列化过程中，一旦发现程序中有 readResolve 对象，将会返回该方法内的对象，而不是反序列化后的对象

增加 readResolve 方法：

```java
public Object readResolve() {
	return INSTANCE;
}
```

>问题3：为什么设置为私有？是否能防止反射创建新的实例？ 

由于如果设置为非私有，那么其他的类都可以任意创造对象，不能保证单例模式

不能防止反射来创建新的实例

>问题4：这样初始化是否能保证单例对象创建时的线程安全？

能保证，因为静态成员变量它的初始化操作是在类加载的时候完成的，由JVM完成，是线程安全的。

>问题5：为什么提供静态方法而不是直接将INSTANCE设置为pub1ic，说出你知道的理由

1. 提供了更好的封装性
2. 可以实现懒惰初始化
3. 提供泛型的支持

###### 实现2

```java
// 问题1：枚举单例是如何限制实例个数的
// 问题2：枚举单例在创建时是否有并发问题
// 问题3：枚举单例能否被反射破坏单例
// 问题4：枚举单例能否被反序列化破坏单例
// 问题5：枚举单例属于是懒汉模式还是饿汉模式
// 问题6：枚举单例如果希望假如一些单例创建时的初始化操作，该如何做？
enum Singleton{
	INSTANCE;
}
```

>问题1：枚举单例是如何限制实例个数的

由反编译可知，其中 INSTANCE 为 `public final static` 修饰的，所以是单实例的

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230326213545.png)

>问题2：枚举单例在创建时是否有并发问题

能保证，因为静态成员变量它的初始化操作是在类加载的时候完成的，由JVM完成，是线程安全的。

>问题3：枚举单例能否被反射破坏单例

不能

>问题4：枚举单例能否被反序列化破坏单例

不能，因为枚举类默认都是继承了序列化的接口的，在实现中已经考虑到了反序列化的问题

>问题5：枚举单例属于是懒汉模式还是饿汉模式

饿汉式，因为其中 INSTANCE 为 `public final static` 修饰的，所以是在类加载时创建的。

>问题6：枚举单例如果希望假如一些单例创建时的初始化操作，该如何做？

可以放在枚举类的构造方法里面

###### 实现3

```java
public final class singleton
	private Singleton(){
	private static Singleton INSTANCE = null; 
	//分析这里的线程安全，并说明有什么缺点
	public static synchronized Singleton getInstance(){
		if(INSTANCE != null ) {
			return INSTANCE;
		}
		INSTANCE = new Singleton(); 
		return INSTANCE;
	}
}
```

能够保证线程安全，因为在 getInstance 方法上增加了 synchronized

【缺点】锁的范围太大了，每次进来该方法都要加锁

【优化】[[#double-checked locking 解决]]

###### 实现4

```java
public final class Singleton {
	private Singleton(){}
	//问题1:解释为什么要加 volatile?
	
	private static volatile Singleton INSTANCE = null;
	//问题2:对比实现3，说出这样做的意义
	public static Singleton getInstance(){
		if (INSTANCE != null) {
			return INSTANCE;
		}
		synchronized (Singleton.class) {
			//问题3:为什么还要在这里加为空判断，之前不是判断过了吗
			if (INSTANCE != null){
				return INSTANCE;
			}
			INSTANCE = new Singleton();
			return INSTANCE;
		}
	}
}
```

>问题1：解释为什么要加 volatile?

为了保证有序性和可见性

参考 [[#double-checked locking 问题]]、[[#double-checked locking 解决]]

>问题2：对比实现3，说出这样做的意义

缩小 synchronized 范围，性能上比较优越

>问题3：为什么还要在这里加为空判断，之前不是判断过了吗

为了防止首次创建 Singleton 对象时的高并发导致多次创建的问题

###### 实现5

```java
public final class Singleton {
	private Singleton() {}
	//问题1：属于懒汉式还是饿汉式
	private static class LazyHolder {
		static final Singleton INSTANCE = new Singleton();
	}
	//问题2：在创建时是否有并发问题
	public static Singleton getInstance() {
		return LazyHolder.INSTANCE;
	}
}
```

>问题1：属于懒汉式还是饿汉式

**懒汉式**，类总是在你第一次被用到时，才会触发它的类加载操作

>问题2：在创建时是否有并发问题

类加载时由JVM进行创建，没有并发问题

# 5 共享模型之无锁

## 本章内容

- CAS 与 volatile
- 原子整数
- 原子引用
- 原子累加器
- Unsafe

## 5.1 问题提出

有如下需求，保证 `accountUnsafe.withdraw` 取款方法的线程安全

```java
public class TestCas {  
  
    public static void main(String[] args) {  
        Account accountUnsafe = new AccountUnsafe(10000);  
        Account.demo(accountUnsafe);  
    }  
  
}  

// 线程不安全的转账操作
class AccountUnsafe implements Account {  
  
    private Integer balance;  
  
    public AccountUnsafe(Integer balance) {  
        this.balance = balance;  
    }  
  
    @Override  
    public Integer getBalance() {  
        return balance;  
    }  
  
    @Override  
    public void withdraw(Integer amount) {  
        balance -= amount;  
    }  
  
}  
  
interface Account {  
  
    // 获取余额  
    Integer getBalance();  
  
    // 取款  
    void withdraw(Integer amount);  
  
    static void demo(Account account) {  
        List<Thread> ts = new ArrayList<>();  
  
        for (int i = 0; i < 1000; i++) {  
            ts.add(new Thread(() -> {  
                account.withdraw(10);  
            }, i + ""));  
        }  
  
        ts.forEach(Thread::start);  
  
        ts.forEach(t -> {  
            try {  
                t.join();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        });  
  
        System.out.println("account => " + account.getBalance());  
  
    }  
}
```

### 为什么不安全？

因为 `balance` 为线程共享变量，而扣款操作非原子，在多线程下会有问题

### 如何解决？

使用 CAS 

```java
class AccountCAS implements Account {  
  
    private AtomicInteger balance;  
  
    public AccountCAS(Integer balance) {  
        this.balance = new AtomicInteger(balance);  
    }  
  
    @Override  
    public Integer getBalance() {  
        return balance.get();  
    }  
  
    @Override  
    public void withdraw(Integer amount) {  
        while (true) {  
            // 获取余额的最新值  
            int prev = balance.get();  
            // 要修改的余额值  
            int next = prev - amount;  
            // 进行余额的修改  
            if (balance.compareAndSet(prev, next)) {  
                break;  
            }  
        }  
    }  
}
```

## 5.2 CAS 与 volatile

### CAS

前面看到的 AtomicInteger 的解决方法，内部并没有用锁来保护共享变量的线程安全。那么它是如何实现的呢?

```java
public void withdraw(Integer amount) {  
	while (true) {  
		// 获取余额的最新值  
		int prev = balance.get();  
		// 要修改的余额值  
		int next = prev - amount;  
		// 进行余额的修改  
		if (balance.compareAndSet(prev, next)) {  
			break;  
		}  
	}  
}  
```

其中的关键是 compareAndSet，它的简称就是CAS(也有 Compare And Swap的说法)，它必须是原子操作。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230327104643.png)

>其实 CAS 的底层是 lock cmpxchg 指令（X86架构），在单核CPU和多核CPU下都能够保证`【比较-交换】`的原子性。
>
>在多核状态下，某个核执行到带 lock的指令时，CPU会让总线锁住，当这个核把此指令执行完毕，再开启总线。这个过程中不会被线程的调度机制所打断，保证了多个线程对内存操作的准确性，是原子的。

### volatile

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230327105507.png)

AtomicInteger 中的 value 属性用 volatile 修饰，原因如下：

获取共享变量时，为了保证该变量的可见性，需要使用 volatile 修饰。

它可以用来修饰成员变量和静态成员变量，他可以避免线程从自己的工作缓存中查找变量的值，必须到主存中获取它的值，线程操作 volatile 变量都是直接操作主存。即一个线程对 volatile 变量的修改，对另一个线程可见。

>volatile 仅仅保证了共享变量的可见性，让其它线程能够看到最新值，但不能解决指令交错问题(不能保证原子性)
>
>CAS 必须借助 volatile 才能读取到共享变量的最新值来实现 `[比较并交换]` 的效果

### 为什么无锁效率高？

- 无锁情况下，即使重试失败，线程始终在高速运行，没有停歇，而 `synchronized` 会让线程在没有获得锁的时候，发生上下文切换，进入阻塞。

- 线程就好像高速跑道上的赛车，高速运行时，速度超快，一旦发生上下文切换，就好比赛车要减速、熄火，等被唤醒又得重新打火、启动、加速，恢复到高速运行，代价比较大。

- 但无锁情况下，因为线程要保持运行，需要额外 CPU 的支持，CPU 在这里就好比高速跑道，没有额外的跑道，线程想高速运行也无从谈起，虽然不会进入阻塞，但由于没有分到时间片，仍然会进入可运行状态，还是会导致上下文切换。 

### CAS 特点

结合 CAS 和 volatile 可以实现无锁并发，适用于线程数少、多核CPU的场景下。

- **CAS 是基于乐观锁的思想**：不怕别的线程来修改共享变量，就算改了也没关系，我吃亏点再重试呗。

- **synchronized 是基于悲观锁的思想**：得防着其它线程来修改共享变量，我上了锁你们都别想改，我改完了解开锁，你们才有机会。

- **CAS 体现的是无锁并发、无阻塞并发**
	- 因为没有使用 synchronized，所以线程不会陷入阻塞，这是效率提升的因素之一
	- 但如果竞争激烈，可以想到重试必然频繁发生，反而效率会受影响




## 5.3 原子整数

JUC 并发包提供了：

- `AtomicBoolean`
- `AtomicInteger`
- `AtomicLong`

以 `AtomicInteger` 为例

```java
public class TestAtomicInteger {  
  
    public static void main(String[] args) {  
  
        AtomicInteger i = new AtomicInteger(0);  
  
        // 等价于 ++i（先自增，后获取），结果：1  
        System.out.println(i.incrementAndGet());  
  
        // 等价于 i++（先获取，后自增），结果1  
        System.out.println(i.getAndIncrement());  
  
        // 等价于 --i（先自减，后获取），结果1  
        System.out.println(i.decrementAndGet());  
  
        // 等价于 i--（先获取，后自减），结果1  
        System.out.println(i.getAndDecrement());  
  
        // 先获取，后加上5，结果0  
        System.out.println(i.getAndAdd(5));  
  
        // 先加上5，后获取，结果10  
        System.out.println(i.addAndGet(5));  
  
        // lambda 参数表示读取到的值，lambda 方法表示将要做的操作，也是原子操作，结果是100  
        System.out.println(i.updateAndGet(x -> x * 10));  
  
        // lambda 参数表示读取到的值，lambda 方法表示将要做的操作，也是原子操作，结果是100  
        System.out.println(i.getAndUpdate(x -> x * 10));  
  
    }  
}
```

### 尝试自己实现一个 updateAndGet()

**v1版本**

```java
public class CustomUpdateAndGet {  
  
    public static void main(String[] args) {  
        AtomicInteger i = new AtomicInteger(5);  
        System.out.println(updateAndGet(i));  
    }  
  
    public static int updateAndGet(AtomicInteger i) {  
        while (true) {  
            int prev = i.get();  
            int next = prev * 10;  
            if (i.compareAndSet(prev, next)) {  
                return next;  
            }  
        }  
    }  
  
}
```

>思考
>
>这样方法就太局限了，最好是能支持各种加减乘除操作

**v2版本**

```java
public class CustomUpdateAndGet {  
  
    public static void main(String[] args) {  
        AtomicInteger i = new AtomicInteger(5);  
        System.out.println(updateAndGet(i, num -> num * 10));  
    }  

	// 实现方法由实现类实现
    public static int updateAndGet(AtomicInteger i, IntUnaryOperator operator) {  
        while (true) {  
            int prev = i.get();  
            int next = operator.applyAsInt(prev);  
            if (i.compareAndSet(prev, next)) {  
                return next;  
            }  
        }  
    }  
}
```

### updateAndGet()原理

```java
public final int updateAndGet(IntUnaryOperator updateFunction) {  
    int prev = get(), next = 0;  
    for (boolean haveNext = false;;) {  
        if (!haveNext)  
	        // 计算next值
            next = updateFunction.applyAsInt(prev);  
		// Unsafe进行CAS操作
        if (weakCompareAndSetVolatile(prev, next))  
            return next;  
		// 若prev没发生变化，那么就不再计算next的值，直接进行CAS操作
		// 若prev发生了变化，重新计算next值，然后CAS操作
        haveNext = (prev == (prev = get()));  
    }  
}
```

## 5.4 原子引用

为什么需要原子引用类型？

- AtomicReference
- AtomicMarkableReference
- AtomicStampedReference

### AtomicReference

```java
public class TestAtomicReference {  
    public static void main(String[] args) {  
        DecimalAccount decimalAccountCAS = new DecimalAccountCAS(new BigDecimal("10000"));  
        DecimalAccount.demo(decimalAccountCAS);  
    }  
}  
  
class DecimalAccountCAS implements DecimalAccount {  
  
    private AtomicReference<BigDecimal> balance;  
  
    public DecimalAccountCAS(BigDecimal balance) {  
        this.balance = new AtomicReference<>(balance);  
    }  
  
    @Override  
    public BigDecimal getBalance() {  
        return balance.get();  
    }  
  
    @Override  
    public void withdraw(BigDecimal amount) {  
        while (true) {  
            BigDecimal prev = balance.get();  
            BigDecimal next = prev.subtract(amount);  
            if (balance.compareAndSet(prev, next)) {  
                break;  
            }  
        }  
    }  
}  
  
// 线程不安全的转账操作  
  
interface DecimalAccount {  
  
    // 获取余额  
    BigDecimal getBalance();  
  
    // 取款  
    void withdraw(BigDecimal amount);  
  
    static void demo(DecimalAccount account) {  
        List<Thread> ts = new ArrayList<>();  
  
        for (int i = 0; i < 1000; i++) {  
            ts.add(new Thread(() -> {  
                account.withdraw(BigDecimal.TEN);  
            }, i + ""));  
        }  
  
        ts.forEach(Thread::start);  
  
        ts.forEach(t -> {  
            try {  
                t.join();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        });  
  
        System.out.println("account => " + account.getBalance());  
  
    }  
}
```

### 关于 ABA 问题以及解决

#### ABA 问题

当主线程准备修改时，其他线程已经进行了对变量的修改，只不过最终结果与主线程最开始获得的结果一致，那么**主线程CAS操作也能成功，无法监测到变量已经被其他线程所改变**

```java
@Slf4j  
public class testABA {  
  
    static AtomicReference<String> reference = new AtomicReference<>("A");  
  
    public static void main(String[] args) throws InterruptedException {  
        String prev = reference.get();  
        log.info("初始值为：{}", prev);  
        otherThreadChange();  
        TimeUnit.SECONDS.sleep(1);  
        if (reference.compareAndSet(prev, "C")) {  
            log.info("{} -> C", prev);  
        }  
    }  
  
    private static void otherThreadChange() throws InterruptedException {  
        Thread t1 = new Thread(() -> {  
            while (true) {  
                String prev = reference.get();  
                if (reference.compareAndSet(prev, "B")) {  
                    log.info("{} -> B", prev);  
                    break;  
                }  
            }  
        }, "t1");  
        t1.start();  
		TimeUnit.MILLISECONDS.sleep(10);  
        Thread t2 = new Thread(() -> {  
            while (true) {  
                String prev = reference.get();  
                if (reference.compareAndSet(prev, "A")) {  
                    log.info("{} -> A", prev);  
                    break;  
                }  
            }  
        }, "t2");  
        t2.start();  
    }  
}
```

**输出结果**

```java
19:17:02.775 [main] INFO com.duoduo.testABA - 初始值为：A
19:17:02.797 [t1] INFO com.duoduo.testABA - A -> B
19:17:02.797 [t2] INFO com.duoduo.testABA - B -> A
19:17:02.798 [main] INFO com.duoduo.testABA - A -> C
```

主线程仅能判断出共享变量的值与最初值A是否相同，不能感知到这种从A改为B又改回A的情况，如果主线程希望：

只要有其它线程**动过了**共享变量，那么自己的 CAS 就算失败，这时，仅比较值是不够的，需要再加一个版本号

### AtomicStampedReference

AtomicStampedReference 在 AtomicReference 基础上加了 stamp（版本）的概念

**输出结果**

```java
19:29:18.563 [main] INFO com.duoduo.testABA - 初始值为：A
19:29:18.568 [main] INFO com.duoduo.testABA - 初始版本号为：0
19:29:18.569 [t1] INFO com.duoduo.testABA - A -> B
19:29:18.569 [t1] INFO com.duoduo.testABA - 当前版本号:1
19:29:18.582 [t2] INFO com.duoduo.testABA - B -> A
19:29:18.582 [t2] INFO com.duoduo.testABA - 当前版本号:2
19:29:19.583 [main] INFO com.duoduo.testABA - 主线程CAS结果为:false
```

注意，比较于 AtomicReference，由于加入了版本号的概念，当发现版本号不一致时，主线程CAS结果失败。

AtomicStampedReference 可以给原子引用加上版本号，追踪原子引用整个的变化过程，如：
A -> B -> A -> C，通过 AtomicStampedReference，我们可以知道，引用变量中途被更改了几次。

但是有时候，并不关心引用变量更改了几次，**只是单纯的关心是否更改过**，所以就有了AtomicMarkableReference

### AtomicMarkableReference

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230327193630.png)

```java
@Slf4j  
public class TestGarbageBag {  
  
    public static void main(String[] args) throws InterruptedException {  
        GarbageBag garbageBag = new GarbageBag("装满了垃圾的垃圾袋");  
        GarbageBag newGarbageBag = new GarbageBag("干净的垃圾袋!");  
        boolean fullOfGarbage = true;  
        AtomicMarkableReference<GarbageBag> reference = new AtomicMarkableReference<>(garbageBag, fullOfGarbage);  
        log.info("start...");  
        GarbageBag prev = reference.getReference();  
        log.info("当前垃圾袋状态为:[{}]", garbageBag);  
  
        // 增加一个保洁阿姨进行垃圾的回收  
        new Thread(() -> {  
            log.info("保洁阿姨开始进行垃圾的回收");  
            reference.compareAndSet(garbageBag, newGarbageBag, true, false);  
        }, "保洁阿姨").start();  
  
        TimeUnit.SECONDS.sleep(1);  
        // 期望是装满垃圾的垃圾袋  
        // 如果没有装满垃圾，那么就不换垃圾袋  
        boolean changeSuccess = reference.compareAndSet(prev, newGarbageBag, fullOfGarbage, !fullOfGarbage);  
        log.info("换了吗？" + changeSuccess);  
        log.info("当前垃圾袋状态为:[{}]", garbageBag);  
    }  
  
}  
  
class GarbageBag {  
  
    String desc;  
  
    public GarbageBag(String desc) {  
        this.desc = desc;  
    }  
  
    @Override  
    public String toString() {  
        return "GarbageBag{" +  
                "desc='" + desc + '\'' +  
                '}';  
    }  
}
```

**输出结果**

```java
19:53:41.622 [main] INFO com.duoduo.TestGarbageBag - start...
19:53:41.625 [main] INFO com.duoduo.TestGarbageBag - 当前垃圾袋状态为:[GarbageBag{desc='装满了垃圾的垃圾袋'}]
19:53:41.646 [保洁阿姨] INFO com.duoduo.TestGarbageBag - 保洁阿姨开始进行垃圾的回收
19:53:42.658 [main] INFO com.duoduo.TestGarbageBag - 换了吗？false
19:53:42.658 [main] INFO com.duoduo.TestGarbageBag - 当前垃圾袋状态为:[GarbageBag{desc='装满了垃圾的垃圾袋'}]
```

发现由于已经被更改，所以主人换垃圾袋的CAS操作失败

## 5.5 原子数组

### 不安全的数组

```java
public class TestAtomicArray {  
  
    public static void main(String[] args) {  
        demo(() -> new int[10], array -> array.length, (array, index) -> array[index]++, array -> System.out.println(Arrays.toString(array)));  
    }  
  
    private static <T> void demo(Supplier<T> arraySupplier, Function<T, Integer> lengthFunc,  
                                 BiConsumer<T, Integer> putConsumer, Consumer<T> printConsumer) {  
       List<Thread> ts = new ArrayList<>();  
        T array = arraySupplier.get();  
        Integer length = lengthFunc.apply(array);  
        for (int i = 0; i < length; i++) {  
            // 每个线程对数组做10000次操作  
            ts.add(new Thread(() -> {  
                for (int j = 0; j < 10000; j++) {  
                    putConsumer.accept(array, j%length);  
                }  
            }));  
        }  
  
        ts.forEach(Thread::start);  

		ts.forEach(t -> {  
		    try {  
		        t.join();  
		    } catch (InterruptedException e) {  
		        throw new RuntimeException(e);  
		    }  
		});

        printConsumer.accept(array);  
    }  
}
```

**输出结果**

```java
[4070, 4143, 4136, 4120, 4136, 4156, 4133, 4175, 4288, 4254]
```

由于数组是不安全的，所以会导致高并发情况下，出现竞态条件

### 安全的数组（AtomicIntegerArray）

```java
public static void main(String[] args) {  
    demo(() -> new AtomicIntegerArray(10),  
            array -> array.length(),  
            (array, index) -> array.getAndIncrement(index),  
            array -> System.out.println(array));  
}
```

**输出结果**

```java
[10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]
```

## 5.6 字段更新器

- AtomicReferenceFieldUpdater
- AtomicIntegerFieldUpdater
- AtomicLongFieldUpdater

利用字段更新器，可以针对对象的某个域（Field）进行原子操作，只能配合 volatile 修饰的字段使用，否则会出现异常

```java
Exception in thread "main" java.lang.IllegalArgumentException: Must be volatile type
```

```java
@Slf4j  
public class TestAtomicReferenceFieldUpdater {  
  
    public static void main(String[] args) throws InterruptedException {  
        Student student = new Student("张三");  
        AtomicReferenceFieldUpdater updater = AtomicReferenceFieldUpdater.newUpdater(Student.class, String.class, "name");  
        new Thread(() -> {  
            student.name = "王五";  
        }).start();  
        TimeUnit.SECONDS.sleep(1);  
        updater.compareAndSet(student, "张三", "李四");  
        System.out.println(student);  
    }  
}  
  
class Student {  
  
    volatile String name;  
  
    public Student(String name) {  
        this.name = name;  
    }  
  
    @Override  
    public String toString() {  
        return "Student{" +  
                "name='" + name + '\'' +  
                '}';  
    }  
}
```

**输出结果**

```java
Student{name='王五'}
```

由于 student 对象的 name 属性被其他线程所修改，所以主线程的 CAS 操作失败。

## 5.7 原子累加器

JDK 8以后，新增了几个专门用于做累加的类，比如说：

- LongAdder
- LongAccumulator
- DoubleAdder
- DoubleAccumulator

### 累加器性能比较

以 `TestLongAdder` 为例

 ```java
 public class TestLongAdder {  
  
    public static void main(String[] args) {  
        System.out.println("【AtomicLong】");  
        for (int i = 0; i < 5; i++) {  
            demo(() -> new AtomicLong(0), adder -> adder.getAndAdd(5));  
        }  
        System.out.println();  
        System.out.println("【LongAdder】");  
        for (int i = 0; i < 5; i++) {  
            demo(() -> new LongAdder(), adder -> adder.add(5));  
        }  
    }  
  
    public static <T> void demo(Supplier<T> adderSupplier, Consumer<T> action) {  
  
        long start = System.currentTimeMillis();  
  
        T adder = adderSupplier.get();  
        List<Thread> ts = new ArrayList<>();  
        for (int i = 0; i < 5; i++) {  
            ts.add(new Thread(() -> {  
                for (int j = 0; j < 500000; j++) {  
                    action.accept(adder);  
                }  
            }));  
        }  
  
        ts.forEach(Thread::start);  
        ts.forEach(t -> {  
            try {  
                t.join();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        });  
        System.out.println("总耗时" + (System.currentTimeMillis() - start));  
    }  
}
```

**输出结果**

```java
【AtomicLong】
总耗时80
总耗时64
总耗时65
总耗时55
总耗时59

【LongAdder】
总耗时33
总耗时9
总耗时8
总耗时8
总耗时8
```

可以看出，差距了7、8倍，性能还是很客观的！

性能提升的原因很简单，就是在有竞争时，设置多个累加单元，Therad-0累加 Cell[0]，而Thread-1累加Cell[1]...最后将结果汇总。这样它们在累加时操作的不同的Cell变量，因此减少了CAS 重试失败，从而提高性能。

### 源码之LongAdder

LongAdder 类有几个关键域

```java
// 累加单元数组，懒惰初始化
transient volatile Cell[] cells;

// 基础值，如果没有竞争，则用 cas 累加这个域
transient volatile long base;

// 在 cells 创建或扩容时，置为1，表示加锁
transient volatile int cellsBusy;
```java

### CAS锁（cellBusy如何实现的？）

```java
@Slf4j  
public class CASLock {  
  
    private AtomicInteger state = new AtomicInteger(0);  
  
    public void lock() {  
        while (true) {  
            // 当1个线程进入后，state变为了1，其他线程的CAS操作均会失败，就相当于加了锁！  
            if (state.compareAndSet(0 ,1)) {  
                break;  
            }  
        }  
    }  
  
    public void unlock() {  
        log.info("unlock");  
        state.set(0);  
    }  
  
    public static void main(String[] args) {  
  
        CASLock casLock = new CASLock();  
  
        new Thread(() -> {  
            log.info("begin...");  
            casLock.lock();  
            try {  
                log.info("lock...");  
                TimeUnit.SECONDS.sleep(1);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } finally {  
                casLock.unlock();  
            }  
        }, "t1").start();  
  
        new Thread(() -> {  
            log.info("begin...");  
            casLock.lock();  
            try {  
                log.info("lock...");  
            } finally {  
                casLock.unlock();  
            }  
        }, "t2").start();  
  
    }  
}
```

**输出结果**

```java
00:29:11.398 [t1] INFO com.duoduo.CASLock - begin...
00:29:11.402 [t1] INFO com.duoduo.CASLock - lock...
00:29:11.398 [t2] INFO com.duoduo.CASLock - begin...
00:29:12.405 [t1] INFO com.duoduo.CASLock - unlock
00:29:12.405 [t2] INFO com.duoduo.CASLock - lock...
00:29:12.405 [t2] INFO com.duoduo.CASLock - unlock
```

发现线程2由于CAS失败，无法继续进行 lock() 操作获得锁

### 原理之伪共享

其中 Cell 即为累加单元

```java
//防止缓存行伪共享
@sun.misc.Contended
static final class Cell {
	volatile long value;
	Cell(long x) { 
		value = x; 
	}

	//最重要的方法，用来 cas 方式进行累加，prev 表示旧值，next 表示新值
	final boolean cas(long prev, long next) {
		return UNSAFE.compareAndSwapLong(this, valueoffset, prev, next); 
	}
	//省略不重要代码
}
```

#### CPU缓存

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328141732.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328142509.png)

因为CPU与内存的速度差异很大，需要靠预读数据至缓存来提升效率。

而缓存以缓存行为单位，每个缓存行对应着一块内存，一般是64 byte (8个long)

缓存的加入会造成数据副本的产生，即同一份数据会缓存在不同核心的缓存行中

CPU要保证数据的一致性，如果某个CPU核心更改了数据，其它 CPU核心对应的整个缓存行必须失效

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328143059.png)

因为 Cell 是数组形式，在内存中是连续存储的，一个Cell为24字节（16字节的对象头和8字节的value），因此缓存行可以存下2个的 Cell 对象。这样问题来了:
- Core-0要修改Cell[0]
- Core-1要修改Cell[1]

无论谁修改成功，都会导致对方 Core 的缓存行失效，比如 Core-0 中 Cell[0]=6000，Cell[1]=8000；要累加Cell[0]=6001, Cel1[1]=8000，这时会让 Core-1 的缓存行失效

`@sun.misc.Contended` 用来解决这个问题，它的原理是在使用此注解的对象或字段的前后各增加128字节大小
的 padding，从而让 CPU将对象预读至缓存时占用不同的缓存行，这样，不会造成对方缓存行的失效

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328143932.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328151908.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328151928.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328151949.png)

## 5.8 Unsafe

### 概述

Unsafe对象提供了非常底层的，操作内存、线程的方法，Unsafe对象不能直接调用，只能通过反射获得

```java
public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException {  
    Field theUnsafe = Unsafe.class.getDeclaredField("theUnsafe");  
    theUnsafe.setAccessible(true);  
    Unsafe unsafe = (Unsafe) theUnsafe.get(null);  
    System.out.println(unsafe);  
}
```

### Unsafe CAS 操作

#### Example

```java
@Slf4j  
public class TestUnsafe {  
  
    public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException {  
        Field theUnsafe = Unsafe.class.getDeclaredField("theUnsafe");  
        theUnsafe.setAccessible(true);  
        Unsafe unsafe = (Unsafe) theUnsafe.get(null);  
        System.out.println(unsafe);  
  
        // 1. 获取到域的偏移地址  
        long idOffset = unsafe.objectFieldOffset(Teacher.class.getDeclaredField("id"));  
        long nameOffset = unsafe.objectFieldOffset(Teacher.class.getDeclaredField("name"));  
  
        Teacher t = new Teacher();  
  
        // 2. 执行 CAS 操作  
        unsafe.compareAndSwapInt(t, idOffset, 0, 1);  
        unsafe.compareAndSwapObject(t, nameOffset, null, "张三");  
  
        // 3. 验证  
        System.out.println(t);  
    }  
}  
  
class Teacher {  
    volatile int id;  
    volatile String name;  
  
    @Override  
    public String toString() {  
        return "Teacher{" +  
                "id=" + id +  
                ", name='" + name + '\'' +  
                '}';  
    }  
}
```

**输出结果**

```java
sun.misc.Unsafe@2781e022
Teacher{id=1, name='张三'}
```

#### 实战：使用自定义的 AtomicData 实现线程安全的原子整数

**AtomicData**

```java
@Slf4j  
public class TestAtomicData {  
  
    public static void main(String[] args) throws InterruptedException {  
        AtomicData atomicData = new AtomicData(10000);  
        List<Thread> ts = new ArrayList<>();  
        for (int i = 0; i < 1000; i++) {  
            ts.add(new Thread(() -> {  
                atomicData.withdraw(10);  
            }));  
        }  
        for (Thread t : ts) {  
            t.start();  
            t.join();  
        }  
        System.out.println(atomicData.getBalance());  
    }  
}  
  
class AtomicData implements Account {  
  
    private static final long balanceOffset;  
    private static final Unsafe UNSAFE;  
    private volatile int balance;  
  
    static {  
        UNSAFE = UnsafeAccessor.getUnsafe();  
        try {  
            balanceOffset = UNSAFE.objectFieldOffset(AtomicData.class.getDeclaredField("balance"));  
        } catch (NoSuchFieldException e) {  
            throw new RuntimeException(e);  
        }  
    }  
  
  
    public AtomicData(int balance) {  
        this.balance = balance;  
    }  
  
    @Override  
    public Integer getBalance() {  
        return balance;  
    }  
  
    @Override  
    public void withdraw(Integer amount) {  
        while (true) {  
            int prev = this.balance;  
            int next = prev - amount;  
            if (UNSAFE.compareAndSwapInt(this, balanceOffset, prev, next)) {  
                break;  
            }  
        }  
    }  
}
```

**UnsafeAccessor**

```java
public class UnsafeAccessor {  
  
    private static final Unsafe unsafe;  
  
    static {  
        try {  
            Field theUnsafe = Unsafe.class.getDeclaredField("theUnsafe");  
            theUnsafe.setAccessible(true);  
            unsafe = (Unsafe) theUnsafe.get(null);  
        } catch (NoSuchFieldException e) {  
            throw new RuntimeException(e);  
        } catch (IllegalAccessException e) {  
            throw new RuntimeException(e);  
        }  
    }  
  
    public static Unsafe getUnsafe() {  
        return unsafe;  
    }  
}
```

**输出结果**

```java
0
```

保证了原子性！

# 6 共享模型之不可变

## 本章内容

- 不可变类的使用
- 不可变类设计
- 无状态类设计

## 6.1 日期转换的问题

### SimpleDateFormat 导致的线程不安全

下面的代码在运行时，由于 SimpleDateFormat 不是线程安全的

```java
SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");  
for (int i = 0; i < 10; i++) {  
    new Thread(() -> {  
        try {  
            sdf.parse("1951-04-21");  
        } catch (ParseException e) {  
            throw new RuntimeException(e);  
        }  
    }).start();  
}
```

**输出结果**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328163707.png)

### 解决方法一：改用 DateTimeFormatter 类（不可变设计）

```java
DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");  
for (int i = 0; i < 10; i++) {  
    new Thread(() -> {  
        log.info("{}", dtf.parse("1951-04-21"));  
    }).start();  
}
```

**输出结果**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328164309.png)

### 解决方法二：采用锁

```java
SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");  
for (int i = 0; i < 10; i++) {  
    new Thread(() -> {  
        synchronized (sdf) {  
            try {  
                log.info("{}", sdf.parse("1951-04-21"));  
            } catch (ParseException e) {  
                throw new RuntimeException(e);  
            }  
        }  
    }).start();  
}
```

## 6.2 不可变的设计

另一个大家更为熟悉的 String 类也是不可变的，以它为例，说明一下不可变设计的要素

```java
public final class String
	implements java.io.Serializable, Comparable<String>, CharSequence { 
	/** The value is used for character storage. */
	private final char value[];
	/** Cache the hash code for the string */ 
	private int hash; // Default to 0
	
	// ...
	
}
```

### final 的使用

发现该类、类中所有属性都是 final 的
- 属性用 final 修饰保证了该属性是只读的，不能修改
- 类用 final 修饰保证了该类中的方法不能被覆盖，防止子类无意间破坏不可变性

### 保护性拷贝

使用字符串时，也有一些跟修改相关的方法，比如 substring 等，那么下面就看一看这些方法是如何实现的，就以 substring 为例：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328165243.png)

发现其内部是调用 String 的构造方法创建了一个新字符串，再进入这个构造看看，是否对 `final char[] value` 做出了修改：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328165412.png)

结果发现也没有，构造新字符串对象时，会生成新的 `char[] value` ，对内容进行复制。这种通过创建副本对象来避免共享的手段称之为 **保护性拷贝(defensive copy)**

### 模式之享元

[[#GOF-享元模式|参考：GOF-享元模式]]


## 6.3 final 原理

理解了 [[#volatile 原理]] ，再对比 final 的实现就比较简单了。

### 设置 final 变量的原理

```java
public class TestFinal {
	final int a = 20;
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328190529.png)

发现 final 变量的赋值也会通过 putfield 指令来完成，同样在这条指令之后也会加入写屏障，保证在其它线程读到它的值时不会出现为0的情况。

### 获取 final 变量的原理

#### 未被 final 修饰的变量

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328192516.png)

发现是使用 `getstatic` 

#### 使用 final 修饰的变量

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328192747.png)

加了 final 修饰，发现是直接将常数保存在栈内存中，性能更高

## 7.3 无状态

在 web 阶段学习时，设计 Servlet 时为了保证其线程安全，都会有这样的建议，不要为 Servlet 设置成员变量，这种没有任何成员变量的类是线程安全的。因为成员变量保存的数据也可以成为状态信息，因此没有成员变量就称之为**无状态**

# 8 共享模型之工具

## 8.1 线程池

### 1 自定义线程池

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230328230845.png)

#### 简易版本的线程池

```java
@Slf4j  
public class TestThreadPool {  
  
    public static void main(String[] args) {  
        ThreadPool threadPool = new ThreadPool(10, 2, 1000, TimeUnit.MICROSECONDS);  
        for (int i = 0; i < 5; i++) {  
            int j = i;  
            threadPool.execute(() -> {  
                log.info("[{}]", j);  
            });  
        }  
    }  
}  
  
@Slf4j  
class ThreadPool {  
    private BlockingQueue<Runnable> taskQueue;  
  
    // 线程集合  
    private HashSet<Worker> workers = new HashSet<>();  
  
    // 核心线程数  
    private int coreSize;  
  
    // 获取任务的超时时间  
    private long timeout;  
  
    private TimeUnit timeUnit;  
  
    public ThreadPool(int queueCapacity, int coreSize, long timeout, TimeUnit timeUnit) {  
        this.taskQueue = new BlockingQueue<>(queueCapacity);  
        this.coreSize = coreSize;  
        this.timeout = timeout;  
        this.timeUnit = timeUnit;  
    }  
  
    public void execute(Runnable task) {  
        synchronized (workers) {  
            // 如果线程数没有超过核心线程数时，直接交给 worker 对象执行  
            // 如果线程数超过了核心线程数，那么加入任务队列  
            if (workers.size() < coreSize) {  
                Worker worker = new Worker(task);  
                log.info("新增工作线程：{}", worker);  
                workers.add(worker);  
                worker.start();  
            }  
            else {  
                log.info("线程数超过核心线程数，任务进入阻塞队列，{}", task);  
                taskQueue.put(task);  
            }  
        }  
    }  
  
    class Worker extends Thread {  
  
        private Runnable task;  
  
        public Worker(Runnable task) {  
            this.task = task;  
        }  
  
        @Override  
        // 执行任务  
        public void run() {  
            // 当 task 不为空，执行任务  
            // 当 task 执行完毕，再接着从任务队列获取任务并执行  
            while (task != null || (task = taskQueue.take()) != null) {  
                try {  
                    log.info("开始执行任务：{}", task);  
                    task.run();  
                } catch (Exception e) {  
                    e.printStackTrace();  
                } finally {  
                    task = null;  
                    log.info("任务执行完毕");  
                }  
            }  
            synchronized (workers) {  
                log.info("移除当前工作线程");  
                workers.remove(this);  
            }  
        }  
  
        @Override  
        public String toString() {  
            return "Worker{" +  
                    "task=" + task +  
                    "} " + super.toString();  
        }  
    }  
}  
  
@Slf4j  
class BlockingQueue<T> {  
  
    // 1. 任务队列  
    private Deque<T> queue = new ArrayDeque<>();  
  
    // 2. 锁  
    private ReentrantLock lock = new ReentrantLock();  
  
    // 3. 生产者条件变量  
    private Condition fullWaitSet = lock.newCondition();  
  
    // 4. 消费者条件变量  
    private Condition emptyWaitSet = lock.newCondition();  
  
    // 5. 容量  
    private int capacity;  
  
    public BlockingQueue(int capacity) {  
        this.capacity = capacity;  
    }  
  
    // 阻塞获取  
    public T take() {  
        lock.lock();  
        try {  
            while (queue.isEmpty()) {  
                log.info("任务队列为空，等待生产任务");  
                emptyWaitSet.await();  
            }  
            T t = queue.removeFirst();  
            log.info("取出任务");  
            log.info("激活任务生产者线程");  
            fullWaitSet.signal();  
            return t;  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
  
    public void put(T t) {  
        lock.lock();  
        try {  
            while (queue.size() == capacity) {  
                log.info("任务队列已满，等待消费任务");  
                fullWaitSet.await();  
            }  
            queue.addLast(t);  
            log.info("生产任务");  
            log.info("激活任务消费者线程");  
            emptyWaitSet.signal();  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
}
```

**输出结果**

```java
00:49:38.834 [main] INFO com.duoduo.ThreadPool - 新增工作线程：Worker{task=com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@cb51256} Thread[Thread-0,5,main]
00:49:38.870 [main] INFO com.duoduo.ThreadPool - 新增工作线程：Worker{task=com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@63440df3} Thread[Thread-1,5,main]
00:49:38.871 [Thread-0] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@cb51256
00:49:38.871 [Thread-0] INFO com.duoduo.TestThreadPool - [0]
00:49:38.871 [main] INFO com.duoduo.ThreadPool - 线程数超过核心线程数，任务进入阻塞队列，com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@76a3e297
00:49:38.871 [Thread-0] INFO com.duoduo.ThreadPool - 任务执行完毕
00:49:38.871 [main] INFO com.duoduo.BlockingQueue - 生产任务
00:49:38.871 [main] INFO com.duoduo.BlockingQueue - 激活任务消费者线程
00:49:38.871 [main] INFO com.duoduo.ThreadPool - 线程数超过核心线程数，任务进入阻塞队列，com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@4d3167f4
00:49:38.872 [main] INFO com.duoduo.BlockingQueue - 生产任务
00:49:38.872 [main] INFO com.duoduo.BlockingQueue - 激活任务消费者线程
00:49:38.872 [main] INFO com.duoduo.ThreadPool - 线程数超过核心线程数，任务进入阻塞队列，com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@ed9d034
00:49:38.872 [main] INFO com.duoduo.BlockingQueue - 生产任务
00:49:38.871 [Thread-1] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@63440df3
00:49:38.872 [main] INFO com.duoduo.BlockingQueue - 激活任务消费者线程
00:49:38.872 [Thread-1] INFO com.duoduo.TestThreadPool - [1]
00:49:38.872 [Thread-1] INFO com.duoduo.ThreadPool - 任务执行完毕
00:49:38.872 [Thread-0] INFO com.duoduo.BlockingQueue - 取出任务
00:49:38.872 [Thread-0] INFO com.duoduo.BlockingQueue - 激活任务生产者线程
00:49:38.872 [Thread-1] INFO com.duoduo.BlockingQueue - 取出任务
00:49:38.872 [Thread-0] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@76a3e297
00:49:38.872 [Thread-1] INFO com.duoduo.BlockingQueue - 激活任务生产者线程
00:49:38.872 [Thread-0] INFO com.duoduo.TestThreadPool - [2]
00:49:38.873 [Thread-0] INFO com.duoduo.ThreadPool - 任务执行完毕
00:49:38.873 [Thread-1] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@4d3167f4
00:49:38.873 [Thread-0] INFO com.duoduo.BlockingQueue - 取出任务
00:49:38.873 [Thread-0] INFO com.duoduo.BlockingQueue - 激活任务生产者线程
00:49:38.873 [Thread-1] INFO com.duoduo.TestThreadPool - [3]
00:49:38.873 [Thread-0] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@ed9d034
00:49:38.873 [Thread-1] INFO com.duoduo.ThreadPool - 任务执行完毕
00:49:38.873 [Thread-0] INFO com.duoduo.TestThreadPool - [4]
00:49:38.873 [Thread-0] INFO com.duoduo.ThreadPool - 任务执行完毕
00:49:38.873 [Thread-1] INFO com.duoduo.BlockingQueue - 任务队列为空，等待生产任务
00:49:38.873 [Thread-0] INFO com.duoduo.BlockingQueue - 任务队列为空，等待生产任务
```

运行后发现，程序并未结束，是因为每个工作线程（worker）都在等待阻塞队列中的任务，进入了无限的等待，所以程序永远不会结束

#### 带有超时等待的线程池

在原先的基础上，我们用超时等待代替 `take()` 避免程序一直等待

```java
@Slf4j  
public class TestThreadPool {  
  
    public static void main(String[] args) {  
        ThreadPool threadPool = new ThreadPool(10, 2, 1000, TimeUnit.MICROSECONDS);  
        for (int i = 0; i < 5; i++) {  
            int j = i;  
            threadPool.execute(() -> {  
                log.info("[{}]", j);  
            });  
        }  
    }  
}  
  
@Slf4j  
class ThreadPool {  
    private BlockingQueue<Runnable> taskQueue;  
  
    // 线程集合  
    private HashSet<Worker> workers = new HashSet<>();  
  
    // 核心线程数  
    private int coreSize;  
  
    // 获取任务的超时时间  
    private long timeout;  
  
    private TimeUnit timeUnit;  
  
    public ThreadPool(int queueCapacity, int coreSize, long timeout, TimeUnit timeUnit) {  
        this.taskQueue = new BlockingQueue<>(queueCapacity);  
        this.coreSize = coreSize;  
        this.timeout = timeout;  
        this.timeUnit = timeUnit;  
    }  
  
    public void execute(Runnable task) {  
        synchronized (workers) {  
            // 如果线程数没有超过核心线程数时，直接交给 worker 对象执行  
            // 如果线程数超过了核心线程数，那么加入任务队列  
            if (workers.size() < coreSize) {  
                Worker worker = new Worker(task);  
                log.info("新增工作线程：{}", worker);  
                workers.add(worker);  
                worker.start();  
            }  
            else {  
                log.info("线程数超过核心线程数，任务进入阻塞队列，{}", task);  
                taskQueue.put(task);  
            }  
        }  
    }  
  
    class Worker extends Thread {  
  
        private Runnable task;  
  
        public Worker(Runnable task) {  
            this.task = task;  
        }  
  
        @Override  
        // 执行任务  
        public void run() {  
            // 当 task 不为空，执行任务  
            // 当 task 执行完毕，再接着从任务队列获取任务并执行  
            while (task != null || (task = taskQueue.poll(timeout, timeUnit)) != null) {  
                try {  
                    log.info("开始执行任务：{}", task);  
                    task.run();  
                } catch (Exception e) {  
                    e.printStackTrace();  
                } finally {  
                    task = null;  
                    log.info("任务执行完毕");  
                }  
            }  
            synchronized (workers) {  
                log.info("移除当前工作线程");  
                workers.remove(this);  
            }  
        }  
  
        @Override  
        public String toString() {  
            return "Worker{" +  
                    "task=" + task +  
                    "} " + super.toString();  
        }  
    }  
}  
  
@Slf4j  
class BlockingQueue<T> {  
  
    // 1. 任务队列  
    private Deque<T> queue = new ArrayDeque<>();  
  
    // 2. 锁  
    private ReentrantLock lock = new ReentrantLock();  
  
    // 3. 生产者条件变量  
    private Condition fullWaitSet = lock.newCondition();  
  
    // 4. 消费者条件变量  
    private Condition emptyWaitSet = lock.newCondition();  
  
    // 5. 容量  
    private int capacity;  
  
    public BlockingQueue(int capacity) {  
        this.capacity = capacity;  
    }  
  
    // 带超时的阻塞获取  
    public T poll(long timeout, TimeUnit unit) {  
        lock.lock();  
        try {  
            // 将 timeout 统一转换为纳秒  
            long nanos = unit.toNanos(timeout);  
            while (queue.isEmpty()) {  
                if (nanos <= 0) {  
                    return null;  
                }  
                // 返回值为剩余时间  
                nanos = emptyWaitSet.awaitNanos(nanos);  
            }  
            T task = queue.removeFirst();  
            fullWaitSet.signal();  
            return task;  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
    
    public void put(T t) {  
        lock.lock();  
        try {  
            while (queue.size() == capacity) {  
                log.info("任务队列已满，等待消费任务");  
                fullWaitSet.await();  
            }  
            queue.addLast(t);  
            log.info("生产任务");  
            log.info("激活任务消费者线程");  
            emptyWaitSet.signal();  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
}
```

**输出结果**

```java
00:54:13.012 [main] INFO com.duoduo.ThreadPool - 新增工作线程：Worker{task=com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@cb51256} Thread[Thread-0,5,main]
00:54:13.037 [Thread-0] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@cb51256
00:54:13.037 [main] INFO com.duoduo.ThreadPool - 新增工作线程：Worker{task=com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@63440df3} Thread[Thread-1,5,main]
00:54:13.037 [Thread-0] INFO com.duoduo.TestThreadPool - [0]
00:54:13.038 [Thread-0] INFO com.duoduo.ThreadPool - 任务执行完毕
00:54:13.038 [main] INFO com.duoduo.ThreadPool - 线程数超过核心线程数，任务进入阻塞队列，com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@76a3e297
00:54:13.038 [Thread-1] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@63440df3
00:54:13.038 [Thread-1] INFO com.duoduo.TestThreadPool - [1]
00:54:13.038 [Thread-1] INFO com.duoduo.ThreadPool - 任务执行完毕
00:54:13.038 [main] INFO com.duoduo.BlockingQueue - 生产任务
00:54:13.038 [main] INFO com.duoduo.BlockingQueue - 激活任务消费者线程
00:54:13.038 [main] INFO com.duoduo.ThreadPool - 线程数超过核心线程数，任务进入阻塞队列，com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@ed9d034
00:54:13.038 [Thread-0] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@76a3e297
00:54:13.038 [main] INFO com.duoduo.BlockingQueue - 生产任务
00:54:13.038 [Thread-0] INFO com.duoduo.TestThreadPool - [2]
00:54:13.038 [main] INFO com.duoduo.BlockingQueue - 激活任务消费者线程
00:54:13.038 [Thread-0] INFO com.duoduo.ThreadPool - 任务执行完毕
00:54:13.038 [Thread-0] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@ed9d034
00:54:13.038 [main] INFO com.duoduo.ThreadPool - 线程数超过核心线程数，任务进入阻塞队列，com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@6121c9d6
00:54:13.039 [Thread-0] INFO com.duoduo.TestThreadPool - [3]
00:54:13.039 [Thread-0] INFO com.duoduo.ThreadPool - 任务执行完毕
00:54:13.039 [main] INFO com.duoduo.BlockingQueue - 生产任务
00:54:13.039 [main] INFO com.duoduo.BlockingQueue - 激活任务消费者线程
00:54:13.039 [Thread-0] INFO com.duoduo.ThreadPool - 开始执行任务：com.duoduo.TestThreadPool$$Lambda$21/0x00000008000be040@6121c9d6
00:54:13.039 [Thread-0] INFO com.duoduo.TestThreadPool - [4]
00:54:13.039 [Thread-0] INFO com.duoduo.ThreadPool - 任务执行完毕
00:54:14.041 [Thread-0] INFO com.duoduo.ThreadPool - 移除当前工作线程
00:54:14.042 [Thread-1] INFO com.duoduo.ThreadPool - 移除当前工作线程
```

程序是结束了，但是思考另一个问题：

如果任务比较多，或者说由于某些任务耗时较长，导致核心线程数不够用了，那会导致什么？

由于在 put() 方法中，我们采用了：

```java
while (queue.size() == capacity) {  
    log.info("任务队列已满，等待消费任务");  
    fullWaitSet.await();  
}
```

所以当阻塞队列满了后，其他线程将会进入阻塞

#### 带有淘汰策略的线程池

##### 死等策略

当某个线程耗费大量时间时，其他任务就会阻塞住，直至阻塞队列有空间

**输出结果**

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230330005222.png)

##### 带超时的等待

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330005805.png)

##### 放弃任务执行

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330113650.png)

##### 抛出异常

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330114252.png)

##### 让调用者自己执行任务

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330140333.png)

##### 全部源码

```java
public class TestThreadPool {  
  
    public static void main(String[] args) {  
  
        // (1) 死等策略  
        // 当某个线程耗费大量时间时，其他任务就会阻塞住，直至阻塞队列有空间  
//        RejectPolicy rejectPolicy = (((queue, task) -> {  
//            queue.put(task);  
//        }));  
  
        // (2) 带超时的等待  
//        RejectPolicy rejectPolicy = (((queue, task) -> {  
//            queue.offer(task, 1000, TimeUnit.MILLISECONDS);  
//        }));  
  
        // (3) 放弃任务执行  
//        RejectPolicy rejectPolicy = (((queue, task) -> {  
//            log.info("放弃执行, {}", task);  
//        }));  
  
        // (4) 抛出异常  
//        RejectPolicy rejectPolicy = (((queue, task) -> {  
//            throw new RuntimeException("阻塞队列为空，直接抛出异常!" + task);  
//        }));  
  
        // (5) 让调用者自己执行任务  
        RejectPolicy rejectPolicy = (((queue, task) -> {  
            log.info("阻塞队列已满，主线程自己执行, {}", task);  
            ((Runnable) task).run();  
        }));  
  
        ThreadPool threadPool = new ThreadPool(1, 1,  
                1, TimeUnit.SECONDS, rejectPolicy);  
        for (int i = 0; i < 3; i++) {  
            int j = i;  
            threadPool.execute(() -> {  
                try {  
                    TimeUnit.SECONDS.sleep(3);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
                log.info("[{}]", j);  
            });  
        }  
    }  
}  
  
@Slf4j  
class ThreadPool {  
    // 阻塞队列  
    private BlockingQueue<Runnable> taskQueue;  
  
    // 线程集合  
    private HashSet<Worker> workers = new HashSet<>();  
  
    // 核心线程数  
    private int coreSize;  
  
    // 获取任务的超时时间  
    private long timeout;  
  
    private TimeUnit timeUnit;  
  
    // 拒绝策略  
    private RejectPolicy<Runnable> rejectPolicy;  
  
    public ThreadPool(int queueCapacity, int coreSize,  
                      long timeout, TimeUnit timeUnit, RejectPolicy<Runnable> rejectPolicy) {  
        this.taskQueue = new BlockingQueue<>(queueCapacity);  
        this.coreSize = coreSize;  
        this.timeout = timeout;  
        this.timeUnit = timeUnit;  
        this.rejectPolicy = rejectPolicy;  
    }  
  
    public void execute(Runnable task) {  
        synchronized (workers) {  
            // 如果线程数没有超过核心线程数时，直接交给 worker 对象执行  
            // 如果线程数超过了核心线程数，那么加入任务队列  
            if (workers.size() < coreSize) {  
                Worker worker = new Worker(task);  
                log.info("新增工作线程：{}", worker);  
                workers.add(worker);  
                worker.start();  
            }  
            else {  
                // 淘汰策略  
                taskQueue.tryPut(rejectPolicy, task);  
            }  
        }  
    }  
  
    class Worker extends Thread {  
  
        private Runnable task;  
  
        public Worker(Runnable task) {  
            this.task = task;  
        }  
  
        @Override  
        // 执行任务  
        public void run() {  
            // 当 task 不为空，执行任务  
            // 当 task 执行完毕，再接着从任务队列获取任务并执行  
            while (task != null || (task = taskQueue.poll(timeout, timeUnit)) != null) {  
                try {  
                    log.info("开始执行任务：{}", task);  
                    task.run();  
                } catch (Exception e) {  
                    e.printStackTrace();  
                } finally {  
                    task = null;  
                    log.info("任务执行完毕");  
                }  
            }  
            synchronized (workers) {  
                log.info("移除当前工作线程");  
                workers.remove(this);  
            }  
        }  
  
        @Override  
        public String toString() {  
            return "Worker{" +  
                    "task=" + task +  
                    "} " + super.toString();  
        }  
    }  
}  
  
@Slf4j  
class BlockingQueue<T> {  
  
    // 1. 任务队列  
    private Deque<T> queue = new ArrayDeque<>();  
  
    // 2. 锁  
    private ReentrantLock lock = new ReentrantLock();  
  
    // 3. 生产者条件变量  
    private Condition fullWaitSet = lock.newCondition();  
  
    // 4. 消费者条件变量  
    private Condition emptyWaitSet = lock.newCondition();  
  
    // 5. 容量  
    private int capacity;  
  
  
    public BlockingQueue(int capacity) {  
        this.capacity = capacity;  
    }  
  
    // 带超时的阻塞获取  
    public T poll(long timeout, TimeUnit unit) {  
        lock.lock();  
        try {  
            // 将 timeout 统一转换为纳秒  
            long nanos = unit.toNanos(timeout);  
            while (queue.isEmpty()) {  
                if (nanos <= 0) {  
                    return null;  
                }  
                // 返回值为剩余时间  
                nanos = emptyWaitSet.awaitNanos(nanos);  
            }  
            T task = queue.removeFirst();  
            fullWaitSet.signal();  
            return task;  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
  
    // 阻塞获取  
    public T take() {  
        lock.lock();  
        try {  
            while (queue.isEmpty()) {  
                log.info("任务队列为空，等待生产任务");  
                emptyWaitSet.await();  
            }  
            T t = queue.removeFirst();  
            log.info("取出任务");  
            log.info("激活任务生产者线程");  
            fullWaitSet.signal();  
            return t;  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
  
    public void put(T t) {  
        lock.lock();  
        try {  
            while (queue.size() == capacity) {  
                log.info("任务队列已满，等待消费任务");  
                fullWaitSet.await();  
            }  
            queue.addLast(t);  
//            log.info("激活任务消费者线程");  
            emptyWaitSet.signal();  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
  
    // 带超时时间的阻塞添加  
    public boolean offer(T t, long timeout, TimeUnit timeUnit) {  
        lock.lock();  
        try {  
            long nanos = timeUnit.toNanos(timeout);  
            while (queue.size() == capacity) {  
                if (nanos <= 0) {  
                    log.info("超过最大等待时间，直接返回false, {}", t);  
                    return false;  
                }  
                nanos = fullWaitSet.awaitNanos(nanos);  
            }  
            queue.addLast(t);  
//            log.info("生产任务");  
            log.info("【offer】激活任务消费者线程");  
            emptyWaitSet.signal();  
            return true;  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlock();  
        }  
    }  
  
    public void tryPut(RejectPolicy<T> rejectPolicy, T task) {  
        lock.lock();  
        try {  
            // 判断队列是否已满  
            if (queue.size() == capacity) {  
                log.info("阻塞队列已满，执行拒绝策略, {}", task);  
                rejectPolicy.reject(this, task);  
            }  
            // 队列未满  
            else {  
                queue.addLast(task);  
                log.info("【tryout】激活任务消费者线程, {}", task);  
                emptyWaitSet.signal();  
            }  
        } finally {  
            lock.unlock();  
        }  
    }  
}  
  
// 拒绝策略  
interface RejectPolicy<T> {  
  
    void reject(BlockingQueue<T> queue, T task);  
  
}
```

### 2 ThreadPoolExecutor

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330141519.png)

#### 线程池状态

ThreadPoolExecutor 使用 int 的高 3 位来表示线程池状态，低 29 位表示线程数量

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330141733.png)

从数字上比较，TERMINATED > TIDYING > STOP > SHUTDOWN> RUNNING

>高位第一位为符号位，1为表示负数，所以 RUNNING 最小

这些信息存储在一个原子变量 ctl 中，目的是将线程池状态与线程个数合二为一，这样就可以用一次 cas 原子操作进行赋值。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330142343.png)

#### 构造方法

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330154134.png)

- corePoolSize：核心线程数目(最多保留的线程数)
- maximumPoolSize：最大线程数目
- keepAliveTime：生存时间，针对救急线程
- unit：时间单位，针对救急线程
- workQueue：阻塞队列
- threadFactory：线程工厂， 可以为线程创建时起个好名
- handler：拒绝策略

#### 工作方式

1. 线程池中刚开始没有线程，当一个任务提交给线程池后，线程池会创建一个新线程来执行任务。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330155152.png)

2. 当线程数达到 `corePoolSize` 并没有线程空闲，这时再加入任务，新加的任务会被加入 `workQueue` 队列排队，直到有空闲的线程。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330155208.png)

3. 任务超过了队列大小时，会创建 `maximumPoolSize - corePoolSize` 数目的线程来救急。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330155229.png)

4. 如果线程到达 `maximumPoolSize` 仍然有新任务这时会执行拒绝策略，jdk 提供了 4 种实现，其他著名框架也提供了实现：

- AbortPolicy **（默认策略）**：让调用者抛出 RejectedExecutionException异常
- CallerRunsPolicy：让调用者运行任务
- DiscardPolicy：放弃本次任务
- DiscardOldestPolicy放弃队列中最早的任务，本任务取而代之
- Dubbo 的实现：在抛出 RejectedExecutionException 异常之前会记录日志，并 dump 线程栈信息，方便定位问题
- Netty 的实现：创建一个新线程来执行任务
- ActiveMQ 的实现，带超时等待(60s)尝试放入队列，类似我们之前自定义的拒绝策略
- PinPoint 的实现，它使用了一个拒绝策略链，会逐一尝试策略链中每种拒绝策略

5. 当高峰过去后，超过 corePoolSize 的救急线程如果一段时间没有任务做，需要结束节省资源，这个时间由keepAliveTime 和 unit 来控制。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330160001.png)

根据这个构造方法，JDK **Executors** 类中提供了众多工厂方法来创建各种用途的线程池

#### 线程池工厂方法

##### newFixedThreadPool

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330160241.png)

**特点**

- 核心线程数等于最大线程数(没有救急线程被创建)，因此也无需超时时间
- 阻塞队列是无界的，可以放任意数量的任务

**评价**

适用于任务量已知，相对耗时的任务

##### newCacheThreadPool

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230330161356.png)

- 核心线程数是0，最大线程数是Integer.MAX_VALUE，救急线程的空闲生存时间是60s，意味着：
	- 全部都是救急线程(60s后可以回收)
	- 救急线程可以无限创建

- 队列采用了 SynchronousQueue 实现特点是，它没有容量，没有线程来取是放不进去的(一手交钱，一手交货)

```java
@Slf4j  
public class TestNewCacheThreadPool {  
  
    public static void main(String[] args) throws InterruptedException {  
        SynchronousQueue<Integer> integers = new SynchronousQueue<>();  
  
        new Thread(() -> {  
            try {  
                log.info("put 1");  
                integers.put(1);  
                log.info("put 2");  
                integers.put(2);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "t1").start();  
  
        TimeUnit.SECONDS.sleep(1);  
  
        new Thread(() -> {  
            try {  
                log.info("take 1");  
                integers.take();  
                log.info("take 2");  
                integers.take();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "t2").start();  
    }  
}
```

**输出结果**

```java
17:12:06.144 [t1] INFO com.duoduo.TestNewCacheThreadPool - put 1
// 等待了1s中，直到有现成来取，才继续通行
17:12:07.142 [t2] INFO com.duoduo.TestNewCacheThreadPool - take 1
17:12:07.143 [t2] INFO com.duoduo.TestNewCacheThreadPool - take 2
17:12:07.143 [t1] INFO com.duoduo.TestNewCacheThreadPool - put 2
```

**特点**

整个线程池表现为线程数会根据任务量不断增长，没有上限，当任务执行完毕，空闲1分钟后释放线程。

**评价**

适合任务数比较密集，但每个任务执行时间较短的情况

##### newSingleThreadExecutor

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330204614.png)

**使用场景**

希望多个任务排队执行。线程数固定为1，任务数多于1时，会放入无界队列排队。任务执行完毕，这唯一的线程也不会被释放。

>自己创建一个单线程串行执行任务，如果任务执行失败而终止那么没有任何补救措施，而线程池还会新建一个线程，保证池的正常工作。比如线程池中任务1出现了除0的异常，并不影响任务2、任务3的执行

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330205735.png)

**newSingleThreadExecutor 与 newFixedThreadPool 的区别**

- Executors.newSingleThreadExecutor() 线程个数始终为1，不能修改
- 区别于其他的线程池，newSingleThreadExecutor返回值被`FinalizableDelegatedExecutorService` 包装来一层，应用的是装饰器模式，只对外暴露了 ExecutorService接口，因此不能调用 ThreadPoolExecutor 中特有的方法
- Executors.newFixedThreadPool(1)初始时为1，以后还可以修改，对外暴露的是ThreadPoolExecutor 对象，可以强转后调用 setCorePoolSize 等方法进行修改

#### 提交任务

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230330210002.png)

##### submit 方法

提交任务 task，用返回值 Future 获得任务执行结果

```java
@Slf4j  
public class TestSubmit {  
  
    public static void main(String[] args) throws ExecutionException, InterruptedException {  
        ExecutorService pool = Executors.newFixedThreadPool(2);  
        Future<String> future = pool.submit(() -> {  
            log.info("running...");  
            TimeUnit.SECONDS.sleep(1);  
            return "ok!";  
        });  
        log.info("{}", future.get());  
    }  
}
```

**输出结果**

```java
21:09:09.829 [pool-1-thread-1] INFO com.duoduo.TestSubmit - running...
21:09:10.837 [main] INFO com.duoduo.TestSubmit - ok!
```

##### invokeAll 方法

提交 tasks 中所有任务

```java
@Slf4j  
public class TestInvokeAll {  
  
    public static void main(String[] args) throws InterruptedException {  
        ExecutorService pool = Executors.newFixedThreadPool(2);  
        List<Future<Object>> futures = pool.invokeAll(Arrays.asList(  
                () -> {  
                    log.info("begin, {}", Thread.currentThread().getName());  
                    TimeUnit.MILLISECONDS.sleep(1000);  
                    return "1";  
                },  
                () -> {  
                    log.info("begin, {}", Thread.currentThread().getName());  
                    TimeUnit.MILLISECONDS.sleep(1000);  
                    return "2";  
                },  
                () -> {  
                    log.info("begin, {}", Thread.currentThread().getName());  
                    TimeUnit.MILLISECONDS.sleep(1000);  
                    return "3";  
                }  
        ));  
  
        futures.forEach(future -> {  
            try {  
                log.info("{}", future.get());  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } catch (ExecutionException e) {  
                throw new RuntimeException(e);  
            }  
        });  
    }  
}
```

**输出结果**

```java
21:29:40.141 [pool-1-thread-2] INFO com.duoduo.TestInvokeAll - begin, pool-1-thread-2
21:29:40.141 [pool-1-thread-1] INFO com.duoduo.TestInvokeAll - begin, pool-1-thread-1
// 由于核心线程就2个，所以进入等待状态
21:29:41.154 [pool-1-thread-2] INFO com.duoduo.TestInvokeAll - begin, pool-1-thread-2
21:29:42.156 [main] INFO com.duoduo.TestInvokeAll - 1
21:29:42.156 [main] INFO com.duoduo.TestInvokeAll - 2
21:29:42.156 [main] INFO com.duoduo.TestInvokeAll - 3

```

##### invokeAny 方法

提交 tasks 中所有任务，哪个任务先成功执行完毕，返回此任务执行结果，其它任务取消

```java
@Slf4j  
public class TestInvokeAll {  
  
    public static void main(String[] args) throws InterruptedException, ExecutionException {  
        ExecutorService pool = Executors.newFixedThreadPool(2);  
        String result = pool.invokeAny(Arrays.asList(  
                () -> {  
                    log.info("begin, {}", Thread.currentThread().getName());  
                    TimeUnit.MILLISECONDS.sleep(1000);  
                    log.info("end1");  
                    return "1";  
                },  
                () -> {  
                    log.info("begin, {}", Thread.currentThread().getName());  
                    TimeUnit.MILLISECONDS.sleep(2000);  
                    log.info("end2");  
                    return "2";  
                },  
                () -> {  
                    log.info("begin, {}", Thread.currentThread().getName());  
                    TimeUnit.MILLISECONDS.sleep(3000);  
                    log.info("end3");  
                    return "3";  
                }  
        ));  
        log.info("{}", result);  
    }  
}
```

**输出结果**

```java
21:36:41.084 [pool-1-thread-1] INFO com.duoduo.TestInvokeAll - begin, pool-1-thread-1
21:36:41.084 [pool-1-thread-2] INFO com.duoduo.TestInvokeAll - begin, pool-1-thread-2
// 发现只有第一个线程进行了end的打印，其他两个线程都被取消了
21:36:42.092 [pool-1-thread-1] INFO com.duoduo.TestInvokeAll - end1
21:36:42.093 [pool-1-thread-1] INFO com.duoduo.TestInvokeAll - begin, pool-1-thread-1
21:36:42.093 [main] INFO com.duoduo.TestInvokeAll - 1
```

#### 关闭线程池

##### shutdown 方法

- 将线程池状态变为 shutdown
- 不会接受新的任务，但已提交任务会执行完
- 此方法不会阻塞调用线程的执行

```java
public void shutdown() {  
    final ReentrantLock mainLock = this.mainLock;  
    mainLock.lock();  
    try {  
        checkShutdownAccess();  
		// 修改线程池状态
        advanceRunState(SHUTDOWN);  
		// 仅会打断空闲线程
        interruptIdleWorkers();  
        onShutdown(); // 拓展点 ScheduledThreadPoolExecutor
    } finally {  
        mainLock.unlock();  
    }  
    // 尝试终结（没有运行任务的线程可以立刻终结，如果还有线程正在进行任务那么也不会阻塞等待其运行完成）
    tryTerminate();  
}
```

##### shutdownNow 方法

- 线程池状态变为 stop
- 不会接收新任务
- 会将队列中的任务返回，并用 interrupt 的方式中断正在执行的任务

```java
public List<Runnable> shutdownNow() {  
    List<Runnable> tasks;  
    final ReentrantLock mainLock = this.mainLock;  
    mainLock.lock();  
    try {  
        checkShutdownAccess();  
		// 修改线程池状态
        advanceRunState(STOP);  
		// 打断所有线程
        interruptWorkers();  
		// 获取队列中的剩余任务
        tasks = drainQueue();  
    } finally {  
        mainLock.unlock();  
    }  
    // 尝试终结，这一步全部都终结线程，因为前面都把所有线程都打断了
	tryTerminate();  
    return tasks;  
}
```

##### isShutdown 方法

不在 RUNNING  状态的线程池，此方法就返回 true

##### isTerminated 方法

线程池状态是否是 TERMINATED

##### awaitTermination 方法

调用 shutdown 后，由于调用线程并不会等待所有任务运行结束，因此如果它想在线程池 TERMINATED 后做些事情，可以利用此方法等待

#### 创建多大的线程池合适？

[[#4 创建多大的线程池合适？|创建多大的线程池合适？]]

#### 任务调度线程池

在『任务调度线程池』功能加入之前，可以使用 `java.util.Timer` 来实现定时功能，Timer 的优点在于简单易用，但由于所有任务都是由同一个线程来调度，因此所有任务都是串行执行的，同一时间只能有一个任务在执行，前一个任务的延迟或异常都将会影响到之后的任务。

##### Timer

###### 缺点1：Timer前一个任务的延迟会影响后面的任务执行

```java
@Slf4j  
public class TestTimer {  
  
    public static void main(String[] args) {  
  
        Timer timer = new Timer();  
  
        TimerTask task1 = new TimerTask() {  
            @Override  
            public void run() {  
                log.info("task 1");  
                try {  
                    TimeUnit.SECONDS.sleep(1);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
        };  
        TimerTask task2 = new TimerTask() {  
            @Override  
            public void run() {  
                log.info("task 2");  
            }  
        };  
  
        //使用 timer 添加两个任务，希望它们都在1s后执行  
        //但由于 timer 内只有一个线程来顺序执行队列中的任务，因此「任务1」的延时，影响了「任务2」的执行  
        timer.schedule(task1, 1000);  
        timer.schedule(task2, 1000);  
    }  
}
```

**输出结果**

```java
23:35:58.247 [Timer-0] INFO com.duoduo.TestTimer - task 1
// 发现并没有同时执行，而是经过任务1完成后才执行了任务2
23:35:59.256 [Timer-0] INFO com.duoduo.TestTimer - task 2
```

###### 缺点2：Timer前一个任务若发生异常，那么会阻断后面的任务执行

```java
@Slf4j  
public class TestTimer {  
  
    public static void main(String[] args) {  
  
        Timer timer = new Timer();  
  
        TimerTask task1 = new TimerTask() {  
            @Override  
            public void run() {  
                log.info("task 1");  
                int a = 1/0;  
                try {  
                    TimeUnit.SECONDS.sleep(1);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
        };  
        TimerTask task2 = new TimerTask() {  
            @Override  
            public void run() {  
                log.info("task 2");  
            }  
        };  
  
        //使用 timer 添加两个任务，希望它们都在1s后执行  
        //但由于 timer 内只有一个线程来顺序执行队列中的任务，因此「任务1」的延时，影响了「任务2」的执行  
        timer.schedule(task1, 1000);  
        timer.schedule(task2, 1000);  
    }  
}
```

**输出结果**

发现任务不执行了

```java
23:37:51.800 [Timer-0] INFO com.duoduo.TestTimer - task 1
Exception in thread "Timer-0" java.lang.ArithmeticException: / by zero
	at com.duoduo.TestTimer$1.run(TestTimer.java:25)
	at java.base/java.util.TimerThread.mainLoop(Timer.java:556)
	at java.base/java.util.TimerThread.run(Timer.java:506)
```

##### newScheduledThreadPool

newScheduledThreadPool 是带有任务调度的线程池

###### 优点1：不会因为前一个任务而导致后面的任务延迟执行

```java
@Slf4j  
public class testNewScheduledThreadPool {  
  
    public static void main(String[] args) {  
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(2);  
          
        pool.schedule(() -> {  
            log.info("task1");  
            try {  
                TimeUnit.SECONDS.sleep(1);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, 1, TimeUnit.SECONDS);  
  
        pool.schedule(() -> {  
            log.info("task2");  
        }, 1, TimeUnit.SECONDS);  
    }  
}
```

**输出结果**

```java
23:43:05.164 [pool-1-thread-2] INFO com.duoduo.testNewScheduledThreadPool - task2
23:43:05.164 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - task1

```

发现他们是同时进行任务，解决了[[#缺点1：Timer前一个任务的延迟会影响后面的任务执行|Timer任务执行过久导致的延迟]]

###### 优点2：不会因为前一个任务抛出异常导致后面的任务中断

```java
@Slf4j  
public class testNewScheduledThreadPool {  
  
    public static void main(String[] args) {  
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(2);  
  
        pool.schedule(() -> {  
            log.info("task1");  
            int a = 1/0;  
            try {  
                TimeUnit.SECONDS.sleep(1);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, 1, TimeUnit.SECONDS);  
  
        pool.schedule(() -> {  
            log.info("task2");  
        }, 1, TimeUnit.SECONDS);  
    }  
}
```

**输出结果**

```java
23:45:45.573 [pool-1-thread-2] INFO com.duoduo.testNewScheduledThreadPool - task2
23:45:45.573 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - task1
```

>[注意]
>
>当任务中出现异常时，并不会进行异常的抛出（这种情况不仅次于newScheduledThreadPool，普通的线程池也有这问题）

###### 处理异常

第一种方式：用 `try catch` 进行包围。

```java
pool.schedule(() -> {  
	try {
		log.info("task1");  
		int a = 1/0;  
	} catch(Exception e) {
		log.info("{}", e)
	}
}
```

第二种方式：采用 submit() 方法，使用 `future.get()` 来获取返回值，如果有异常，`future.get()` 会返回返回值。

```java
Future<Boolean> future = pool.submit(() -> {
	log.info("task2");
	int a = 1/0;
	return true;
})
log.info("result:{}", future.get());
```

###### 定时执行任务

**scheduleAtFixedRate() 方法**

以一定的频率执行：

- 第一个参数为任务启用后多久开始执行
- 第二个参数是第一个任务【开始】多久后，执行下一个任务

>注意：受上一个执行任务完成时间的影响

```java
@Slf4j  
public class testNewScheduledThreadPool {  
  
    public static void main(String[] args) {  
        
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(1);  
        log.info("start...");  
        
        pool.scheduleAtFixedRate(() -> {  
            log.info("running");  
            try {  
                TimeUnit.SECONDS.sleep(2);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, 2, 1, TimeUnit.SECONDS);  
    }  
}
```

```java
14:01:14.788 [main] INFO com.duoduo.testNewScheduledThreadPool - start...
14:01:16.811 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - running
// 发现这边是每隔2s执行，2s内包括了任务间隔1s，因为是从启用任务开始算
14:01:18.816 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - running
14:01:20.819 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - running
```

**scheduleWithFixedDelay() 方法**

以一定的频率执行：

- 第一个参数为任务启用后多久开始执行
- 第二个参数是第一个任务【完成】多久后，执行下一个任务

>注意：受上一个执行任务完成时间的影响

```java
@Slf4j  
public class testNewScheduledThreadPool {  
  
    public static void main(String[] args) {  
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(1);  
        log.info("start...");  
		pool.scheduleWithFixedDelay(() -> {  
		    log.info("running");  
		    try {  
		        TimeUnit.SECONDS.sleep(2);  
		    } catch (InterruptedException e) {  
		        throw new RuntimeException(e);  
		    }  
		}, 2, 1, TimeUnit.SECONDS);
    }  
}
```

```java
14:03:19.445 [main] INFO com.duoduo.testNewScheduledThreadPool - start...
// 发现这边是每隔3s执行，包括前一个任务中挂起2s时间和每个任务的间隔
14:03:21.464 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - running
14:03:24.468 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - running
14:03:27.475 [pool-1-thread-1] INFO com.duoduo.testNewScheduledThreadPool - running
```

**举个例子：要求每周四执行任务**

```java
@Slf4j  
public class TestFixSchedule {  
  
    // 【需求】每周四18：00：00执行任务  
    public static void main(String[] args) throws InterruptedException {  
  
        // 获取当前时间  
        LocalDateTime now = LocalDateTime.now();  
        // 获取周四的时间  
        LocalDateTime time = now.withHour(8).withMinute(0).withNano(0).with(DayOfWeek.THURSDAY);  
  
        // 如果 当前时间 > 周四，必须找到下周的周四  
        while (now.compareTo(time) > 0) {  
            // 增加一周  
            time = time.plusWeeks(1);  
        }  
  
        // 当前时间距离周四的时间  
        long initialDelay = Duration.between(now, time).toMillis();  
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(2);  
        // initDelay：当前时间和周四的差值  
        // period：一周的时间  
        long period = 1000 * 60 * 60 * 24 * 7;  
        pool.scheduleAtFixedRate(() -> {  
            log.info("running...");  
        }, initialDelay, period, TimeUnit.MILLISECONDS);  
    }  
}
```

#### Tomcat 线程池

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230331150028.png)

- LimitLatch：用来限流，可以控制最大连接个数，类似J.U.C 中的 Semaphore
- Acceptor：只负责【接收新的 socket 连接】
- Poller：负责监听 socket channel 是否有【可读的IO事件】，一旦可读，封装一个任务对象（socketProcessor），提交给 Executor 线程池处理
- Executor 线程池中的工作线程最终负责【处理请求】

Tomcat 线程池扩展了 ThreadPoolExecutor ，行为稍有不同
- 如果总线程数达到 maximumPoolSize
	- 这时不会立刻抛 RejectedExecutionException异常
	- 而是再次尝试将任务放入队列，如果还失败，才抛出 RejectedExecutionException 异常

##### execute 方法

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230331151154.png)

##### TaskQueue 方法

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230331151415.png)

##### 线程池配置-Connector

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230331152035.png)

##### Executor 线程配置

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230331152231.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230331152504.png)



### 3 Fork/Join

#### 1 概念

Fork/Join 是 JDK 1.7 加入的新的线程池实现，它体现的是一种分治思想，适用于能够进行任务拆分的 cpu 密集型运算

所谓的任务拆分，是将一个大任务拆分为算法上相同的小任务，直至不能拆分可以直接求解。跟递归相关的一些计算，如归并排序、斐波那契数列、都可以用分治思想进行求解

Fork/Join 在分治的基础上加入了多线程，可以把每个任务的分解和合并交给不同的线程来完成，进一步提升了运算效率
Fork/Join 默认会创建与 cpu 核心数大小相同的线程池

#### 使用

提交给 Fork/Join 线程池的任务需要继承 RecursiveTask (有返回值)或 RecursiveAction (没有返回值)，例如下面定义了一个对 1~n 之间的整数求和的任务

```java
@Slf4j  
public class TestForkJoin {  
  
    public static void main(String[] args) {  
        ForkJoinPool pool = new ForkJoinPool(4);  
        System.out.println(pool.invoke(new MyTask(5)));  
    }  
  
}  
  
@Slf4j  
class MyTask extends RecursiveTask<Integer> {  
  
    private int n;  
  
    public MyTask(int n) {  
        this.n = n;  
    }  
  
    @Override  
    protected Integer compute() {  
        if (n == 1) return 1;  
        MyTask t1 = new MyTask(n - 1);  
        // 让一个线程去执行该任务  
        t1.fork();  
        log.info("fork() {} {}", n, t1);  
        // 获取任务的结果  
        log.info("join() {} {}", n, t1);  
        return n + t1.join();  
    }  
}
```

**输出结果**

```java
14:56:49.935 [ForkJoinPool-1-worker-3] INFO com.duoduo.MyTask - fork() 5 com.duoduo.MyTask@22a648bc
14:56:49.943 [ForkJoinPool-1-worker-3] INFO com.duoduo.MyTask - join() 5 com.duoduo.MyTask@22a648bc
14:56:49.935 [ForkJoinPool-1-worker-7] INFO com.duoduo.MyTask - fork() 3 com.duoduo.MyTask@5a52d19c
14:56:49.943 [ForkJoinPool-1-worker-7] INFO com.duoduo.MyTask - join() 3 com.duoduo.MyTask@5a52d19c
14:56:49.935 [ForkJoinPool-1-worker-5] INFO com.duoduo.MyTask - fork() 4 com.duoduo.MyTask@441c4e24
14:56:49.935 [ForkJoinPool-1-worker-1] INFO com.duoduo.MyTask - fork() 2 com.duoduo.MyTask@79c8f2b3
14:56:49.944 [ForkJoinPool-1-worker-5] INFO com.duoduo.MyTask - join() 4 com.duoduo.MyTask@441c4e24
14:56:49.944 [ForkJoinPool-1-worker-1] INFO com.duoduo.MyTask - join() 2 com.duoduo.MyTask@79c8f2b3
15
```

可以看出来被分解为多个线程进行计算

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401145823.png)

#### 改进

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401193818.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401194114.png)




## 8.2 JUC

### AQS 原理

#### 概述

全称是 AbstractQueuedSynchronizer，是**阻塞式锁**和相关的同步器工具的框架

**特点**

- 用 state 属性来表示资源的状态(分独占模式和共享模式)，子类需要定义如何维护这个状态，控制如何获取锁和释放锁
	- getState：获取 state 状态
	- setState：设置 state 状态
	- compareAndSetState：CAS机制设置state状态
	- 独占模式是只有一个线程能够访问资源，而共享模式可以允许多个线程访问资源
- 提供了基于FIFO的等待队列，类似于 Monitor 的 EntryList
- 条件变量来实现等待、唤醒机制，支持多个条件变量，类似于 Monitor 的 WaitSet

**子类主要实现这样一些方法（默认抛出 UnsupportedOperationException）**

- tryAcquire
- tryRelease
- tryAcquireShared
- tryReleaseShared
- isHeldExclusively

**获取锁的姿势**

```java
// 如果获取锁失败
if (!tryAcquire(arg)) {
	// 入队，可以选择阻塞当前线程
}
```

**释放锁的姿势**

```java
// 如果释放锁成功
if (tryRelease(arg)) {
	// 当阻塞队列恢复运行
}
```

#### 实现不可重入锁

```java
@Slf4j  
public class TestAQS {  
  
    public static void main(String[] args) {  
        MyLock lock = new MyLock();  
        new Thread(() -> {  
            lock.lock();  
            try {  
                log.info("locking...");  
                TimeUnit.SECONDS.sleep(1);  
            } catch(Exception e) {  
                e.printStackTrace();  
            } finally {  
                log.info("end...");  
                lock.unlock();  
            }  
        }, "t1").start();  
  
  
        new Thread(() -> {  
            lock.lock();  
            try {  
                log.info("locking...");  
            } catch(Exception e) {  
                e.printStackTrace();  
            } finally {  
                log.info("end...");  
                lock.unlock();  
            }  
        }, "t2").start();  
  
    }  
}  
  
// 自定义锁（不可重入锁）  
class MyLock implements Lock {  
  
    // 独占锁  
    MySync sync = new MySync();  
  
    class MySync extends AbstractQueuedSynchronizer {  
  
        // 尝试获取锁  
        @Override  
        protected boolean tryAcquire(int arg) {  
            if (compareAndSetState(0, 1)) {  
                // 加上锁，并且设置 owner 为当前线程  
                setExclusiveOwnerThread(Thread.currentThread());  
                return true;  
            }  
            return false;  
        }  
  
        // 尝试释放锁  
        @Override  
        protected boolean tryRelease(int arg) {  
            if (Thread.currentThread() != getExclusiveOwnerThread())  
                throw new IllegalMonitorStateException();  
            setExclusiveOwnerThread(null);  
            // 由于 volatile 会加入写屏障，写屏障之前的所有操作对所有线程可见  
            // 所以这边 setState(0) 要放在后面  
            setState(0);  
            return true;  
        }  
  
        // 是否持有独占锁  
        @Override  
        protected boolean isHeldExclusively() {  
            return getExclusiveOwnerThread() == Thread.currentThread();  
        }  
  
        public Condition newCondition() {  
            return new ConditionObject();  
        }  
  
    }  
  
    @Override  
    // 加锁（不成功，就会进入等待队列等待）  
    public void lock() {  
        sync.acquire(1);  
    }  
  
    @Override  
    // 加锁，可打断  
    public void lockInterruptibly() throws InterruptedException {  
        sync.acquireInterruptibly(1);  
    }  
  
    @Override  
    // 尝试加锁（一次）  
    public boolean tryLock() {  
        return sync.tryAcquire(1);  
    }  
  
    @Override  
    // 尝试加锁（带超时时间）  
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {  
        return sync.tryAcquireNanos(1, unit.toNanos(time));  
    }  
  
    @Override  
    // 解锁  
    public void unlock() {  
        sync.release(1);  
    }   
  
    @Override  
    // 创建条件变量  
    public Condition newCondition() {  
        return sync.newCondition();  
    }  
}
```

**输出结果**

```java
20:31:05.942 [t1] INFO com.duoduo.TestAQS - locking...
20:31:06.949 [t1] INFO com.duoduo.TestAQS - end...
20:31:06.949 [t2] INFO com.duoduo.TestAQS - locking...
20:31:06.950 [t2] INFO com.duoduo.TestAQS - end...
```

注意，由于是不可重入锁，所以在**某个线程获取锁之后，再次上锁，会被自己堵塞**

[[多线程#11. 聊聊 AQS？|面试题：聊聊AQS]]

### ReentrantLock 原理

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401203409.png)

#### 非公平锁实现原理

##### 加锁流程

构造器默认是非公平锁

```java
public ReentrantLock() {
	sync = new NonfairSync();
}
```

###### 三个步骤

```java
public final void acquire(int arg) {  
    if (!tryAcquire(arg) &&  
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))  
        selfInterrupt();  
}
```

###### 没有竞争时

Thread-0 占用了锁

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401211108.png)

###### 第一个竞争出现时

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401211347.png)

Thread-1执行了：

1. CAS尝试将 state 由0改为1，结果失败
2. **进入 tryAcquire逻辑**，这时 state 已经是1，结果仍然失败
3. 接下来进入 addWaiter 逻辑，构造Node队列
	- 图中黄色三角表示该 Node 的 waitStatus 状态，其中 0 为默认正常状态
	- Node 的创建是懒惰的
	- 其中第一个Node称为Dummy (哑元)或哨兵，用来占位，并不关联线程

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401211759.png)

**当前线程进入 acquireQueued 逻辑**

1. acquireQueued 会在一个死循环中不断尝试获得锁，失败后进入 park 阻塞
2. 如果自己是紧邻着 head (排第二位)，那么再次 tryAcquire 尝试获取锁，当然这时 state 仍为1，失败
3. 进入 shouldParkAfterFailedAcquire 逻辑，将前驱 node，即 head 的 waitStatus 改为 -1，这次返回 false

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401213040.png)

4. shouldParkAfterFailedAcquire 执行完毕回到 acquireQueued，再次 tryAcquire 尝试获取锁，当然这时 state 仍为1，失败
5. 当再次进入 shouldParkAfterFailedAcquire 时，这时因为其前驱 node 的 waitStatus 已经是-1，这次返回 true
6. 进入 parkAndCheckInterrupt，Thread-1执行park方法进入阻塞 (灰色表示)

再次有多个线程经历上述过程竞争失败，变成这个样子

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401213709.png)

##### 加锁源码

```java
public final void acquire(int arg) {  
    if (!tryAcquire(arg) &&  
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))  
        selfInterrupt();  
}
```

```java
// 尝试获取不公平锁
final boolean nonfairTryAcquire(int acquires) {  
    final Thread current = Thread.currentThread();  
    int c = getState();  
    // 尝试使用 cas 获得，这边体现了非公平性，不去检查 AQS 队列
    if (c == 0) {  
        if (compareAndSetState(0, acquires)) {  
            setExclusiveOwnerThread(current);  
            return true;  
        }  
    }  
    // 如果是当前线程，那么就 state++，体现了可重入
    else if (current == getExclusiveOwnerThread()) {  
        int nextc = c + acquires;  
        if (nextc < 0) // overflow  
            throw new Error("Maximum lock count exceeded");  
        setState(nextc);  
        return true;  
    }  
    // 获取锁失败，返回调用处
    return false;  
}

final boolean acquireQueued(final Node node, int arg) {  
    boolean interrupted = false;  
    try {  
        for (;;) {  
            final Node p = node.predecessor();  
            if (p == head && tryAcquire(arg)) {  
                setHead(node);  
                p.next = null; // help GC  
                return interrupted;  
            }  
            if (shouldParkAfterFailedAcquire(p, node))  
                interrupted |= parkAndCheckInterrupt();  
        }  
    } catch (Throwable t) {  
        cancelAcquire(node);  
        if (interrupted)  
            selfInterrupt();  
        throw t;  
    }  
}

static void selfInterrupt() {  
    Thread.currentThread().interrupt();  
}
```

##### 解锁流程

```java
public final boolean release(int arg) {  
    if (tryRelease(arg)) {  
        Node h = head;  
        if (h != null && h.waitStatus != 0)  
            unparkSuccessor(h);  
        return true;  
    }  
    return false;  
}
```

```java
@ReservedStackAccess  
protected final boolean tryRelease(int releases) {  
    int c = getState() - releases;  
    if (Thread.currentThread() != getExclusiveOwnerThread())  
        throw new IllegalMonitorStateException();  
    boolean free = false;  
    if (c == 0) {  
        free = true;  
        setExclusiveOwnerThread(null);  
    }  
    setState(c);  
    return free;  
}
```

Thread-0释放锁，进入 tryRelease 流程，如果成功

- 设置 exclusiveOwner Thread 为 null
- state = 0（这里暂时不考虑可重入锁的问题，state为1为上锁）

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230401214051.png)

当前队列不为 null，并且 head 的 waitStatus =-1，进入 unparkSuccessor 流程

找到队列中离 head 最近的一个 Node(没取消的)， unpark 恢复其运行，本例中即为
Thread-1

回到 Thread-1 的 acquireQueued 流程

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401214848.png)

如果加锁成功(没有竞争)，会设置

- exclusiveOwnerThread 为 Thread-1，state = 1

- head 指向刚刚 Thread-1 所在的 Node，该 Node 清空 Thread 原本的 head 因为从链表断开，而可被垃圾回收

- 如果这时候有其它线程来竞争(非公平的体现)，例如这时有Thread-4来了

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230401215001.png)

如果不巧又被 Thread-4 占了先

- Thread-4 被设置为 exclusiveOwnerThread，state = 1
- Thread-1 再次进入 acquireQueued流程，获取锁失败，重新进入 park 阻塞

##### 解锁源码

```java
public final boolean release(int arg) {  
    if (tryRelease(arg)) {  
        Node h = head;  
        if (h != null && h.waitStatus != 0)  
            unparkSuccessor(h);  
        return true;  
    }  
    return false;  
}

protected final boolean tryRelease(int releases) {  
    int c = getState() - releases;  
    if (Thread.currentThread() != getExclusiveOwnerThread())  
        throw new IllegalMonitorStateException();  
    boolean free = false;  
    if (c == 0) {  
        free = true;  
        setExclusiveOwnerThread(null);  
    }  
    setState(c);  
    return free;  
}

private void unparkSuccessor(Node node) {  
    
    int ws = node.waitStatus;  
    // 当前线程执行完毕，将状态变为0
    if (ws < 0)  
        node.compareAndSetWaitStatus(ws, 0);  
   
	 Node s = node.next;  
    if (s == null || s.waitStatus > 0) {  
        s = null;  
        // 从后往前找，找到第一个status小于等于0的，先激活那个线程
        for (Node p = tail; p != node && p != null; p = p.prev)  
            if (p.waitStatus <= 0)  
                s = p;  
    }  
    if (s != null)  
        LockSupport.unpark(s.thread);  
}
```

#### 可重入原理

##### nonfairTryAcquire

```java
final boolean nonfairTryAcquire(int acquires) {  
    final Thread current = Thread.currentThread();  
    int c = getState();  
    // Sync 继承过来的方法，方便阅读，放在此处
    if (c == 0) {  
        if (compareAndSetState(0, acquires)) {  
            setExclusiveOwnerThread(current);  
            return true;  
        }  
    }  
    // 如果已经获得了锁，线程还是当前线程，表示发生了锁重入
    else if (current == getExclusiveOwnerThread()) {  
	    // state++
        int nextc = c + acquires;  
        if (nextc < 0) // overflow  
            throw new Error("Maximum lock count exceeded");  
        setState(nextc);  
        return true;  
    }  
    return false;  
}
```

##### tryRelease

```java
protected final boolean tryRelease(int releases) {  
	// state--
    int c = getState() - releases;  
    if (Thread.currentThread() != getExclusiveOwnerThread())  
        throw new IllegalMonitorStateException();  
    boolean free = false;  
    if (c == 0) {  
        free = true;  
        setExclusiveOwnerThread(null);  
    }  
    setState(c);  
    return free;  
}
```

#### 可打断原理

##### 不可打断模式

在此模式下，即使它被打断，仍会驻留在AQS队列中，等获得锁后方能继续运行，只是打断标记被设置为 true，打断标记被设置为 true 后，会由加锁中的 acquire() 方法进行打断

```java
static final class NonfairSync extends Sync {
	
	// ...

	private final boolean parkAndCheckInterrupt() {  
		// 如果打断标记已经是 true，则park会失效
	    LockSupport.park(this);  
		// interrupted 会清除打断标记
	    return Thread.interrupted();  
	}
	
	final boolean acquireQueued(final Node node, int arg) {  
	    boolean interrupted = false;  
	    try {  
	        for (;;) {  
	            final Node p = node.predecessor();  
	            if (p == head && tryAcquire(arg)) {  
	                setHead(node);  
	                p.next = null; // help GC  
	                // 需要获得锁以后，才能返回打断状态
	                return interrupted;  
	            }  
	            // 代码相当于
	            //if (shouldParkAfterFailedAcquire(p, node) || parkAndCheckInterrupt()) {
			            //interrupted = true;
		            //}  
	            if (shouldParkAfterFailedAcquire(p, node))  
		            // 如果是因为 interrupt 被唤醒，返回打断状态为 true
	                interrupted |= parkAndCheckInterrupt();  
	        }  
	    } catch (Throwable t) {  
	        cancelAcquire(node);  
	        if (interrupted)  
	            selfInterrupt();  
	        throw t;  
	    }  
	}
	
	public final void acquire(int arg) {  
	    if (!tryAcquire(arg) &&  
	        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))  
	        selfInterrupt();  
	}

	static void selfInterrupt() {  
	    Thread.currentThread().interrupt();  
	}
}
```

##### 可打断模式

```java
// AQS方法
public final void acquireInterruptibly(int arg)  
        throws InterruptedException {  
    if (Thread.interrupted())  
        throw new InterruptedException();  
    if (!tryAcquire(arg))  
        doAcquireInterruptibly(arg);  
}

private void doAcquireInterruptibly(int arg)  
    throws InterruptedException {  
    final Node node = addWaiter(Node.EXCLUSIVE);  
    try {  
        for (;;) {  
            final Node p = node.predecessor();  
            if (p == head && tryAcquire(arg)) {  
                setHead(node);  
                p.next = null; // help GC  
                return;  
            }  
            // 如果因为 interrupt 被唤醒，那么就直接抛出异常，不会等待获得锁后再进行处理
            if (shouldParkAfterFailedAcquire(p, node) &&  
                parkAndCheckInterrupt())  
                throw new InterruptedException();  
        }  
    } catch (Throwable t) {  
        cancelAcquire(node);  
        throw t;  
    }  
}
```

#### 公平锁实现原理

与[[#非公平锁实现原理|非公平锁]]的区别主要在于 tryAcquire() 上

```java
    protected final boolean tryAcquire(int acquires) {  
        final Thread current = Thread.currentThread();  
        int c = getState();  
        if (c == 0) {  
	        // 只有当前节点没有前驱节点，才会进行进行CAS操作
            if (!hasQueuedPredecessors() &&  
                compareAndSetState(0, acquires)) {  
                setExclusiveOwnerThread(current);  
                return true;  
            }  
        }  
        else if (current == getExclusiveOwnerThread()) {  
            int nextc = c + acquires;  
            if (nextc < 0)  
                throw new Error("Maximum lock count exceeded");  
            setState(nextc);  
            return true;  
        }  
        return false;  
    }  
}

public final boolean hasQueuedPredecessors() {  
    Node h, s;  
    if ((h = head) != null) {  
        if ((s = h.next) == null || s.waitStatus > 0) {  
            s = null; // traverse in case of concurrent cancellation  
            for (Node p = tail; p != h && p != null; p = p.prev) {  
                if (p.waitStatus <= 0)  
                    s = p;  
            }  
        }  
        if (s != null && s.thread != Thread.currentThread())  
            return true;  
    }  
    return false;  
}
```

#### 条件变量实现原理

每个条件变量其实就对应着一个等待队列，其实现类是ConditionObject

##### await 流程

开始 Thread-0 持有锁，调用 await，进入 ConditionObject 的 addConditionWaiter 流程创建新的Node 状态为 -2(Node.CONDITION)，关联 Thread-0，加入等待队列尾部

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230402094330.png)

接下来进入 AQS 的 fullyRelease 流程，释放同步器上的锁

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230402094903.png)

unpark AQS 队列中的下一个节点，竞争锁，假设没有其他竞争线程，那么 Thread-1 竞争成功

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230402095423.png)

park 阻塞 Thread-0

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230402095450.png)

##### await 源码

```java
public final void await() throws InterruptedException {  
    if (Thread.interrupted())  
        throw new InterruptedException();  
    Node node = addConditionWaiter();  
    int savedState = fullyRelease(node);  
    int interruptMode = 0;  
    while (!isOnSyncQueue(node)) {  
        LockSupport.park(this);  
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)  
            break;  
    }  
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)  
        interruptMode = REINTERRUPT;  
    if (node.nextWaiter != null) // clean up if cancelled  
        unlinkCancelledWaiters();  
    if (interruptMode != 0)  
        reportInterruptAfterWait(interruptMode);  
}

private Node addConditionWaiter() {  
    if (!isHeldExclusively())  
        throw new IllegalMonitorStateException();  
    Node t = lastWaiter;  
    // If lastWaiter is cancelled, clean out.  
    if (t != null && t.waitStatus != Node.CONDITION) {  
        unlinkCancelledWaiters();  
        t = lastWaiter;  
    }  
  
    Node node = new Node(Node.CONDITION);  
  
    if (t == null)  
        firstWaiter = node;  
    else  
        t.nextWaiter = node;  
    lastWaiter = node;  
    return node;  
}

final int fullyRelease(Node node) {  
    try {  
        int savedState = getState();  
        if (release(savedState))  
            return savedState;  
        throw new IllegalMonitorStateException();  
    } catch (Throwable t) {  
        node.waitStatus = Node.CANCELLED;  
        throw t;  
    }  
}
```

##### signal 流程

假设 Thread-1 要来唤醒 Thread-0

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230402095827.png)

进入 ConditionObject 的 doSignal 流程，取得等待队列中第一个 Node，即 Thread-0 所在
Node

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230402101750.png)

执行 transferForSignal 流程，将该 Node 加入 AQS 队列尾部，将 Thread-0 的 waitStatus 改为0，Thread-3 的 waitStatus 改为 -1

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230402102246.png)

Thread-1释放锁，进入 unlock 流程，略

##### signal 源码

```java
public final void signal() {  
    if (!isHeldExclusively())  
        throw new IllegalMonitorStateException();  
    Node first = firstWaiter;  
    if (first != null)  
        doSignal(first);  
}

private void doSignal(Node first) {  
    do {  
        if ( (firstWaiter = first.nextWaiter) == null)  
            lastWaiter = null;  
        first.nextWaiter = null;  
    } while (!transferForSignal(first) &&  
             (first = firstWaiter) != null);  
}

final boolean transferForSignal(Node node) {  
    if (!node.compareAndSetWaitStatus(Node.CONDITION, 0))  
        return false;  
  
	Node p = enq(node);  
    int ws = p.waitStatus;  
    if (ws > 0 || !p.compareAndSetWaitStatus(ws, Node.SIGNAL))  
        LockSupport.unpark(node.thread);  
    return true;  
}

private Node enq(Node node) {  
    for (;;) {  
        Node oldTail = tail;  
        if (oldTail != null) {  
            node.setPrevRelaxed(oldTail);  
            if (compareAndSetTail(oldTail, node)) {  
                oldTail.next = node;  
                return oldTail;  
            }  
        } else {  
            initializeSyncQueue();  
        }  
    }  
}
```

### 读写锁

#### ReentrantReadWriteLock

当读操作远远高于写操作时，这时候使用 `读写锁` 让 `读-读` 可以并发，提高性能。类似于数据库中的 `select ... from ... lock in share mode`

提供一个 `数据容器类` 内部分别使用读锁保护数据的 `read()` 方法，写锁保护数据的 `write()` 方法

##### 验证

```java
@Slf4j  
public class TestReadWriteLock {  
  
    public static void main(String[] args) throws InterruptedException {  
        DataContainer data = new DataContainer();  
  
        log.info("测试读-读");  
  
        new Thread(() -> {  
            data.read();  
        }, "t1-读").start();  
        new Thread(() -> {  
            data.read();  
        }, "t2-读").start();  
  
        TimeUnit.SECONDS.sleep(2);  
  
        log.info("测试读-写");  
  
        new Thread(() -> {  
            data.read();  
        }, "t3-读").start();  
        new Thread(() -> {  
            data.write();  
        }, "t4-写").start();  
  
        TimeUnit.SECONDS.sleep(2);  
  
        log.info("测试写-写");  
  
        new Thread(() -> {  
            data.write();  
        }, "t5-写").start();  
        new Thread(() -> {  
            data.write();  
        }, "t6-写").start();  
  
    }  
}  
  
@Slf4j  
class DataContainer {  
    // 受保护的变量  
    private Object data;  
    private ReentrantReadWriteLock rw = new ReentrantReadWriteLock();  
    // 读锁  
    private ReentrantReadWriteLock.ReadLock r = rw.readLock();  
    // 写锁  
    private ReentrantReadWriteLock.WriteLock w = rw.writeLock();  
  
    public Object read() {  
        r.lock();  
        log.info("获取读锁");  
        try {  
            log.info("读取");  
            TimeUnit.SECONDS.sleep(1);  
            return data;  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            log.info("释放读锁");  
            r.unlock();  
        }  
    }  
  
    public void write() {  
        w.lock();  
        log.info("获取写锁");  
        try {  
            log.info("写入");  
            TimeUnit.SECONDS.sleep(1);  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            log.info("释放写锁");  
            w.unlock();  
        }  
    }  
}
```

```java
// 发现读-读兼容
10:51:29.333 [main] INFO com.duoduo.TestReadWriteLock - 测试读-读
10:51:29.336 [t1-读] INFO com.duoduo.DataContainer - 获取读锁
10:51:29.337 [t1-读] INFO com.duoduo.DataContainer - 读取
10:51:29.337 [t2-读] INFO com.duoduo.DataContainer - 获取读锁
10:51:29.337 [t2-读] INFO com.duoduo.DataContainer - 读取
10:51:30.337 [t1-读] INFO com.duoduo.DataContainer - 释放读锁
10:51:30.337 [t2-读] INFO com.duoduo.DataContainer - 释放读锁

// 发现读写不兼容，需要另一个线程释放后，才能进行锁的获取
10:51:31.342 [main] INFO com.duoduo.TestReadWriteLock - 测试读-写
10:51:31.344 [t3-读] INFO com.duoduo.DataContainer - 获取读锁
10:51:31.344 [t3-读] INFO com.duoduo.DataContainer - 读取
10:51:32.344 [t3-读] INFO com.duoduo.DataContainer - 释放读锁
10:51:32.345 [t4-写] INFO com.duoduo.DataContainer - 获取写锁
10:51:32.345 [t4-写] INFO com.duoduo.DataContainer - 写入

// 发现写写不兼容，需要另一个线程释放后，才能进行锁的获取
10:51:33.344 [main] INFO com.duoduo.TestReadWriteLock - 测试写-写
10:51:33.345 [t4-写] INFO com.duoduo.DataContainer - 释放写锁
10:51:33.346 [t5-写] INFO com.duoduo.DataContainer - 获取写锁
10:51:33.346 [t5-写] INFO com.duoduo.DataContainer - 写入
10:51:34.350 [t5-写] INFO com.duoduo.DataContainer - 释放写锁
10:51:34.351 [t6-写] INFO com.duoduo.DataContainer - 获取写锁
10:51:34.351 [t6-写] INFO com.duoduo.DataContainer - 写入
10:51:35.356 [t6-写] INFO com.duoduo.DataContainer - 释放写锁
```

##### 注意事项

- 读锁不支持条件变量

- **不支持重入时升级**：即持有读锁的情况下去获取写锁，会导致获取写锁永久等待

```java
r.lock();
try {
	// ...
	w.lock();
	try {
	// ...
	} finally {
		w.unlock();
	}
} finally {
	r.unlock();
}
```
 
- **支持重入时降级**：即持有写锁的情况下去获取读锁

```java
ReentrantReadWriteLock rw = new ReentrantReadWriteLock();  
  
new Thread(() -> {  
    rw.writeLock().lock();  
    try {  
        log.info("我拿到了写锁!");  
        TimeUnit.SECONDS.sleep(1);  
        rw.readLock().lock();  
        log.info("降级为了读锁！");  
        rw.readLock().unlock();  
        log.info("我释放了读锁!");  
    } catch (InterruptedException e) {  
        throw new RuntimeException(e);  
    } finally {  
        rw.writeLock().unlock();  
        log.info("我释放了写锁!");  
    }  
}, "t1").start();  
  
new Thread(() -> {  
    rw.writeLock().lock();  
    try {  
        log.info("我拿到了写锁!");  
        TimeUnit.SECONDS.sleep(1);  
        rw.readLock().lock();  
        log.info("降级为了读锁！");  
        rw.readLock().unlock();  
        log.info("我释放了读锁!");  
    } catch (InterruptedException e) {  
        throw new RuntimeException(e);  
    } finally {  
        rw.writeLock().unlock();  
        log.info("我释放了写锁!");  
    }  
}, "t2").start();
```

```java
15:45:28.184 [t1] INFO com.duoduo.TestReadWriteLock - 我拿到了写锁!
15:45:29.190 [t1] INFO com.duoduo.TestReadWriteLock - 降级为了读锁！
15:45:29.190 [t1] INFO com.duoduo.TestReadWriteLock - 我释放了读锁!
15:45:29.191 [t1] INFO com.duoduo.TestReadWriteLock - 我释放了写锁!
15:45:29.191 [t2] INFO com.duoduo.TestReadWriteLock - 我拿到了写锁!
15:45:30.191 [t2] INFO com.duoduo.TestReadWriteLock - 降级为了读锁！
15:45:30.192 [t2] INFO com.duoduo.TestReadWriteLock - 我释放了读锁!
15:45:30.192 [t2] INFO com.duoduo.TestReadWriteLock - 我释放了写锁!
```

##### 读写锁原理

###### 图解流程

读写锁用的是同一个 Sycn 同步器，因此等待队列、state等也是同一个

###### 以 [t1] w.lock，[t2] r.lock 为例

1. t1 成功上锁，流程与 ReentrantLock 加锁相比没有特殊之处，不同是写锁状态占了 state 的低16位，而读锁使用的是 state 的高16位

```java
protected final boolean tryAcquire(int acquires) {  
	Thread current = Thread.currentThread();  
    int c = getState();  
    // w=0表示读锁，w!=0表示写锁
    int w = exclusiveCount(c);  
    if (c != 0) {  
        // 1. 该读写锁上的是读锁，由于读写锁不兼容，所以返回false
        // 2. 该读写锁上的是写锁，并且锁的拥有者不是当前线程，返回false
        if (w == 0 || current != getExclusiveOwnerThread())  
            return false;  
		// 如果可重入数超过最大可重入数，抛出异常
        if (w + exclusiveCount(acquires) > MAX_COUNT)  
            throw new Error("Maximum lock count exceeded");  
        // CAS操作
        setState(c + acquires);  
        return true;  
    }
    // 判断是否应该阻塞
	// 非公平锁永远返回false
    // 公平锁只有AQS第一个线程返回true
    if (writerShouldBlock() ||  
        !compareAndSetState(c, c + acquires))  
        return false;
    setExclusiveOwnerThread(current);
    return true; 
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403155202.png)

2. t2 执行 r.lock ，这时进入读锁的 sync.acquireShared(1) 流程，首先会进入 tryAcquireShared 流程。如果有写锁占据，那么 tryAcquireShared 返回 -1 表示失败

```java
public void lock() {  
    sync.acquireShared(1);  
}

public final void acquireShared(int arg) {  
    if (tryAcquireShared(arg) < 0)  
        doAcquireShared(arg);  
}

protected final int tryAcquireShared(int unused) {  

	Thread current = Thread.currentThread();  
    int c = getState();  
	// 查看写锁是否为0
    if (exclusiveCount(c) != 0 &&  
        getExclusiveOwnerThread() != current)  
        return -1;  
    int r = sharedCount(c);  
    if (!readerShouldBlock() &&  
        r < MAX_COUNT &&  
        compareAndSetState(c, c + SHARED_UNIT)) {  
        if (r == 0) {  
            firstReader = current;  
            firstReaderHoldCount = 1;  
        } else if (firstReader == current) {  
            firstReaderHoldCount++;  
        } else {  
            HoldCounter rh = cachedHoldCounter;  
            if (rh == null ||  
                rh.tid != LockSupport.getThreadId(current))  
                cachedHoldCounter = rh = readHolds.get();  
            else if (rh.count == 0)  
                readHolds.set(rh);  
            rh.count++;  
        }  
        return 1;  
    }  
    return fullTryAcquireShared(current);  
}
```

>tryAcquireShared 返回值表示
>
>-1：表示失败
>1：表示成功，而且数值是还有几个后继节点需要唤醒，读写锁返回 1

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403172000.png)

3. 这时会进入 sync.doAcquireShared(1) 流程，首先也是调用 addWaiter 添加节点，不同之处在于节点被设置为 Node.SHARED 模式而非 Node.EXCLUSIVE 模式，注意此时 t2 仍处于活跃状态

```java
private void doAcquireShared(int arg) {  
    final Node node = addWaiter(Node.SHARED);  
    boolean interrupted = false;  
    try {  
        for (;;) {  
            final Node p = node.predecessor();  
            if (p == head) {  
                int r = tryAcquireShared(arg);  
                if (r >= 0) {  
                    setHeadAndPropagate(node, r);  
                    p.next = null; // help GC  
                    return;  
                }  
            }  
            if (shouldParkAfterFailedAcquire(p, node))  
                interrupted |= parkAndCheckInterrupt();  
        }  
    } catch (Throwable t) {  
        cancelAcquire(node);  
        throw t;  
    } finally {  
        if (interrupted)  
            selfInterrupt();  
    }  
}
```

4. t2 会看看自己的节点是不是老二，如果是，还会再次调用 tryAcquireShared(1)来尝
试获取锁

5. 如果没有成功，在doAcquireShared 内 for (;;) 循环一次，把前驱节点的 waitStatus 改为-1，再 for (;;) 循环一次尝试 tryAcquireShared(1) 如果还不成功，那么在 parkAndCheckInterrupt() 处 park

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403172529.png)

###### 以 [t3] r.lock，[t4] w.lock 为例

这种状态下，假设又有t3加读锁和t4加写锁，这期间t1仍然持有锁，就变成了下面的样子

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403172801.png)

###### [t1] w.unlock

这时会走到写锁的 sync.release(1) 流程，调用 sync.tryRelease(1) 成功，变成下面的样子

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403172920.png)

```java
public void unlock() {  
    sync.release(1);  
}

public final boolean release(int arg) {  
    if (tryRelease(arg)) {  
        Node h = head;  
        if (h != null && h.waitStatus != 0)  
            unparkSuccessor(h);  
        return true;  
    }  
    return false;  
}

protected final boolean tryRelease(int releases) {  
    if (!isHeldExclusively())  
        throw new IllegalMonitorStateException();  
    int nextc = getState() - releases;  
    // 判断可重入数是否减为0了
    boolean free = exclusiveCount(nextc) == 0;
    // 如果减为0了，那么锁占有者变为null
    if (free)  
        setExclusiveOwnerThread(null);  
    setState(nextc);  
    return free;  
}
```

接下来执行唤醒流程 sync.unparkSuccessor，即让老二恢复运行，这时 2 在 doAcquireShared 内 parkAndCheckInterrupt() 处恢复运行

这回再来一次for(;;)执行 tryAcquireShared 成功则让读锁计数加一

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403173402.png)

这时 t2 已经恢复运行，接下来 t 调用 setHeadAndPropagate(node, 1)，它原本所在节点被置为头节点

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403190625.png)

事情还没完，在 setHeadAndPropagate 方法内还会检查下一个节点是否是 shared，如果是则调用doReleaseShared() 将 head 的状态从 -1 改为 0 并唤醒老二，这时 t3 在 doAcquireShared 内 parkAndCheckInterrupt() 处恢复运行

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403191102.png)

这回再来一次 for(;;) 执行 tryAcquireShared 成功，则让读锁计数加一

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403191151.png)

这时 t3 已经恢复运行，接下来 t3 调用 setHeadAndPropagate(node, 1)，它原本所在节点被置为头节点

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403191306.png)

下一个节点不是 shared 了，因此不会继续唤醒 t4 所在节点

###### 以 [t2] r.unlock，[t3] r.unlock 为例

t2 进入 sync.releaseShared(1) 中，调用 sync.releaseShared(1) 让计数减一，但由于计数还不为零

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403191539.png)

t3 进入 sync.releaseShared(1) 中，调用 tryReleaseShared(1) 让计数减一，这回计数为零了，进入 doReleaseShared() 将头节点从 -1 改为0，并唤醒老二，即

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403191943.png)

之后 t4 在 acquireQueued 中 parkAndCheckInterrupt 处恢复运行，再次 for(;;) 这次自己是老二，并且没有其他竞争，tryAcquire(1)成功，修改头结点，流程结束

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230403192206.png)




#### StampedLock

该类自 JDK 8 加入，是为了进一步优化读性能，它的特点是在使用读锁、写锁时都必须配合【戳】使用

##### 加解读锁

```java
long stamp = lock.readLock();
lock.unlockRead(stamp);
```

##### 加解写锁

```java
long stamp = lock.writeLock();
lock.unlockWrite(stamp);
```

乐观读，StampedLock 支持 tryOptimisticRead() 方法（乐观读），读取完毕后需要做一次`戳校验`如果校验通过，表示这期间确实没有写操作，数据可以安全使用，如果校验没通过，需要重新获取读锁，保证数据安全。

```java
long stamp = lock.tryOptimisticRead();
// 验戳
if (!lock.validate(stamp)) {
	// 锁升级
}
```

提供一个数据容器类内部分别使用读锁保护数据的 read() 方法，写锁保护数据的 write() 方法

##### 使用

**发生锁升级的情况（读写）**

```java
@Slf4j  
public class TestStampedLock {  
  
    public static void main(String[] args) throws InterruptedException {  
  
        DataObject dataObject = new DataObject(1);  
  
        new Thread(() -> {  
            try {  
                dataObject.read(500);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "t1").start();  
  
        new Thread(() -> {  
            dataObject.write();  
        }, "t2").start();  
  
    }  
}  
  
@Slf4j  
class DataObject {  
  
    private int data;  
    private final StampedLock lock = new StampedLock();  
  
    public DataObject(int data) {  
        this.data = data;  
    }  
  
    public int read(long readTime) throws InterruptedException {  
        long stamp = lock.tryOptimisticRead();  
        log.info("【读】戳为:{}", stamp);  
        TimeUnit.MILLISECONDS.sleep(readTime);  
        if (lock.validate(stamp)) {  
            log.info("【读】未发生修改，戳生效，{}, data:{}", stamp, data);  
            return data;  
        }  
        stamp = lock.readLock();  
        try {  
            log.info("【读】发生了修改，新戳为:{}, data:{}", stamp, data);  
        } finally {  
            lock.unlockRead(stamp);  
        }  
        return data;  
    }  
  
    public void write() {  
        long stamp = lock.writeLock();  
        log.info("【写】戳:{}", stamp);  
        try {  
            data = new Random().nextInt(100);  
            log.info("【写】进行修改, 戳:{}, data:{}", stamp, data);  
            TimeUnit.MILLISECONDS.sleep(500);  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        } finally {  
            lock.unlockWrite(stamp);  
        }  
    }  
}
```

```java
23:59:57.601 [t2] INFO com.duoduo.DataObject - 【写】戳:384
23:59:57.601 [t1] INFO com.duoduo.DataObject - 【读】戳为:256
23:59:57.608 [t2] INFO com.duoduo.DataObject - 【写】进行修改, 戳:384, data:39
23:59:58.110 [t1] INFO com.duoduo.DataObject - 【读】发生了修改，新戳为:513, data:39
```

**未发生锁升级读情况（读读）**

```java
public static void main(String[] args) throws InterruptedException {  
  
    DataObject dataObject = new DataObject(1);  
  
    new Thread(() -> {  
        try {  
            dataObject.read(500);  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
    }, "t1").start();  
  
    new Thread(() -> {  
        try {  
            dataObject.read(500);  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
    }, "t2").start();  
}
```

```java
00:02:26.153 [t2] INFO com.duoduo.DataObject - 【读】戳为:256
00:02:26.153 [t1] INFO com.duoduo.DataObject - 【读】戳为:256
00:02:26.666 [t1] INFO com.duoduo.DataObject - 【读】未发生修改，戳生效，256, data:1
00:02:26.666 [t2] INFO com.duoduo.DataObject - 【读】未发生修改，戳生效，256, data:1
```

##### 注意

- StampedLock 不支持条件变量
- StampedLock 不支持可重入

### Semaphore

信号量，用来限制能同时访问共享资源的线程上限。

#### Semaphore 应用

使用 Semaphore 限流，在访问高峰期时，让请求线程阻塞，高峰期过去再释放许可，当然它只适合限制单机线程数量，并且仅是限制线程数，而不是限制资源数（例如连接数，请对比 Tomcat  LimitLatch 的实现)

用 Semaphore 实现简单连接池，对比[[#模式之享元]]下的实现（用wait notify)，性能和可读性显然更好，注意下面的实现中线程数和数据库连接数是相等的

#### 用 Semaphore 优化[[#自定义实现简易数据库连接池]]

```java
@Slf4j  
public class TestSemaphorePool {  
  
    public static void main(String[] args) {  
        SemaphorePool pool = new SemaphorePool(2);  
        for (int i = 0; i < 5; i++) {  
            new Thread(() -> {  
                Connection conn = null;  
                try {  
                    conn = pool.getConnection();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                } finally {  
                    pool.freeConnection(conn);  
                }  
            }, i + "").start();  
        }  
    }  
}  
  
@Slf4j  
class SemaphorePool {  
  
    // 1. 连接池大小  
    private final int poolSize;  
  
    // 2. 连接对象数组  
    private Connection[] connections;  
  
    // 3. 连接状态数组，0：表示空闲，1：表示繁忙  
    private AtomicIntegerArray status;  
  
    private Semaphore semaphore;  
  
    // 4. 进行属性的初始化  
    public SemaphorePool(int poolSize) {  
        // 让许可数与资源数一致  
        this.semaphore = new Semaphore(poolSize);  
        this.poolSize = poolSize;  
        connections = new Connection[poolSize];  
        this.status = new AtomicIntegerArray(new int[poolSize]);  
        for (int i = 0; i < poolSize; i++) {  
            connections[i] = new MockConnection("[CONNECTION-]" + i);  
        }  
    }  
  
    // 创建连接  
    public Connection getConnection() throws InterruptedException {  
        semaphore.acquire();  
        for (int i = 0; i < poolSize; i++) {  
            if (status.get(i) == 0) {  
                if (status.compareAndSet(i, 0, 1)) {  
                    log.info("成功获取连接");  
                    return connections[i];  
                }  
            }  
        }  
        return null;  
    }  
  
    // 归还连接  
    public void freeConnection(Connection conn) {  
        for (int i = 0; i < poolSize; i++) {  
            if (connections[i] == conn) {  
                // 由于释放连接一定拥有对这线程的使用权  
                status.set(i, 0);  
                log.info("归还连接{}", connections[i]);  
                semaphore.release();  
                break;  
            }  
        }  
    }  
}
```

```java
11:24:15.536 [1] INFO com.duoduo.SemaphorePool - 成功获取连接
11:24:15.536 [0] INFO com.duoduo.SemaphorePool - 成功获取连接
11:24:15.542 [1] INFO com.duoduo.SemaphorePool - 归还连接MockConnection{name='[CONNECTION-]0'}
11:24:15.542 [0] INFO com.duoduo.SemaphorePool - 归还连接MockConnection{name='[CONNECTION-]1'}
11:24:15.560 [4] INFO com.duoduo.SemaphorePool - 成功获取连接
11:24:15.560 [3] INFO com.duoduo.SemaphorePool - 成功获取连接
11:24:15.560 [4] INFO com.duoduo.SemaphorePool - 归还连接MockConnection{name='[CONNECTION-]0'}
11:24:15.560 [3] INFO com.duoduo.SemaphorePool - 归还连接MockConnection{name='[CONNECTION-]1'}
11:24:15.560 [2] INFO com.duoduo.SemaphorePool - 成功获取连接
11:24:15.561 [2] INFO com.duoduo.SemaphorePool - 归还连接MockConnection{name='[CONNECTION-]0'}
```

#### Semaphore 原理

```java
public Semaphore(int permits) {  
    sync = new NonfairSync(permits);  
}
```

Semaphore 有点像一个停车场，permits 就好像停车位数量，当线程获得了 permits 就像是获得了停车位，然后停车场显示空余车位减一

刚开始，permits(state) 为3，这时5个线程来获取资源

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230404112655.png)

假设其中 Thread-1，Thread-2，Thread-4，CAS竞争成功，而 Thread-0 和 Thread-3 竞争失败，进入 AQS 队列 park 阻塞。

```java
private void doAcquireSharedInterruptibly(int arg)  
    throws InterruptedException {  
    // 添加头节点
    final Node node = addWaiter(Node.SHARED);  
    try {  
        for (;;) {  
            final Node p = node.predecessor();  
            if (p == head) {  
                int r = tryAcquireShared(arg);  
                if (r >= 0) {  
                    setHeadAndPropagate(node, r);  
                    p.next = null; // help GC  
                    return;  
                }  
            }  
            // shouldParkAfterFailedAcquire 判断前一个节点是否需要唤醒下一个节点，是的话就park
            // parkAndCheckInterrupt 执行 park 方法
            if (shouldParkAfterFailedAcquire(p, node) &&  
                parkAndCheckInterrupt())  
                throw new InterruptedException();  
        }  
    } catch (Throwable t) {  
        cancelAcquire(node);  
        throw t;  
    }  
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230404113409.png)

这时 Thread-4 释放了 permits，状态如下

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230404114602.png)

```java
protected final boolean tryReleaseShared(int releases) {  
    for (;;) {  
        int current = getState();  
        int next = current + releases;  
        if (next < current) // overflow  
            throw new Error("Maximum permit count exceeded");  
        if (compareAndSetState(current, next))  
            return true;  
    }  
}

private void doReleaseShared() {  
   for (;;) {  
        Node h = head;  
        if (h != null && h != tail) {  
            int ws = h.waitStatus;  
            if (ws == Node.SIGNAL) {  
                if (!h.compareAndSetWaitStatus(Node.SIGNAL, 0))  
                    continue;            // loop to recheck cases  
                unparkSuccessor(h);  
            }  
            else if (ws == 0 &&  
                     !h.compareAndSetWaitStatus(0, Node.PROPAGATE))  
                continue;                // loop on failed CAS  
        }  
        if (h == head)                   // loop if head changed  
            break;  
    }  
}
```

接下来 Thread-0 竞争成功，permits 再次设置为0，设置自己为 head 节点，断开原来的head节点，unpark接下来的Thread-3节点，但由于permits是0，因此Thread-3在尝试不成功后再次进入park状态

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230404134229.png)




### CountdownLatch

用来进行线程同步协作，等待所有线程完成倒计时。

其中构造参数用来初始化等待计数值，`await()` 用来等待计数归零，`countDown()` 用来让计数减一

#### 使用场景

可以保证几个线程按顺序的进行

>join不是也可以按顺序进行，为什么不选择用join？

由于我们线上环境一般是使用线程池，线程一直在使用中，因此我们并不能使用 join 来等待线程结束的方式来控制按顺序执行

#### 基本使用

```java
@Slf4j  
public class TestCountDownLatch {  
  
    public static void main(String[] args) throws InterruptedException {  
  
        log.info("waiting...");  
  
        CountDownLatch latch = new CountDownLatch(3);  
  
        new Thread(() -> {  
            try {  
                log.info("running...");  
                TimeUnit.SECONDS.sleep(1);  
                // 计数器-1  
                latch.countDown();  
                log.info("end...");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "t1").start();  
  
        new Thread(() -> {  
            try {  
                log.info("running...");  
                TimeUnit.SECONDS.sleep(2);  
                // 计数器-1  
                latch.countDown();  
                log.info("end...");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "t2").start();  
  
        new Thread(() -> {  
            try {  
                log.info("running...");  
                TimeUnit.MILLISECONDS.sleep(1000 + 500);  
                // 计数器-1  
                latch.countDown();  
                log.info("end...");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "t3").start();  
  
        latch.await();  
        log.info("end...");  
    }  
}
```

```java
14:22:08.205 [main] INFO com.duoduo.TestCountDownLatch - waiting...
14:22:08.208 [t1] INFO com.duoduo.TestCountDownLatch - running...
14:22:08.209 [t2] INFO com.duoduo.TestCountDownLatch - running...
14:22:08.209 [t3] INFO com.duoduo.TestCountDownLatch - running...
14:22:09.213 [t1] INFO com.duoduo.TestCountDownLatch - end...
14:22:09.712 [t3] INFO com.duoduo.TestCountDownLatch - end...
14:22:10.213 [t2] INFO com.duoduo.TestCountDownLatch - end...
14:22:10.213 [main] INFO com.duoduo.TestCountDownLatch - end...
```

#### 线程池中使用 CountDownLatch

```java
@Slf4j  
public class TestCountDownLatch {  
  
    public static void main(String[] args) throws InterruptedException {  
  
        CountDownLatch latch = new CountDownLatch(3);  
  
        ExecutorService pool = Executors.newFixedThreadPool(3);  
  
        log.info("waiting...");  
  
        pool.execute(() -> {  
            try {  
                log.info("running...");  
                TimeUnit.SECONDS.sleep(1);  
                // 计数器-1  
                latch.countDown();  
                log.info("end...");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        });  
  
        pool.execute(() -> {  
            try {  
                log.info("running...");  
                TimeUnit.SECONDS.sleep(2);  
                // 计数器-1  
                latch.countDown();  
                log.info("end...");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        });  
  
        pool.execute(() -> {  
            try {  
                log.info("running...");  
                TimeUnit.MILLISECONDS.sleep(1000 + 500);  
                // 计数器-1  
                latch.countDown();  
                log.info("end...");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        });  
  
        latch.await();  
        log.info("end...");  
    }  
}
```

```java
14:37:08.284 [main] INFO com.duoduo.TestCountDownLatch - waiting...
14:37:08.290 [pool-1-thread-1] INFO com.duoduo.TestCountDownLatch - running...
14:37:08.291 [pool-1-thread-2] INFO com.duoduo.TestCountDownLatch - running...
14:37:08.292 [pool-1-thread-3] INFO com.duoduo.TestCountDownLatch - running...
14:37:09.294 [pool-1-thread-1] INFO com.duoduo.TestCountDownLatch - end...
14:37:09.794 [pool-1-thread-3] INFO com.duoduo.TestCountDownLatch - end...
14:37:10.295 [pool-1-thread-2] INFO com.duoduo.TestCountDownLatch - end...
14:37:10.295 [main] INFO com.duoduo.TestCountDownLatch - end...
```

#### 实战：游戏全部玩家准备后进行游戏

```java
@Slf4j  
public class TestCountDownLatch {  
  
    public static void main(String[] args) throws InterruptedException {  
  
        ExecutorService pool = Executors.newFixedThreadPool(10);  
        String[] all = new String[10];  
        Random random = new Random();  
        CountDownLatch latch = new CountDownLatch(10);  
  
        for (int i = 0; i < 10; i++) {  
            int index = i;  
            pool.submit(() -> {  
                for (int j = 0; j <= 100; j++) {  
                    try {  
                        TimeUnit.MILLISECONDS.sleep(random.nextInt(100));  
                    } catch (InterruptedException e) {  
                        throw new RuntimeException(e);  
                    }  
                    all[index] = j + "%";  
                    // \r 将光标移到开头，对内容进行覆盖  
                    System.out.print("\r" + Arrays.toString(all));  
                }  
                latch.countDown();  
            });  
        }  
  
        latch.await();  
        System.out.println("\n游戏开始!");  
    }  
}
```

```java
[100%, 100%, 100%, 100%, 100%, 100%, 100%, 100%, 100%, 100%]
游戏开始!
```

#### 实战：收集物流、商品信息后，一次性输出

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230404153223.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230404153234.png)

三个远程接口分别需要花费一定的秒数：

- 如果用串型执行，那么会需要三个接口花费的时间相加。
- 采用CountDownLatch，那么只需要花费三个接口中最大的耗时时间。

>如果需要返回值，那么采用 future 更为合适
>
>Future<Map<String, Object>> f1 = pool.submit(() -> {
>	// 业务逻辑
>	return new HashMap<String, Object>();
>})
>
>// 程序会阻塞在这，等待线程运行结果
>f1.get();




### CyclicBarrier

循环栅栏，用来进行线程协作，等待线程满足某个计数。构造时设置「计数个数」，每个线程执行到某个需要**同步**的时刻调用 `await()` 方法进行等待，当等待的线程数满足「计数个数」时，继续执行

#### 基本使用

```java
ExecutorService pool = Executors.newFixedThreadPool(2);  
CyclicBarrier cyclicBarrier = new CyclicBarrier(2);  
  
pool.submit(() -> {  
    log.info("task1 begin...");  
    try {  
        TimeUnit.SECONDS.sleep(1);  
        cyclicBarrier.await();  
    } catch (InterruptedException | BrokenBarrierException e) {  
        throw new RuntimeException(e);  
    }  
    log.info("task1 end...");  
});  
  
pool.submit(() -> {  
    log.info("task2 begin...");  
    try {  
        TimeUnit.SECONDS.sleep(2);  
        cyclicBarrier.await();  
    } catch (InterruptedException | BrokenBarrierException e) {  
        throw new RuntimeException(e);  
    }  
    log.info("task2 end...");  
});
```

#### CyclicBarrier 与 CountdownLatch 的区别

- CyclicBarrier 在计数变为0后，**会**重新将计数变为初始化时的值

- CountdownLatch 在技术变为0后，**不会**将技术变为初始化的值

```java
@Slf4j  
public class TestCyclicBarrier {  
  
    public static void main(String[] args) throws BrokenBarrierException, InterruptedException {  
  
        ExecutorService pool = Executors.newFixedThreadPool(2);  

        CountDownLatch countDownLatch = new CountDownLatch(2);  
  
        countDownLatch.countDown();  
        log.info("【CountDownLatch】计数-1");  
        countDownLatch.countDown();  
        log.info("【CountDownLatch】计数-1");  
        countDownLatch.await();  
        log.info("【CountDownLatch】执行await方法");  
        countDownLatch.await();  
        log.info("【CountDownLatch】执行await方法");  
  
        CyclicBarrier cyclicBarrier = new CyclicBarrier(2);  
  
        pool.submit(() -> {  
            try {  
                cyclicBarrier.await();  
                log.info("【cyclicBarrier】计数-1");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } catch (BrokenBarrierException e) {  
                throw new RuntimeException(e);  
            }  
        });  
  
        pool.submit(() -> {  
            try {  
                cyclicBarrier.await();  
                log.info("【cyclicBarrier】计数-1");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } catch (BrokenBarrierException e) {  
                throw new RuntimeException(e);  
            }  
        });  
  
        pool.submit(() -> {  
            try {  
                log.info("【cyclicBarrier】尝试await，此处由于计数器变为初始值，所以阻塞了");  
                cyclicBarrier.await();  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } catch (BrokenBarrierException e) {  
                throw new RuntimeException(e);  
            }  
        });  
    }  
}
```

```java
16:08:55.872 [main] INFO com.duoduo.TestCyclicBarrier - 【CountDownLatch】计数-1
16:08:55.875 [main] INFO com.duoduo.TestCyclicBarrier - 【CountDownLatch】计数-1
16:08:55.876 [main] INFO com.duoduo.TestCyclicBarrier - 【CountDownLatch】执行await方法
16:08:55.876 [main] INFO com.duoduo.TestCyclicBarrier - 【CountDownLatch】执行await方法
16:08:55.891 [pool-1-thread-1] INFO com.duoduo.TestCyclicBarrier - 【cyclicBarrier】计数-1
16:08:55.891 [pool-1-thread-2] INFO com.duoduo.TestCyclicBarrier - 【cyclicBarrier】计数-1
16:08:55.892 [pool-1-thread-2] INFO com.duoduo.TestCyclicBarrier - 【cyclicBarrier】尝试await，此处由于计数器变为初始值，所以阻塞了
```


### 线程安全集合类概述

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230404163529.png)

线程安全集合类可以分为三大类：

**第一类**

遗留的线程安全集合如 Hashtable，Vector

**第二类**

使用 Collections 修饰的线程安全集合，如：

- Collections.synchronizedCollection
- Collections.synchronizedMap
- Collections.synchronizedSet
- Collections.synchronizedNavigableMap
- Collections.synchronizedNavigableSet
- Collections.synchronizedSortedMap
- Collections.synchronizedSortedSet
- Collections.synchronizedList

**第三类**

java.util.concurrent

重点介绍 java.util.concurrent.* 下的线程安全集合类，可以发现它们有规律，里面包含三类关键词：Blocking、CopyOn Write、Concurrent

- Blocking 大部分实现基于锁，并提供用来阻塞的方法
- CopyOnWrite 之类容器修改开销相对较重
- Concurrent 类型的容器
	- 内部很多操作使用 CAS 优化，一般可以提供较高吞吐量
	- 弱一致性
		- 遍历时弱一致性，例如，当利用迭代器遍历时，如果容器发生修改，迭代器仍然可以继续进行遍历，这时内容是旧的
		- 求大小弱一致性，size 操作未必是 100% 准确
		- 读取弱一致性

>遍历时如果发生了修改，对于非安全容器来讲，使用 fail-fast 机制也就是让遍历立刻失败，抛出ConcurrentModificationException，不再继续遍历



### ConcurrentHashMap（JDK 8）

#### 死链

JDK7中两个线程同时扩容会造成死链

>参考：黑马JUC，278集-280集

#### 重要属性和内部类

```java
// 默认为 0 
// 当初始化时，为 -1
// 当扩容时，为 -(1+扩容线程数)
// 当初始化或扩容完成后，为下一次的扩容的阈值大小，也就是容量的3/4
private transient volatile int sizeCtl;

// 整个 ConcurrentHashMap 就是一个 Node[]
static class Node<K,V> implements Map.Entry<K,V>{}

// hash 表
transient volatile Node<K,V>[] table;

// 扩容时的新 hash 表
private transient volatile Node<K,V>[] nextTable;

// 扩容时如果某个 bin 迁移完毕，用 ForwardingNode 作为旧 table bin 的头结点
static final class ForwardingNode<K,V> extends Node<K,V>{}

// 用在 compute 以及 computeIfAbsent 时，用来占位，计算完成后替换为普通Node 
static final class ReservationNode<K,V> extends Node<K,V>{}

// 作为 treebin 的头节点，存储 root 和 first 
static final class TreeBin<k,V> extends Node<K,V>{}

//作为 treebin 的节点，存储parent,left,right 
static final class TreeNode<K,V> extends Node<K,V>{}
```

#### 重要方法

```java
// 获取 Node[] 中第 i 个 Node
static final <K, V> Node<K, V> tabAt(Node<K, V>[] tab, int i);

// CAS 修改 Node[] 中第 i 个 Node 的值，c为旧值，v为新值
static final <K, V> boolean casTabAt(Node<K, V>[] tab, int i, Node<K, V> c, Node<K, V> v)

// 直接修改 Node[] 中第 i 个 Node 的值，v 为新值
static final <K, V> void setTabAt(Node<K, V>[] tab, int i, Node<K, V> v)
```

#### 构造器

```java
public ConcurrentHashMap(int initialCapacity,  
                         float loadFactor, int concurrencyLevel) {  
    if (!(loadFactor > 0.0f) || initialCapacity < 0 || concurrencyLevel <= 0)  
        throw new IllegalArgumentException();  
    if (initialCapacity < concurrencyLevel)   // Use at least as many bins  
        initialCapacity = concurrencyLevel;   // as estimated threads  
	// 1 + (个数 / 负载因子)
    long size = (long)(1.0 + (long)initialCapacity / loadFactor);  
    // tableSizeFor 保证计算大小为 2^n，即16，32，64
    int cap = (size >= (long)MAXIMUM_CAPACITY) ?  
        MAXIMUM_CAPACITY : tableSizeFor((int)size);  
    this.sizeCtl = cap;  
}
```

#### get 流程

```java
public V get(Object key) {  
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;  
    // spread 方法能够保证返回结果是整数
    int h = spread(key.hashCode());  
    if ((tab = table) != null && (n = tab.length) > 0 &&  
        (e = tabAt(tab, (n - 1) & h)) != null) {  
	    // 如果头节点已经是要查找的key  
        if ((eh = e.hash) == h) {  
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))  
                return e.val;  
        }  
        // hash 为负数表示该 bin 在扩容中或是 treebin（红黑树），这是调用 find 方法来查找
        // [注意]扩容时，会给旧链表头部加上FORWARDING_NODE，find方法就会到新的链表去查找该Key
        else if (eh < 0)  
            return (p = e.find(h, key)) != null ? p.val : null;  
        // 正常遍历链表，用 equals 来查找
        while ((e = e.next) != null) {  
            if (e.hash == h &&  
                ((ek = e.key) == key || (ek != null && key.equals(ek))))  
                return e.val;  
        }  
    }  
    return null;  
}
```

#### put 流程

以下数组简称（table），链表简称（bin）

```java
// onlyIfAbsent 表示如果为真，那么只有第一次put这个键和值的时候，才会把这个键和值放进去；否则不会
public V put (K key, V value) {
	return putVal(key, value, false);
}

final V putVal(K key, V value, boolean onlyIfAbsent) {  
    if (key == null || value == null) throw new NullPointerException();  
    // 其中spread方法会综合高位低位，具有更好的 hash 性
    int hash = spread(key.hashCode());  
    int binCount = 0;  
    for (Node<K,V>[] tab = table;;) {  
	    // f 是链表头节点
	    // fh 是链表头节点的 hash
	    // i 是链表在 table 中的下标
        Node<K,V> f; int n, i, fh; K fk; V fv;  
        // 如果 table 还未创建，那么创建 table
        if (tab == null || (n = tab.length) == 0)  
	        // 初始化 table，使用 cas，无需 synchronized 创建成功，进入下一轮循环
            tab = initTable();  
		// 创建链表头节点
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {  
	        // 添加链表头，使用了 cas，无需 synchronized
            if (casTabAt(tab, i, null, new Node<K,V>(hash, key, value)))  
                break;
        }  
        // 帮忙扩容，判断下当前链表头节点是否是FORWARDING_NODE，如果是，帮忙扩容
        else if ((fh = f.hash) == MOVED)  
	        // 帮忙之后，进入下一轮循环
	        // helpTransfer 会锁住【某个】链表，进行扩容
            tab = helpTransfer(tab, f);  
        // 如果只在第一次进行插入 
        // 并且当前头节点的hash值与要查找的相等 
        // 并且头节点的key与要查询的key引用同一个对象，或者 equals() 方法比较相等 
        // 并且值不为0，那么返回值
        else if (onlyIfAbsent // check first node without acquiring lock  
                 && fh == hash  
                 && ((fk = f.key) == key || (fk != null && key.equals(fk)))  
                 && (fv = f.val) != null)  
            return fv;  
        else {  
            V oldVal = null;  
            // 锁住桶的头节点
            synchronized (f) {
	            // 再次确定链表头节点没被移动过  
                if (tabAt(tab, i) == f) {  
	                // 如果头节点的hash码>0，那么说明是链表，进行链表处理
                    if (fh >= 0) {  
                        binCount = 1;  
                        // 遍历链表
                        for (Node<K,V> e = f;; ++binCount) {  
                            K ek;  
                            // 找到相同key
                            if (e.hash == hash &&  
                                ((ek = e.key) == key ||  
                                 (ek != null && key.equals(ek)))) {  
                                oldVal = e.val;  
                                if (!onlyIfAbsent)  
                                    e.val = value;  
                                break;  
                            } 
                            // 如果到了最后一个节点还没找到，那么新增 Node，追加至链表尾
                            Node<K,V> pred = e;  
                            if ((e = e.next) == null) {  
                                pred.next = new Node<K,V>(hash, key, value);  
                                break;  
                            }  
                        }  
                    } 
                    // 红黑树处理
                    else if (f instanceof TreeBin) {  
                        Node<K,V> p;  
                        binCount = 2;  
                        // putTreeVal 会看 key 是否已经在树中，是，则返回对应的 TreeNode
                        if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,  
                                                       value)) != null) {  
                            oldVal = p.val;  
                            if (!onlyIfAbsent)  
                                p.val = value;  
                        }  
                    }  
                    else if (f instanceof ReservationNode)  
                        throw new IllegalStateException("Recursive update");  
                }  
                // 释放链表头节点的锁
            }  
            // 红黑树处理，binCount = 2
            // 如果是链表处理，bincount=1，每遍历一个链表节点，binCount++
            if (binCount != 0) {  
	            // 如果链表长度 >= 树化阈值(8)，进行链表转为红黑树
                if (binCount >= TREEIFY_THRESHOLD)  
                    treeifyBin(tab, i);  
                if (oldVal != null)  
                    return oldVal;  
                break;  
            }  
        }  
    } 
    // 增加 size 计数
    addCount(1L, binCount);  
    return null;  
}

private final Node<K,V>[] initTable() {  
    Node<K,V>[] tab; int sc;  
    while ((tab = table) == null || tab.length == 0) {  
	    // sizeCtl小于0表示正在创建哈希表，所以当前线程会让出CPU使用权
        if ((sc = sizeCtl) < 0)  
            Thread.yield(); 
		// 尝试将 sizeCtl 设置为 -1（表示初始化 table）
        else if (U.compareAndSetInt(this, SIZECTL, sc, -1)) {  
	        // 获得锁，创建 table，这时其它线程会在 while()循环中 yield 直至 table 创建
            try {  
                if ((tab = table) == null || tab.length == 0) {  
                    int n = (sc > 0) ? sc : DEFAULT_CAPACITY;  
                    @SuppressWarnings("unchecked")  
                    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];  
                    table = tab = nt;  
                    sc = n - (n >>> 2);  
                }  
            } finally {  
                sizeCtl = sc;  
            }  
            break;  
        }  
    }  
    return tab;  
}

// x：增加数
// check：之前 bigCount 的个数
// addCount 方法和之前学习的 longAdd 类似，都是多线程进行累加
private final void addCount(long x, int check) {  
    CounterCell[] cs; long b, s;  
	// 如果有了 counterCells，向cell累加
    if ((cs = counterCells) != null ||  
	    // 如果还没有 counterCells，那么向 baseCount 累加
        !U.compareAndSetLong(this, BASECOUNT, b = baseCount, s = b + x)) {  
        CounterCell c; long v; int m;  
        boolean uncontended = true;  
        // 如果还没有 counterCells
        if (cs == null || (m = cs.length - 1) < 0 ||  
	        // 如果还没有 cell
            (c = cs[ThreadLocalRandom.getProbe() & m]) == null ||  
            // cell cas 增加计数失败
            !(uncontended =  
              U.compareAndSetLong(c, CELLVALUE, v = c.value, v + x))) {  
            // 创建累加单元数组和cell，累加重试
            fullAddCount(x, uncontended);  
            return;  
        }  
        if (check <= 1)  
            return;  
		// 获取元素个数
        s = sumCount();  
    }  
    if (check >= 0) {  
        Node<K,V>[] tab, nt; int n, sc;  
        while (s >= (long)(sc = sizeCtl) && (tab = table) != null &&  
               (n = tab.length) < MAXIMUM_CAPACITY) {  
            int rs = resizeStamp(n);  
            if (sc < 0) {  
                if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 ||  
                    sc == rs + MAX_RESIZERS || (nt = nextTable) == null ||  
                    transferIndex <= 0)  
                    break;  
				// 如果 newtable 已经创建，帮忙扩容
                if (U.compareAndSetInt(this, SIZECTL, sc, sc + 1))  
                    transfer(tab, nt);  
            }  
            // 需要扩容，这时 newtable 未创建
            else if (U.compareAndSetInt(this, SIZECTL, sc,  
                                         (rs << RESIZE_STAMP_SHIFT) + 2))  
                transfer(tab, null);  
            s = sumCount();  
        }  
    }  
}
```

#### size 计算流程

size 计算实际发生在 put，remove 改变集合元素的操作之中

- 没有竞争发生，向 baseCount 累加计数
- 有竞争发生，新建 counterCells，向其中的一个 cell 累加计数 counterCells 
	- 初始有两个 cell
	- 如果计数竞争比较激烈，会创建新的cell来累加计数

```java
public int size() {  
    long n = sumCount();  
    return ((n < 0L) ? 0 :  
            (n > (long)Integer.MAX_VALUE) ? Integer.MAX_VALUE :  
            (int)n);  
}

final long sumCount() {  
    CounterCell[] cs = counterCells;  
    long sum = baseCount;  
    if (cs != null) {  
	    // 将 baseCount 计数与所有 cell 计数累加
        for (CounterCell c : cs)  
            if (c != null)  
                sum += c.value;  
    }  
    return sum;  
}
```

```java
private final void transfer(Node<K,V>[] tab, Node<K,V>[] nextTab) {  
    int n = tab.length, stride;  
    if ((stride = (NCPU > 1) ? (n >>> 3) / NCPU : n) < MIN_TRANSFER_STRIDE)  
        stride = MIN_TRANSFER_STRIDE; // subdivide range
	// 如果新 table 为null，那就创建新的table
	if (nextTab == null) {
		try {  
		    @SuppressWarnings("unchecked")  
		    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n << 1];  
		    nextTab = nt;  
		} catch (Throwable ex) {      // try to cope with OOME  
		    sizeCtl = Integer.MAX_VALUE;  
		    return;  
		}  
		nextTable = nextTab;  
		transferIndex = n;
	}
	int nextn = nextTab.length;  
	ForwardingNode<K,V> fwd = new ForwardingNode<K,V>(nextTab);  
	boolean advance = true;  
	boolean finishing = false; // to ensure sweep before committing nextTab  
	// 开始搬迁节点
	for (int i = 0, bound = 0;;) {  
	    Node<K,V> f; int fh;
	    while (advance) {...}
	    if (i < 0 || i >= n || i + n >= nextn){...}
	    // 如果链表头是null，就说明该链表处理完了，将链表头变为ForwardingNode
	    else if ((f = tabAt(tab, i)) == null)  
		    advance = casTabAt(tab, i, null, fwd);  
		// 如果发现链表头是ForwardingNode，说明该链表已经处理完了，那就处理下一个链表
		else if ((fh = f.hash) == MOVED)  
		    advance = true; // already processed
		//  
		else {
			synchronized(f) {
				if (tabAt(tab, i) == f) {
					Node<K, V> ln, hn;
					// 如果节点 hash >= 0，说明是正常节点类型（链表），走正常的逻辑
					if (fh >= 0) {...}
					// 如果是数节点，那么就采用树节点的搬迁方式
					else if (f instance TreeBin) {...}
				}
			}
		}
	}
}
```


### LinkedBlockingQueue 原理

#### 结构

```java
public class LinkedBlockingQueue<E> extends AbstractQueue<E>  
        implements BlockingQueue<E>, java.io.Serializable {
	static class Node<E> {
		E item;

		/**
		  * 下列三种情况之一
		  * - 真正的后继节点
		  * - 自己，发生在出队时
		  * - null，表示没有后继节点，到底了
		/*
		Node<E> next;
	
		Node(E x) {item = x;}
	}
}
```

#### 基本的入队与出队

##### 入队

初始化链表 `last = head = new Node<E>(null)` ；Dummy 节点用来占位，item 为 null

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405140859.png)

当一个节点入队 `last = last.next = node;` 这个语句等同于 `last.next = node; last = last.next;`

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405141053.png)

再来一个节点入队 `last = last.next = node;`

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405141302.png)

##### 出队

```java
Node<E> h = head;
Node<E> first = h.next;
h.next = h;    // help GC
head = first;
E x = first.item;
first.item = null
return x;
```

**h = head**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405141549.png)

**first = h.next**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405141556.png)

**h.next = h**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405142335.png)

**head = first**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405141737.png)

**E x = first.item;**
**first.item = null**
**return x;**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405142255.png)

#### 加锁分析

**LinkedBlockingQueue 高明之处在于用了两把锁和 Dummy 节点**

- 用一把锁，同一时刻，最多只允许有一个线程(生产者或消费者，二选一)执行
- 用两把锁，同一时刻，可以允许两个线程同时(一个生产者与一个消费者)执行
	- 消费者与消费者线程仍然串行
	- 生产者与生产者线程仍然串行

**线程安全分析**

- 当节点总数大于2时(包括 dummy 节点), putLock保证的是 last 节点的线程安全，takeLock 保证的是 head 节点的线程安全。两把锁保证了入队和出队没有竞争
- 当节点总数等于2时(即一个 dummy 节点，一个正常节点)这时候，仍然是两把锁锁两个对象，不会竞争
- 当节点总数等于1时(就一个 dummy 节点)，这时 take 线程会被 notEmpty 条件阻塞，有竞争，会阻塞

```java
//用于put(阻塞)offer(非阻塞)
private final ReentrantLock putLock = new ReentrantLock();
//用户 take(阻塞)poll(非阻塞)
private final ReentrantLock takeLock = new ReentrantLock();
```

##### put 操作

```java
public void put(E e) throws InterruptedException {  
    if (e == null) throw new NullPointerException();  
    final int c;  
    final Node<E> node = new Node<E>(e);  
    final ReentrantLock putLock = this.putLock;  
    // count 用来维护元素个数
    final AtomicInteger count = this.count;  
    // 上 put 锁
    putLock.lockInterruptibly();  
    try {  
	    // 满了则等待
        while (count.get() == capacity) {  
			// 等待 notFull，满的时候等待
            notFull.await();  
        }  
        // 有空位，入队且计数+1
        enqueue(node);  
        // 这里c返回的是+1前的值
        c = count.getAndIncrement(); 
        // 除了自己 put 以外，队列还有空位，由自己叫醒其他 put 线程 
        if (c + 1 < capacity)  
            notFull.signal();  
    } finally {  
        putLock.unlock();  
    }  
    // 如果队列中有元素，那么激活 take 线程
    // 这边的c=0表示的是有1个元素
    if (c == 0)  
		// 这里调用的是 notEmpty.signal()而不是 notEmpty.signalAll() 是为了减少竞争
        signalNotEmpty();  
}
```

##### take 操作

```java
public E take() throws InterruptedException {  
    final E x;  
    final int c;  
    final AtomicInteger count = this.count;  
    final ReentrantLock takeLock = this.takeLock;  
    // 上 take 锁
    takeLock.lockInterruptibly();  
    try {  
	    // 如果没元素，那么等待
        while (count.get() == 0) {  
            notEmpty.await();  
        }  
        // 出队
        x = dequeue();  
        // count--，获得到的是减之前的值
        c = count.getAndDecrement();  
        if (c > 1)  
            notEmpty.signal();  
    } finally {  
        takeLock.unlock();  
    }  
    // 如果队列未满，激活 put 线程
    // 这边的 c == capacity 表示消费掉了1个元素
    // 如果有多个线程进行出队，那么第一个线程满足 c == capacity，后续线程 c < capacity
    if (c == capacity)  
        signalNotFull();  
    return x;  
}
```

#### LinkedBlockingQueue 与 ArrayBlockingQueue 的性能比较

- Linked 支持有界，Array 强制有界
- Linked 实现是链表，Array 实现是数组
- Linked 是懒惰的，而 Array 需要提前初始化 Node 数组
- Linked 每次入队会生成新 Node，而 Array的 Node 是提前创建好的 
- Linked 两把锁，Array 一把锁


### ConcurrentLinkedQueue 原理

ConcurrentLinkedQueue 的设计与 LinkedBlockingQueue 非常像，也是

- 两把锁，同一时刻，可以允许两个线程同时(一个生产者与一个消费者)执行
- dummy 节点的引入让两把锁将来锁住的是不同对象，避免竞争
- **只是这锁使用了 cas来实现**

事实上，ConcurrentLinkedQueue应用还是非常广泛的

例如之前讲的 Tomcat 的 Connector 结构时，Acceptor 作为生产者向 Poller 消费者传递事件信息时，正是采用了 ConcurrentLinkedQueue 将 SocketChannel 给 Poller 使用

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405145137.png)

### CopyOnWriteArrayList（JDK 11）

底层实现采用了 `写入时拷贝` 的思想，增删改操作会将底层数组拷贝一份，更改操作在新数组上执行，这时不影响其它线程的**并发读，读写分离**。

#### add 方法

```java
public boolean add(E e) {  
    synchronized (lock) {  
	    // 获取旧数组
        Object[] es = getArray();  
        int len = es.length;  
        // 拷贝新的数组（这里是比较耗时都操作，但不影响其他读线程）
        es = Arrays.copyOf(es, len + 1);  
        es[len] = e;  
        // 添加新元素
        setArray(es);  
        // 替换旧的数组
        return true;  
    }  
}
```

**其他操作并为加锁**

```java
public void forEach(Consumer<? super E> action) {  
    Objects.requireNonNull(action);  
    // 这边的 getArray() 是旧的数组，因为 add 还未做完修改，还没 setArray
    for (Object x : getArray()) {  
        @SuppressWarnings("unchecked") E e = (E) x;  
        action.accept(e);  
    }  
}
```

#### 使用场景

适合『读多写少』的应用场景

#### get 弱一致性

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405150227.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230405150242.png)

Thread-0 获取到旧的数组，当访问 1 元素的时候，由于元素1被删除了，所以会有问题

#### 迭代器弱一致性

```java
@Slf4j  
public class TestCopyOnWriteArrayList {  
  
    public static void main(String[] args) throws InterruptedException {  
        CopyOnWriteArrayList<Object> list = new CopyOnWriteArrayList<>();  
        list.add(1);  
        list.add(2);  
        list.add(3);  
        Iterator<Object> iterator = list.iterator();  
        new Thread(() -> {  
            list.remove(0);  
            System.out.println(list);  
        }, "t1").start();  
  
        TimeUnit.SECONDS.sleep(1);  
  
        while (iterator.hasNext()) {  
            System.out.println(iterator.next());  
        }  
    }  
}
```

```java
[2, 3]
1
2
3
```

发现线程t1删除了元素，其他线程依旧能访问到元素

>不要觉得弱一致性就不好
>- 数据库的MVCC都是弱一致性的表现
>- 并发高和一致性是矛盾的，需要权衡

# 多线程模式

## 同步模式之保护性暂停

### 定义

即 Guarded Suspension，用在一个线程等待另一个线程的执行结果

**要点**

- 有一个结果需要从一个线程传递到另一个线程，让他们关联同一个 GuardedObject 
- 如果有结果不断从一个线程到另一个线程那么可以使用消息队列（见生产者/消费者）
- JDK中 join 的实现、Future 的实现，采用的就是此模式
- 因为要等待另一方的结果，因此归类到同步模式

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321214909.png)

### 实现

```java
@Slf4j  
public class TestGuardedObject {  
  
    public static void main(String[] args) {  
        GuardedObject guardedObject = new GuardedObject();  
        // t1等待t2的执行  
        new Thread(() -> {  
            log.info("t1等待t2的返回结果");  
            List<String> response = ((List<String>) guardedObject.get());  
            log.info("t2执行完成，结果为大小为:{}", response.size());  
        }, "t1").start();  
  
        new Thread(() -> {  
            try {  
                TimeUnit.SECONDS.sleep(1);  
                List<String> res = download();  
                guardedObject.complete(res);  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } catch (IOException e) {  
                throw new RuntimeException(e);  
            }  
        }, "t2").start();  
    }  
  
    private static List<String> download() throws IOException {  
        URLConnection urlConnection = (HttpURLConnection) new URL("https://www.baidu.com/").openConnection();  
        List<String> lines = new ArrayList<>();  
        try(BufferedReader reader = new BufferedReader(new InputStreamReader(urlConnection.getInputStream(), StandardCharsets.UTF_8))) {  
            String line;  
            while ((line = reader.readLine()) != null) {  
                lines.add(line);  
            }  
        }  
        return lines;  
    }  
}  
  
@Slf4j  
class GuardedObject {  
    private static Object response;  
  
    // 获取结果  
    public Object get() {  
        synchronized (this) {  
            try {  
                while (response == null) {  
                    // 还未有结果  
                    log.info("正在等待结果...");  
                    this.wait();  
                }  
                return response;  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }  
    }  
  
    // 产生结果  
    public void complete(Object response) {  
        synchronized (this) {  
            this.response = response;  
            this.notifyAll();  
        }  
    }  
}
```

**输出结果**

```java
22:10:42.891 [t1] INFO com.duoduo.TestGuardedObject - t1等待t2的返回结果
22:10:42.894 [t1] INFO com.duoduo.GuardedObject - 正在等待结果...
22:10:44.305 [t1] INFO com.duoduo.TestGuardedObject - t2执行完成，结果为大小为:3
```

### 拓展1：带有超时时间的等待

```java
// 带有超时时间（毫秒级）的获取结果  
public Object get(long timeout) {  
    synchronized (this) {  
        long begin = System.currentTimeMillis();  
        try {  
            while (response == null) {  
                long costedTime = System.currentTimeMillis() - begin;  
                long waitTime = timeout - costedTime;  
                // 还未有结果  
                this.wait(waitTime);  
                // 如果花费时间大雨最大等待时间，那么退出  
                if (costedTime >= timeout) break;  
            }  
            return response;  
        } catch (InterruptedException e) {  
            throw new RuntimeException(e);  
        }  
    }  
}
```

### Thread.join() 原理

```java
public final synchronized void join(long millis)  throws InterruptedException {  
    long base = System.currentTimeMillis();  
    long now = 0;  

	// 最大等待时间小于0抛出异常
    if (millis < 0) {  
        throw new IllegalArgumentException("timeout value is negative");  
    }  

	// 最大等待时间等于0，那么一直等待
    if (millis == 0) {  
        while (isAlive()) {  
            wait(0);  
        }  

	// 最大等待时间大于0，那么就计算已经等待的时间，如果超时了就退出
    } else {  
        while (isAlive()) {  
            long delay = millis - now;  
            if (delay <= 0) {  
                break;  
            }  
            wait(delay);  
            now = System.currentTimeMillis() - base;  
        }  
    }  
}
```

### 拓展2

图中 Futures 就好比居民楼一层的信箱(每个信箱有房间编号)，左侧的t0，t2，t4就好比等待邮件的居民，右侧的t1，t3，t5就好比邮递员

如果需要在多个类之间使用 GuardedObject 对象，作为参数传递不是很方便，因此设计一个用来解耦的中间类这样不仅能够解耦 `结果等待者` 和 `结果生产者` ，还能够同时支持多个任务的管理

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321233630.png)

```java
/**  
 * @author lianwenda  
 * @description description  
 * @since 2023/3/21  
 */@Slf4j  
public class TestGuardedObject {  
  
    public static void main(String[] args) throws InterruptedException {  
        for (int i = 0; i < 3; i++) {  
            new People().start();  
        }  
        
        TimeUnit.SECONDS.sleep(1);  
  
        Set<Integer> ids = MailBoxes.getIds();  
        for (int id : ids) {  
            new Postman(id, "内容:" + id).start();  
        }  
    }  
}  
  
class MailBoxes {  
    private static Map<Integer, GuardedObject> boxes = new Hashtable<>();  
  
    private static int id = 0;  
  
    private static synchronized int generateId() {  
        return id++;  
    }  
  
    public static GuardedObject generateGuardedObject() {  
        GuardedObject guardedObject = new GuardedObject(generateId());  
        boxes.put(guardedObject.getId(), guardedObject);  
        return guardedObject;  
    }  
  
    public static Set<Integer> getIds() {  
        return boxes.keySet();  
    }  
  
    public static GuardedObject getGuardedObject(int id) {  
        GuardedObject guardedObject = boxes.get(id);  
        boxes.remove(id);  
        return guardedObject;  
    }  
  
}  
  
@Slf4j  
class People extends Thread {  
    @Override  
    public void run() {  
        GuardedObject guardedObject = MailBoxes.generateGuardedObject();  
        log.info("开始收信id:{}", guardedObject.getId());  
        Object o = guardedObject.get(5000);  
        log.info("收到信id:{}, 内容:{}", guardedObject.getId(), o);  
    }  
}  
  
@Slf4j  
class Postman extends Thread {  
  
    private int id;  
    private String mail;  
  
    public Postman(int id, String mail) {  
        this.id = id;  
        this.mail = mail;  
    }  
  
    @Override  
    public void run() {  
        GuardedObject guardedObject = MailBoxes.getGuardedObject(id);  
        log.info("送信id:{}, 内容为:{}", guardedObject.getId(), mail);  
        guardedObject.complete(mail);  
    }  
}  
  
@Slf4j  
@Getter  
class GuardedObject {  
  
    private int id;  
  
    private static Object response;  
  
    public GuardedObject(int id) {  
        this.id = id;  
    }  
  
    // 带有超时时间（毫秒级）的获取结果  
    public Object get(long timeout) {  
        synchronized (this) {  
            long begin = System.currentTimeMillis();  
            try {  
                while (response == null) {  
                    long costedTime = System.currentTimeMillis() - begin;  
                    long waitTime = timeout - costedTime;  
                    // 还未有结果  
                    this.wait(waitTime);  
                    // 如果花费时间大雨最大等待时间，那么退出  
                    if (costedTime >= timeout) break;  
                }  
                return response;  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }  
    }  
  
    // 产生结果  
    public void complete(Object response) {  
        synchronized (this) {  
            this.response = response;  
            this.notifyAll();  
        }  
    }  
}
```

**输出结果**

```java
23:34:44.591 [Thread-2] INFO com.duoduo.People - 开始收信id:2
23:34:44.591 [Thread-1] INFO com.duoduo.People - 开始收信id:1
23:34:44.591 [Thread-0] INFO com.duoduo.People - 开始收信id:0
23:34:45.607 [Thread-3] INFO com.duoduo.Postman - 送信id:2, 内容为:内容:2
23:34:45.607 [Thread-4] INFO com.duoduo.Postman - 送信id:1, 内容为:内容:1
23:34:45.607 [Thread-5] INFO com.duoduo.Postman - 送信id:0, 内容为:内容:0
23:34:45.607 [Thread-2] INFO com.duoduo.People - 收到信id:2, 内容:内容:1
23:34:45.607 [Thread-1] INFO com.duoduo.People - 收到信id:1, 内容:内容:1
23:34:45.608 [Thread-0] INFO com.duoduo.People - 收到信id:0, 内容:内容:0
```

## 异步模式之生产者/消费者

- 与前面的保护性暂停中的 GuardObject 不同，不需要产生结果和消费结果的线程一一对应
- 消费队列可以用来平衡生产和消费的线程资源
- 生产者仅负责产生结果数据，不关心数据该如何处理，而消费者专心处理结果数据
- 消息队列是有容量限制的，满时不会再加入数据，空时不会再消耗数据
- JDK 中各种阻塞队列，采用的就是这种模式

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230321233848.png)

### 实现

```java
@Slf4j  
public class TestPublicSub {  
  
    public static void main(String[] args) {  
        MessageQueue messageQueue = new MessageQueue(2);  
        for (int i = 0; i < 3; i++) {  
            int id = i;  
            new Thread(() -> {  
                try {  
                    messageQueue.put(new Message(id, "消息" + id));  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }, "生产者线程" + i).start();  
        }  
  
        new Thread(() -> {  
            try {  
                while(true) {  
                    TimeUnit.SECONDS.sleep(1);  
                    messageQueue.take();  
                }  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            }  
        }, "消费者").start();  
    }  
  
}  
  
// 消息队列类，用于线程间的通信  
@Slf4j  
class MessageQueue {  
  
    // 消息队列集合  
    private LinkedList<Message> queue = new LinkedList<>();  
  
    // 队列容量  
    private int capacity;  
  
    public MessageQueue(int capacity) {  
        this.capacity = capacity;  
    }  
  
    // 获取消息的方法  
    public Message take() throws InterruptedException {  
        synchronized (queue) {  
            while (queue.isEmpty()) {  
                log.info("消息队列为空，消费者正在等待生产者生产消息...");  
                queue.wait();  
            }  
            Message message = queue.removeFirst();  
            log.info("消费者消费数据{}:{}", message.getId(), message.getValue());  
            queue.notifyAll();  
            return message;  
        }  
    }  
  
    // 存入消息的方法  
    public void put(Message message) throws InterruptedException {  
        synchronized (queue) {  
            while (queue.size() == capacity) {  
                log.info("消息队列已满，生产者正在等待消费者消费消息");  
                queue.wait();  
            }  
            log.info("生产者塞入数据{}:{}", message.getId(), message.getValue());  
            queue.addLast(message);  
            queue.notifyAll();  
        }  
    }  
}  
  
@Getter  
@AllArgsConstructor  
class Message {  
    private int id;  
    private Object value;  
  
}
```

**输出结果**

```java
00:01:53.029 [生产者线程0] INFO com.duoduo.MessageQueue - 生产者塞入数据0:消息0
00:01:53.033 [生产者线程2] INFO com.duoduo.MessageQueue - 生产者塞入数据2:消息2
00:01:53.034 [生产者线程1] INFO com.duoduo.MessageQueue - 消息队列已满，生产者正在等待消费者消费消息
00:01:54.026 [消费者] INFO com.duoduo.MessageQueue - 消费者消费数据0:消息0
00:01:54.027 [生产者线程1] INFO com.duoduo.MessageQueue - 生产者塞入数据1:消息1
00:01:55.027 [消费者] INFO com.duoduo.MessageQueue - 消费者消费数据2:消息2
00:01:56.028 [消费者] INFO com.duoduo.MessageQueue - 消费者消费数据1:消息1
00:01:57.029 [消费者] INFO com.duoduo.MessageQueue - 消息队列为空，消费者正在等待生产者生产消息...
```

## 同步模式之顺序控制

### 固定运行顺序

#### wait & notify

```java
@Slf4j  
public class TestOrder {  
  
    static final Object lock = new Object();  
  
    // 表示t2是否运行过  
    static boolean t2Finished  = false;  
  
    public static void main(String[] args) throws InterruptedException {  
  
        new Thread(() -> {  
            synchronized (lock) {  
                while (!t2Finished) {  
                    try {  
                        lock.wait();  
                    } catch (InterruptedException e) {  
                        throw new RuntimeException(e);  
                    }  
                }  
                log.info("1");  
            }  
        }, "t1").start();  
  
        new Thread(() -> {  
            synchronized (lock) {  
                log.info("2");  
                t2Finished = true;  
                lock.notify();  
            }  
        }, "t2").start();  
    }  
  
}
```

**输出结果**

```java
00:10:52.677 [t2] INFO com.duoduo.TestOrder - 2
00:10:52.683 [t1] INFO com.duoduo.TestOrder - 1
```

#### ReentrantLock（await & signal）

```java
@Slf4j  
public class TestOrder {  
  
    static final ReentrantLock lock = new ReentrantLock();  
  
    static final Condition condition = lock.newCondition();  
  
    // 表示t2是否运行过  
    static boolean t2Finished  = false;  
  
    public static void main(String[] args) throws InterruptedException {  
  
        new Thread(() -> {  
            lock.lock();  
            try {  
                while (!t2Finished) {  
                    condition.await();  
                }  
                log.info("1");  
            } catch (InterruptedException e) {  
                throw new RuntimeException(e);  
            } finally {  
                lock.unlock();  
            }  
        }, "t1").start();  
  
        new Thread(() -> {  
            lock.lock();  
            try {  
                log.info("2");  
                t2Finished = true;  
                condition.signal();  
            } finally {  
                lock.unlock();  
            }  
        }, "t2").start();  
    }  
}
```

```java
00:46:41.905 [t2] INFO com.duoduo.TestOrder - 2
00:46:41.912 [t1] INFO com.duoduo.TestOrder - 1
```

#### park & unpark

```java
@Slf4j  
public class TestOrder {  
  
    // 表示t2是否运行过  
    public static void main(String[] args) throws InterruptedException {  
        Thread t1 = new Thread(() -> {  
            LockSupport.park();  
            log.info("1");  
        }, "t1");  
        t1.start();  
  
        new Thread(() -> {  
            log.info("2");  
            LockSupport.unpark(t1);  
        }, "t2").start();  
    }  
}
```

**输出结果**

```java
00:52:27.572 [t2] INFO com.duoduo.TestOrder - 2
00:52:27.576 [t1] INFO com.duoduo.TestOrder - 1
```

### 交替输出

#### synchronized

```java
@Slf4j  
public class TestOrder {  
  
    public static void main(String[] args) throws InterruptedException {  
        OrderPrint orderPrint = new OrderPrint("A", 3);  
  
        new Thread(() -> {  
            orderPrint.print("A", "B", "CONTENT-A");  
        }, "A").start();  
  
        new Thread(() -> {  
            orderPrint.print("B", "C", "CONTENT-B");  
        }, "B").start();  
  
        new Thread(() -> {  
            orderPrint.print("C", "A", "CONTENT-C");  
        }, "C").start();  
    }  
  
}  
  
@Slf4j  
class OrderPrint {  
  
    private String nextThreadName;  
    private int maxLoopCount;  
  
    public OrderPrint(String nextThreadName, int maxLoopCount) {  
        this.nextThreadName = nextThreadName;  
        this.maxLoopCount = maxLoopCount;  
    }  
  
    public void print(String currentThreadName, String nextThreadName, String content) {  
        for (int i = 0; i < maxLoopCount; i++) {  
            synchronized (this) {  
                while (!currentThreadName.equals(this.nextThreadName)) {  
                    try {  
                        this.wait();  
                    } catch (InterruptedException e) {  
                        throw new RuntimeException(e);  
                    }  
                }  
                log.info(content);  
                this.nextThreadName = nextThreadName;  
                this.notifyAll();  
            }  
        }  
    }  
}
```

**输出结果**

```java
14:34:48.145 [A] INFO com.duoduo.OrderPrint - CONTENT-A
14:34:48.150 [B] INFO com.duoduo.OrderPrint - CONTENT-B
14:34:48.150 [C] INFO com.duoduo.OrderPrint - CONTENT-C
14:34:48.150 [A] INFO com.duoduo.OrderPrint - CONTENT-A
14:34:48.150 [B] INFO com.duoduo.OrderPrint - CONTENT-B
14:34:48.150 [C] INFO com.duoduo.OrderPrint - CONTENT-C
14:34:48.150 [A] INFO com.duoduo.OrderPrint - CONTENT-A
14:34:48.150 [B] INFO com.duoduo.OrderPrint - CONTENT-B
14:34:48.150 [C] INFO com.duoduo.OrderPrint - CONTENT-C
```

#### await & signal

```java
@Slf4j  
public class TestOrderByAwait {  
  
    static final int maxLoopCount = 3;  
  
    public static void main(String[] args) throws InterruptedException {  
  
        ReentrantLock lock = new ReentrantLock();  
  
        Condition aCondition = lock.newCondition();  
        Condition bCondition = lock.newCondition();  
        Condition cCondition = lock.newCondition();  
          
        new Thread(() -> {  
            for (int i = 0; i < maxLoopCount; i++) {  
                lock.lock();  
                try {  
                    aCondition.await();  
                    log.info("CONTENT-A");  
                    bCondition.signal();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                } finally {  
                    lock.unlock();  
                }  
            }  
        }, "A").start();  
  
        new Thread(() -> {  
            for (int i = 0; i < maxLoopCount; i++) {  
                lock.lock();  
                try {  
                    bCondition.await();  
                    log.info("CONTENT-B");  
                    cCondition.signal();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                } finally {  
                    lock.unlock();  
                }  
            }  
        }, "B").start();  
  
        new Thread(() -> {  
            for (int i = 0; i < maxLoopCount; i++) {  
                lock.lock();  
                try {  
                    cCondition.await();  
                    log.info("CONTENT-C");  
                    aCondition.signal();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                } finally {  
                    lock.unlock();  
                }  
            }  
        }, "C").start();  
  
        lock.lock();  
        try {  
            aCondition.signal();  
        } finally {  
            lock.unlock();  
        }  
  
    }  
}
```

**输出结果**

```java
15:41:53.576 [A] INFO com.duoduo.TestOrderByAwait - CONTENT-A
15:41:53.581 [B] INFO com.duoduo.TestOrderByAwait - CONTENT-B
15:41:53.582 [C] INFO com.duoduo.TestOrderByAwait - CONTENT-C
15:41:53.582 [A] INFO com.duoduo.TestOrderByAwait - CONTENT-A
15:41:53.582 [B] INFO com.duoduo.TestOrderByAwait - CONTENT-B
15:41:53.582 [C] INFO com.duoduo.TestOrderByAwait - CONTENT-C
15:41:53.582 [A] INFO com.duoduo.TestOrderByAwait - CONTENT-A
15:41:53.582 [B] INFO com.duoduo.TestOrderByAwait - CONTENT-B
15:41:53.582 [C] INFO com.duoduo.TestOrderByAwait - CONTENT-C
```

#### park & unpark

```java
@Slf4j  
public class TestOrderPark {  
  
    private static final int maxLoopCount = 3;  
  
    static Thread a, b, c;  
  
    public static void main(String[] args) throws InterruptedException {  
  
        a = new Thread(() -> {  
            for (int i = 0; i < maxLoopCount; i++) {  
                LockSupport.park();  
                log.info("CONTENT-A");  
                LockSupport.unpark(b);  
            }  
        }, "A");  
  
        b = new Thread(() -> {  
            for (int i = 0; i < maxLoopCount; i++) {  
                LockSupport.park();  
                log.info("CONTENT-B");  
                LockSupport.unpark(c);  
            }  
        }, "B");  
  
        c = new Thread(() -> {  
            for (int i = 0; i < maxLoopCount; i++) {  
                LockSupport.park();  
                log.info("CONTENT-C");  
                LockSupport.unpark(a);  
            }  
        }, "C");  
  
        a.start();  
        b.start();  
        c.start();  
  
        LockSupport.unpark(a);  
  
    }  
}
```

**输出结果**

```java
08:41:10.590 [A] INFO com.duoduo.TestOrderPark - CONTENT-A
08:41:10.595 [B] INFO com.duoduo.TestOrderPark - CONTENT-B
08:41:10.596 [C] INFO com.duoduo.TestOrderPark - CONTENT-C
08:41:10.596 [A] INFO com.duoduo.TestOrderPark - CONTENT-A
08:41:10.596 [B] INFO com.duoduo.TestOrderPark - CONTENT-B
08:41:10.596 [C] INFO com.duoduo.TestOrderPark - CONTENT-C
08:41:10.596 [A] INFO com.duoduo.TestOrderPark - CONTENT-A
08:41:10.596 [B] INFO com.duoduo.TestOrderPark - CONTENT-B
08:41:10.596 [C] INFO com.duoduo.TestOrderPark - CONTENT-C
```


## 终止模式之两阶段终止模式（Two Phase Termination）

### 如何优雅的终止一个线程的运行？

在一个线程T1中如何**优雅**终止线程T2？

这里的**优雅**指的是给T2一个料理后事的机会。

### 错误的思路

**stop()**

使用线程对象的 stop() 方法停止线程。

stop方法会真正杀死线程，如果这时线程锁住了共享资源，那么当它被杀死后就再也没有机会释放锁， 其它线程将永远无法获取锁。

**System.exit(int)**

使用 System.exit(int) 方法停止线程

目的仅是停止一个线程，但这种做法会让整个程序都停止。

### 正确思路（volatile）

```java
@Slf4j  
public class TestThreadVisibility {  
  
    static volatile boolean stop = false;  
  
    public static void main(String[] args) throws InterruptedException {  
        Thread a = new Thread(() -> {  
            while (!stop) {  
                log.info("running...");  
            }  
            log.info("料理后事");  
        }, "A");  
        a.start();  
  
        Thread.sleep(1);  
  
        stop = true;  
    }  
}
```

```java
10:13:36.812 [A] INFO com.duoduo.TestThreadVisibility - running...
10:13:36.817 [A] INFO com.duoduo.TestThreadVisibility - 料理后事
```

## 同步模式之 Balking

Balking(犹豫) 模式用在一个线程发现另一个线程或本线程已经做了某一件相同的事，那么本线程就无需再做了，直接结束返回。

```java
@Slf4j  
public class TestThreadVisibility {  
  
    public static void main(String[] args) throws InterruptedException {  
  
        Monitor monitorA = new Monitor("MONITOR-A");  
        // 生成2个监视线程，但是只有1个发挥作用，拒绝一直产生新的线程
        monitorA.start();  
        monitorA.start();  
        Monitor monitorB = new Monitor("MONITOR-B");  
        monitorB.start();  
  
    }  
}  
  
@Slf4j  
class Monitor {  
  
    private String name;  
	// 注意使用volatile保证该变量可见
    private volatile boolean hasStart = false;  
  
    public Monitor(String name) {  
        this.name = name;  
    }  
  
    public void start() {  
	    // 注意加锁，为了防止高并发情况下，多个线程同时进来，但是还未进行hasStart = true的赋值，导致照样会生成多个线程
        synchronized (this) {  
            if (hasStart) return;  
            hasStart = true;  
        }  
        new Thread(() -> {  
            while (true) {  
                log.info("监控中...");  
                try {  
                    TimeUnit.SECONDS.sleep(1);  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                }  
            }  
        }, name).start();  
    }  
}
```



## 异步模式之工作线程

### 1 定义

让有限的工作线程（Worker Thread）来轮流异步处理无限多的任务。也可以将其归类为分工模式，它的典型实现就是线程池，也体现了经典设计模式中的[[#模式之享元|享元模式]]。

例如，海底捞的服务员（线程），轮流处理每位客人的点餐（任务），如果为每位客人都配一名专属的服务员，那么成本就太高了

>对比另一种多线程设计模式：Thread-Per-Message(来一个消息就创建一个线程)

注意，不同任务类型应该使用不同的线程池，这样能够避免饥饿，并能提升效率

例如，如果一个餐馆的工人既要招呼客人（任务类型A），又要到后厨做菜（任务类型B）显然效率不咋地，分成服务员（线程池A）与厨师（线程池B）更为合理，当然你能想到更细致的分工

### 2 饥饿

固定大小线程池会有饥饿现象

两个工人是同一个线程池中的两个线程，他们要做的事情是：为客人点餐和到后厨做菜，这是两个阶段的工作。

客人点餐：必须先点完餐，等菜做好，上菜，在此期间处理点餐的工人必须等待，
后厨做菜：没啥说的，做就是了。

比如工人A处理了点餐任务，接下来它要等着工人B把菜做好，然后上菜，他俩也配合的蛮好，但现在同时来了两个客人，这个时候工人A和工人B都去处理点餐了，这时没人做饭了，发生了饥饿

```java
@Slf4j  
public class TestHungry {  
  
    public static void main(String[] args) {  
        ExecutorService pool = Executors.newFixedThreadPool(2);  
        eat(pool, "宫保鸡丁");  
        eat(pool, "烤串");  
  
    }  
  
    private static void eat(ExecutorService pool, String food) {  
        pool.execute(() -> {  
            log.info("处理点餐");  
            Future<String> cooking1 = pool.submit(() -> {  
                log.info("处理做菜");  
                return food;  
            });  
            try {  
                log.info("做菜完毕！{}", cooking1.get());  
            } catch (InterruptedException | ExecutionException e) {  
                throw new RuntimeException(e);  
            }  
        });  
    }  
}
```

**输出结果**

```java
22:40:39.768 [pool-1-thread-1] INFO com.duoduo.TestHungry - 处理点餐
22:40:39.768 [pool-1-thread-2] INFO com.duoduo.TestHungry - 处理点餐
```

由于线程数不足，所以会导致饥饿的发生

### 3 解决饥饿

不同类型的线程采用不同的线程池！厨师一个线程池，点餐人员一个线程池

```java
22:53:56.025 [pool-1-thread-1] INFO com.duoduo.TestHungry - 处理点餐
22:53:56.046 [pool-2-thread-1] INFO com.duoduo.TestHungry - 处理做菜
22:53:56.047 [pool-1-thread-1] INFO com.duoduo.TestHungry - 做菜完毕！宫保鸡丁
22:53:56.049 [pool-1-thread-1] INFO com.duoduo.TestHungry - 处理点餐
22:53:56.049 [pool-2-thread-1] INFO com.duoduo.TestHungry - 处理做菜
22:53:56.049 [pool-1-thread-1] INFO com.duoduo.TestHungry - 做菜完毕！烤串
```

### 4 创建多大的线程池合适？

- 过小会导致程序不能充分地利用系统资源、容易导致饥饿
- 过大会导致更多的线程上下文切换，占用更多内存

#### 1 CPU 密集型运算

如果应用程序做数据分析，要占用大多数的CPU

通常采用cpu核数+1能够实现最优的 CPU 利用率，+1是保证当线程由于页缺失故障（操作系统）或其它原因导致暂停时，额外的这个线程就能顶上去，保证CPU时钟周期不被浪费

#### 2 I/O 密集型运算

CPU不总是处于繁忙状态，例如，当你执行业务计算时，这时候会使用CPU资源，但当你执行IO操作时、 远程RPC调用时，包括进行数据库操作时，这时候CPU就闲下来了，你可以利用多线程提高它的利用率。

经验公式如下

`线程数＝核数 * 期望 CPU 利用率 * 总时间(CPU计算时间+等待时间）/ CPU 计算时间`

例如4核CPU计算时间是50%，其它等待时间是50%，期望cpu被100%利用，套用公式

`4 * 100% * 100% / 50% = 8`

例如4核CPU计算时间是10%，其它等待时间是 90%，期望cpu被100%利用，套用公式

`4 * 100% * 100% / 10% = 40`

# 附录

## 1 park()

^4eaca8

### park() 与 unpark()

^0bc5ab

#### park() / unpark() 实现的伪代码

```java
park() {
    if(permit > 0) {
        permit = 0;
        return;
    }

    if(中断状态 == true) {
        return;
    }

    阻塞当前线程;  // 将来会从这里被唤醒

    if(permit > 0) {
        permit = 0;
    }
}
```

可见，只要 `permit` 为1或者 `中断状态` 为true，那么执行 `park` 就不能够阻塞线程。`park` 只可能消耗掉 `permit` ，但不会去消耗掉`中断状态`。

```java
unpark(Thread thread) {
    if(permit < 1) {
        permit = 1;
        if(thread处于阻塞状态)
            唤醒线程thread;
    }
}
```

`unpark` 一定会将 `permit` 置为1，如果线程阻塞，再将其唤醒。从实现可见，无论调用几次`unpark`，`permit`只能为1。

#### park/unpark的实验

```java
public class test3 {
    public static void main(String[] args) throws InterruptedException {
        LockSupport.park();  //因为此时permit为0且中断状态为false，所以阻塞
    }
}
```

上面程序执行后，程序不会运行结束，main线程阻塞。  
原因是，线程默认的 `permit` 是0，`中断状态` 为false，所以会 `阻塞当前线程` 。

上面程序执行后，程序运行结束。  
原因是 `LockSupport.unpark(Thread.currentThread())` 执行后，会使得main线程的 `permit` 为1。而 `park` 时发现这个 `permit` 为1时，就会消耗掉这个 `permit` ，然后直接返回，所以main线程没有阻塞。

```java
public class test3 {
    public static void main(String[] args) throws InterruptedException {
        LockSupport.unpark(Thread.currentThread());
        LockSupport.park();  //消耗掉permit后，直接返回了
        LockSupport.park();  //此时permit为0，中断状态为false，必然会阻塞
    }
}
```

上面程序执行后，程序不会运行结束，main线程阻塞。  
原因是第二次 `park` 时，`permit` 为0了，中断状态为false，所以会 `阻塞当前线程`。

```java
public class test3 {
    public static void main(String[] args){
        Thread main = Thread.currentThread();
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("子线程开始睡觉");
                try {
                    Thread.sleep(1000);//睡一下保证是在main线程park后，才去unpark main线程
                } catch (InterruptedException e) {
                    System.out.println(Thread.currentThread().getName()+"抛出了中断异常");
                }
                System.out.println("子线程睡醒了，开始unpark main线程");
                LockSupport.unpark(main);
            }
        }).start();

        LockSupport.park();  //此时permit为0，中断状态为false，必然会阻塞
        //被子线程unpark后，从上一句被唤醒，继续执行。此时permit还是为0，中断状态为false。
        LockSupport.park();  //此时permit为0，中断状态为false，必然会阻塞
    }
}
```

上面程序执行后，程序不会运行结束，main线程阻塞。  
这个程序同上，只是之前的版本都是先 `unpark` ，再 `park` 。现在保证是，main线程先 `park` 后，再去 `unpark` main线程。

### interrupt() 与 park()

#### interrupt() 实现的伪代码

```java
interrupt(){
    if(中断状态 == false) {
        中断状态 = true;
    }
    unpark(this);    //注意这是Thread的成员方法，所以我们可以通过this获得Thread对象
}
```

`interrupt()` 会设置 `中断状态` 为true。注意， `interrupt()` 还会去调用 `unpark` 的，所以也会把 `permit` 置为1的。

#### interrupt()实验

```java
public class test3 {
    public static void main(String[] args) throws InterruptedException {
        Thread.currentThread().interrupt();
        LockSupport.park();  //消耗掉permit后，直接返回了
    }
}
```

上面程序执行后，程序运行结束。因为 `park` 执行时 `permit` 为1，直接返回了。

```java
public class test3 {
    public static void main(String[] args) throws InterruptedException {
        Thread.currentThread().interrupt();
        LockSupport.park();  //消耗掉permit后，直接返回了
        LockSupport.park();  //因为中断状态 == true，直接返回了
        LockSupport.park();  //同上
    }
}
```

上面程序执行后，程序运行结束。马上无论怎么 `park` 都无法阻塞线程了，因为此时线程的 `中断状态` 为true，函数直接返回了。

```java
public class test3 {
    public static void main(String[] args) throws InterruptedException {
        Thread main = Thread.currentThread();
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("马上开始睡觉");
                try {
                    Thread.sleep(1000);//睡一下保证是在main线程阻塞后，才去中断main线程
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("睡醒了，开始中断main线程");
                main.interrupt();
            }
        }).start();

        LockSupport.park();  //此时permit为0，中断状态为false，必然会阻塞
        //被子线程中断后，从上一句被唤醒，继续执行。此时permit为0，中断状态为true。
        LockSupport.park();  //因为中断状态 == true，直接返回了
        LockSupport.park();  //同上
    }
}
```

## 2 Monitor 上锁 / 释放锁过程分析

java.lang.Object 类定义了 wait()，notify()，notifyAll() 方法。 这些都是 native方法，底层是C++来实现的。 这些方法的具体实现，依赖一个叫做ObjectMonitor模式实现，这是JVM内部C++实现的机制。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318151422.png)

```
_owner：指向持有ObjectMonitor对象的线程地址。

_WaitSet：存放调用wait方法，而进入等待状态的线程的队列。

_EntryList：这里是等待锁block状态的线程的队列。

_recursions：锁的重入次数。

_count：线程获取锁的次数。
```

**上锁过程**

1. 线程获取资源对象的锁，判断 `_owner` 是否为空。这里操作是通过 CAS操作：比较和交换（Conmpare And Swap），比较新值和旧值的不同，替换。
2. 如果 `_owner` 为null ，直接把其赋值，指向自己， `_owner` = self ,同时把重入次数 `_recursions` = 1， 获取锁成功。
3. 如果 `_self` == cur 和当前线程一致，说明是重入了， `_recursions`++ 即可
4. 线程进入对象资源，处理。 同时等待当前线程的释放信号，期间一致持有对象资源的锁。

**释放锁过程**

1. 通过 ObjectMonitor::exit 退出
2. 把线程插入到_EntryList中 `_recursions--`
3. 再次从 `_EntryList` 中取出线程
4. 调用unpark退出

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230318152144.png)

>具体代码参考 objectMonitor.cpp

## 3 CPU执行指令

### 鱼罐头的故事

加工一条鱼需要50分钟，只能一条鱼、一条鱼顺序加工...

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325155700.png)

可以将每个鱼罐头的加工流程细分为5个步骤:

- 去鳞清洗10分钟
- 蒸煮沥水10分钟
- 加注汤料10分钟
- 杀菌出锅10分钟
- 真空封罐10分钟

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325155832.png)

即使只有一个工人，最理想的情况是：他能够在10分钟内同时做好这5件事，因为对第一条鱼的真空装罐，不会影响对第二条鱼的杀菌出锅... 

### CPU指令重排优化

事实上，现代处理器会设计为一个时钟周期完成一条执行时间最长的 CPU 指令。

为什么这么做呢？可以想到指令还可以再划分成一个个更小的阶段，例如，每条指令都可以分为：`取指令 -> 指令译码 -> 执行指令 -> 内存访问 -> 数据写回` 这5个阶段

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325160109.png)

>术语

- instruction fetch (IF) 
- instruction decode (ID) 
- еxecute (EX)
- memory access (MEM) 
- register write back (WB)

在不改变程序结果的前提下，这些指令的各个阶段可以通过**重排序**和**组合**来实现**指令级并行**，这一技术在80年代中叶到90年代中叶占据了计算架构的重要地位。

>分阶段，分工是提升效率的关键！

指令重排的前提是，重排指令不能影响结果，例如

```java
//可以重排的例子
int a = 10; // 指令1
int b= 20; //指令2
System.out.println( a + b);

//不能重排的例子
int a = 10;    //指令1 
int b=a - 5;  //指令2
```

### 支持流水线的处理器

现代 CPU 支持**多级指令流水线**，例如支持同时执行 `取指令 -> 指令译码 -> 执行指令 -> 内存访问 -> 数据写回` 的处理器，就可以称之为**五级指令流水线**。这时CPU可以在一个时钟周期内，同时运行五条指令的不同阶段 (相当于一条执行时间最长的复杂指令)，IPC=1，本质上，流水线技术并不能缩短单条指令的执行时间， 但它变相地提高了指令地吞吐率。

>奔腾四（Pentium 4) 支持高达35级流水线，但由于功耗太高被废弃

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230325160521.png)



## 4 GOF-享元模式

### 定义

**英文名称**

`Flyweight patternt` 适用于当需要重用数量有限的同一类对象时

**出自**

`"Gang of Four" design patterns`

### 体现

#### 包装类

在 JDK 中 Boolean，Byte，Short，Integer，Long，Character 等包装类提供了 valueOf 方法，例如 Long 的 valueOf 会缓存 -128~127 之间的 Long 对象，在这个范围之间会重用对象，大于这个范围，才会新建 Long 对象：

**Long.valueOf(long l)**

```java
public static Long valueOf(long l) {  
    final int offset = 128;  
    if (l >= -128 && l <= 127) { // will cache  
        return LongCache.cache[(int)l + offset];  
    }  
    return new Long(l);  
}
```

**Long.LongCache**

Long.LongCache 在 Long 类初始化加载的时候就分配了256个Long对象，用于后面直接使用

```java
private static class LongCache {  
    private LongCache(){}  
  
    static final Long cache[] = new Long[-(-128) + 127 + 1];  
  
    static {  
        for(int i = 0; i < cache.length; i++)  
            cache[i] = new Long(i - 128);  
    }  
}
```

>注意
>
>Byte, Short, Long缓存的范围都是-128~127
>
>Character缓存的范围是0~127
>
>Integer的默认范围是-128~127，最小值不能变，但最大值可以通过调整虚拟机参数 `-Djava.lang.Integer.IntegerCache.high` 来改变
>
>Boolean缓存了 TRUE 和 FALSE

#### String串池

#### BigDecimal BigInteger

### 自定义实现简易数据库连接池

例如:一个线上商城应用，QPS达到数干，如果每次都重新创建和关闭数据库连接，性能会受到极大影响。这时预先创建好一批连接，放入连接池。一次请求到达后，从连接池获取连接，使用完毕后再还回连接池，这样既节约了连接的创建和关闭时间，也实现了连接的重用，不至于让庞大的连接数压垮数据库。

```java
public class TestPool {  
  
    public static void main(String[] args) {  
        Pool pool = new Pool(2);  
        for (int i = 0; i < 5; i++) {  
            new Thread(() -> {  
               Connection conn = null;  
                try {  
                    conn = pool.getConnection();  
                } catch (InterruptedException e) {  
                    throw new RuntimeException(e);  
                } finally {  
                    pool.freeConnection(conn);  
                }  
            }, i + "").start();  
        }  
    }  
  
}  
  
@Slf4j  
class Pool {  
  
    // 1. 连接池大小  
    private final int poolSize;  
  
    // 2. 连接对象数组  
    private Connection[] connections;  
  
    // 3. 连接状态数组，0：表示空闲，1：表示繁忙  
    private AtomicIntegerArray status;  
  
    // 4. 进行属性的初始化  
    public Pool(int poolSize) {  
        this.poolSize = poolSize;  
        connections = new Connection[poolSize];  
        this.status = new AtomicIntegerArray(new int[poolSize]);  
        for (int i = 0; i < poolSize; i++) {
            connections[i] = new MockConnection("[CONNECTION-]" + i);  
        }  
    }  
  
    // 创建连接  
    public Connection getConnection() throws InterruptedException {  
        // 由于 status.get(i) 在字节码中是多个指令，所以不是原子的，多线程下会有问题  
        // 所以使用 while(true)        
        while (true) {  
            for (int i = 0; i < poolSize; i++) {  
                if (status.get(i) == 0) {  
                    if (status.compareAndSet(i, 0, 1)) {  
                        log.info("成功获取连接");  
                        return connections[i];  
                    }  
                }  
            }  
            // 如果没有空闲连接，让当前线程进入等待  
            synchronized (this) {  
                log.info("未获取到连接，进入等待");  
                this.wait();  
            }  
        }  
    }  

    // 归还连接  
    public void freeConnection(Connection conn) {
        for (int i = 0; i < poolSize; i++) { 
            if (connections[i] == conn) {
                // 由于释放连接一定拥有对这线程的使用权  
                status.set(i, 0);
                synchronized (this) {
                    log.info("归还连接{}", connections[i]);
                    this.notifyAll();
                }
                break;  
            }  
        }  
    }  
}

class MockConnection implements Connection {

	private String name;

	public MockConnection(String name) {  
	    this.name = name;  
	}

	// 这里省略了Connection接口实现（不影响代码运行）

	@Override  
	public String toString() {  
	    return "MockConnection{" +  
	            "name='" + name + '\'' +  
	            '}';  
	}

}
```

**输出结果**

```java
18:37:38.401 [0] INFO com.duoduo.Pool - 成功获取连接
18:37:38.401 [2] INFO com.duoduo.Pool - 成功获取连接
18:37:38.401 [1] INFO com.duoduo.Pool - 未获取到连接，进入等待
18:37:38.406 [2] INFO com.duoduo.Pool - 归还连接MockConnection{name='[CONNECTION-]1'}
18:37:38.419 [0] INFO com.duoduo.Pool - 归还连接MockConnection{name='[CONNECTION-]0'}
18:37:38.419 [4] INFO com.duoduo.Pool - 未获取到连接，进入等待
18:37:38.419 [3] INFO com.duoduo.Pool - 未获取到连接，进入等待
18:37:38.419 [1] INFO com.duoduo.Pool - 成功获取连接
18:37:38.419 [1] INFO com.duoduo.Pool - 归还连接MockConnection{name='[CONNECTION-]0'}
18:37:38.419 [3] INFO com.duoduo.Pool - 成功获取连接
18:37:38.419 [4] INFO com.duoduo.Pool - 成功获取连接
18:37:38.420 [3] INFO com.duoduo.Pool - 归还连接MockConnection{name='[CONNECTION-]1'}
18:37:38.420 [4] INFO com.duoduo.Pool - 归还连接MockConnection{name='[CONNECTION-]0'}
```

**以上实现没有考虑到的地方：**

- 连接到动态增长与收缩
- 连接保活（可用性检测）
- 等待超时处理
- 分布式hash

>对于关系型数据库，有比较成熟的连接池实现，例如 `c3p0` ，`druid` 等
>
>对于更通用的对象池，可以考虑使用 `apache commons pool`，例如 redis 连接池可以参考 jedis 中关于连接池的实现


如果加锁成功(没有竞争)，会设置
exclusiveOwnerThread为 Thread-1, state = 1
head指向刚刚Thread-1所在的Node，该Node 清空Thread 原本的head因为从链表断开，而可被垃圾回收
如果这时候有其它线程来竞争(非公平的体现)，例如这时有Thread-4来了
