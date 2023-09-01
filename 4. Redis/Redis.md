#Redis 

# 1. Redis 10大数据类型（待补充）

## 1. String

## 1.2 Bitmap

## 1.3 Bitfield

## 1.4 Hash

## 1.5 List

## 1.6.Set

## 1.7 Sorted Set

## 1.8 Geospatial

## 1.9 Hyperlog

## 1.10 Stream

## 一览

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228093515.png)

# 2 Redis持久化

## 2.1 RDB（Redis Database）

### 2.1.1 是什么？

RDB 持久性以指定的时间间隔执行数据集的时间点快照。实现类似照片记录效果的方式，就是把某一时刻的数据和状态以文件的形式写到磁盘上，也就是快照。这样一来即使故障宕机，快照文件也不会丢失，数据的可靠性也就得到了保证。这个快照文件就称为RDB文件(dump.rdb)，其中，RDB就是Redis DataBase的缩写。

### 2.1.2 能干嘛？

在指定的时间间隔内将内存中的数据集快照写入磁盘，也就是行话讲的Snapshot内存快照，它恢复时再将硬盘快照文件直接读回到内存里。
Redis的数据都在内存中，保存备份时它执行的是全量快照 ， 也就是说，把内存中的所有数据都记录到磁盘中。

>RDB保存的是 `dump.rdb` 文件

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228100005.png)

### 2.1.3 Redis6 VS Redis7

**Redis 6**

在 Redis.conf 配置文件中的 SNAPSHOTTING 下配置 save 参数，来触发 Redis 的 RDB 持久化条件，比如 `save m n`：表示m秒内数据集存在n次修改时，自动触发bgsave
- save 900 1：每隔900s(15min)，如果有超过1个key发生了变化，就写一份新的 RDB 文件
- save 300 10：每隔300s(5min)，如果有超过10个key发生了变化，就写一份新的RDB 文件
- save 60 10000：每隔60s(1min)，如果有超过10000个key发生了变化，就写一份新的RDB 文件
>只要满足其中一个条件，会自动触发bgsave，例如已经有超过10个key发生了变化，不论是否隔了300s，那么就会触发bgsave

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228100541.png)

**Redis 7**

出场自带默认的设置
- 每隔3600s，如果有超过1个key发生了变化，就写一份新的 RDB 文件
- 每隔300s，如果有超过100个key发生了变化，就写一份新的 RDB 文件
- 每隔60s，如果有超过10000个key发生了变化，就写一份新的 RDB 文件

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228100637.png)

### 2.1.4 触发方式

#### 2.1.4.1 自动触发 RDB

1. 设置 `save <seconds> <changes>`

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228135030.png)

2. 修改dump文件保存路径

>建议：==不要放在同目录==，防止dump文件损坏，因为flushdb或者其他命令可能会覆盖dump文件，导致无法恢复

3. 修改dum文件名

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228135423.png)

4. 触发备份

在5s内更新2笔数据后，发现配置文件中指定的dump路径下生成dump文件。（即使在5s外，只要更新了2笔，也会生成dump文件）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228135549.png)

5. 数据恢复

重启服务器，Redis会自动读取dump文件进行数据的恢复。
==注意：确保dump文件是无误完整的==

#### 2.1.4.2 手动触发 RDB

##### save

在主程序中执行会==阻塞==当前redis服务器，直到持久化工作完成执行save命令期间，Redis不能处理其他命令，==线上禁止使用。==

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228140208.png)

##### bgsave（默认）

Redis会在后台异步进行快照操作，==不阻塞==快照同时还可以响应客户端请求，该触发方式会fork一个子进程由子进程复制持久化过程。Redis会使用bgsave对当前内存中的所有数据做快照，这个操作是子进程在后台完成的，这就允许主进程同时可以修改数据。

>fork：在Linux程序中，fork()会产生一个和父进程完全相同的子进程，但子进程在此后多会exec系统调用，出于效率考虑，尽量避免膨胀。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228140525.png)

#### 2.1.4.3 LASTSAVE

可以通过 lastsave 命令获取最后一次成功执行快照的时间

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228141124.png)

### 2.1.5 RDB 优点

- 适合大规模的数据恢复
- 按照业务定时备份
- 对数据完整性和一致性要求不高
- RDB 文件在内存中的加载速度要比 AOF 快得多

### 2.1.6 RDB 缺点

- 在一定间隔时间做一次备份，所以如果redis意外down掉的话，就会丢失从当前至最近一次快照期间的数据，==快照之间的数据会丢失==
- 内存数据的全量同步，如果数据量太大会导致I/O严重影响服务器性能
- RDB依赖于主进程的fork，在更大的数据集中，这可能会导致服务请求的瞬间延迟。 fork的时候内存中的数据被克隆了一份，大致2倍的膨胀性，需要考虑。

### 2.1.7 如何修复 dump.rdb 文件

```bash
redis-check-rdb dump6379.rdb
```

### 2.1.8 哪些情况会触发 RDB 文件

- 配置文件中默认的快照配置
- 手动save/bgsave命令
- 执行 flushall/flushdb 命令也会产生 dump.rdb 文件，但里面是空的，无意义执行 shutdown 且没有设置开启 AOF 持久化
- 主从复制时，主节点自动触发

### 2.1.9 如何禁用快照

#### 方式一：命令

```bash
redis-cli config set save ""
```

#### 方式二：配置文件

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230228142338.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228142415.png)

### 2.1.10 RDB优化配置项详解

- `save ＜seconds> <changes>`
- dbfilename
- dir
- stop-writes-on-bgsave-error（默认yes）：如果配置成no，表示你不在乎数据不一致或者有其他的手段发现和控制这种不一致，那么在快照写入失败时，也能确保redis继续接受新的写请求。
- rdbcompression（默认yes）：对于存储到磁盘中的快照，可以设置是否进行压缩存储。如果是的话，redis会采用LZF算法进行压缩。  
如果你不想消耗CPU来进行压缩的话，可以设置为关闭此功能
- rdbchecksum（默认yes）：在存储快照后，还可以让redis使用CRC64算法来进行数据校验，但是这样做会增加大约10%的性能消耗，如果希望获取到最大的性能提升，可以关闭此功能
- rdb-del-sync-files：在没有持久性的情况下删除复制中使用的RDB文件启用。默认情况下no，此选项是禁用的。

### 2.1. 11 总结

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230228143028.png)

## 2.2 AOF（Append Only File）

### 2.2.1 是什么？

以日志的形式来记录每个写操作，将Redis执行过的所有写指令记录下来(读操作不记录)，只许追加文件但不可以改写文件，redis启动之初会读取该文件重新构建数据，换言之，redis重启的话就根据日志文件的内容将写指令从前到后执行一次以完成数据的恢复工作。

默认情况下， 以日志的形式来记录每个写操作，将Redis执行过的所有写指令记录下来(读操作不记录)，只许追加文件但不可以改写文件，redis启动之初会读取该文件重新构建数据，换言之，redis重启的话就根据日志文件的内容将写指令从前到后执行一次以完成数据的恢复工作。

默认情况下， redis 是没有开启AOF(append only file)的。
开启AOF功能需要设置配置：`appendonly yes`

>AOF 保存的文件为 appendonly.aof 文件

### 2.2.2 AOF 持久化工作流程

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228143728.png)

1. Client作为命令的来源，会有多个源头以及源源不断的请求命令。
2. 在这些命令到达Redis Server以后并不是直接写入AOF文件，会将其这些命令先放入AOF缓存中进行保存。这里的AOF缓冲区实际上是内存中的一片区域，存在的目的是当这些命令达到一定量以后再写入磁盘，避免频繁的磁盘IO操作。
3. AOF缓冲会根据AOF缓冲区**同步文件的三种写回策略**将命令写入磁盘上的AOF文件。
4. 随着写入AOF内容的增加为避免文件膨胀，会根据规则进行命令的合并(又称**AOF重写**），从而起到AOF文件压缩的目的。

### 2.2.3 三种写回策略

#### Always

同步写回，每个写命令执行完立刻同步地将日志写回磁盘

#### everysec

每秒写回，每个写命令执行完，只是先把日志写到AOF文件的内存缓冲区，每隔1秒把缓冲区中的内容写入磁盘

#### no

操作系统控制的写回，每个写命令执行完，只是先把日志写到AOF文件的内存缓冲区，由操作系统决定何时将缓冲区内容写回磁盘

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228172448.png)

### 2.2.4 AOF 配置

#### 2.2.4.1 如何开启 AOF

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228194238.png)

#### 2.2.4.2 配置写回策略

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228194354.png)

#### 2.2.4.3 配置保存路径

**Redis 6**

Redis6 以及 Redis6 以前 AOF 保存文件的位置和 RDB 保存文件的位置一样，都是通过 redis.conf 配置文件的 dir 配置

**Redis 7**

Redis7之后，redis.conf中有一个配置为 appenddirname，这个属性用来配置 AOF 的路径，最终路径 = dir + appenddirname

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228194702.png)

#### 2.2.4.4 AOF 文件保存名

**Redis 6**

Redis6中只有1个 aof 文件，其文件名由 redis.conf 中的 appendfilename 决定

**Redis 7**

Redis7中的AOF采用了MP（Multi Part）-AOF的设计:
顾名思义，MP-AOF就是将原来的单个AOF文件拆分成多个AOF文件。在MP-AOF中，我们将AOF分为三种类型，分别为:
- BASE:表示基础AOF，它一般由子进程通过重写产生，该文件最多只有一个。
- INCR:表示增量AOF, 它一般会在AOFRW开始执行时被创建，该文件可能存在多个。
- HISTORY：表示历史AOF，它由BASE和INCR AOF变化而来，每次AOFRW成功完成时，本次AOFRW之前对应的BASE和INCR AOF都将变为HISTORY, HISTORY类型的AOF会被Redis自动删除。
为了管理这些AOF文件，我们引入了一个manifest(清单)文件来跟踪、管理这些AOF。同时，为了便于AOF备份和拷贝，我们将所有的AOF文件和manifest文件放入一个单独的文件目录中，目录名由appenddirname配置。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228194811.png)

### 2.2.5 恢复

#### 2.2.5.2 正常恢复

当redis启动后，会自动执行aof中的所有命令进行数据的恢复。

#### 2.2.5.2 异常恢复

故意篡改AOF文件，发现redis无法启动。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228201144.png)

进行aof文件修复：
```bash
redis-check-aof --fix /myredis/appendonlydir/appendonly.aof.1.incr.aof
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228201419.png)

经过aof文件修复后，发现redis启动正常。

### 2.2.6 AOF优势

- 使用AOF Redis更加持久，您可以有不同的fsync 策略：根本不fsyn、每秒 fsync、每次查询时fsync。使用每秒fsync 的默认策略，写入性能仍然很棒。fsync是使用后台线程执行的，当没有fsync正在进行时，主线程将努力执行写入，因此您只能丢失一秒钟的写入。
- AOF 日志是一个仅附加日志，因此不会出现寻道问题，也不会在断电时出现损坏问题。即使由于某种原因(磁盘已满或其他原因)日志以写一半的命令结尾，redis-check-aof 工具也能够轻松修复它。
- 当AOF 变得太大时，Redis能够在后台自动重写AOF。重写是完全安全的，因为当Redis继续附加到旧文件时，会使用创建当前数据集所需的最少操作集生成一个全新的文件，一旦第二个文件准备就绪，Redis 就会切换两者并开始附加到新的那一个。
- AOF以易于理解和解析的格式依次包含所有操作的日志。您甚至可以轻松导出AOF文件。例如，即使您不小心使用该FLUSHALL命令刷新了所有内容，只要在此期间没有执行日志重写，您仍然可以通过停止服务器、删除最新命令并重新启动Redis来保存您的数据集。

### 2.2.7 AOF劣势

- 相同数据集的数据而言aof文件要远大于rdb文件，恢复速度慢于rdb。
- aof运行效率要慢于rdb,每秒同步策略效率较好，不同步效率和rdb相同。

### 2.2.8 AOF重写机制

#### 2.2.8.1 AOF重写机制是什么？

由于AOF持久化是Redis不断将写命令记录到AOF 文件中，随着Redis不断的进行，AOF的文件会越来越大，文件越大，占用服务器内存越大以及AOF恢复要求时间越长。

为了解决这个问题，==Redis新增了重写机制==，当AOF文件的大小超过所设定的峰值时，Redis就会自动启动AOF文件的内容压缩，只保留可以恢复数据的最小指令集或者==可以手动使用命令 bgrewriteaof 来重新。==

#### 2.2.8.2 触发机制

**自动触发**

官方默认配置
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228202442.png)

在同时满足以下条件时才会触发：
1. 根据上次重写后的aof大小，判断当前aof大小是不是增长了指定倍。
2. 重写时文件大小是否满足指定的文件大小。

**手动触发**

客户端向服务器发送 bgrewriteaof 命令。

#### 2.2.8.3 AOF重写原理

1. 在重写开始前，redis会创建一个“重写子进程”，这个子进程会读取现有的AOF文件，并将其包含的指令进行分析压缩并写入到一个临时文件中。

2. 与此同时，主进程会将新接收到的写指令一边累积到内存缓冲区中，一边继续写入到原有的AOF文件中，这样做是保证原有的AOF文件的可用性，避免在重写过程中出现意外。

3. 当“重写子进程”完成重写工作后，它会给父进程发一个信号，父进程收到信号后就会将内存中缓存的写指令追加到新AOF文件中

4. 当追加结束后，redis就会用新AOF文件来代替旧AOF文件，之后再有新的写指令，就都会追加到新的AOF文件中

5. 重写aof文件的操作，并没有读取旧的aof文件，而是将整个内存中的数据库内容用命令的方式重写了一个新的aof文件，这点和快照有点类似

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228204400.png)

### 2.2.9 总结

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230228204638.png)

## 2.3 RDB-AOF混合持久化

### 2.3.1 数据恢复顺序和加载流程

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228205305.png)

### 2.3.2 RDB 与 AOF 如何选择

RDB持久化方式能够在指定的时间间隔能对你的数据进行快照存储。

AOF持久化方式记录每次对服务器写的操作，当服务器重启的时候会重新执行这些命令来恢复原始的数据，AOF命令以Redis协议追加保存每次写的操作到文件末尾。

### 2.3.3 【推荐方式】同时开启两种持久化方式

#### 2.3.3.1 原因

在这种情况下,当redis重启的时候会优先载入AOF文件来恢复原始的数据，因为在通常情况下AOF文件保存的数据集要比RDB文件保存的数据集要完整。

>RDB的数据不实时，同时使用两者时服务器重启也只会找AOF文件。那要不要只使用AOF呢?

建议不要，因为RDB更适合用于备份数据库(AOF在不断变化不好备份)，留着RDB作为一个万一的手段。

#### 2.3.3.1 开启方式

1. 开启混合方式设置：设置 aof-use-rdb-preamble 的值为 yes，yes表示开启，设置为no表示禁用。

2. RDB+AOF的混合方式：RDB镜像做全量持久化，AOF做增量持久化

先使用RDB进行快照存储，然后使用AOF持久化记录所有的写操作，当重写策略满足或手动触发重写的时候，**将最新的数据存储为新的RDB记录**。这样的话，重启服务的时候会从RDB和AOF两部分恢复数据，既保证了数据完整性，又提高了恢复数据的性能。简单来说：混合持久化方式产生的文件一部分是RDB格式，一部分是AOF格式。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228210154.png)

## 2.4 纯缓存模式

**方式一：save "" **

禁用rdb持久化模式下，我们仍然可以使用命令save、 bgsave生成rdb文件

**方式二：appendonly no**

禁用aof持久化模式下，我们仍然可以使用命令bgrewriteaof生成aof文件。

# 3 Redis 事务

## 3.1 什么是事务？

可以一次执行多个命令，本质是一组命令的集合。一个事务中的
所有命令都会按顺序地串行化执行而不会被其它命令插入。事务的命令要么一起成功，要么一起失败。

## 3.2 使用事务

- 以MULTI开始一个事务
- 以EXEC提交一个事务

```redis
multi
set k1 v1
set k2 v2
set k3 v3
exec
```

## 3.3 Redis事务 VS 数据库事务

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228211327.png)

>1. 如果在事务的期间，未发现任何错误，但是运行时发现错误，那么将会出现部分执行成功，部分执行失败的情况。
>2. 如果在事务期间，即MULTI与EXEC之间出现了语法错误，比如说SET A（参数不够，命令错误），那么会将整个事务放弃。

## 3.4 watch监控

Redis使用Watch来提供乐观锁定，类似于CAS(Check-and-Set)，**Redis在修改的时候会检测数据是否被更改，如果更改了，则执行失败**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228212532.png)

一旦执行了exec，那么之前加的监控锁都会被取消掉了。
当客户端连接丢失的时候(比如退出链接)，所有东西都会被取消监视。

>unwatch：放弃监控

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228212820.png)

# 4 Redis 管道

## 4.1 为什么需要管道？

Redis是一种基于客户端-服务端模型以及请求/响应协议的TCP服务。一个请求会遵循以下步骤：

1. 客户端向服务端发送命令分四步(发送命令→命令排队→命令执行→返回结果)，并监听Socket返回，通常以阻塞模式等待服务端响应。

2. 服务端处理命令，并将结果返回给客户端。

**上述两步称为：Round Trip Time(简称RTT,数据包往返于两端的时间)**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228213428.png)

如果同时需要执行大量的命令，那么就要等待上一条命令应答后再执行，这中间不仅仅多了RTT（Round Time Trip），而且还频繁调用系统IO，发送网络请求，同时需要redis调用多次read()和write()系统方法，系统方法会将数据从用户态转移到内核态，这样就会对进程上下文有比较大的影响了，性能不太好。

## 4.1 什么是管道？

管道(pipeline)可以一次性发送多条命令给服务端，服务端依次处理完完毕后，**通过一条响应一次性将结果返回，通过减少客户端与redis的通信次数来实现降低往返延时时间**。pipeline实现的原理是队列，先进先出特性就保证数据的顺序性。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228213535.png)

## 4.2 管道的使用

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228232600.png)

如果其中一个命令报错了，不会影响其他的命令执行，不会中断管道的执行。

## 4.3 总结

### 4.3.1 Pipeline 与原生批量命令对比

- 原生批量命令是原子性(例如:mset, mget), ==pipeline是非原子性==。
- 原生批量命令一次只能执行一种命令，pipeline支持批量执行不同命令。
- 原生批命令是服务端实现，而pipeline需要服务端与客户端共同完成。

### 4.3.2 Pipeline 与事务

- 事务具有原子性，管道不具有原子性
- 管道一次性将多条命令发送到服务器，事务是一条一条的发，事务只有在接收到exec命令后才会执行，管道不会执行事务时会阻塞其他命令的执行，而执行管道中的命令时不会。

### 4.3.3 使用Pipeline注意事项

- pipeline缓冲的指令只是会依次执行，不保证原子性，如果执行中指令发生异常，将会继续执行后续的指令
- 使用pipeline组装的命令个数不能太多，不然数据量过大客户端阻塞的时间可能过久，同时服务端此时也被迫回复一个队列答复，占用很多内存

# 5 Redis 发布订阅

## 5.1 什么是发布订阅

是一种消息通信模式：发送者(PUBLISH)发送消息，订阅者(SUBSCRIBE)接收消息，可以实现进程间的消息传递。

## 5.2 常用命令

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230228234407.png)

## 5.3 发布/订阅缺点

- 发布的消息在Redis系统中不能持久化，因此，必须先执行订阅，再等待消息发布。如果先发布了消息，那么该消息由于没有订阅者，消息将被直接丢弃。
- 消息只管发送，对于发布者而言消息是即发即失的，不管接收，也没有ACK机制，无法保证消息的消费成功。

以上的缺点导致Redis的Pub/Sub模式就像个小玩具，在生产环境中几乎无用武之地，为此Redis5.0版本新增了Stream数据结构，不但支持多播，还支持数据持久化，相比Pub/Sub更加的强大。

# 6 Redis 复制（Replica）

## 6.1 定义

Redis复制即为主从复制，Master以写为主， Slave以读为主
当Master数据变化的时候，自动将新的数据异步同步到其它Slave数据库。

## 6.2 作用

- 读写分离
- 容灾恢复
- 数据备份
- 水平扩容支撑高并发

## 6.3 基本操作命令

- info replication：可以查看复制节点的主从关系和配置信息
- replicaof 主库IP 主库端口：一般写入redis.conf配置文件内
- slaveof 主库IP 主库端口：
	- 每次与master断开之后，都需要重新连接，除非你配置进redis.conf文件。
	- 在运行期间修改slave节点的信息，如果该数据库已经是某个主数据库的从数据库，那么会停止和原主数据库的同步关系转而和新的主数据库同步。
- slaveof no one：使当前数据库停止与其他数据库的同步，使自身变为主数据库。

## 6.4 配置主从复制

1. 开启后台运行：daemonize yes
2. 注释掉 bin 127.0.0.1
3. 关闭保护模式：protected-mode no
4. 指定Redis服务端口：port 6379
5. 指定当前的工作目录：dir /myredis
6. 指定pid文件名字：pidfile /var/run/redis_6379.pid
7. 指定log文件名：logfile "/myredis/6379.log"
8. 指定redis登陆密码：requirepass
9. 指定dump.rdb文件名：dbfilename dump6379.rdb
10. 开启aof，并配置aof文件地址以及aof文件名：
	1. appendonly yes
	2. appendfilename "appendonly.aof"

## 6.5 主从复制问题解答

### 1. 从机可以执行写命令吗？

不行

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301003907.png)

### 2. 主机shutdown后情况如何？从机是否会变为主机？

从机不会变为主机，从机的数据可以正常使用，重新等待主机启动。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301004328.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301004351.png)

### 3. 主机shutdown后，重启后主从关系还在吗?从机还能否顺利复制？

主从关系依旧存在，从机依旧能顺利复制

### 4. 某台从机down后, master继续，从机重启后它能跟上大部队吗？

当从机重启成功后，从机能马上进行主从复制，保持与主机的数据同步。

## 6.6 复制原理和工作流程

1. slave启动，请求同步
	slave启动成功连接到master后会发送一个sync命令。slave首次全新连接master，一次完全同步(全量复制)将被自动执行，slave自身原有数据会被master数据覆盖清除。

2. 首次连接，全量复制
	master节点收到sync命令后会开始在后台保存快照(即RDB持久化，主从复制时会触发RDB)，同时收集所有接收到的用于修改数据集命令缓存起来，master节点执行RDB持久化完后，master将rdb快照文件和所有缓存的命令发送到所有slave，以完成一次完全同步而slave服务在接收到数据库文件数据后，将其存盘并加载到内存中，从而完成复制初始化。

3. master与slave之间保持通信
	`repl-ping-replica-period 10`：master发出PING包的周期，默认是10秒。

4. 进入平稳期，增量复制
	Master继续将新的所有收集到的修改命令自动依次传给slave，完成同步。

5. 从机下线，重连续传
	master会检查backlog里面的offset，master和slave都会保存一个复制的offset还有一个masterId，offset是保存在backlog中的。==master只会把已经复制的offset后面的数据复制给slave==，类似断点续传。

[[7. 面试题/Redis#16. Redis 主从同步是怎样的过程？|16. Redis 主从同步是怎样的过程？]]

## 6.7 复制的缺点

- 由于所有的写操作都是先在Master上操作，然后同步更新到Slave上，所以从Master同步到Slave机器有一定的延迟，当系统很繁忙的时候，延迟问题会更加严重，Slave机器数量的增加也会使这个问题更加严重。

- 当Master挂掉时，不会在Slave节点中自动重新选一个Master。

# 7 Redis 哨兵（Sentinel）

## 7.1 什么是哨兵？

哨兵监控后台master主机是否故障，如果故障了根据==投票数==自动将某一个从库转换为新主库，继续对外服务

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301101731.png)

## 7.2 哨兵能干嘛？

- 主从监控：监控主从redis库运行是否正常
- 消息通知：哨兵可以将故障转移的结果发送给客户端
- 故障转移：如果Master异常，则会进行主从切换，将其中一个Slave作为新Master
- 配置中心：客户端通过连接哨兵来获得当前Redis服务的主节点地址

## 7.3 配置哨兵

>哨兵的配置文件为 sentinel.conf

配置哨兵需要配置如下选项：

**【重要配置】**
- `bind`：服务监听地址，用于客户端连接，默认本机地址
- `daemonize`：是否以后台daemon方式运行
- `protected-mode`：安全保护模式
- `port`：端口
- `logfile`：日志文件路径
- `pidfile`：pid文件路径
- `dir`：工作目录
- `sentinel monitor <master-name> <ip> <redis-port> <quorum>`：设置要监控的master服务器，quorum表示最少有几个哨兵认可[[#^68c477|客观下线]]，同意故障迁移的法定票数
- `sentinel auth-pass <master-name> <password>`：设定连接master服务的密码。

**【其他配置】**
- `sentinel down-after-milliseconds <master-name> <milliseconds>`：指定多少毫秒之后，主节点没有应答哨兵，此时哨兵主观上认为主节点下线。

`sentinel parallel-syncs <master-name> <nums>`：表示允许并行同步的slave个数，当Master挂了后，哨兵会选出新的Master，此时，剩余的slave会向新的master发起同步数据。

`sentinel failover-timeout <master-name> <milliseconds>`：故障转移的超时时间，进行故障转移时，如果超过设置的毫秒，表示故障转移失败。

`sentinel notification-script <master-name> <script-path>`：配置当某一事件发生时所需要执行的脚本。

`sentinel client-reconfig-script <master-name> <script-path>`：客户端重新配置主节点参数脚本。

配置模版
```conf
nd 0.0. 0.0
daemonize yes
protected- mode no
port 26379
logfile "/myredis/sentinel26379. log"
pidfile /var/run/redis-sentinel26379. pid
dir /myredis
sentinel monitor mymaster 192.168.111. 185 6379 2 sentinel auth- pass mymaster 12345678
```

## 7.4 启动哨兵

执行 `redis-sentinel` 启动哨兵：

```bash
redis-sentinel sentinel.conf --sentinel
```

- 配置文件的内容，会在哨兵运行期间动态进行更改。
- Master-Slave切换后，master_redis.conf、slave_redis.conf和sentinel.conf的内容都会发生改变， 即master_redis.conf中会多一行slaveof的配置，sentinel.conf的监控目标会随之调换。

## 7.5 哨兵运行流程和选举原理

当一个主从配置中的master失效之后， sentinel可以选举出一个新的master
用于自动接替原master的工作，主从配置中的其他redis服务器自动指向新的master同步数据。一般建议sentinel采取奇数台，防止某一台sentinel无法连接到master导致误切换。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301140616.png)

### 7.5.1 步骤一：判断是否为主观下线（Subjectively Down，简称SDOWN）

所谓主观下线（Subjectively Down， 简称 SDOWN）指的是==单个Sentinel实例==对服务器做出的下线判断，即单个sentinel认为某个服务下线（有可能是接收不到订阅，之间的网络不通等等原因）。主观下线就是说如果服务器在 `sentinel down-after-milliseconds` 给定的毫秒数之内没有回应PING命令或者返回一个错误消息， 那么这个Sentinel会主观的==单方面的==认为这个master不可用了。认为这个redis-server进入到失效（SDOWN）状态。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301141137.png)

### 7.5.2 步骤二：判断是否为客观下线（Objectively Down，简称ODOWN）：

^68c477

ODOWN需要一定数量的sentinel，==多个哨兵达成一致意见==才能认为一个master客观上已经宕掉。

哨兵配置文件中，包含如下配置：`sentinel monitor <master-name> <ip> <redis-port> <quorum>`，其中quorum是进行客观下线的依据，意思是至少有quorum个sentinel认为这个master有故障才会对这个master进行下线以及故障转移。因为有的时候，某个sentinel节点可能因为自身网络原因导致无法连接master，而此时master并没有出现故障，所以这就需要多个sentinel都一致认为该master有问题，才可以进行下一步操作，这就保证了公平性和高可用。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301141607.png)

### 7.5.3 步骤三：选举出领导者哨兵

当主节点被判断客观下线以后，各个哨兵节点会进行协商，通过[[7. 面试题/Redis#说一下Raft算法？|RAFT算法]]选举出一个领导者哨兵节点(兵王) 并由该领导者节点，也即被选举出的兵王进行failover (故障迁移)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301141910.png)

Raft 算法

监视该主节点的所有哨兵都有可能被选为领导者，选举使用的算法是[[7. 面试题/Redis#说一下Raft算法？|RAFT算法]]; Raft算法的基本思路是==先到先得==：即在一轮选举中，哨兵A向B发送成为领导者的申请，如果B没有同意过其他哨兵，则会同意A成为领导者。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301142543.png)

### 7.5.4 步骤四：由领导者哨兵推动故障切换流程并选出一个新master

1. 选举新Master
- redis.conf文件中，优先级slave-priority或者replica-priority最高的从节点(数字越小优先级越高) 
- 复制偏移位置offset最大的从节点
	- `【举例】`由于网络波动，可能出现从机A中的记录会比从机B的记录多，即A_offset大于B_offset，此时A会选举为新的Master节点
- 最小Run ID的从节点（字典顺序、ASCII码）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301143143.png)

2. 将选举出来的未来Master主机变为Master主机，剩余的Slave变为新Master的Slave。
	- 执行slaveof no one命令让选出来的从节点成为新的主节点，并通过slaveof命令让其他节点成为其从节点。
	- Sentinel leader会对选举出的新master执行slaveof no one操作，将其提升为master节点。
	- Sentinel leader向其它slave发送命令，让剩余的slave成为新的master节点的slave

3. 旧Master重新连接
	- 将之前已下线的老master设置为新选出的新master的从节点，当老master重新上线后，它会成为新master的从节点。
	- Sentinel leader会让原来的master降级为slave并恢复正常工作。


## 7.6 哨兵使用建议

- 哨兵节点的数量应为多个，哨兵本身应该集群，保证高可用。
- 哨兵节点的数量应该是奇数。
- 各个哨兵节点的配置应一致。
- 如果哨兵节点部署在Docker等容器里面，尤其要注意端口的正确映射。
- 哨兵集群+主从复制，并不能保证数据零丢失，所以我们需要集群。

# 8 Redis 集群（cluster）

## 8.1 什么是集群

==由于数据量过大，单个Master复制集难以承担==，因此需要对多个复制集进行集群，形成水平扩展每个复制集只负责存储整个数据集的一部分，这就是Redis的集群，其作用是提供在多个Redis节点间共享数据的程序集。

Redis集群是一个提供在多个Redis节点间共享数据的程序集。

**Redis集群可以支持多个Master。**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301172300.png)

## 8.2 集群能干嘛

Redis集群支持多个Master，每个Master又可以挂载多个Slave。
由于Cluster自带Sentinel的故障转移机制，内置了高可用的支持，**无需再去使用哨兵功能。**
客户端与Redis的节点连接，不再需要连接集群中所有的节点，只需要任意连接集群中的一个可用节点即可。
**槽位slot**负责分配到各个物理服务节点，由对应的集群来负责维护节点、插槽和数据之间的关系。

## 8.3 集群算法-分片-槽位slot

### 8.3.1 什么是槽位

**官网描述：**

集群的密钥空间被分成16384个槽，有效地设置了16384个主节点的集群大小上限(但是，建议的最大节点大小约为1000个节点)。

集群中的每个主节点处理16384个哈希槽的一个子集。当没有集群重新配置正在进行时(即哈希槽从一个节点移动到另一个节点)，集群是稳定的。当集群稳定时，单个哈希槽将由单个节点提供服务(但是，服务节点可以有一个或多个副本，在网络分裂或故障的情况下替换它，并且可以用于扩展读取陈旧数据是可接受的操作)。

Redis集群没有使用一致性hash，而是引入了**哈希槽**的概念.
Redis集群有16384个哈希槽，每个key通过CRC16校验后对16384取模来决定放置哪个槽，集群的每个节点负责部分hash槽。举个例子，比如当前集群有3个节点，那么：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301173240.png)

### 8.3.2 redis 集群的分片

**什么是分片？**

使用Redis集群时我们会将存储的数据分散到多台redis机器上，这称为分片。简言之，集群中的每个Redis实例都被认为是整个数据的一个分片。

**如何找到给定key的分片？**

为了找到给定key的分片，我们对key进行CRC16(key)算法处理并通过对总分片数量取模。然后，==使用确定性哈希函数==，这意味着给定的key==将多次始终映射到同一个分片==，我们可以推断将来读取特定key的位置。

### 8.3.3 槽位与分片的优势

这种结构很容易添加或者删除节点，比如如果我想新添加个节点D，我需要从节点A，B，C中得部分槽到D上。如果我想移除节点A，需要将A中的槽移到B和C节点上，然后将没有任何槽的A节点从集群中移除即可。由于从一个节点将哈希槽移动到另一个节点并不会停止服务，所以无论添加删除或者改变某个节点的哈希槽的数量都不会造成集群不可用的状态。

### 8.3.4 三种分区方法（为什么选择哈希槽分区？）

#### 8.3.4.1 哈希取余分区

用户每次的读写操作都将根据公式 `hash(key) % N` 进行计算，根据结果来决定数据映射到哪个节点上。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301194926.png)

##### 优点

简单粗暴，直接有效，只需要预估好数据规划好节点，例如3台、8台、10台，就能保证一段时间的数据支撑。使用Hash算法让固定的一部分请求落到同一台服务器上，这样每台服务器固定处理一部分请求（并维护这些请求的信息），起到负载均衡+分而治之的作用。

##### 缺点

原来规划好的节点，进行扩容或者缩容就比较麻烦了额，不管扩缩，每次数据变动导致节点有变动，映射关系需要重新进行计算，在服务器个数固定不变时没有问题，如果需要弹性扩容或故障停机的情况下，原来的取模公式就会发生变化：`Hash(key)/3`会变成`Hash(key)/?`。此时地址经过取余运算的结果将发生很大变化，根据公式获取的服务器也会变得不可控。
举例：某个redis机器宕机了，由于台数数量变化，会导致hash取余全部数据重新洗牌。

#### 8.3.4.2 一致性哈希算法分区

基于分布式缓存数据变动和映射问题，如果某个机器宕机了，分母数量改变了，自然取余数就行不通了。为了解决这个问题，提出一致性Hash解决方案，目的是当服务器个数发生变动时，尽量减少影响客户端到服务器的映射关系。

##### 如何实现？

###### 1. 算法构建一致性哈希环

一致性哈希算法必然有个hash函数并按照算法产生hash值，这个算法的所有可能哈希值会构成一个全量集，这个集合可以成为一个hash空间[0,2^32-1]，这个是一个线性空间，但是在算法中，我们通过适当的逻辑控制将它首尾相连(0 = 2^32),这样让它逻辑上形成了一个环形空间。

它也是按照使用取模的方法，==前面笔记介绍的节点取模法是对节点（服务器）的数量进行取模。而一致性Hash算法是对2^32取模，一致性Hash算法将整个哈希值空间组织成一个虚拟的圆环==，如假设某哈希函数H的值空间为0-2^32-1（即哈希值是一个32位无符号整形），整个哈希环如下图：整个空间按==顺时针方向组织==，圆环的正上方的点代表0，0点右侧的第一个点代表1，以此类推，2、3、4、……直到2^32-1，也就是说0点左侧的第一个点代表2^32-1， 0和2^32-1在零点中方向重合，我们把这个由2^32个点组成的圆环称为Hash环。

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230301195727.png)

###### redis服务器ip节点映射

将集群中各个IP节点映射到环上的某一个位置。

将各个服务器使用Hash进行一个哈希，具体可以选择服务器的IP或主机名作为关键字进行哈希，这样每台机器就能确定其在哈希环上的位置。假如4个节点NodeA、B、C、D，经过IP地址的哈希函数计算(hash(ip))，使用IP地址哈希后在环空间的位置如下：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301195831.png)

###### 3. key映射到服务器的落键规则

当我们需要存储一个kv键值对时，首先计算key的hash值，hash(key)，将这个key使用相同的函数Hash计算出哈希值并确定此数据在环上的位置，==从此位置沿环顺时针“行走”==，第一台遇到的服务器就是其应该定位到的服务器，并将该键值对存储在该节点上。

如我们有Object A、Object B、Object C、Object D四个数据对象，经过哈希计算后，在环空间上的位置如下：根据一致性Hash算法，数据A会被定为到Node A上，B被定为到Node B上，C被定为到Node C上，D被定为到Node D上。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301195940.png)

##### 优点

- 提高了容错性

假设Node C宕机，可以看到此时对象A、B、D不会受到影响。一般的，在一致性Hash算法中，如果一台服务器不可用，则==受影响的数据仅仅是此服务器到其环空间中前一台服务器（即沿着逆时针方向行走遇到的第一台服务器）之间数据，其它不会受到影响==。简单说，就是C挂了，受到影响的只是B、C之间的数据且这些==数据会转移到D进行存储==。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301200420.png)

- 提高了拓展性

数据量增加了，需要增加一台节点NodeX，X的位置在A和B之间，那收到影响的也就是A到X之间的数据，重新把A到X的数据录入到X上即可，不会导致hash取余全部数据重新洗牌。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301200406.png)

##### 缺点

会导致数据的倾斜

一致性Hash算法在服务**节点太少时**，容易因为节点分布不均匀而造成**数据倾斜**（被缓存的对象大部分集中缓存在某一台服务器上）问题。

例如系统中只有两台服务器：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301200459.png)

#### 8.3.4.2 哈希槽分区（重点）

##### 1. 为什么会出现哈希槽分区

为了解决一致性哈希算法的数据倾斜问题。

哈希槽实质就是一个数组，数组`[0,2^14 -1]`形成hash slot空间。

解决均匀分配的问题，==在数据和节点之间又加入了一层，把这层称为哈希槽（slot），用于管理数据和节点之间的关系==，现在就相当于节点上放的是槽，槽里放的是数据。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301200804.png)

##### 2. 有多少个哈希槽

一个集群只能有16384个槽，编号0-16383（0-2^14-1）。这些槽会分配给集群中的所有主节点，分配策略没有要求。

集群会记录节点和槽的对应关系，解决了节点和槽的关系后，接下来就需要对key求哈希值，然后对16384取模，余数是几key就落入对应的槽里。HASH_SLOT = CRC16(key) mod 16384。以槽为单位移动数据，因为槽的数目是固定的，处理起来比较容易，这样数据移动问题就解决了。

##### 3. 为什么redis集群的最大槽数是16384个（经典面试题）？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301202905.png)

Redis集群中，计算key位于哪个slot时，会先用crc16(key)函数计算key的哈希值，然后再用哈希值对2^16取模，取模结果有2^16 -1=65535个余值，可能很多人会有疑问， slot的个数为什么不是65536？这里主要是有两方面的考虑：

1. **如果槽位为65536，发送心跳信息的消息头达8k，发送的心跳包过于庞大。**
	redis集群中各节点间会定时通过心跳发送消息，以让其他节点知道当前节点存活，并且利用Gossip协议交换节点间的信息；心跳消息中包含一个节点的完整配置信息，包括slot bitmap的信息。如果是16384个slot，占的空间为16384个位，即16384/8=2048=2KB空间。而如果是65536个slot，即65536位，占用空间为65536/8=8KB；16384个slot占用的空间更少；

2. **redis的集群主节点数量基本不可能超过1000个。**
	集群节点越多，心跳包的消息体内携带的数据越多。如果节点过1000个，也会导致网络拥堵。因此redis作者不建议redis cluster节点数量超过1000个。 那么，对于节点数在1000以内的redis cluster集群，16384个槽位够用了。没有必要拓展到65536个。

3. **槽位越小，节点少的情况下，压缩比高，容易传输**
Redis主节点的配置信息中它所负责的哈希槽是通过一张bitmap的形式来保存的，在传输过程中会对bitmap进行压缩，但是如果bitmap的填充率slots / N很高的话(N表示节点数)，bitmap的压缩率就很低。 如果节点数很少，而哈希槽数量很多的话，bitmap的压缩率就很低。

##### 4. 哈希槽分区是如何实现的？

Redis 集群中内置了 16384 个哈希槽，redis 会根据节点数量大致均等的将哈希槽映射到不同的节点。当需要在 Redis 集群中放置一个 key-value时，redis先对key使用crc16算法算出一个结果然后用结果对16384求余数`[ CRC16(key) % 16384]`，这样每个 key 都会对应一个编号在 0-16383 之间的哈希槽，也就是映射到某个节点上。如下代码，key在A 、B在Node2， key之C落在Node3上

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230301201212.png)

Redis集群**不保证强一致性**，这意味着在特定的条件下， Redis集群可能会丢掉一些被系统收到的写入请求命令。

## 8.4 配置集群

略（参考脑图）

# 9 SpringBoot集成Redis

## 9.1 集成Jedis

```POM
<dependency>  
    <groupId>redis.clients</groupId>  
    <artifactId>jedis</artifactId>  
    <version>4.3.1</version>  
</dependency>
```

```java
public class JedisMain {  
    public static void main(String[] args) {  
        // 创建redis连接  
        Jedis jedis = new Jedis("10.211.55.7", 6379);  
  
        // 2. 指定访问服务器的密码  
        jedis.auth("12345678");  
  
        jedis.set("k3", "hello!jedis");  
        System.out.println(jedis.get("k3"));  
  
        jedis.lpush("list", "11", "22", "33");  
        List<String> list = jedis.lrange("list", 0, -1);  
        list.stream().forEach(System.out::println);  
    }  
}
```

## 9.2 集成Lettuce

Lettuce是一个Redis的Java驱动包

```xciwpml
<dependency>  
    <groupId>io.lettuce</groupId>  
    <artifactId>lettuce-core</artifactId>  
    <version>6.2.1.RELEASE</version>  
</dependency>
```

```java
public class LettuceMain {  
  
    public static void main(String[] args) {  
        // 1. 使用构建器链式编程来builder我们RedisURI  
        RedisURI uri = RedisURI.builder().redis("10.211.55.7").withPort(6379).withAuthentication("default", "12345678").build();  
  
        // 2. 创建连接客户端  
        RedisClient redisClient = RedisClient.create(uri);  
        StatefulRedisConnection<String, String> conn = redisClient.connect();  
  
        // 3. 创建操作Command  
        RedisCommands<String, String> commands = conn.sync();  
  
        commands.set("k1", "v1");  
        System.out.println(commands.get("k1"));  
  
        //  4. 关闭释放资源  
        conn.close();  
        redisClient.shutdown();  
    }  
}
```

## 9.3 Jedis和Lettuce的区别

Jedis和Lettuce都是Redis的客户端，它们都可以连接Redis服务器，但是在SpringBoot2.0之后默认都是使用的Lettuce这个客户端连接Redis服务器。因为当使用Jedis客户端连接Redis服务器的时候，每个线程都要拿自己创建的Jedis实例怯连接Redis客户端，当有很多个线程的时候，不仅开销大需要反复的创建关闭一个Jedis连接，而且也是线程不安全的，一个线程通过Jedis实例更改Redis服务器中的数据之后会影响另一个线程;

但是如果使用Lettuce这个客户端连接Redis服务器的时候，就不会出现上面的情况，Lettuce底层使用的是Netty,当有多个线程都需要连接Redis服务器的时候，可以保证只创建一个Lettuce连接，使所有的线程共享这一个Lettuce连接，这样可以减少创建关闭一个Lettuce连接时候的开销;而且这种方式也是线程安全的，不会出现一个线程通过Lettuce更改Redis服务器中的数据之后而影响另一个线程的情况;

## 9.4 集成RestTemplate

### 单机Redis

#### POM

```xml
<properties>  
	<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>  
	<maven.compiler.source>1.8</maven.compiler.source>  
	<maven.compiler.target>1.8</maven.compiler.target>  
	<junit.version>4.12</junit.version>  
	<log4j.version>1.2.17</log4j.version>  
<!--        <lombok.version>1.16.18</lombok.version>-->  
	<java.version>11</java.version>  
</properties>  

<dependencies>        <!--SpringBoot通用依赖模块-->  
	<dependency>  
		<groupId>org.springframework.boot</groupId>  
		<artifactId>spring-boot-starter-web</artifactId>  
	</dependency>        <!--SpringBoot与Redis整合依赖-->  
	<dependency>  
		<groupId>org.springframework.boot</groupId>  
		<artifactId>spring-boot-starter-data-redis</artifactId>  
	</dependency>        <dependency>            <groupId>org.apache.commons</groupId>  
		<artifactId>commons-pool2</artifactId>  
	</dependency>        <!--swagger2-->  
	<dependency>  
		<groupId>io.springfox</groupId>  
		<artifactId>springfox-swagger2</artifactId>  
		<version>2.9.2</version>  
	</dependency>        <dependency>            <groupId>io.springfox</groupId>  
		<artifactId>springfox-swagger-ui</artifactId>  
		<version>2.9.2</version>  
	</dependency>        <!--通用基础配置junit/devtools/test/log4j/lombok/hutool-->  
	<dependency>  
		<groupId>junit</groupId>  
		<artifactId>junit</artifactId>  
		<version>${junit.version}</version>  
	</dependency>        <dependency>            <groupId>org.springframework.boot</groupId>  
		<artifactId>spring-boot-starter-test</artifactId>  
		<scope>test</scope>  
	</dependency>        <dependency>            <groupId>log4j</groupId>  
		<artifactId>log4j</artifactId>  
		<version>${log4j.version}</version>  
	</dependency>        <dependency>            <groupId>org.projectlombok</groupId>  
		<artifactId>lombok</artifactId>  
	</dependency>    
</dependencies>
```

#### RedisConfig

```java
@Configuration  
public class RedisConfig  
{  
    /**  
     * redis序列化的工具配置类，下面这个请一定开启配置  
     * 127.0.0.1:6379> keys *  
     * 1) "ord:102"  序列化过  
     * 2) "\xac\xed\x00\x05t\x00\aord:102"   野生，没有序列化过  
     * this.redisTemplate.opsForValue(); //提供了操作string类型的所有方法  
     * this.redisTemplate.opsForList(); // 提供了操作list类型的所有方法  
     * this.redisTemplate.opsForSet(); //提供了操作set的所有方法  
     * this.redisTemplate.opsForHash(); //提供了操作hash表的所有方法  
     * this.redisTemplate.opsForZSet(); //提供了操作zset的所有方法  
     * @param lettuceConnectionFactory  
     * @return  
     */  
    @Bean  
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory lettuceConnectionFactory)  
    {  
        RedisTemplate<String,Object> redisTemplate = new RedisTemplate<>();  
  
        redisTemplate.setConnectionFactory(lettuceConnectionFactory);  
        //设置key序列化方式string  
        redisTemplate.setKeySerializer(new StringRedisSerializer());  
        //设置value的序列化方式json，使用GenericJackson2JsonRedisSerializer替换默认序列化  
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());  
  
        redisTemplate.setHashKeySerializer(new StringRedisSerializer());  
        redisTemplate.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());  
  
        redisTemplate.afterPropertiesSet();  
  
        return redisTemplate;  
    }  
}
```

**为什么需要序列化？**

如果没有序列化，那么在Redis服务器中，将会显示异常，不好维护。

通过自定义RestTemplate，我们可以在写入Redis时，将key序列化，避免出现如下情况。

当我们读取key时，我们可以在连接时加上 `--row` 属性（`redis-cli -a 12345678 --raw`），这样我们就可以支持中文显示。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230302212107.png)

```java
@Service  
@Slf4j  
public class OrderService {  
  
    public static final String ORDER_KEY = "ord:";  
  
    private final StringRedisTemplate redisTemplate;  
  
    public OrderService(StringRedisTemplate redisTemplate) {  
        this.redisTemplate = redisTemplate;  
    }  
  
    public void addOrder() {  
        int keyId = ThreadLocalRandom.current().nextInt(1000)+1;  
        String serialNo = UUID.randomUUID().toString();  
        String key = ORDER_KEY + keyId;  
        String value = "京东订单" + serialNo;  
  
        redisTemplate.opsForValue().set(key, value);  
  
        log.info("key:{}", key);  
        log.info("value:{}", value);  
    }  
  
    public String getOrderById(Integer keyId) {  
        return redisTemplate.opsForValue().get(ORDER_KEY + keyId);  
    }  
}
```

#### PROPERTIES

```properties
server.port=7777  
  
spring.application.name=redistemplate  
  
# ========================logging=====================  
logging.level.root=info  
logging.level.com.atguigu.redis7=info  
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger- %msg%n   
logging.file.name=D:/mylogs2023/redis7_study.log  
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger- %msg%n  
  
# ========================swagger=====================  
spring.swagger2.enabled=true  
#在springboot2.6.X结合swagger2.9.X会提示documentationPluginsBootstrapper空指针异常，  
#原因是在springboot2.6.X中将SpringMVC默认路径匹配策略从AntPathMatcher更改为PathPatternParser，  
# 导致出错，解决办法是matching-strategy切换回之前ant_path_matcher  
spring.mvc.pathmatch.matching-strategy=ant_path_matcher  
  
# ========================redis单机=====================  
spring.redis.database=0  
# 修改为自己真实IP  
spring.redis.host=10.211.55.7  
spring.redis.port=6379  
spring.redis.password=12345678  
spring.redis.lettuce.pool.max-active=8  
spring.redis.lettuce.pool.max-wait=-1ms  
spring.redis.lettuce.pool.max-idle=8  
spring.redis.lettuce.pool.min-idle=0
```

### 集群

#### PROPERTIES

```properties
server.port=7777
spring.application.name=redis7_study
# ========================logging=====================
logging.level.root=info
logging.level.com.atguigu.redis7=info
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger- %msg%n
logging.file.name=D:/mylogs2023/redis7_study.log
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger- %msg%n
# ========================swagger=====================
spring.swagger2.enabled=true
#在springboot2.6.X结合swagger2.9.X会提示documentationPluginsBootstrapper空指针异常，
#原因是在springboot2.6.X中将SpringMVC默认路径匹配策略从AntPathMatcher更改为PathPatternParser，
# 导致出错，解决办法是matching-strategy切换回之前ant_path_matcher
spring.mvc.pathmatch.matching-strategy=ant_path_matcher
# ========================redis集群=====================
spring.redis.password=111111
# 获取失败 最大重定向次数
spring.redis.cluster.max-redirects=3
spring.redis.lettuce.pool.max-active=8
spring.redis.lettuce.pool.max-wait=-1ms
spring.redis.lettuce.pool.max-idle=8
spring.redis.lettuce.pool.min-idle=0
#支持集群拓扑动态感应刷新,自适应拓扑刷新是否使用所有可用的更新，默认false关闭
spring.redis.lettuce.cluster.refresh.adaptive=true
#定时刷新
spring.redis.lettuce.cluster.refresh.period=2000
spring.redis.cluster.nodes=192.168.111.175:6381,192.168.111.175:6382,192.168.111.172:6383,192.168.111.172:6384,192.168.111.174:6385,192.168.111.174:6386
```

# 【 高阶篇】

# 10 Redis单线程 VS 多线程

## 10.1 Redis是单线程吗？

分版本：
- 版本3.x，redis是单线程。
- 版本4.x，严格意义来说也不是单线程，而是负责处理客户端请求的线程是单线程，但是开始加了点多线程的东西(异步删除)。
- 2020年5月版本的6.0.x后及2022年出的7.0版本后，告别了大家印象中的单线程，用一种全新的多线程来解决问题。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230302233856.png)

## 10.2 Redis为什么选择单线程？

**什么是Redis的单线程？**

Redis单线程主要是指Redis的网络IO和键值对读写是由一个线程来完成的，Redis在处理客户端的请求时包括获取 (socket 读)、解析、执行、内容返回 (socket 写) 等都由一个顺序串行的主线程处理，这就是所谓的**单线程**。这也是Redis对外提供键值存储服务的主要流程。

但Redis的其他功能，比如持久化RDB、AOF、异步删除、集群数据同步等等，其实是由额外的线程执行的。

==Redis命令工作线程是单线程的，但是，整个Redis来说，是多线程的；==

**Redis为什么选择单线程？**

1. 使用单线程模型是 Redis 的开发和维护更简单，因为单线程模型方便开发和调试；

2. 即使使用单线程模型也并发的处理多客户端的请求，主要使用的是IO多路复用和非阻塞IO；

3. ==对于Redis系统来说，主要的性能瓶颈是内存或者网络带宽而并非 CPU==（官网原话）。

## 10.3 为什么在Redis 4.0之后引入了多线程？

**单线程情况：**

正常情况下使用 del 指令可以很快的删除数据，而当被删除的 key 是一个非常大的对象时，例如时包含了成千上万个元素的 hash 集合时，那么 del 指令就会造成 Redis 主线程卡顿。

这就是redis3.x单线程时代最经典的故障，大key删除的头疼问题，由于redis是单线程的，执行del操作需要等待很久这个线程才会释放，类似加了一个synchronized锁，你可以想象高并发下，将无法得到及时的请求响应。

**使用多线程解决：**

当Redis需要删除一个很大的数据时，因为是单线程原子命令操作，这就会导致 Redis 服务卡顿，于是在 Redis 4.0 中就新增了多线程的模块，当然此版本中的多线程主要是为了解决删除数据效率比较低的问题的，比如命令 `unlink key`、`flushdb async`、`flushall async`

redis一直强调"Lazy Redis is better Redis"，而lazy free的本质就是把某些花费较高(主要时间复制度，占用主线程cpu时间片)的删除操作，==从redis主线程剥离让非阻塞子线程来处理（在主线程中重新开一个子线程处理其他命令），极大地减少主线阻塞时间。从而减少删除导致性能和稳定性问题。==

在Redis4.0就引入了多个线程来实现数据的异步惰性删除等功能，但是其处理读写请求的仍然只有一个线程，所以仍然算是狭义上的单线程。

## 10.4 Redis6/7的多线程特性

#### Redis中主线程与IO线程怎么协作完成请求处理的？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303003206.png)
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303003225.png)

**阶段一：服务端和客户端建立Socket连接，并分配处理线程**

首先，主线程负责接收建立连接请求。当有客户端请求和实例健立Socket连接（redis-cli -a 12345678）时，主线程会创建和客户端的连接，并把S0cket放入全局等待队列中。紧接着，主线程通过轮询方法把S0cket连接分配给lO线程。

**阶段二：IO线程读取并解析请求**

主线程一旦把Socket分配给IO线程，就会进入阻塞状态，等待IO线程完成客户端请求读取和解析，因为有多个IO线程在并行处理，所以，这个过程很快就可以完成。

**阶段三：主线程执行请求操作**

等到IO线程解析完请求，主线程还是会以单线程的方式执行这些命令操作。

**阶段四：IO线程回写Socket和主线程清空全局队列**

当主线程执行完请求操作后，会把需要返回的结果写入缓冲区，然后，主线程会阻塞等待I○线程，把这些结果回写到Socket中，并返回给客户端。和lO线程读取和解析请求一样，IO线程回写Socket时，也是有多个线程在并发执行，所以回写Socket的速度也很快。等到lO线程回写Socket完毕，主线程会清空全局队列，等待客户端的后续请求。

>从Redis6开始，就新增了多线程的功能来提高 I/O 的读写性能，他的主要实现思路是将主线程的 IO 读写任务拆分给一组独立的线程去执行，这样就可以使多个 socket 的读写可以并行化了，采用 [[#^28dbcc|IO多路复用]] 可以让单个线程高效的处理多个连接请求（尽量减少网络IO的时间消耗），将最耗时的Socket的读取、请求解析、写入单独外包出去，剩下的命令执行仍然由主线程串行执行并和内存的数据交互。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303220450.png)

#### Unix网络编程中的五种IO模型

- 阻塞IO
- 非阻塞IO
- 信号驱动IO
- 异步IO

##### IO多路复用

^28dbcc

###### 定义

- IO：网络IO，尤其在操作系统层面指数据在内核态和用户态之间的读写操作。
- 多路：多个客户端连接（连接就是套接字描述符，即socket或者channel）。
- 复用：复用一个或几个线程。

IO多路复用是一种同步的IO模型，实现一个线程监视多个[[#^c19157|文件句柄]]，一个或一组线程处理多个TCP连接，使用单进程就能够实现同时处理多个客户端的连接（比如 redis-cli），无需创建或者维护过多的进程/线程。一旦某个文件句柄就绪就能够通知到对应应用程序进行相应的读写操作，没有文件句柄就绪时就会阻塞应用程序，从而释放CPU资源。

【一句话】一个服务端进程可以同时处理多个套接字描述符。

实现IO多路复用的模型有3种:可以分select->poll->epoll三个阶段来描述。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303214526.png)

###### 通过场景理解IO多路复用与epoll

模拟一个tcp服务器处理30个客户socket。

假设你是一个监考老师，让30个学生解答一道竞赛考题，然后负责验收学生答卷，你有下面几个选择：

第一种选择(轮询)：按顺序逐个验收，先验收A，然后是B，之后是C、D。。。这中间如果有一个学生卡住，全班都会被耽误,你用循环挨个处理socket，根本不具有并发能力。

第二种选择(来一个new一个，1对1服务)：你创建30个分身线程，每个分身线程检查一个学生的答案是否正确。 这种类似于为每一个用户创建一个进程或者线程处理连接。

第三种选择(响应式处理，1对多服务)，你站在讲台上等，谁解答完谁举手。这时C、D举手，表示他们解答问题完毕，你下去依次检查C、D的答案，然后继续回到讲台上等。此时E、A又举手，然后去处理E和A。这种就是IO复用模型。Linux下的select、poll和epoll就是干这个的。

###### 再次理解IO多路复用模型

将用户socket对应的[[#^c19157|文件句柄]]注册进epoll，然后epoll帮你监听哪些socket上有消息到达，这样就避免了大量的无用操作。此时的socket应该采用非阻塞模式。这样，整个过程只在调用select、poll、epoll这些调用的时候才会阻塞，收发客户消息是不会阻塞的，整个进程或者线程就被充分利用起来，这就是事件驱动，所谓的reactor反应模式。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303214947.png)

**在单个线程通过记录跟踪每一个Sockek(I/O流)的状态来同时管理多个I/O流**。一个服务端进程可以同时处理多个套接字描述符。目的是尽量多的提高服务器的吞吐能力。

>大家都用过nginx，nginx使用epoll接收请求，ngnix会有很多链接进来， epoll会把他们都监视起来，然后像拨开关一样，谁有数据就拨向谁，然后调用相应的代码处理。redis类似同理，这就是IO多路复用原理，有请求就响应，没请求不打扰。

###### 文件描述符（FD，或句柄）

^c19157

文件描述符（File descriptor）是计算机科学中的一个术语，是一个用于表述指向文件的引用的抽象化概念。文件描述符在形式上是一个非负整数。实际上，它是一个索引值，指向内核为每一个进程所维护的该进程打开文件的记录表。当程序打开一个现有文件或者创建一个新文件时，内核向进程返回一个文件描述符。在程序设计中，文件描述符这一概念往往只适用于UNIX、Linux这样的操作系统。

###### 总结

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303215207.png)

客户端请求服务端时，实际就是在服务端的Socket文件中写入客户端对应的文件描述符(FileDescriptor),如果有多个客户端同时请求服务端，为每次请求分配一个线程，类似每次来都new一个，如此就会比较耗费服务端资源......因此，我们只使用一个线程来监听多个文件描述符，这就是IO多路复用。

**采用多路I/O复用技术可以让单个线程高效的处理多个连接请求一个服务端进程可以同时处理多个套接字描述符。**

## 10.5 Redis为什么这么快？

- Redis使用了[[#^28dbcc|IO多路复用]]
- 单线程命令+redis安装在内存中。

## 10.6 Redis7默认是否开启了多线程？

如果你在实际应用中，发现Redis实例的**CPU开销不大但吞吐量却没有提升**，可以考虑使用Redis7的多线程机制，加速网络处理，进而提升实例的吞吐量。

在Redis6.0及7后，多线程机制默认是关闭的，如果需要使用多线程功能，需要在redis.conf中完成两个设置。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303220856.png)

# 11 BigKey

## 11.1 MoreKey案例

### 1. 大批量往redis里面插入2000W测试数据key

```bash
for((i=1;i<=100*10000;i++)); do echo "set k$i v$i" >> /tmp/redisTest.txt ;done;
```

```bash
cat /tmp/redisTest.txt | redis-cli -h 127.0.0.1 -p 6379 -a 12345678 --pipe
```

### 2. 真实生产案例新闻

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303222757.png)

100万级别数据，keys * 命令将执行21s。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303223029.png)

**生产上如何显示keys * / flushdb / flushall 等危险命令？**

通过配置设置禁用这些命令：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303223327.png)

>【注意】如果AOF文件与RDB文件中已经包含了需要的命令，那么将会启动失败，请将RDB文件与AOF文件删除后再次启动。

### 3. 不用 keys * 避免卡顿，那应该用什么？

**定义**

Scan 命令用于迭代数据库中的数据库键。

SCAN 命令是一个基于游标的迭代器，每次被调用之后， 都会向用户返回一个新的游标， 用户在下次迭代时需要使用这个新游标作为 SCAN 命令的游标参数， 以此来延续之前的迭代过程。

SCAN 返回一个包含两个元素的数组，第一个元素是用于进行下一次迭代的新游标，第二个元素则是一个数组，这个数组中包含了所有被迭代的元素。如果新游标返回零表示迭代已结束。

**SCAN的遍历顺序**

非常特别，==它不是从第一维数组的第零位一直遍历到末尾，而是采用了高位进位加法来遍历==。之所以使用这样特殊的方式进行遍历，是考虑到字典的扩容和缩容时避免槽位的遍历重复和遗漏。

**SCAN的使用方式**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303232543.png)

## 11.2 BigKey案例

### 11.2.1 多大算BigKey？

**阿里开发手册**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303232844.png)

### 11.2.2 BigKey有哪些危害？

- 内存不均，集群迁移困难
- 超时删除，BigKey删除作梗
- 网络流量阻塞

### 11.2.3 如何发现BigKey？

##### 1. redis-cli --bigkeys

**好处，见最下面总结**

给出每种数据结构Top 1 bigkey，同时给出每种数据类型的键值个数+平均大小

**不足**

想查询大于10kb的所有key，`--bigkeys`参数就无能为力了，需要用到 `memory usage` 来计算每个键值的字节数。

```bash
redis-cli -h 127.0.0.1 -p 6379 -a 12345678 --bigkeys

【-i表示每隔100条scan指令就会休眠0.1s，意义不是很大】redis-cli -h 127.0.0.1 -p 7001 –-bigkeys -i 0.1
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303233740.png)

##### 2. memory usage

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303233832.png)

### 11.2.4 如何删除BigKey？

**String**

一般用del,如果过于庞大unlink

**Hash**

使用hscan每次获取少量field-value,再使用hdel删除每个field

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303234433.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303234406.png)

**List**

使用ltrim渐进式逐步删除，直到全部删除完成

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303234752.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303234839.png)

**Set**

使用scan每次获取部分元素，再使用srem命令删除每个元素。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303235617.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230303235632.png)

**Zset**

使用zscan每次获取部分元素，再使用ZREMRANGEBYRANK命令删除每个元素。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304000014.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304000038.png)

### 11.2.5 BigKey生产调优

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304000220.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304000239.png)

### 11.3 面试题

- 阿里广告平台，海量数据里查询某一固定前缀的key
- 小红书，你如何生产上限制keys * / flushdb /flushall 等危险命令以防止误删误用？
- 美团，MEMORY USAGE 命令你用过吗?
- BigKey问题，多大算big?你如何发现?如何删除?如何处理?
- BigKey你做过调优吗?惰性释放lazyfree了解过吗?
- Morekey问题，生产上redis数据库有1000W记录，你如何遍历?key * 可以吗?

# 12 缓存双写一致性之更新策略探讨

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304002148.png)

**双检加锁策略**

```java
@Service
@Slf4j
public class UserService {
    public static final String CACHE_KEY_USER = "user:";
    @Resource
    private UserMapper userMapper;
    @Resource
    private RedisTemplate redisTemplate;

    /**
     * 加强补充，避免突然key失效了，打爆mysql，做一下预防，尽量不出现击穿的情况。
     * @param id
     * @return
     */
    public User findUserById2(Integer id) {
        User user = null;
        String key = CACHE_KEY_USER + id;

        //1 先从redis里面查询，如果有直接返回结果，如果没有再去查询mysql，
        // 第1次查询redis，加锁前
        user = (User) redisTemplate.opsForValue().get(key);
        if (user == null) {
            //2 大厂用，对于高QPS的优化，进来就先加锁，保证一个请求操作，让外面的redis等待一下，避免击穿mysql
            synchronized(UserService.class) {
                //第2次查询redis，加锁后
                user = (User) redisTemplate.opsForValue().get(key);
                //3 二次查redis还是null，可以去查mysql了(mysql默认有数据)
                if (user == null) {
                    //4 查询mysql拿数据(mysql默认有数据)
                    user = userMapper.selectByPrimaryKey(id);
                    if (user == null) {
                        return null;
                    } else {
                        //5 mysql里面有数据的，需要回写redis，完成数据一致性的同步工作
                        redisTemplate.opsForValue().setIfAbsent(key, user, 7 L, TimeUnit.DAYS);
                    }
                }
            }
        }
        return user;
    }

}
```

## 12.1 如何在高并发情况下实现缓存双写？

多个线程同时去查询数据库的这条数据，那么我们可以在第一个查询数据的请求上使用一个互斥锁来锁住它。其他的线程走到这一步拿不到锁就等着，等第一个线程查询到了数据，然后做缓存。后面的线程进来发现已经有缓存了，就直接走缓存。

```java
@Slf4j
public class UserService {
    public static final String CACHE_KEY_USER = "user:";
    @Resource
    private UserMapper userMapper;
    @Resource
    private RedisTemplate redisTemplate;

    /**
     * 业务逻辑没有写错，对于小厂中厂(QPS《=1000)可以使用，但是大厂不行
     * @param id
     * @return
     */
    public User findUserById(Integer id) {
        User user = null;
        String key = CACHE_KEY_USER + id;

        //1 先从redis里面查询，如果有直接返回结果，如果没有再去查询mysql
        user = (User) redisTemplate.opsForValue().get(key);

        if (user == null) {
            //2 redis里面无，继续查询mysql
            user = userMapper.selectByPrimaryKey(id);
            if (user == null) {
                //3.1 redis+mysql 都无数据
                //你具体细化，防止多次穿透，我们业务规定，记录下导致穿透的这个key回写redis
                return user;
            } else {
                //3.2 mysql有，需要将数据写回redis，保证下一次的缓存命中率
                redisTemplate.opsForValue().set(key, user);
            }
        }
        return user;
    }

    /**
     * 加强补充，避免突然key失效了，打爆mysql，做一下预防，尽量不出现击穿的情况。
     * @param id
     * @return
     */
    public User findUserById2(Integer id) {
        User user = null;
        String key = CACHE_KEY_USER + id;

        //1 先从redis里面查询，如果有直接返回结果，如果没有再去查询mysql，
        // 第1次查询redis，加锁前
        user = (User) redisTemplate.opsForValue().get(key);
        if (user == null) {
            //2 大厂用，对于高QPS的优化，进来就先加锁，保证一个请求操作，让外面的redis等待一下，避免击穿mysql
            synchronized(UserService.class) {
                //第2次查询redis，加锁后
                user = (User) redisTemplate.opsForValue().get(key);
                //3 二次查redis还是null，可以去查mysql了(mysql默认有数据)
                if (user == null) {
                    //4 查询mysql拿数据(mysql默认有数据)
                    user = userMapper.selectByPrimaryKey(id);
                    if (user == null) {
                        return null;
                    } else {
                        //5 mysql里面有数据的，需要回写redis，完成数据一致性的同步工作
                        redisTemplate.opsForValue().setIfAbsent(key, user, 7 L, TimeUnit.DAYS);
                    }
                }
            }
        }
        return user;
    }
}
```

## 12.2 数据库和缓存一致性的4种策略

### 12.2.1 先更新数据库，再更新缓存

#### 1. 异常问题1

1. 先更新mysql的某商品的库存，当前商品的库存是100，更新为99个。

2. 先更新mysql修改为99成功，然后更新redis。

3. 此时假设异常出现，更新redis失败了，这导致mysql里面的库存是99而redis里面的还是100 。

4. 上述发生，会让数据库里面和缓存redis里面数据不一致，读到redis脏数据。

#### 2. 异常问题2

A、B两个线程发起调用：

**【正常逻辑】**

1. A update mysql 100
2. A update redis 100
3. B update mysql 80
4. B update redis 80

**【异常逻辑】多线程环境下，A、B两个线程有快有慢，有前有后有并行**

1. A update mysql 100
2. B update mysql 80
3. B update redis 80
4. A update redis 100

最终结果，mysql和redis数据不一致。

### 12.2.2 先更新缓存，再更新数据库

业务上一般把mysql作为底单数据库，保证最后解释。

A、B两个线程发起调用

**【正常逻辑】**

1. A update redis 100
2. A update mysql 100
3. B update redis 80
4. B update mysql 80

**【异常逻辑】多线程环境下，A、B两个线程有快有慢有并行**

1. A update redis  100
2. B update redis  80
3. B update mysql 80
4. A update mysql 100

### 12.2.3 先删除缓存，再更新数据库

1. 请求A进行写操作，删除redis缓存后，工作正在进行中，线程A还么有彻底更新完mysql，还没commit。
2. 请求B进行查询，查询redis发现缓存不存在(被A从redis中删除了)。
3. 请求B继续，去数据库查询得到了mysql中的旧值(A还没有更新完)。
4. 请求B将旧值写回redis缓存。
5. 请求A将新值写入mysql数据库。

| 时间 | 线程A                                                      | 线程B                                                                                     | 出现的问题 |
| ---- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- |
| t1   | 线程A进行写操作，删除缓存成功后，由于一些原因，MySQL还未更新完成 |                                                                                           |            |
| t2   |                                                            | 线程B进行读操作，由于缓存中读取不到数据，读取MySQL，读取到了MySQL中的旧值，并且将旧值写入redis |            |
|    t3  |     此时A已完成数据库的更新                                                      |                                                                                           |   此时Redis是被B写回的旧值，而MySQL是被A更新的新值，出现了数据不一致的问题         |

如果数据库更新失败或超时或返回不及时，导致B线程请求访问缓存时发现Redis里面没数据，缓存缺失，B再去读取MySQL时，从数据库中读取到旧值，还写回Redis，导致A白干了。

#### 延迟双删

##### 什么是延迟双删？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304085803.png)

加上sleep的这段时间，就是为了让线程B能够先从数据库读取数据，再把缺失的数据写入缓存，
然后，线程A再进行删除。所以，==线程A sleep的时间，就需要大于线程B读取数据再写入缓存的时间。==这样一来，其它线程读取数据时，会发现缓存缺失，所以会从数据库中读取最新值。因为这个方案会在第一次删除缓存值后，延迟一段时间再次进行删除，所以我们也把它叫做**延迟双删**。

##### 延迟双删面试题

**删除的休眠该设定多久？**

- 第一种方法：

在业务程序运行的时候，统计下线程读数据和写缓存的操作时间，自行评估自己的项目的读数据业务逻辑的耗时，以此为基础来进行估算。然后写数据的休眠时间则在读数据业务逻辑的耗时基础上加百毫秒即可。这么做的目的，就是确保读请求结束，写请求可以删除读请求造成的缓存脏数据。

- 第二种方法：

新启动一个后台监控程序，比如后面要讲解的WatchDog监控程序，会加时。

**这种同步淘汰策略，吞吐量降低怎么办？**

开启异步确认的线程

```java
@ParameterizedTest  
@CsvSource("1")  
void testDeleteDoubleOrderDelay(String order) throws InterruptedException {  
   // 1. 线程A先删除Redis缓存  
   redisDeleteOrder(order);  
    // 2. 线程A再更新MySQL  
    mySQLUpdateOrder(order);  
    try {  
        CompletableFuture<Long> completableFuture = CompletableFuture.supplyAsync(() -> {  
            return redisDeleteOrder(order);  
        });  
        // 3. 等待执行redisDeleteOrder方法，进行返回值的处理  
        completableFuture.whenComplete((result, exception) -> {  
            log.info("result -> " + result);  
            log.info("exception -> " + exception);  
        });  
        completableFuture.get();  
    } catch (ExecutionException e) {  
        throw new RuntimeException(e);  
    }  
}  
  
Long redisDeleteOrder(String order)  {  
    log.info("---------------Redis-------------");  
    log.info("删除订单中..." + order);  
    log.info("删除成功..." + order);  
    return 1L;  
}  
  
Long mySQLUpdateOrder(String order) throws InterruptedException {  
    log.info("---------------MySQL-------------");  
    log.info("删除订单中..." + order);  
    log.info("删除成功..." + order);  
    TimeUnit.SECONDS.sleep(1);  
    return 1L;  
}
```

>CompletableFuture使用参考：
>https://blog.csdn.net/ChenShiAi/article/details/123913374

### 12.2.4【折中方法】先更新数据库，再删除缓存

| 时间 | 线程A            | 线程B                                 | 出现的问题                                     |
| ---- | ---------------- | ------------------------------------- | ---------------------------------------------- |
| t1   | 更新数据库中的值 |                                       |                                                |
| t2   |                  | 缓存命中，此时线程B读取到的是缓存旧值 | A还没来得及删除缓存的值，导致B缓存命中读到旧值 |
| t3   | 删除缓存的数据   |                                       |                                                | 
**解决方案：**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304102402.png)

1. 可以把要删除的缓存值或者是要更新的数据库值暂存到消息队列中（例如使用Kafka/RabbitMQ等）。
2. 当程序没有能够成功地删除缓存值或者是更新数据库值时，可以从消息队列中重新读取这些值，然后再次进行删除或更新。
3. 如果能够成功地删除或更新，我们就要把这些值从消息队列中去除，以免重复操作，此时，我们也可以保证数据库和缓存的数据一致了，否则还需要再次进行重试
4. 如果重试超过的一定次数后还是没有成功，我们就需要向业务层发送报错信息了，通知运维人员。

### 12.2.5 总结

**如何选择方案？**

在大多数业务场景下，
阳哥个人建议是优先使用先更新数据库，再删除缓存的方案。理由如下：
1. 先删除缓存值再更新数据库，有可能导致请求因缓存缺失而访问数据库，给数据库带来压力导致打满mysql。
2. 如果业务应用中读取数据库和写缓存的时间不好估算，那么，延迟双删中的等待时间就不好设置。

>如果业务层要求必须读取一致性的数据，那么我们就需要在更新数据库时，先在Redis缓存客户端暂停并发读请求，等数据库更新完、缓存值删除后，再读取数据，从而保证数据一致性，这是理论可以达到的效果，但实际，不推荐，因为真实生产环境中，分布式下很难做到实时一致性，一般都是最终一致性，请大家参考。

**一图总结**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304103035.png)

# 13 Redis与MySQL数据双写一致性工程落地案例（Canal）

## 13.1 简介

**canal [kə'næl]**，译意为水道/管道/沟渠，主要用途是基于 MySQL 数据库增量日志解析，提供增量数据订阅和消费。

**工作原理**
-   canal 模拟 MySQL slave 的交互协议，伪装自己为 MySQL slave ，向 MySQL master 发送 dump 协议
-   MySQL master 收到 dump 请求，开始推送 binary log 给 slave (即 canal )
-   canal 解析 binary log 对象(原始为 byte 流)

**MySQL主从复制流程**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304114324.png)

**Canal工作原理**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304114405.png)

## 13.2 实战

### 1. 配置MySQL

```ini
[mysqld]

port=3306

log-bin=mysql-binlog #启用二进制日志

binlog-format=ROW #开启ROW模式

server_id=1 #配置MySQL复制需要定义，注意不要和canal的slaveId重复
```

授权canal连接MySQL账号

```mysql
DROP USER IF EXISTS 'canal'@'%';

CREATE USER 'canal'@'%' IDENTIFIED BY 'canal';

grant all privileges on *.* to 'canal'@'%' with grant option

SELECT * FROM mysql.user;
```

### 2. 配置Canal服务端

配置文件路径：/Users/venda/Environment/canal.deployer-1.1.6/conf/example
```properties
# MySQL数据库的用户名
canal.instance.dbUsername=canal
# MySQL数据库的用户密码
canal.instance.dbPassword=canal
# MySQL数据库的服务器
canal.instance.master.address=127.0.0.1:3306
```

### 3. 启动Canal服务器

```bash
cd /Users/venda/Environment/canal.deployer-1.1.6/bin
./startup.sh
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230304180513.png)

### 4. Canal客户端编写

```sql
CREATE TABLE `t_user` (
	`id` bigint(20) NOT NULL AUTO_INCREMENT,
	`userName` varchar(100) NOT NULL,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4
```

```XML
<properties>  
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>  
    <maven.compiler.source>1.8</maven.compiler.source>  
    <maven.compiler.target>1.8</maven.compiler.target>  
    <junit.version>4.12</junit.version>  
    <log4j.version>1.2.17</log4j.version>  
    <lombok.version>1.16.18</lombok.version>  
    <mysql.version>5.1.47</mysql.version>  
    <druid.version>1.1.16</druid.version>  
    <mapper.version>4.1.5</mapper.version>  
    <mybatis.spring.boot.version>1.3.0</mybatis.spring.boot.version>  
    <maven.compiler.source>11</maven.compiler.source>  
    <maven.compiler.target>11</maven.compiler.target>  
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>  
</properties>  
  
<dependencies>  
    <!--canal-->  
    <dependency>  
        <groupId>com.alibaba.otter</groupId>  
        <artifactId>canal.client</artifactId>  
        <version>1.1.0</version>  
    </dependency>  
  
    <!--SpringBoot通用依赖模块-->  
    <dependency>  
        <groupId>org.springframework.boot</groupId>  
        <artifactId>spring-boot-starter-web</artifactId>  
    </dependency>  
    <dependency>  
        <groupId>org.springframework.boot</groupId>  
        <artifactId>spring-boot-starter-actuator</artifactId>  
    </dependency>  
  
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
  
    <!--SpringBoot与Redis整合依赖-->  
    <dependency>  
        <groupId>org.springframework.boot</groupId>  
        <artifactId>spring-boot-starter-data-redis</artifactId>  
    </dependency>  
  
    <dependency>  
        <groupId>org.apache.commons</groupId>  
        <artifactId>commons-pool2</artifactId>  
    </dependency>  
  
    <!--SpringBoot与AOP-->  
    <dependency>  
        <groupId>org.springframework.boot</groupId>  
        <artifactId>spring-boot-starter-aop</artifactId>  
    </dependency>  
  
    <dependency>  
        <groupId>org.aspectj</groupId>  
        <artifactId>aspectjweaver</artifactId>  
    </dependency>  
  
    <!--Mysql数据库驱动-->  
  
    <dependency>  
        <groupId>mysql</groupId>  
        <artifactId>mysql-connector-java</artifactId>  
        <version>5.1.47</version>  
    </dependency>  
  
    <!--SpringBoot集成druid连接池-->  
  
    <dependency>  
        <groupId>com.alibaba</groupId>  
        <artifactId>druid-spring-boot-starter</artifactId>  
        <version>1.1.10</version>  
    </dependency>  
  
    <dependency>  
        <groupId>com.alibaba</groupId>  
        <artifactId>druid</artifactId>  
        <version>${druid.version}</version>  
    </dependency>  
  
    <!--mybatis和springboot整合-->  
  
    <dependency>  
        <groupId>org.mybatis.spring.boot</groupId>  
        <artifactId>mybatis-spring-boot-starter</artifactId>  
        <version>${mybatis.spring.boot.version}</version>  
    </dependency>  
  
    <!--通用基础配置junit/devtools/test/log4j/lombok/hutool-->  
  
    <!--hutool-->  
    <dependency>  
        <groupId>cn.hutool</groupId>  
        <artifactId>hutool-all</artifactId>  
        <version>5.2.3</version>  
    </dependency>  
  
    <dependency>  
        <groupId>junit</groupId>  
        <artifactId>junit</artifactId>  
        <version>${junit.version}</version>  
    </dependency>  
  
    <dependency>  
        <groupId>org.springframework.boot</groupId>  
        <artifactId>spring-boot-starter-test</artifactId>  
        <scope>test</scope>  
    </dependency>  
  
    <dependency>  
        <groupId>log4j</groupId>  
        <artifactId>log4j</artifactId>  
        <version>${log4j.version}</version>  
    </dependency>  
  
    <dependency>  
        <groupId>org.projectlombok</groupId>  
        <artifactId>lombok</artifactId>  
        <version>${lombok.version}</version>  
        <optional>true</optional>  
    </dependency>  
  
    <!--persistence-->  
    <dependency>  
        <groupId>javax.persistence</groupId>  
        <artifactId>persistence-api</artifactId>  
        <version>1.0.2</version>  
    </dependency>  
  
    <!--通用Mapper-->  
    <dependency>  
        <groupId>tk.mybatis</groupId>  
        <artifactId>mapper</artifactId>  
        <version>${mapper.version}</version>  
    </dependency>  
  
    <dependency>  
        <groupId>org.springframework.boot</groupId>  
        <artifactId>spring-boot-autoconfigure</artifactId>  
    </dependency>  
  
    <dependency>  
        <groupId>redis.clients</groupId>  
        <artifactId>jedis</artifactId>  
        <version>3.8.0</version>  
    </dependency>  
</dependencies>  
  
<build>  
    <plugins>  
        <plugin>  
            <groupId>org.springframework.boot</groupId>  
            <artifactId>spring-boot-maven-plugin</artifactId>  
        </plugin>  
    </plugins>  
</build>
```

```properties
server.port=5555
# ========================alibaba.druid=====================
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/bigdata?useUnicode=true&characterEncoding=utf-8&useSSL=false
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.druid.test-while-idle=false
```

```java
package com.duoduo;  
  
import com.alibaba.fastjson.JSONObject;  
import com.alibaba.otter.canal.client.CanalConnector;  
import com.alibaba.otter.canal.client.CanalConnectors;  
import com.alibaba.otter.canal.common.utils.AddressUtils;  
import com.alibaba.otter.canal.protocol.CanalEntry.*;  
import com.alibaba.otter.canal.protocol.Message;  
import com.duoduo.util.RedisUtils;  
import redis.clients.jedis.Jedis;  
import java.net.InetSocketAddress;  
import java.util.List;  
import java.util.UUID;  
import java.util.concurrent.TimeUnit;  
/**  
 * @author lianwenda  
 * @description description  
 * @since 2023/3/5  
 */public class RedisCanalClientExample {  
  
    public static final Integer _60SECONDS = 60;  
  
    // 配置文件路径：/Users/venda/Environment/canal.deployer-1.1.6/conf/canal.properties  
    public static final String CANAL_SERVER_IP = "127.0.0.1";  
    public static final Integer CANAL_SERVER_PORT = 11111;  
  
    private static void redisInsert(List<Column> columns)  
    {  
        JSONObject jsonObject = new JSONObject();  
        for (Column column : columns)  
        {  
            System.out.println(column.getName() + " : " + column.getValue() + "    update=" + column.getUpdated());  
            jsonObject.put(column.getName(),column.getValue());  
        }  
        if(columns.size() > 0)  
        {  
            try(Jedis jedis = RedisUtils.getJedis())  
            {  
                jedis.set(columns.get(0).getValue(),jsonObject.toJSONString());  
            }catch (Exception e){  
                e.printStackTrace();  
            }  
        }  
    }  
  
  
    private static void redisDelete(List<Column> columns)  
    {  
        JSONObject jsonObject = new JSONObject();  
        for (Column column : columns)  
        {  
            jsonObject.put(column.getName(),column.getValue());  
        }  
        if(columns.size() > 0)  
        {  
            try(Jedis jedis = RedisUtils.getJedis())  
            {  
                jedis.del(columns.get(0).getValue());  
            }catch (Exception e){  
                e.printStackTrace();  
            }  
        }  
    }  
  
    private static void redisUpdate(List<Column> columns)  
    {  
        JSONObject jsonObject = new JSONObject();  
        for (Column column : columns)  
        {  
            System.out.println(column.getName() + " : " + column.getValue() + "    update=" + column.getUpdated());  
            jsonObject.put(column.getName(),column.getValue());  
        }  
        if(columns.size() > 0)  
        {  
            try(Jedis jedis = RedisUtils.getJedis())  
            {  
                jedis.set(columns.get(0).getValue(),jsonObject.toJSONString());  
                System.out.println("---------update after: "+jedis.get(columns.get(0).getValue()));  
            }catch (Exception e){  
                e.printStackTrace();  
            }  
        }  
    }  
  
    public static void printEntry(List<Entry> entrys) {  
        for (Entry entry : entrys) {  
            if (entry.getEntryType() == EntryType.TRANSACTIONBEGIN || entry.getEntryType() == EntryType.TRANSACTIONEND) {  
                continue;  
            }  
  
            RowChange rowChage = null;  
            try {  
                //获取变更的row数据  
                rowChage = RowChange.parseFrom(entry.getStoreValue());  
            } catch (Exception e) {  
                throw new RuntimeException("ERROR ## parser of eromanga-event has an error,data:" + entry.toString(),e);  
            }  
            //获取变动类型  
            EventType eventType = rowChage.getEventType();  
            System.out.println(String.format("================&gt; binlog[%s:%s] , name[%s,%s] , eventType : %s",  
                    entry.getHeader().getLogfileName(), entry.getHeader().getLogfileOffset(),  
                    entry.getHeader().getSchemaName(), entry.getHeader().getTableName(), eventType));  
  
            for (RowData rowData : rowChage.getRowDatasList()) {  
                if (eventType == EventType.INSERT) {  
                    redisInsert(rowData.getAfterColumnsList());  
                } else if (eventType == EventType.DELETE) {  
                    redisDelete(rowData.getBeforeColumnsList());  
                } else {//EventType.UPDATE  
                    redisUpdate(rowData.getAfterColumnsList());  
                }  
            }  
        }  
    }  
  
    public static void main(String[] args)  
    {  
        System.out.println("---------O(∩_∩)O哈哈~ initCanal() main方法-----------");  
  
        //=================================  
        // 创建链接canal服务端  
        CanalConnector connector = CanalConnectors.newSingleConnector(new InetSocketAddress(CANAL_SERVER_IP, CANAL_SERVER_PORT), "example", "canal", "canal");  
        int batchSize = 1000;  
        //空闲空转计数器  
        int emptyCount = 0;  
        System.out.println("---------------------canal init OK，开始监听mysql变化------");  
        try {  
            connector.connect();  
            //connector.subscribe(".*\\..*");  
            connector.subscribe("canal.t_user");  
            connector.rollback();  
            int totalEmptyCount = 10 * _60SECONDS;  
            while (emptyCount < totalEmptyCount) {  
                System.out.println("我是canal，每秒一次正在监听:"+ UUID.randomUUID().toString());  
                Message message = connector.getWithoutAck(batchSize); // 获取指定数量的数据  
                long batchId = message.getId();  
                int size = message.getEntries().size();  
                if (batchId == -1 || size == 0) {  
                    emptyCount++;  
                    try { TimeUnit.SECONDS.sleep(1); } catch (InterruptedException e) { e.printStackTrace(); }  
                } else {  
                    //计数器重新置零  
                    emptyCount = 0;  
                    printEntry(message.getEntries());  
                }  
                connector.ack(batchId); // 提交确认  
                // connector.rollback(batchId); // 处理失败, 回滚数据  
            }  
            System.out.println("已经监听了"+totalEmptyCount+"秒，无任何消息，请重启重试......");  
        } finally {  
            connector.disconnect();  
        }  
    }  
}
```

# 14 Bitmap / Hyperloglog / GEO 实战


## 14.1 Hyperloglog

**UV**

Unique Visitor（独立访客，一般理解为客户端IP）

>需要考虑去重，即一个IP计算一次。

**PV**

Page View（页面浏览量）

>不需要考虑去重，点击一次算一次

**DAU**

Daily Active User（日活跃用户量）

常用于反映网站、互联网应用或者网络游戏的运营情况，登录或者使用了某个产品的用户数

>去重复登录的用户

**MAU**

月活跃用户量

**常用场景**

- 每日注册 IP 数。
- 每日访问 IP 数。
- 页面实时访问数 PV。
- 访问用户数 UV。

**能不能使用HashMap？**

按照ipv4的结构来说明，每个ipv4的地址最多是15个字节，例如"192.168.130.210";
一天要占用 1.5亿 * 15个字节 = 2G，一个月60G。

**为什么要使用Hyperloglog？**

Redis HyperLogLog是用来做基数统计的算法，HyperLogLog的优点是，在输入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定的、并且是很小的。
在Redis里面，每个HyperLogLog键只需要花费[[#^6774d4|12KB内存]]，就可以计算接近 2^64 个不同元素的基数。这和计算基数时，元素越多耗费内存就越多的集合形成鲜明对比。
但是，因为HyperLogLog 只会根据输入元素来计算基数，而不会储存输入元素本身，所以HyperLogLog不能像集合那样，返回输入的各个元素。

**为什么Hyperloglog只要花费12KB？** ^6774d4

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230305171624.png)

Redis使用了2^14=16384个桶，按照上面的标准差，误差为0.81%，精度相当高。Redis使用一个long型哈希值的前14个比特位用来确定桶编号，剩下的50个比特位用来做基数估计。而2^6=64，所以只需要用6个比特表示下标值，在一般情况下，一个HLL数据结构占用内存的大小为 16384 * 6 / 8 = 12kB，Redis将这种情况称为密集(dense)存储。

**Hyperloglog算法参考**

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230305200824.png)

>Hyperloglog算法描述：https://cloud.tencent.com/developer/article/1598395
  Hyperloglog在线统计：http://content.research.neustar.biz/blog/hll.html

**实战案例**

**HyperloglogService**

```java
@Service
@ Slf4j
public class HyperLogLogService {
    @Resource
    private RedisTemplate redisTemplate;

    /**
     * 模拟后台有用户点击首页，每个用户来自不同ip地址
     */
    @PostConstruct
    public void init() {
        log.info("------模拟后台有用户点击首页，每个用户来自不同ip地址");
        new Thread(() - > {
            String ip = null;
            for (int i = 1; i <= 200; i++) {
                Random r = new Random();
                ip = r.nextInt(256) + "." + r.nextInt(256) + "." + r.nextInt(256) + "." + r.nextInt(256);

                Long hll = redisTemplate.opsForHyperLogLog().add("hll", ip);
                log.info("ip={},该ip地址访问首页的次数={}", ip, hll);
                //暂停几秒钟线程
                try {
                    TimeUnit.SECONDS.sleep(3);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "t1").start();
    }

}
```

**HyperloglogController**

```java
@Api(description = "淘宝亿级UV的Redis统计方案")
@RestController
@Slf4j
public class HyperLogLogController
{
    @Resource
    private RedisTemplate redisTemplate;

    @ApiOperation("获得IP去重后的首页访问量")
    @RequestMapping(value = "/uv",method = RequestMethod.GET)
    public long uv()
    {
        //pfcount
        return redisTemplate.opsForHyperLogLog().size("hll");
    }

}
```

## 14.2 GEO

**常用场景**

- 交友软件中附近的人
- 外卖软件中附近的美食店铺
- 打车软件附近的车辆

- GEOADD：添加经纬度坐标
- GEOPOS：返回经纬度
- GEOHASH：返回坐标的geohash表示
- GEODIST：两个位置之间距离
- GEORADIUS：以给定的经纬度为中心， 返回键包含的位置元素当中， 与中心的距离不超过给定最大距离的所有位置元素。
- GEORADIUSBYMEMBER：找出位于指定范围内的元素，中心点是由给定的位置元素决定

**GeoContoller**

```java
@Api(tags = "美团地图位置附近的酒店推送GEO")
@RestController
@Slf4j
public class GeoController
{
    @Resource
    private GeoService geoService;

    @ApiOperation("添加坐标geoadd")
    @RequestMapping(value = "/geoadd",method = RequestMethod.GET)
    public String geoAdd()
    {
        return geoService.geoAdd();
    }

    @ApiOperation("获取经纬度坐标geopos")
    @RequestMapping(value = "/geopos",method = RequestMethod.GET)
    public Point position(String member)
    {
        return geoService.position(member);
    }

    @ApiOperation("获取经纬度生成的base32编码值geohash")
    @RequestMapping(value = "/geohash",method = RequestMethod.GET)
    public String hash(String member)
    {
        return geoService.hash(member);
    }

    @ApiOperation("获取两个给定位置之间的距离")
    @RequestMapping(value = "/geodist",method = RequestMethod.GET)
    public Distance distance(String member1, String member2)
    {
        return geoService.distance(member1,member2);
    }

    @ApiOperation("通过经度纬度查找北京王府井附近的")
    @RequestMapping(value = "/georadius",method = RequestMethod.GET)
    public GeoResults radiusByxy()
    {
        return geoService.radiusByxy();
    }

    @ApiOperation("通过地方查找附近,本例写死天安门作为地址")
    @RequestMapping(value = "/georadiusByMember",method = RequestMethod.GET)
    public GeoResults radiusByMember()
    {
        return geoService.radiusByMember();
    }

}
```

**GeoService**

```java
@Service
@Slf4j
public class GeoService
{
    public static final String CITY ="city";

    @Autowired
    private RedisTemplate redisTemplate;

    public String geoAdd()
    {
        Map<String, Point> map= new HashMap<>();
        map.put("天安门",new Point(116.403963,39.915119));
        map.put("故宫",new Point(116.403414 ,39.924091));
        map.put("长城" ,new Point(116.024067,40.362639));

        redisTemplate.opsForGeo().add(CITY,map);

        return map.toString();
    }

    public Point position(String member) {
        //获取经纬度坐标
        List<Point> list= this.redisTemplate.opsForGeo().position(CITY,member);
        return list.get(0);
    }


    public String hash(String member) {
        //geohash算法生成的base32编码值
        List<String> list= this.redisTemplate.opsForGeo().hash(CITY,member);
        return list.get(0);
    }


    public Distance distance(String member1, String member2) {
        //获取两个给定位置之间的距离
        Distance distance= this.redisTemplate.opsForGeo().distance(CITY,member1,member2, RedisGeoCommands.DistanceUnit.KILOMETERS);
        return distance;
    }

    public GeoResults radiusByxy() {
        //通过经度，纬度查找附近的,北京王府井位置116.418017,39.914402
        Circle circle = new Circle(116.418017, 39.914402, Metrics.KILOMETERS.getMultiplier());
        //返回50条
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs().includeDistance().includeCoordinates().sortAscending().limit(50);
        GeoResults<RedisGeoCommands.GeoLocation<String>> geoResults= this.redisTemplate.opsForGeo().radius(CITY,circle, args);
        return geoResults;
    }

    public GeoResults radiusByMember() {
        //通过地方查找附近
        String member="天安门";
        //返回50条
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs().includeDistance().includeCoordinates().sortAscending().limit(50);
        //半径10公里内
        Distance distance=new Distance(10, Metrics.KILOMETERS);
        GeoResults<RedisGeoCommands.GeoLocation<String>> geoResults= this.redisTemplate.opsForGeo().radius(CITY,member, distance,args);
        return geoResults;
    }
}
```

## 14.3 Bitmap

**常用场景：**
- 日活统计
- 连续签到打卡
- 最近一周的活跃用户
- 统计指定用户一年之中的登陆天数
- 某用户按照一年365天，哪几天登陆过？哪几天没有登陆？全年中登录的天数共计多少？

**实战：**
结合[[#^533ed8|布隆过滤器]]

# 15 布隆过滤器

^9edeb7

**常用场景**

- 现有50亿个电话号码，现有10万个电话号码，如何要快速准确的判断这些电话号码是否已经存在?判断是否存在
- 安全连接网址，全球数10亿的网址判断
- 黑名单校验，识别垃圾邮件
- 白名单校验，识别出合法用户进行后续处理
- ==解决缓存穿透的问题，和redis结合bitmap==


## 15.1 布隆过滤器是什么？

布隆过滤器（Bloom Filter）是 1970 年由布隆提出的。它实际上是一个很长的二进制向量和一系列随机映射函数。布隆过滤器可以用于检索一个元素是否在一个集合中。它的优点是空间效率和查询时间都比一般的算法要好的多，缺点是有一定的误识别率和删除困难。

==一个元素如果判断结果：存在时，元素不一定存在，但是判断结果为不存在时，则一定不存在。==

## 15.2 布隆过滤器原理

布隆过滤器(Bloom Filter) 是一种专门用来解决去重问题的高级数据结构。

实质就是一个大型**位数组**和几个不同的无偏hash函数(无偏表示分布均匀)。由一个初值都为零的bit数组和多个个哈希函数构成，用来快速判断某个数据是否存在。但是跟 HyperLogLog 一样，它也一样有那么一点点不精确，也存在一定的[[#^056182|误判概率]]。

当我们向布隆过滤器中添加数据时，为了尽量地址不冲突，会使用多个 hash 函数对 key 进行运算，算得一个下标索引值，然后对位数组长度进行取模运算得到一个位置，每个 hash 函数都会算得一个不同的位置。再把位数组的这几个位置都置为 1 就完成了 add 操作。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230305231133.png)

**为什么布隆过滤器会存在误判？** ^056182

向布隆过滤器查询某个key是否存在时，先把这个 key 通过相同的多个 hash 函数进行运算，查看对应的位置是否都为 1，只要有一个位为零，那么说明布隆过滤器中这个 key 不存在；如果这几个位置全都是 1，那么说明极有可能存在；因为这些位置的 1 可能是因为其他的 key 存在导致的，也就是Hash冲突

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230305231420.png)

布隆过滤器做个标记。当缓存缺失后，应用查询数据库时，可以通过查询布隆过滤器快速判断数据是否存在。如果不存在，就不用再去数据库中查询了。这样一来，即使发生缓存穿透了，大量请求只会查询Redis和布隆过滤器，而不会积压到数据库，也就不会影响数据库的正常运行。**布隆过滤器可以使用Redis实现，本身就能承担较大的并发访问压力。**

**布隆过滤器为什么不要删除？**

布隆过滤器的误判是指多个输入经过哈希之后在相同的bit位置1了，这样就无法判断究竟是哪个输入产生的，因此误判的根源在于相同的 bit 位被多次映射且置 1。这种情况也造成了布隆过滤器的删除问题，因为布隆过滤器的每一个 bit 并不是独占的，很有可能多个元素共享了某一位。如果我们直接删除这一位的话，会影响其他的元素

**特性**

布隆过滤器可以添加元素，但是不能删除元素。因为删掉元素会导致误判率增加。

## 15.3 总结

1. **当布隆过滤器查出来有，那么可能有该数据；如果查出来无此数据，那么一定无该数据。**
2. 使用时最好不要让实际元素数量远大于初始化数量，一次给够避免扩容。
3. 当实际元素数量超过初始化数量时，应该对布隆过滤器进行重建，重新分配一个size更大的过滤器，再将所有的历史元素批量 add 进行。

## 15.4 布隆过滤器适用场景

1. **可以使用布隆过滤器解决缓存穿透的问题**

	把已存在数据的key存在布隆过滤器中，相当于redis前面挡着一个布隆过滤器。
	当有新的请求时，先到布隆过滤器中查询是否存在：如果布隆过滤器中不存在该条数据则直接返回；如果布隆过滤器中已存在，才去查询缓存redis，如果redis里没查询到则再查询Mysql数据库。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230305232400.png)


2. **黑名单校验，识别垃圾邮件**

	发现存在黑名单中的，就执行特定操作。比如：识别垃圾邮件，只要是邮箱在黑名单中的邮件，就识别为垃圾邮件。假设黑名单的数量是数以亿计的，存放起来就是非常耗费存储空间的，布隆过滤器则是一个较好的解决方案。把所有黑名单都放在布隆过滤器中，在收到邮件时，判断邮件地址是否在布隆过滤器中即可。

## 15.5 实战

^533ed8

**流程图**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230306194107.png)

**Service实现**

```java
@Service  
@Slf4j  
public class CustomerService {  
  
    public static final String CACHE_KEY_CUSTOMER = "customer:";  
    private static final String WHITE_CUSTOMER = "whiteCustomer:";  
  
  
    @Resource  
    private CustomerMapper customerMapper;  
    @Resource  
    private RedisTemplate redisTemplate;  
    @Resource  
    private CheckUtils checkUtils;  
  
    public void addCustomer(Customer customer) {  
        int i = customerMapper.insertSelective(customer);  
        if (i > 0) {  
            Integer id = customer.getId();  
            String key = CACHE_KEY_CUSTOMER + id;  
            redisTemplate.opsForValue().set(key, customer);  
        }  
    }  

    public Customer findCustomerById(Integer customerId) {  
        String key = CACHE_KEY_CUSTOMER + customerId;  
        // 布隆过滤器check，若未在白名单中发现，那么肯定不在白名单，否则可能在  
        if (!checkUtils.checkWithBloomFilter(WHITE_CUSTOMER, key)) {  
            log.info("白名单无此顾客，不允许访问");  
            return null;  
        }  
        Customer customer = (Customer) redisTemplate.opsForValue().get(key);  
        if (customer == null) {  
            customer = customerMapper.selectByPrimaryKey(customerId);  
            if (customer != null) {  
                redisTemplate.opsForValue().set(key, customer);  
            }  
        }  
        return customer;  
    }  
}
```

**布隆过滤器实现** ^36542c

```java
@Slf4j  
@Component  
public class BloomFilterInit {  
  
    private static final String WHITE_CUSTOMER = "whiteCustomer:";  
  
    @Resource  
    private RedisTemplate redisTemplate;  
  
    @PostConstruct  
    public void init() {  
        // 1. 白名单加载到布隆过滤器  
        String key = "customer:12";  
        // 2. 计算hashValue，由于存在计算出来负数对可能，我们取绝对值  
        int hashValue = Math.abs(key.hashCode());  
        // 3. 通过hashValue和2^32取余，获得对应对下标坑位  
        long index = (long) (hashValue % Math.pow(2, 32));  
        log.info("{}对应对坑位index:{}", key, index);  
        // 设置redis里面的bitmap对应类型白名单:whitelistCustomer的坑位，将该值设置为1  
        redisTemplate.opsForValue().setBit(WHITE_CUSTOMER, index, true);  
    }  
}
```

**检查是否在布隆过滤器中存在**

```java
@Slf4j  
@Component  
public class CheckUtils {  
  
    @Resource  
    private RedisTemplate redisTemplate;  
  
    public Boolean checkWithBloomFilter(String checkItem, String key) {  
        int hashValue = Math.abs(key.hashCode());  
        long index = (long) (hashValue % Math.pow(2, 32));  
        Boolean existKey = redisTemplate.opsForValue().getBit(checkItem, index);  
        log.info("{}对应下标为{}，是否存在查询结果为{}", key, index, existKey);  
        return existKey;  
    }  
}
```

## 15.6 布隆过滤器的优缺点

**优点**

高效地插入和查询，内存占用bit空间少。

**缺点**

1. 不能删除元素
	因为删掉元素会导致误判率增加，因为hash冲突同一个位置可能存的东西是多个共有的，你删除一个元素的同时可能也把其它的删除了。

2. 存放误判，不能精准过滤
	有，是很可能有
	无，是肯定无，100%无

# 16 缓存预热+缓存雪崩+缓存击穿+缓存穿透

## 16.1 缓存预热

**什么是预热？**

msyql假如新增100条记录，一般默认以mysql为准作为底单数据，如何同步给redis (布隆过滤器) 这100条合法数据？

**为什么需要预热？**

基于用户体验，比如电商平台做618促销，那么最好的方式就是先将商品写进缓存，不用让用户体验较差。

**如何预热？**

1. 只对mysql做了数据新增，利用redis的回写机制，让它逐步实现100条新增记录的同步最好提前晚上部署发布版本的时候，由自己人提前手动触发缓存（比如逐个点击商品），让redis同步了，不要把这个步骤留给客户，会造成加载很慢。
2. 通过中间件或者程序（在工具类加上@PostConstruct初始化白名单数据，参考[[#^36542c|布隆过滤器]]）自行完成。

## 16.2 缓存雪崩

**缓存雪崩是怎么发生的？**

硬件方面：redis主机挂了， Redis全盘崩溃。
软件方面：redis中有大量key同时过期大面积失效。

**预防**

1. redis中key设置为永不过期or过期时间
2. redis缓存集群实现高可用
	1. 主从+哨兵
	2. Redis集群
	3. 开启Redis持久化机制 AOF / RDB，尽快恢复缓存集群
3. 多缓存结合预防雪崩：ehcache本地缓存+redis缓存
4. 服务降级：Hystrix或者sentinel限流&降级

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230306200903.png)

## 16.3 缓存穿透

### 16.3.1 定义

缓存穿透是指查询一个一定不存在的数据

由于缓存是不命中时需要从数据库查询，查不到数据则不写入缓存，这将导致这个不存在的数据每次请求都要到数据库去查询，进而给数据库带来压力。

### 16.3.2 如何解决？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230306201412.png)

#### 方式一：将 空对象/缺省值 塞入缓存

当Redis根据key值查找不到，并且MySQL也查询不到时，系统会将在Redis中缓存一个空对象/缺省值在该key上。之后相同的key再来查询后，便不会在MySQL服务器进行数据的查询。

>【注意】设置失效时间

>【缺陷】只能解决相同Key访问的问题，加入攻击者是用不同的Key，那么此方法效果甚微。

#### Google布隆过滤器Guava解决缓存穿透

Guava中布隆过滤器的实现算是比较权威的，所以实际项目中我们可以直接使用Guava布隆过滤器

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230306210414.png)

##### 方式二：Guava布隆过滤器实现白名单

**POM**

```xml
<!--guava Google 开源的 Guava 中自带的布隆过滤器-->
<dependency>
	<groupId>com.google.guava</groupId>
	<artifactId>guava</artifactId>
	<version>23.0</version>
</dependency>
```

**Service**

```java
@Slf4j  
@Service  
public class GuavaBloomFilterService {  
  
    private static final int ONE_THOUSAND = 10000;  
    // guava布隆过滤器初始容量  
    private static final int INIT_SIZE = 100 * ONE_THOUSAND;  
    // 误判率：它越小，误判的个数就越少  
    // 当误判率越小，占用的资源越多，guava布隆过滤器默认就是为0.03  
    private static double fpp = 0.03;  
    // 创建Guava过滤器  
    private static BloomFilter<Integer> bloomFilter = BloomFilter.create(Funnels.integerFunnel(), INIT_SIZE, fpp);  
  
    public void guavaBloomFilter() {  
        // 加入100w条数据进白名单  
        for (int i = 0; i < INIT_SIZE; i++) {  
            bloomFilter.put(i);  
        }  
        // 故意取10w条不在合法范围内的数据，进行误判率的演示  
        ArrayList<Integer> list = new ArrayList<>(10 * ONE_THOUSAND);  
  
        // 3. 验证  
        for (int i = 0; i < INIT_SIZE + (10 * ONE_THOUSAND); i++) {  
            boolean exist = bloomFilter.mightContain(i);  
            if (exist) {  
                log.info("{} 元素被误判了", i);  
                list.add(i);  
            }  
        }  
        log.info("误判总数量：{}", list.size());  
    }  
}
```

>【课外话】
>Guava布隆过滤器在存入了 100W 条数据后，该对象占用的大小约为819KB，换算下来，每个元素只占用了0.9byte，100M的内存可存放11亿的数据，所以不用担心造成内存的占用太大的问题。

[[计算Java对象占用的内存大小]]

##### Guava实现白名单

**POM**

```xml
<!--guava Google 开源的 Guava 中自带的布隆过滤器-->
<dependency>
	<groupId>com.google.guava</groupId>
	<artifactId>guava</artifactId>
	<version>23.0</version>
</dependency>
```

**用户推荐实现逻辑**

```java
@Slf4j  
@Api("用户观看视频推荐")  
@RestController  
public class VideoRecommendController {  
  
    @Resource  
    BloomFilter userRecommendBloomFilter;  
  
    @ApiOperation("传入用户id，获取推荐视频")  
    @GetMapping("/user/recommend/{id}")  
    public List<String> getRecommendVideo(@PathVariable("id") String userId) {  
        List<String> recommendVideoList = new ArrayList<>();  
        Random random = new Random();  
        int retryCount = 0;     // 重试次数，假如15次都没有一条视频，那么退出循环直接返回  
        while (recommendVideoList.size() < 5 && retryCount < 15) {  
            // 模拟数据库，生成10条视频给用户  
            String videoId = random.nextInt(50) + "";  
            String key = userId + ":" + videoId;  
            retryCount++;  
            boolean videoHasRecommend = userRecommendBloomFilter.mightContain(key);  
            log.info("视频x{}判断是否存在结果为{}", videoId, videoHasRecommend);  
            // 如果布隆过滤器中包含了此视频，说明视频被推荐过了，不再予以推荐  
            if (!videoHasRecommend) {  
                userRecommendBloomFilter.put(key);  
                recommendVideoList.add(videoId);  
            }  
        }  
        return recommendVideoList;  
    }  
}
```

**布隆过滤器配置**

```java
@Configuration  
public class BloomFilterConfig {  
  
    private static final int INIT_SIZE = 10_000_000;  
    private static final double FPP = 0.03;  
  
    @Bean  
    public BloomFilter<String> userRecommendBloomFilter() {  
        BloomFilter<String> charSequenceBloomFilter = BloomFilter.create(Funnels.stringFunnel(StandardCharsets.UTF_8), INIT_SIZE, FPP);  
        return charSequenceBloomFilter;  
    }  
  
}
```

## 16.4 缓存击穿

### 16.4.1 定义

大量的请求同时查询一个key时，此时这个key正好失效了，就会导致大量的请求都打到数据库上面去。

高频访问的redis热点key失效。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230306224240.png)


### 16.4.2 如何解决？

**方式一：差异失效时间**

对于访问频繁的热点key，干脆就不设置过期时间，而是通过建立一个热点key的备份，备份key比热点key的失效时间迟。

**方式二：互斥更新，采用双检加锁策略**

多个线程同时去查询数据库的这条数据，那么我们可以在第一个查询数据的请求上使用一个 互斥锁来锁住它。

其他的线程走到这一步拿不到锁就等着，等第一个线程查询到了数据，然后做缓存。后面的线程进来发现已经有缓存了，就直接走缓存。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230306231649.png)

### 16.4.3 如何产生的缓存击穿？

**背景**

>淘宝的聚划算，每次点击都会产生20笔数据，这个是如何实现的？
>
>淘宝定期将数据库中要在聚划算展示的20笔商品放入缓存，并且设置失效时间。

**（不安全的）实现方式如下：**

```java
@RestController
@Slf4j
@Api(tags = "聚划算商品列表接口")
public class JHSProductController
{
    public  static final String JHS_KEY="jhs";
    public  static final String JHS_KEY_A="jhs:a";
    public  static final String JHS_KEY_B="jhs:b";

    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * 分页查询：在高并发的情况下，只能走redis查询，走db的话必定会把db打垮
     * @param page
     * @param size
     * @return
     */
    @RequestMapping(value = "/pruduct/find",method = RequestMethod.GET)
    @ApiOperation("按照分页和每页显示容量，点击查看")
    public List<Product> find(int page, int size) {
        List<Product> list=null;

        long start = (page - 1) * size;
        long end = start + size - 1;

        try {
            //采用redis list数据结构的lrange命令实现分页查询
            list = this.redisTemplate.opsForList().range(JHS_KEY, start, end);
            if (CollectionUtils.isEmpty(list)) {
                //TODO 走DB查询
            }
            log.info("查询结果：{}", list);
        } catch (Exception ex) {
            //这里的异常，一般是redis瘫痪 ，或 redis网络timeout
            log.error("exception:", ex);
            //TODO 走DB查询
        }
        return list;
    }
}
```

```java
@Slf4j
@Service
public class JHSTaskService
{
    public  static final String JHS_KEY="jhs";
    public  static final String JHS_KEY_A="jhs:a";
    public  static final String JHS_KEY_B="jhs:b";

    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * 模拟从数据库读取100件特价商品，用于加载到聚划算的页面中
     * @return
     */
    private List<Product> getProductsFromMysql() {
        List<Product> list=new ArrayList<>();
        for (int i = 1; i <=20; i++) {
            Random rand = new Random();
            int id= rand.nextInt(10000);
            Product obj=new Product((long) id,"product"+i,i,"detail");
            list.add(obj);
        }
        return list;
    }

    //@PostConstruct
    public void initJHS(){
        log.info("启动定时器淘宝聚划算功能模拟.........."+ DateUtil.now());
        new Thread(() -> {
            //模拟定时器，定时把数据库的特价商品，刷新到redis中
            while (true){
                //模拟从数据库读取100件特价商品，用于加载到聚划算的页面中
                List<Product> list=this.getProductsFromMysql();
                //采用redis list数据结构的lpush来实现存储
                this.redisTemplate.delete(JHS_KEY);
                //lpush命令
                this.redisTemplate.opsForList().leftPushAll(JHS_KEY,list);
                //间隔一分钟 执行一遍
                try { TimeUnit.MINUTES.sleep(1); } catch (InterruptedException e) { e.printStackTrace(); }

                log.info("runJhs定时刷新..............");
            }
        },"t1").start();
    }
}
```

>由于 （把缓存中的商品列表删除） 与 （将新商品加入缓存）这两个操作不是原子性的，所以会将缓存中的元素删除了但是还未把商品加入缓存的情况，此时热点key失效，从而导致缓存击穿！！

**处于性能考虑（双检加锁会降低），采用差异失效时间防止缓存击穿**

```java
@RestController
@Slf4j
@Api(tags = "聚划算商品列表接口")
public class JHSProductController
{
    public  static final String JHS_KEY="jhs";
    public  static final String JHS_KEY_A="jhs:a";
    public  static final String JHS_KEY_B="jhs:b";

    @Autowired
    private RedisTemplate redisTemplate;

    @RequestMapping(value = "/pruduct/findab",method = RequestMethod.GET)
    @ApiOperation("防止热点key突然失效，AB双缓存架构")
    public List<Product> findAB(int page, int size) {
        List<Product> list=null;
        long start = (page - 1) * size;
        long end = start + size - 1;
        try {
            //采用redis list数据结构的lrange命令实现分页查询
            list = this.redisTemplate.opsForList().range(JHS_KEY_A, start, end);
            if (CollectionUtils.isEmpty(list)) {
                log.info("=========A缓存已经失效了，记得人工修补，B缓存自动延续5天");
                //用户先查询缓存A(上面的代码)，如果缓存A查询不到（例如，更新缓存的时候删除了），再查询缓存B
                this.redisTemplate.opsForList().range(JHS_KEY_B, start, end);
                //TODO 走DB查询
            }
            log.info("查询结果：{}", list);
        } catch (Exception ex) {
            //这里的异常，一般是redis瘫痪 ，或 redis网络timeout
            log.error("exception:", ex);
            //TODO 走DB查询
        }
        return list;
    }
}
```

```java
@Service
@Slf4j
public class JHSTaskService
{
    public  static final String JHS_KEY="jhs";
    public  static final String JHS_KEY_A="jhs:a";
    public  static final String JHS_KEY_B="jhs:b";

    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * 模拟从数据库读取100件特价商品，用于加载到聚划算的页面中
     * @return
     */
    private List<Product> getProductsFromMysql() {
        List<Product> list=new ArrayList<>();
        for (int i = 1; i <=20; i++) {
            Random rand = new Random();
            int id= rand.nextInt(10000);
            Product obj=new Product((long) id,"product"+i,i,"detail");
            list.add(obj);
        }
        return list;
    }

    @PostConstruct
    public void initJHSAB(){
        log.info("启动AB定时器计划任务淘宝聚划算功能模拟.........."+DateUtil.now());
        new Thread(() -> {
            //模拟定时器，定时把数据库的特价商品，刷新到redis中
            while (true){
                //模拟从数据库读取100件特价商品，用于加载到聚划算的页面中
                List<Product> list=this.getProductsFromMysql();
                //先更新B缓存
                this.redisTemplate.delete(JHS_KEY_B);
                this.redisTemplate.opsForList().leftPushAll(JHS_KEY_B,list);
                this.redisTemplate.expire(JHS_KEY_B,20L,TimeUnit.DAYS);
                //再更新A缓存
                this.redisTemplate.delete(JHS_KEY_A);
                this.redisTemplate.opsForList().leftPushAll(JHS_KEY_A,list);
                this.redisTemplate.expire(JHS_KEY_A,15L,TimeUnit.DAYS);
                //间隔一分钟 执行一遍
                try { TimeUnit.MINUTES.sleep(1); } catch (InterruptedException e) { e.printStackTrace(); }
                log.info("runJhs定时刷新双缓存AB两层..............");
            }
        },"t1").start();
    }
}

```

## 16.5 总结

![](https://raw.githubusercontent.com/michik0/notes-image/master/20230306233115.png)

# 17 手写Redis分布式锁

**锁的种类**

`单机版同一个JVM虚拟机内`：synchronized或者Lock接口。
`分布式多个不同JVM虚拟机`：单机的线程锁机制不再起作用，资源类在不同的服务器之间共享了。

**设置分布式锁**

`set key value [EX seconds] [PX milliseconds] [NX|XX]`

## 17.2 为什么需要分布式锁？

**整体架构**

订单模块有2个节点，由库存模块去访问库存模块，进行库存的减少

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230307150121.png)

### 17.2.1 给程序加普通锁

```java
@Service
@Slf4j
public class InventoryService
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Value("${server.port}")
    private String port;

    private Lock lock = new ReentrantLock();

    public String sale()
    {
        String retMessage = "";
        lock.lock();
        try
        {
            //1 查询库存信息
            String result = stringRedisTemplate.opsForValue().get("inventory001");
            //2 判断库存是否足够
            Integer inventoryNumber = result == null ? 0 : Integer.parseInt(result);
            //3 扣减库存
            if(inventoryNumber > 0) {
                stringRedisTemplate.opsForValue().set("inventory001",String.valueOf(--inventoryNumber));
                retMessage = "成功卖出一个商品，库存剩余: "+inventoryNumber;
                System.out.println(retMessage);
            }else{
                retMessage = "商品卖完了，o(╥﹏╥)o";
            }
        }finally {
            lock.unlock();
        }
        return retMessage+"\t"+"服务端口号："+port;
    }
}
```

**普通锁造成的问题**

用Jmeter在1S中发送100个请求，发现库存不正常，由于系统总库存为100，高并发下，库存变为12，发生一个商品被卖出去2次的情况。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230307150755.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230307150822.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230307150844.png)

**为什么会造成加了锁还没控制住？**

在==单机环境==下，可以使用synchronized或Lock来实现。但是在分布式系统中，因为竞争的线程可能不在同一个节点上（同一个jvm中），所以需要一个让所有进程都能访问到的锁来实现(比如redis或者zookeeper来构建)

不同进程jvm层面的锁就不管用了，那么可以利用第三方的一个组件，来获取锁，未获取到锁，则阻塞当前想要运行的线程。

### 17.2.2 不完美的Redis的分布式锁（一）

```java
@Service
@Slf4j
public class InventoryService
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Value("${server.port}")
    private String port;

    private Lock lock = new ReentrantLock();

    public String sale()
    {
        String retMessage = "";
        String key = "zzyyRedisLock";
        String uuidValue = IdUtil.simpleUUID()+":"+Thread.currentThread().getId();
        while(!stringRedisTemplate.opsForValue().setIfAbsent(key, uuidValue)){
            //暂停20毫秒，类似CAS自旋，避免[[#^d8400c|虚假唤醒]]
            try { TimeUnit.MILLISECONDS.sleep(20); } catch (InterruptedException e) { e.printStackTrace(); }
        }
        try
        {
            //1 查询库存信息
            String result = stringRedisTemplate.opsForValue().get("inventory001");
            //2 判断库存是否足够
            Integer inventoryNumber = result == null ? 0 : Integer.parseInt(result);
            //3 扣减库存
            if(inventoryNumber > 0) {
                stringRedisTemplate.opsForValue().set("inventory001",String.valueOf(--inventoryNumber));
                retMessage = "成功卖出一个商品，库存剩余: "+inventoryNumber;
                System.out.println(retMessage);
            }else{
                retMessage = "商品卖完了，o(╥﹏╥)o";
            }
        }finally {
            stringRedisTemplate.delete(key);
        }
        return retMessage+"\t"+"服务端口号："+port;
    }
}
```




### 17.2.3 不完美的分布式锁（二）

**存在的问题**

>在 `分布式锁（一）` 中，如果我们的服务器在处理业务逻辑的时候==服务器宕机==了怎么办？
>那么我们无法进行分布式锁的释放，从而导致一直存在锁，其他进程无法进行加锁！

```java
// 获取分布式锁
try{
	// TODO 业务逻辑
} catch(Exception e) {
	// TODO 异常处理
} finally {
	// 释放分布式锁
}
```

**如何解决？**

>加入过期机制，为分布式锁设置过期时间

```java
@Service
@Slf4j
public class InventoryService
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Value("${server.port}")
    private String port;

    private Lock lock = new ReentrantLock();

    public String sale()
    {
        String retMessage = "";
        String key = "zzyyRedisLock";
        String uuidValue = IdUtil.simpleUUID()+":"+Thread.currentThread().getId();

		// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ 新增了过期机制 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
        while(!stringRedisTemplate.opsForValue().setIfAbsent(key, uuidValue,30L,TimeUnit.SECONDS))
        // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ 新增了过期机制 ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
        {
            //暂停毫秒
            try { TimeUnit.MILLISECONDS.sleep(20); } catch (InterruptedException e) { e.printStackTrace(); }
        }

        try
        {
            //1 查询库存信息
            String result = stringRedisTemplate.opsForValue().get("inventory001");
            //2 判断库存是否足够
            Integer inventoryNumber = result == null ? 0 : Integer.parseInt(result);
            //3 扣减库存
            if(inventoryNumber > 0) {
                stringRedisTemplate.opsForValue().set("inventory001",String.valueOf(--inventoryNumber));
                retMessage = "成功卖出一个商品，库存剩余: "+inventoryNumber;
                System.out.println(retMessage);
            }else{
                retMessage = "商品卖完了，o(╥﹏╥)o";
            }
        }finally {
            stringRedisTemplate.delete(key);
        }
        return retMessage+"\t"+"服务端口号："+port;
    }
}
```

### 17.2.4 不完美的分布式锁（三）

**存在的问题**

>在 `分布式锁（二）` 中如果实际的业务处理时间如果超过了默认设置key的过期时间呢？
>那么将导致在执行完业务后，业务A将释放了业务B所生成的分布式锁！
>【举个例子】
>线程1生成的分布式过期后（此时线程1的业务还未完成），线程2生成分布式锁，此时线程1执行完成，并且自己释放了分布式锁（此时这个锁被线程2占用）删了线程2的锁！）

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230307212051.png)

**如何解决？**

```java
@Service
@Slf4j
public class InventoryService
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Value("${server.port}")
    private String port;

    private Lock lock = new ReentrantLock();

    public String sale()
    {
        String retMessage = "";
        String key = "zzyyRedisLock";
        // ↓↓↓↓↓↓↓ 将VALUE关联当前线程ID，确保每个线程生成的分布式锁的VALUE不同 ↓↓↓↓↓↓↓
        String uuidValue = IdUtil.simpleUUID()+":"+Thread.currentThread().getId();
		// ↑↑↑↑↑↑↑ 将Key关联当前线程ID，确保每个线程生成的分布式锁的KEY不同 ↑↑↑↑↑↑↑
        while(!stringRedisTemplate.opsForValue().setIfAbsent(key, uuidValue,30L,TimeUnit.SECONDS))
        {
            //暂停毫秒
            try { TimeUnit.MILLISECONDS.sleep(20); } catch (InterruptedException e) { e.printStackTrace(); }
        }
        try
        {
            //1 查询库存信息
            String result = stringRedisTemplate.opsForValue().get("inventory001");
            //2 判断库存是否足够
            Integer inventoryNumber = result == null ? 0 : Integer.parseInt(result);
            //3 扣减库存
            if(inventoryNumber > 0) {
                stringRedisTemplate.opsForValue().set("inventory001",String.valueOf(--inventoryNumber));
                retMessage = "成功卖出一个商品，库存剩余: "+inventoryNumber+"\t"+uuidValue;
                System.out.println(retMessage);
            }else{
                retMessage = "商品卖完了，o(╥﹏╥)o";
            }
        }finally {
        // ↓↓↓↓↓↓↓ 取出分布式锁，如果VALUE为当前线程，那么删除，否则不删除 ↓↓↓↓↓↓↓
            if(stringRedisTemplate.opsForValue().get(key).equalsIgnoreCase(uuidValue)){
                stringRedisTemplate.delete(key);
            }
		// ↑↑↑↑↑↑↑ 取出分布式锁，如果VALUE为当前线程，那么删除，否则不删除 ↑↑↑↑↑↑↑
        }
        return retMessage+"\t"+"服务端口号："+port;
    }
}
```

### 17.2.5 不完美的分布式锁（四）

**存在的问题**

>在 `分布式锁（三）` 中，由于我们的在释放锁的时候是通过2个命令：get(key)、delete(key)，这个操作不是原子的，所以会存在并发问题，所以要将其变为原子的。

**如何解决？**

采用Lua脚本

```java
@Service
@Slf4j
public class InventoryService
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Value("${server.port}")
    private String port;

    private Lock lock = new ReentrantLock();

    public String sale()
    {
        String retMessage = "";
        String key = "zzyyRedisLock";
        String uuidValue = IdUtil.simpleUUID()+":"+Thread.currentThread().getId();

        while(!stringRedisTemplate.opsForValue().setIfAbsent(key, uuidValue,30L,TimeUnit.SECONDS))
        {
            //暂停毫秒
                     try { TimeUnit.MILLISECONDS.sleep(20); } catch (InterruptedException e) { e.printStackTrace(); }
        }

        try
        {
            //1 查询库存信息
            String result = stringRedisTemplate.opsForValue().get("inventory001");
            //2 判断库存是否足够
            Integer inventoryNumber = result == null ? 0 : Integer.parseInt(result);
            //3 扣减库存
            if(inventoryNumber > 0) {
                stringRedisTemplate.opsForValue().set("inventory001",String.valueOf(--inventoryNumber));
                retMessage = "成功卖出一个商品，库存剩余: "+inventoryNumber+"\t"+uuidValue;
                System.out.println(retMessage);
            }else{
                retMessage = "商品卖完了，o(╥﹏╥)o";
            }
        }finally {
            // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ 使用Lua脚本↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
            String luaScript =
                    "if (redis.call('get',KEYS[1]) == ARGV[1]) then " +
                        "return redis.call('del',KEYS[1]) " +
                    "else " +
                        "return 0 " +
                    "end";
            stringRedisTemplate.execute(new DefaultRedisScript<>(luaScript, Boolean.class), Arrays.asList(key), uuidValue);
            // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ 使用Lua脚本↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
        }
        return retMessage+"\t"+"服务端口号："+port;
    }
}
```




### 17.2.6 不完美的分布式锁（五）

>在 `分布式锁（四）` 中，看似乎一切都很完美了，但是我们还没有考虑到可重入锁
>如果我们在业务中还有嵌套个方法，该方法同样也需要生成分布式锁，那么就会进入死锁！！

**可重入锁**

可重入锁又名递归锁

是指在同一个线程在外层方法获取锁的时候，再进入该线程的内层方法会自动获取锁(前提，锁对象得是同一个对象)，不会因为之前已经获取过还没释放而阻塞，这样的锁就叫可重入锁。

与可重入锁相反，不可重入锁不可递归调用，递归调用就发生死锁。

**隐式锁（即synchronized关键字使用的锁）默认是可重入锁**

在一个synchronized修饰的方法或代码块的内部调用本类的其他synchronized修饰的方法或代码块时，是永远可以得到锁的。

```java
public class ReEntryLockDemo
{
    public static void main(String[] args)
    {
        final Object objectLockA = new Object();

        new Thread(() -> {
            synchronized (objectLockA)
            {
                System.out.println("-----外层调用");
                synchronized (objectLockA)
                {
                    System.out.println("-----中层调用");
                    synchronized (objectLockA)
                    {
                        System.out.println("-----内层调用");
                    }
                }
            }
        },"a").start();
    }
}
```

```java
public class ReEntryLockDemo
{
    public synchronized void m1()
    {
        System.out.println("-----m1");
        m2();
    }
    public synchronized void m2()
    {
        System.out.println("-----m2");
        m3();
    }
    public synchronized void m3()
    {
        System.out.println("-----m3");
    }

    public static void main(String[] args)
    {
        ReEntryLockDemo reEntryLockDemo = new ReEntryLockDemo();

        reEntryLockDemo.m1();
    }
}
```

**如何解决？**

>参考AQS的做法，线程中存在有state属性：
>	- 当上锁时，state++；
>	- 当释放锁时，state--；
>一般而言，你要lock几次，就要unlock几次

我们将分布式锁变为Hash数据类型进行存储：
`hset redis {锁名字} {请求线程的UUID+ThreadID} {加锁的次数}`

**完整的代码结构**

业务Service
```java
@Service
@Slf4j
public class InventoryService
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Value("${server.port}")
    private String port;
    @Autowired
    private DistributedLockFactory distributedLockFactory;

    public String sale()
    {
        String retMessage = "";
        // 工厂模式生成分布分布式锁
        Lock redisLock = distributedLockFactory.getDistributedLock("redis");
        // 获得分布式锁
        redisLock.lock();
        try
        {
            //1 查询库存信息
            String result = stringRedisTemplate.opsForValue().get("inventory001");
            //2 判断库存是否足够
            Integer inventoryNumber = result == null ? 0 : Integer.parseInt(result);
            //3 扣减库存
            if(inventoryNumber > 0) {
                stringRedisTemplate.opsForValue().set("inventory001",String.valueOf(--inventoryNumber));
                retMessage = "成功卖出一个商品，库存剩余: "+inventoryNumber;
                System.out.println(retMessage);
                // ======= 用来测试当前锁是否为可重入锁============
                this.testReEnter();
            }else{
                retMessage = "商品卖完了，o(╥﹏╥)o";
            }
        }catch (Exception e){
            e.printStackTrace();
        }finally {
	        // 释放分布式锁
            redisLock.unlock();
        }
        return retMessage+"\t"+"服务端口号："+port;
    }

    private void testReEnter()
    {
        Lock redisLock = distributedLockFactory.getDistributedLock("redis");
        redisLock.lock();
        try
        {
            System.out.println("################测试可重入锁####################################");
        }finally {
            redisLock.unlock();
        }
    }
}
```

分布式锁工厂
```java
@Component
public class DistributedLockFactory
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    private String lockName;
    private String uuidValue;

    public DistributedLockFactory()
    {
        this.uuidValue = IdUtil.simpleUUID();//UUID
    }

    public Lock getDistributedLock(String lockType)
    {
        if(lockType == null) return null;

        if(lockType.equalsIgnoreCase("REDIS")){
            lockName = "zzyyRedisLock";
            return new RedisDistributedLock(stringRedisTemplate,lockName,uuidValue);
        } else if(lockType.equalsIgnoreCase("ZOOKEEPER")){
            //TODO zookeeper版本的分布式锁实现
            return new ZookeeperDistributedLock();
        } else if(lockType.equalsIgnoreCase("MYSQL")){
            //TODO mysql版本的分布式锁实现
            return null;
        }
        return null;
    }
}
```

分布式锁实现
```java
public class RedisDistributedLock implements Lock
{
    private StringRedisTemplate stringRedisTemplate;
    private String lockName;
    private String uuidValue;
    private long   expireTime;

    public RedisDistributedLock(StringRedisTemplate stringRedisTemplate, String lockName,String uuidValue)
    {
        this.stringRedisTemplate = stringRedisTemplate;
        this.lockName = lockName;
        this.uuidValue = uuidValue+":"+Thread.currentThread().getId();
        this.expireTime = 30L;
    }

    @Override
    public void lock()
    {
        this.tryLock();
    }
    @Override
    public boolean tryLock()
    {
        try
        {
            return this.tryLock(-1L,TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException
    {
        if(time != -1L)
        {
            expireTime = unit.toSeconds(time);
        }

        String script =
                "if redis.call('exists',KEYS[1]) == 0 or redis.call('hexists',KEYS[1],ARGV[1]) == 1 then " +
                    "redis.call('hincrby',KEYS[1],ARGV[1],1) " +
                    "redis.call('expire',KEYS[1],ARGV[2]) " +
                    "return 1 " +
                "else " +
                    "return 0 " +
                "end";
        System.out.println("lockName: "+lockName+"\t"+"uuidValue: "+uuidValue);

        while (!stringRedisTemplate.execute(new DefaultRedisScript<>(script, Boolean.class), Arrays.asList(lockName), uuidValue, String.valueOf(expireTime)))
        {
            try { TimeUnit.MILLISECONDS.sleep(60); } catch (InterruptedException e) { e.printStackTrace(); }
        }

        return true;
    }

    @Override
    public void unlock()
    {
        String script =
                "if redis.call('HEXISTS',KEYS[1],ARGV[1]) == 0 then " +
                    "return nil " +
                "elseif redis.call('HINCRBY',KEYS[1],ARGV[1],-1) == 0 then " +
                    "return redis.call('del',KEYS[1]) " +
                "else " +
                        "return 0 " +
                "end";
        System.out.println("lockName: "+lockName+"\t"+"uuidValue: "+uuidValue);
        Long flag = stringRedisTemplate.execute(new DefaultRedisScript<>(script, Long.class), Arrays.asList(lockName), uuidValue, String.valueOf(expireTime));
        if(flag == null)
        {
            throw new RuntimeException("没有这个锁，HEXISTS查询无");
        }
    }

    //=========================================================
    @Override
    public void lockInterruptibly() throws InterruptedException
    {

    }
    @Override
    public Condition newCondition()
    {
        return null;
    }
}
```


### 17.2.7 不完整的分布式锁（六）

>在 `分布式锁（五）` 中，我们将原本的分布式锁改为了Hash数据类型存储，但是我们重新思考一个问题，假如业务在锁时效期间还未处理完，怎么办？

**解决办法**

加入一个监听的线程，当我们生成锁的时候，我们就生成一个对应的线程专门用来监控该锁是否释放，如果未释放，说明业务还未完成，我们继续延长该锁的失效时间。

```java
public class RedisDistributedLock implements Lock
{
    private StringRedisTemplate stringRedisTemplate;

    private String lockName;//KEYS[1]
    private String uuidValue;//ARGV[1]
    private long   expireTime;//ARGV[2]

    public RedisDistributedLock(StringRedisTemplate stringRedisTemplate,String lockName,String uuidValue)
    {
        this.stringRedisTemplate = stringRedisTemplate;
        this.lockName = lockName;
        this.uuidValue = uuidValue+":"+Thread.currentThread().getId();
        this.expireTime = 30L;
    }
    @Override
    public void lock()
    {
        tryLock();
    }

    @Override
    public boolean tryLock()
    {
        try {tryLock(-1L,TimeUnit.SECONDS);} catch (InterruptedException e) {e.printStackTrace();}
        return false;
    }

    /**
     * 实现加锁功能
     * @param time
     * @param unit
     * @return
     * @throws InterruptedException
     */
    @Override
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException
    {
        if(time != -1L)
        {
            this.expireTime = unit.toSeconds(time);
        }

        String script =
                "if redis.call('exists',KEYS[1]) == 0 or redis.call('hexists',KEYS[1],ARGV[1]) == 1 then " +
                        "redis.call('hincrby',KEYS[1],ARGV[1],1) " +
                        "redis.call('expire',KEYS[1],ARGV[2]) " +
                        "return 1 " +
                        "else " +
                        "return 0 " +
                        "end";

        System.out.println("script: "+script);
        System.out.println("lockName: "+lockName);
        System.out.println("uuidValue: "+uuidValue);
        System.out.println("expireTime: "+expireTime);

        while (!stringRedisTemplate.execute(new DefaultRedisScript<>(script,Boolean.class), Arrays.asList(lockName),uuidValue,String.valueOf(expireTime))) {
            TimeUnit.MILLISECONDS.sleep(50);
        }
        this.renewExpire();
        return true;
    }

    /**
     * 实现解锁功能
     */
    @Override
    public void unlock()
    {
        String script =
                "if redis.call('HEXISTS',KEYS[1],ARGV[1]) == 0 then " +
                        "   return nil " +
                        "elseif redis.call('HINCRBY',KEYS[1],ARGV[1],-1) == 0 then " +
                        "   return redis.call('del',KEYS[1]) " +
                        "else " +
                        "   return 0 " +
                        "end";
        // nil = null
        // 1 = true
        // 0 = false
        System.out.println("lockName: "+lockName);
        System.out.println("uuidValue: "+uuidValue);
        System.out.println("expireTime: "+expireTime);
        Long flag = stringRedisTemplate.execute(new DefaultRedisScript<>(script, Long.class), Arrays.asList(lockName),uuidValue,String.valueOf(expireTime));
        if(flag == null)
        {
            throw new RuntimeException("This lock doesn't EXIST");
        }
    }

	// ↓↓↓↓↓↓↓↓↓↓↓↓开启监听线程，如事务未处理完完成，延长锁的时间↓↓↓↓↓↓↓↓↓↓↓↓
    private void renewExpire()
    {
        String script =
                "if redis.call('HEXISTS',KEYS[1],ARGV[1]) == 1 then " +
                        "return redis.call('expire',KEYS[1],ARGV[2]) " +
                        "else " +
                        "return 0 " +
                        "end";
        new Timer().schedule(new TimerTask()
        {
            @Override
            public void run()
            {
                if (stringRedisTemplate.execute(new DefaultRedisScript<>(script, Boolean.class), Arrays.asList(lockName),uuidValue,String.valueOf(expireTime))) {
                    renewExpire();
                }
            }
        },(this.expireTime * 1000)/3);
    }
	// ↑↑↑↑↑↑↑↑↑↑↑↑↑↑开启监听线程，如事务未处理完完成，延长锁的时间↑↑↑↑↑↑↑↑↑↑↑↑↑↑

    //以下的方法分布式锁暂时用不到
    @Override
    public void lockInterruptibly() throws InterruptedException
    {

    }

    @Override
    public Condition newCondition()
    {
        return null;
    }
}
```

# 18 Redlock算法和底层源码分析

## 18.1 为什么需要Redlock红锁？

>在 `分布式锁（六）` 中，看似都很完美，但是如果在master上锁，但是在

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230308104847.png)

1. 线程 1 首先获取锁成功，将键值对写入 redis 的 master 节点在 redis 将该键值对同步到 slave 节点之前，master 发生了故障。
2. redis 触发故障转移，其中一个 slave 升级为新的 master，此时新上位的master并不包含线程1写入的键值对，因此线程 2 尝试获取锁也可以成功拿到锁。
3. 此时相当于有两个线程获取到了锁，可能会导致各种预期之外的情况发生，例如最常见的脏数据。

我们加的是排它独占锁，同一时间只能有一个建redis锁成功并持有锁，严禁出现2个以上的请求线程拿到锁。

## 18.2 什么是Redlock？

^7fc5f4

锁变量由多个实例维护，即使有实例发生了故障，锁变量仍然是存在的，客户端还是可以完成锁操作。

Redlock算法是实现高可靠分布式锁的一种有效解决方案，可以在实际开发中使用。

假设我们有N个Redis主节点，例如 N = 5这些节点是完全独立的，我们不使用复制或任何其他隐式协调系统，为了取到锁客户端执行以下操作：
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230308111215.png)

该方案为了解决数据不一致的问题，直接舍弃了异步复制只使用 master 节点，同时由于舍弃了 slave，为了保证可用性，引入了 N 个节点，官方建议是 5。

>客户端只有在满足下面的这两个条件时，才能认为是加锁成功。
>【条件1】客户端从超过半数（大于等于N/2+1）的Redis实例上成功获取到了锁；
>【条件2】客户端获取锁的总耗时没有超过锁的有效时间。

## 18.3 Redisson：RedissonLock

基于Redis的Redisson红锁 `RedissonRedLock` 对象实现了[[#^7fc5f4|Redlock]]介绍的加锁算法。该对象也可以用来将多个 `RLock` 对象关联为一个红锁，每个RLock对象实例可以来自于不同的Redisson实例。

```java
RLock lockl = redissonInstancel.getLock("lock1"); 
RLock lock2 = redissonInstance2.getLock("lock2"); 
RLock lock3 = redissonInstance3.getLock("lock3");

RedissonRedLock lock = new RedissonRedLock(lock1, lock2, lock3);
// 同时加锁：lock1，lock2，lock3
//红锁在大部分节点上加锁成功就算成功。
lock.lock();
// TODO 业务逻辑
lock.unlock();
```

大家都知道，如果负责储存某些分布式锁的某些Redis节点宕机以后，而且这些锁正好处于锁住的状态时，这些锁会出现锁死的状态。为了避免这种情况的发生， Redisson内部提供了一个监控锁的看门狗，它的作用是在Redisson实例被关闭前，不断的延长锁的有效期。默认情况下，看门狗的检查锁的超时时间是30秒钟，也可以通过修改`Config.lockWatchdogTimeout`来另行指定。

另外Redisson还通过加锁的方法提供了`leaseTime`的参数来指定加锁的时间。超过这个时间后锁便自动解开了。

```java
RedissonRedLock lock = new RedissonRedLock(lock1, lock2,lock3);
//给lock1, lock2, lock3加锁，如果没有手动解开的话，10秒钟后将会自动解开
lock.lock(10, TimeUnit.SECONDS);

//为加锁等待100秒时间，并在加锁成功10秒钟后自动解开
boolean res = lock.tryLock(100，10, TimeUnit.SECONDS);
// TODO 业务逻辑
lock.unlock();
```

**实战**

```xml
<!--redisson-->
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson</artifactId>
    <version>3.13.4</version>
</dependency>
```

```java
@Configuration
public class RedisConfig
{
    @Bean
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory lettuceConnectionFactory)
    {
        RedisTemplate<String,Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(lettuceConnectionFactory);
        //设置key序列化方式string
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        //设置value的序列化方式json
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        redisTemplate.setHashKeySerializer(new StringRedisSerializer());
        redisTemplate.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());

        redisTemplate.afterPropertiesSet();

        return redisTemplate;
    }

    //单Redis节点模式
    @Bean
    public Redisson redisson()
    {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://192.168.111.175:6379").setDatabase(0).setPassword("111111");
        return (Redisson) Redisson.create(config);
    }
}
```

```java
@RestController
@Api(tags = "redis分布式锁测试")
public class InventoryController
{
    @Autowired
    private InventoryService inventoryService;

    @ApiOperation("扣减库存，一次卖一个")
    @GetMapping(value = "/inventory/sale")
    public String sale()
    {
        return inventoryService.sale();
    }

    @ApiOperation("扣减库存saleByRedisson，一次卖一个")
    @GetMapping(value = "/inventory/saleByRedisson")
    public String saleByRedisson()
    {
        return inventoryService.saleByRedisson();
    }
}
```

```java
@Service
@Slf4j
public class InventoryService
{
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Value("${server.port}")
    private String port;
    @Autowired
    private DistributedLockFactory distributedLockFactory;

    @Autowired
    private Redisson redisson;
    public String saleByRedisson()
    {
        String retMessage = "";
        String key = "zzyyRedisLock";
        RLock redissonLock = redisson.getLock(key);
        redissonLock.lock();
        try
        {
            //1 查询库存信息
            String result = stringRedisTemplate.opsForValue().get("inventory001");
            //2 判断库存是否足够
            Integer inventoryNumber = result == null ? 0 : Integer.parseInt(result);
            //3 扣减库存
            if(inventoryNumber > 0) {
                stringRedisTemplate.opsForValue().set("inventory001",String.valueOf(--inventoryNumber));
                retMessage = "成功卖出一个商品，库存剩余: "+inventoryNumber;
                System.out.println(retMessage);
            }else{
                retMessage = "商品卖完了，o(╥﹏╥)o";
            }
        }finally {
            if(redissonLock.isLocked() && redissonLock.isHeldByCurrentThread())
            {
                redissonLock.unlock();
            }
        }
        return retMessage+"\t"+"服务端口号："+port;
    }
}
```

## 18.4 红锁原理

![未命名绘图.drawio.png](https://raw.githubusercontent.com/michik0/notes-image/master/%E6%9C%AA%E5%91%BD%E5%90%8D%E7%BB%98%E5%9B%BE.drawio.png)

## 18.5 多重锁

>可惜的是RedissonLock不再推荐使用，建议使用的是多重锁

基于Redis 的分布式 `Multilock` 对象允许将Lock对象分组并将它们作为单个锁处理。每个RLock 对象可能属于不同的Redisson实例。

`MultiLock` 如果获取崩溃的 Redisson 实例 `Multilock` 可能会永远挂在获取状态。为了避免这种情况，Redisson会维护锁看门狗，它会在锁持有者Redisson实例处于活动状态时延长锁到期时间。默认情况下，锁定看门狗超时为30秒，可以通过Config.lockWatchdogTimeout设置进行更改。

`leaseTime` 可以定义获取锁期间的参数。在指定的时间间隔后，锁定的锁将自动释放，

`MultiLock` 对象的行为符合Java Lock规范， 这意味着只有锁所有者线程才能解锁它
否则 `IllegalMonitorStateException` 会被抛出。否则考虑使用 `RSemaphore` 对象。

**代码示例**

```java
RLock lock1 = redisson1.getLock("lock1");
RLock lock2 = redisson2.getLock("lock2");
RLock lock3 = redisson3.getLock("lock3");
RLock multiLock = anyRedisson.getMultiLock(lock1, lock2, lock3); 
// traditional lock method
multilock.lock();

// or acquire lock and automatically unlock it after 10 seconds multilock.
lock(10, TimeUnit.SECONDS);

// or wait for lock aquisition up to 100 seconds
// and automatically unlock it after 10 seconds
boolean res = multilock.trylock(100, 10, TimeUnit.SECONDS); 
if (res){
	try{
		// TODO 业务逻辑
	} finally {
	multiLock.unlock();
}
```

**配置**

```java
@Configuration
@EnableConfigurationProperties(RedisProperties.class)
public class CacheConfiguration {

    @Autowired
    RedisProperties redisProperties;

    @Bean
    RedissonClient redissonClient1() {
        Config config = new Config();
        String node = redisProperties.getSingle().getAddress1();
        node = node.startsWith("redis://") ? node : "redis://" + node;
        SingleServerConfig serverConfig = config.useSingleServer()
                .setAddress(node)
                .setTimeout(redisProperties.getPool().getConnTimeout())
                .setConnectionPoolSize(redisProperties.getPool().getSize())
                .setConnectionMinimumIdleSize(redisProperties.getPool().getMinIdle());
        if (StringUtils.isNotBlank(redisProperties.getPassword())) {
            serverConfig.setPassword(redisProperties.getPassword());
        }
        return Redisson.create(config);
    }

    @Bean
    RedissonClient redissonClient2() {
        Config config = new Config();
        String node = redisProperties.getSingle().getAddress2();
        node = node.startsWith("redis://") ? node : "redis://" + node;
        SingleServerConfig serverConfig = config.useSingleServer()
                .setAddress(node)
                .setTimeout(redisProperties.getPool().getConnTimeout())
                .setConnectionPoolSize(redisProperties.getPool().getSize())
                .setConnectionMinimumIdleSize(redisProperties.getPool().getMinIdle());
        if (StringUtils.isNotBlank(redisProperties.getPassword())) {
            serverConfig.setPassword(redisProperties.getPassword());
        }
        return Redisson.create(config);
    }

    @Bean
    RedissonClient redissonClient3() {
        Config config = new Config();
        String node = redisProperties.getSingle().getAddress3();
        node = node.startsWith("redis://") ? node : "redis://" + node;
        SingleServerConfig serverConfig = config.useSingleServer()
                .setAddress(node)
                .setTimeout(redisProperties.getPool().getConnTimeout())
                .setConnectionPoolSize(redisProperties.getPool().getSize())
                .setConnectionMinimumIdleSize(redisProperties.getPool().getMinIdle());
        if (StringUtils.isNotBlank(redisProperties.getPassword())) {
            serverConfig.setPassword(redisProperties.getPassword());
        }
        return Redisson.create(config);
    }
}
```

```java
@Data
@ConfigurationProperties(prefix = "spring.redis", ignoreUnknownFields = false)
public class RedisProperties {

    private int database;

    /**
     * 等待节点回复命令的时间。该时间从命令发送成功时开始计时
     */
    private int timeout;

    private String password;

    private String mode;

    /**
     * 池配置
     */
    private RedisPoolProperties pool;

    /**
     * 单机信息配置
     */
    private RedisSingleProperties single;

}
```

```java
@Data
public class RedisPoolProperties {

    private int maxIdle;

    private int minIdle;

    private int maxActive;

    private int maxWait;

    private int connTimeout;

    private int soTimeout;

    /**
     * 池大小
     */
    private  int size;

}
```

```java
@Data
public class RedisSingleProperties {
    private  String address1;
    private  String address2;
    private  String address3;
}
```

```java
@Slf4j
@RestController
public class MultiLockController {

    public static final String CACHE_KEY_REDLOCK = "ATGUIGU_REDLOCK";

    @Autowired
    RedissonClient redissonClient1;

    @Autowired
    RedissonClient redissonClient2;

    @Autowired
    RedissonClient redissonClient3;

    boolean isLockBoolean;

    @GetMapping(value = "/multiLock")
    public String getMultiLock() throws InterruptedException
    {
        String uuid =  IdUtil.simpleUUID();
        String uuidValue = uuid+":"+Thread.currentThread().getId();

        RLock lock1 = redissonClient1.getLock(CACHE_KEY_REDLOCK);
        RLock lock2 = redissonClient2.getLock(CACHE_KEY_REDLOCK);
        RLock lock3 = redissonClient3.getLock(CACHE_KEY_REDLOCK);

        RedissonMultiLock redLock = new RedissonMultiLock(lock1, lock2, lock3);
        redLock.lock();
        try
        {
            System.out.println(uuidValue+"\t"+"---come in biz multiLock");
            try { TimeUnit.SECONDS.sleep(30); } catch (InterruptedException e) { e.printStackTrace(); }
            System.out.println(uuidValue+"\t"+"---task is over multiLock");
        } catch (Exception e) {
            e.printStackTrace();
            log.error("multiLock exception ",e);
        } finally {
            redLock.unlock();
            log.info("释放分布式锁成功key:{}", CACHE_KEY_REDLOCK);
        }

        return "multiLock task is over  "+uuidValue;
    }

}
```

# 19 Redis的缓存过期淘汰策略

## 19.1 Redis内存满了怎么办？

**Redis默认内存是多少？**

64位的系统下：
默认不限制Redis内存使用，理论上可以达到操作系统的上限。

32位系统下：
至多3GB。

>一般推荐Redis设置内存为最大物理内存的3/4

**如何修改Redis内存大小？**

方式一（配置文件）：

`maxmemory 104857600` ：表示Redis内存大小为100M

方式二（命令）：

`config set maxmemory 104857600` ：表示Redis内存大小为100M

**什么命令查看Redis内存？**

- `info memory`

- `config get maxmemory`

**Redis内存满了会怎样？**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230308195918.png)

## 19.2 三种不同的删除策略

### 1. 立即删除

Redis不可能时时刻刻遍历所有被设置了生存时间的key，来检测数据是否已经到达过期时间，然后对它进行删除。

立即删除能保证内存中数据的最大新鲜度，因为它保证过期键值会在过期后马上被删除，其所占用的内存也会随之释放。但是立即删除对cpu是最不友好的。因为删除操作会占用cpu的时间，如果刚好碰上了cpu很忙的时候，比如正在做交集或排序等计算的时候，就会给cpu造成额外的压力。

这会产生大量的性能消耗，同时也会影响数据的读取操作。

>立即删除对CPU不友好，用处理器性能换取存储空间（拿时间换空间）

### 2. 惰性删除

数据到达过期时间，不做处理。等下次访问该数据时：
- 如果未过期，返回数据 。
- 发现已过期，删除，返回不存在。

如果一个键已经过期，而这个键又仍然保留在redis中，那么只要这个过期键不被删除，它所占用的内存就不会释放。

在使用惰性删除策略时，如果数据库中有非常多的过期键，而这些过期键又恰好没有被访问到的话，那么它们也许永远也不会被删除(除非用户手动执行FLUSHDB)，我们甚至可以将这种情况看作是一种内存泄漏–无用的垃圾数据占用了大量的内存，而服务器却不会自己去释放它们，这对于运行状态非常依赖于内存的Redis服务器来说，肯定不是一个好消息。

>惰性删除对内存是最不友好的。

### 3. 定期删除

定期删除策略是前两种策略的折中。

定期删除策略==每隔一段时间执行一次删除过期键操作==并通过限制删除操作执行时长和频率来减少删除操作对CPU时间的影响。

周期性轮询redis库中的时效性数据，采用随机抽取的策略，利用过期数据占比的方式控制删除频度：
- 特点1：CPU性能占用设置有峰值，检测频度可自定义设置 
- 特点2：内存压力不是很大，长期占用内存的冷数据会被持续清理 

定期删除策略的难点是确定删除操作执行的时长和频率：
- 如果删除操作执行得太频繁或者执行的时间太长，定期删除策略就会退化成立即删除策略，以至于将CPU时间过多地消耗在删除过期键上面。
- 如果删除操作执行得太少，或者执行的时间太短，定期删除策略又会和惰性删除束略一样，出现浪费内存的情况。因此，如果采用定期删除策略的话，

==服务器必须根据情况，合理地设置删除操作的执行时长和执行频率。==

## 19.3 Redis的缓存淘汰策略

>由于上述的三种删除机制都有缺点，必须要有一个更好的方案

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230308201319.png)

### 19.3.1 LRU与LFU算法

LRU（Least Recently Used）：最近最少使用页面置换算法，淘汰最长时间未被使用的页面，看页面最后一次被使用到发生调度的时间长短，首先淘汰最长时间未被使用的页面。

LFU（Least Frequently Used）：最近最不常用页面置换算法，淘汰一定时期内被访问次数最少的页，看一定时间段内页面被使用的频率，淘汰一定时期内被访问次数最少的页

**举个例子**

某次时期Time为10分钟，如果每分钟进行一次调页，主存块为3，若所需页面走向为2 1 2 1 2 3 4

假设到页面4时会发生缺页中断

若按LRU算法,应换页面1(1页面最久未被使用)，但按LFU算法应换页面3(十分钟内，页面3只使用了一次)

可见LRU关键是看页面最后一次被使用到发生调度的时间长短，而LFU关键是看一定时间段内页面被使用的频率!

### 19.3.2 Redis7中的8种缓存淘汰策略

1. noeviction（默认）：不会驱逐任何key，表示即使内存达到上限也不进行置换，所有能引起内存增加的命令都会返回error 。
2. allkeys-lru：对所有key使用LRU算法进行删除，优先删除掉最近最不经常使用的key，用以保存新数据。
3. volatile-lru：对所有设置了过期时间的key使用LRU算法进行删除。
4. allkeys-random：对所有key随机删除。
5. volatile-random：对所有设置了过期时间的key随机删除。
6. volatile-ttl：删除马上要过期的key。
7. allkeys-lfu：对所有key使用LFU算法进行删除。
8. volatile-lfu：对所有设置了过期时间的key使用LFU算法进行删除。

**平时用哪种？**

- 在所有的key都是最近最经常使用，那么就需要选择allkeys-Iru进行置换最近最不经常使用的key，如果你不确定使用哪种策略，那么推荐使用allkeys-Iru。
- 如果所有的key的访问概率都是差不多的，那么可以选用allkeys-random 策略去置换数据。
- 如果对数据有足够的了解，能够为key指定hint (通过expire/ttl指定)，那么可以选择volatile-ttl进行置换。

>推荐使用 allkeys-lru

**如何设置**

方式一（命令）：

`config set maxmemory-policy noeviction`

方式二（配置文件）

`maxmemory-policy noeviction`

### 19.3.3 Redis缓存淘汰配置性能建议

- 避免存储 bigkey
- 开启懒惰淘汰，lazyfree-lazy-eviction=yes

# 20 Redis 经典五大类型源码及底层实现（略）

# 21 Redis为什么快？高性能设计之epoll和IO多路复用深度解析

## 22.1 同步与异步 ｜ 阻塞与非阻塞

### 1. 同步与异步

**同步**

调用者要一直等待调用结果的通知后才能进行后续的执行，现在就要，我可以等，等出结果为止。

**异步**

指被调用方先返回应答让调用者先回去，然后再计算调用结果，计算完最终结果后再通知并返回给调用方。
异步调用要想获得结果一般通过回调。

>同步、异步的讨论对象是被调用者(服务提供者)，重点在于获得调用结果的消息通知方式上

### 2. 阻塞与非阻塞

**阻塞**

调用方一直在等待而且别的事情什么都不做，当前进/线程会被挂起。

**非阻塞**

调用在发出去后，调用方先去忙别的事情，不会阻塞当前进/线程，而会立即返回

>阻塞、非阻塞的讨论对象是调用者(服务请求者)，重点在于等消息时候的行为，调用者是否能干其它事

### 3. 四种组合方式

- **同步阻塞：** 服务员说快到你了，先别离开我后台看一眼马上通知你。客户在海底捞火锅前台干等着，啥都不干。

- **同步非阻塞：** 服务员说快到你了，先别离开。客户在海底捞火锅前台边刷抖音边等着叫号。

- **异步阻塞：** 服务员说还要再等等，你先去逛逛，一会儿通知你。客户怕过号在海底捞火锅前台拿着排号小票啥都不干，一直等着店员通知。

- **异步非阻塞：** 服务员说还要再等等，你先去逛逛，一会儿通知你。拿着排号小票+刷着抖音，等着店员通知。

## 21.2 为什么要使用IO多路复用？

并发多客户端连接，在多路复用之前最简单和典型的方案：==同步阻塞网络IO模型==

这种模式的特点就是==用一个进程来处理一个网络连接(一个用户请求)==，比如一段典型的示例代码如下，直接调用 recv 函数从一个 socket 上读取数据：
```
int main()
{
	...
	//从用户角度来看非常简单，一个recv一用，要接收的数据就到我们手里了。
	recv(sock, ...) 
}
```

>【优点】
>非常容易让人理解，写起代码来非常的自然，符合人的直线型思维。
>【缺点】
>性能差，每个用户请求到来都得占用一个进程来处理，来一个请求就要分配一个进程跟进处理

进程在 Linux 上是一个开销不小的家伙，先不说创建，光是上下文切换一次就得几个微秒。所以为了高效地对海量用户提供服务，必须要让一个进程能同时处理很多个 tcp 连接才行。现在假设一个进程保持了 10000 条连接，那么如何发现哪条连接上有数据可读了、哪条连接可写了？

我们当然可以采用循环遍历的方式来发现 IO 事件，但这种方式太低级了。

我们希望有一种更高效的机制，在很多连接中的某条上有 IO 事件发生的时候直接快速把它找出来。

其实这个事情 Linux 操作系统已经替我们都做好了，它就是我们所熟知的 **IO多路复用机制，这里的复用指的就是对进程的复用**

## 22.2 IO多路复用模型

### 22.2.1 什么是IO多路复用模型？

- I/O：网络I/O。
- 多路：多个客户端连接(连接就是套接字描述符，即 socket或者channel)，指的是多条TCP连接。
- 复用：用一个进程来处理多条的连接，使用单进程就能够实现同时处理多个客户端的连接。

>IO多路复用实现了用一个进程来处理大量的用户连接，可以分select->poll->epoll三个阶段来描述。

![](https://raw.githubusercontent.com/michik0/notes-image/master/%E4%B8%8B%E8%BD%BD.gif)

### 22.2.2 Redis单线程如何处理那么多并发客户端连接？Redis为什么单线程？Redis为什么这么快？

Redis利用epoll来实现IO多路复用，==将连接信息和事件放到队列中==，一次放到文件事件==分派器==，事件分派器将事件分发给==事件处理器==。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230309093245.png)

Redis 是跑在单线程中的，所有的操作都是按照顺序线性执行的，==但是由于读写操作等待用户输入或输出都是阻塞的，所以 I/O 操作在一般情况下往往不能直接返回==，这会导致某一文件的 I/O 阻塞导致整个进程无法对其它客户提供服务，而 I/O 多路复用就是为了解决这个问题而出现。

所谓 I/O 多路复用机制，就是说通过一种机制，可以监视多个描述符，一旦某个描述符就绪（一般是读就绪或写就绪），能够通知程序进行相应的读写操作。这种机制的使用需要 select 、 poll 、 epoll 来配合。==多个连接共用一个阻塞对象，应用程序只需要在一个阻塞对象上等待，无需阻塞等待所有连接。当某条连接有新的数据可以处理时，操作系统通知应用程序，线程从阻塞状态返回，开始进行业务处理。==

Redis 服务采用 Reactor 的方式来实现文件事件处理器（每一个网络连接其实都对应一个文件描述符） 

Redis基于Reactor模式开发了网络事件处理器，这个处理器被称为**文件事件处理器**。它的组成结构为4部分：
- 多个套接字
- IO多路复用程序
- 文件事件分派器
- 事件处理器

==因为文件事件分派器队列的消费是单线程的，所以Redis才叫单线程模型。==


# 附录

## 1. 什么是虚假唤醒？

^d8400c

多线程环境下，有多个线程执行了wait()方法，需要其他线程执行notify()或者notifyAll()方法去唤醒它们，假如多个线程都被唤醒了，但是只有其中一部分是有用的唤醒操作，其余的唤醒都是无用功；对于不应该被唤醒的线程而言，便是虚假唤醒。

比如：仓库有货了才能出库，突然仓库入库了一个货品；这时所有的线程（货车）都被唤醒，来执行出库操作；实际上只有一个线程（货车）能执行出库操作，其他线程都是虚假唤醒。

**代码验证**

```java
public class SpuriousWakeup2 {  
  
    public static void main(String[] args) {  
        WareHouse wareHouse = new WareHouse();  
        Producer producer = new Producer(wareHouse);  
        Customer customer = new Customer(wareHouse);  
  
        new Thread(producer, "ProducerA").start();  
        new Thread(producer, "ProducerB").start();  
        new Thread(producer, "ProducerC").start();  
  
        new Thread(customer, "ConsumerD").start();  
        new Thread(customer, "ConsumerE").start();  
    }  
}  
  
// 仓库  
class WareHouse {  
    private volatile int product = 0;  
  
    // 入库  
    public synchronized void purchase() {  
        // 库存已满，仓库最多容纳1个货品  
        if (product > 0) {  
            try {  
                this.wait();  
            } catch (InterruptedException e) {  
                // ignore exception  
            }  
            System.out.println("【生产者】" + Thread.currentThread().getName() + "【被激活】");  
        }  
        ++product;  
        // 该线程从while中出来的时候，已满足条件  
        System.out.println(Thread.currentThread().getName() + ": " + "-------------入库成功，余货：" + product);  
        this.notifyAll();  
    }  
  
    // 出库  
    public synchronized void outbound() {  
        if (product <= 0) {  
            try {  
                System.out.println(Thread.currentThread().getName() + "出库待机中....");  
                this.wait();  
            } catch (InterruptedException e) {  
                // ignore exception  
            }  
            System.out.println("【消费者】" + Thread.currentThread().getName() + "【被激活】");  
        }  
        --product;  
        System.out.println(Thread.currentThread().getName() + ":出库成功，余货：" + product);  
        this.notifyAll();  
    }  
}  
  
// 生产者  
class Producer implements Runnable {  
    private WareHouse wareHouse;  
  
    public Producer(WareHouse wareHouse) {  
        this.wareHouse = wareHouse;  
    }  
  
    @Override  
    public void run() {  
        for (int i = 0; i < 5; ++i) {  
            try {  
                Thread.sleep(200);  
            } catch (InterruptedException e) {  
            }  
            wareHouse.purchase();  
        }  
    }  
}  
  
// 消费者  
class Customer implements Runnable {  
    private WareHouse wareHouse;  
  
    public Customer(WareHouse wareHouse) {  
        this.wareHouse = wareHouse;  
    }  
  
    @Override  
    public void run() {  
        for (int i = 0; i < 5; ++i) {  
            wareHouse.outbound();  
        }  
    }
}
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230307205531.png)

**如何解决？**

将 `if() {this.wait}` 改为 `while() {this.wait}`，这样在每次线程被唤醒时，都将会进行条件的重新判断，避免导致超卖的情况。