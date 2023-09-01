#Redis #面试题 

# 1. 什么是 Redis？它主要用来什么的？

Redis，英文全称是 Remote Dictionary Server（远程字典服务），是一 个开源的使用 ANSIC 语言编写、支持网络、可基于内存亦可持久化的日志型、 Key-Value 数据库，并提供多种语言的 API。

与 MySQL 数据库不同的是，Redis 的数据是存在内存中的。它的读写速度非常快，每秒可以处理超过 10 万次读写操作。因此 Redis **被广泛应用于缓存**，另外，Redis 也经常用来做分布式锁。除此之外，Redis 支持事务、持久化、 LUA 脚本、LRU 驱动事件、多种集群方案。

# 2. 说说 Redis 的基本数据结构类型

## String（字符串）

>简介

String 是 Redis 最基础的数据结构类型，它是二进制安全的，可以存储图片或者序列化的对象，值最大存储为 512M 

>简单使用举例

`set key value`

`get key`

>应用场景

共享 session、分布式锁，计数器、限流。

## Hash（哈希）

>简介

在 Redis 中，哈希类型是指 v（值）本身又是一个键值对（k-v）结构 

>简单使用举例：

`hset key field value`

`hget key field`

>应用场景

缓存用户信息等。 

>注意点

如果开发使用 `hgetall`，哈希元素比较多的话，可能导致 Redis 阻塞，可以使用 `hscan`。而如果只是获取部分 field，建议使用 `hmget（HMGET KEY_NAME FIELD1...FIELDN）`。

## List（列表）

>简介

列表（list）类型是用来存储多个有序的字符串，一个列表最多可以存储 2^32-1 个元素。

>简单实用举例

`lpush key value [value ...] `

`lrange key start end `

>应用场景

消息队列，文章列表

**lpush+lpop=Stack（栈）**

**lpush+rpop=Queue（队列）**

**lpsh+ltrim=Capped Collection（有限集合）**

如下命令就只保留日志前100项

```bash
LPUSH log newest_log
LTRIM log 0 99
```

**lpush+brpop=Message Queue（消息队列）**

它是 [_RPOP_](http://doc.redisfans.com/list/rpop.html#rpop) 命令的阻塞版本，当给定列表内没有任何元素可供弹出的时候，连接将被 [BRPOP](http://doc.redisfans.com/list/brpop.html#brpop) 命令阻塞，直到等待超时或发现可弹出元素为止。

当给定多个 key 参数时，按参数 key 的先后顺序依次检查各个列表，弹出第一个非空列表的尾部元素。

```bash
redis> LLEN course
(integer) 0

redis> RPUSH course algorithm001
(integer) 1

redis> RPUSH course c++101
(integer) 2

redis> BRPOP course 30
1) "course"            
2) "c++101"            
```

## Set（集合）

>简介

集合（set）类型也是用来保存多个的字符串元素，但是不允许重复元素

>简单使用举例

`sadd key element [element ...]`

`smembers key`

>注意点

smembers 和 lrange、hgetall 都属于比较重的命令，如果元素过多存在阻塞 Redis 的可能性，可以使用 sscan 来完成。 

>应用场景

用户标签，生成随机数抽奖、社交需求。

## 有序集合（zset）

>简介

已排序的字符串集合，同时元素不能重复 

>简单格式举例

`zadd key score member [score member ...]`

`zrank key member`

>应用场景

排行榜，社交需求（如用户点赞）。

# 3. 说说 Redis 的特殊数据类型

**Geo**

Redis3.2 推出的，地理位置定位，用于存储地理位置信息，并对存储的信息进行操作。 

**HyperLogLog**

用来做基数统计算法的数据结构，如统计网站的 UV。

**Bitmaps**

用一个比特位来映射某个元素的状态，在 Redis 中，它的底层是基于字符串类型实现的，可以把 bitmaps 成作一个以比特位为单位的数组


# 4. Redis 为什么这么快？

## 原因1：基于内存存储实现

我们都知道内存读写是比在磁盘快很多的，Redis 基于内存存储实现的数据库，相对于数据存在磁盘的 MySQL 数据库，省去磁盘 I/O 的消耗。

## 原因2：高效的数据结构

我们知道，Mysql 索引为了提高效率，选择了 B+树的数据结构。其实合理的 数据结构，就是可以让你的应用程序更快。先看下 Redis 的数据结构&内部编码图：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230422211307.png)

### SDS 简单动态字符串

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230422211400.png)

- 字符串长度处理：Redis 获取字符串长度，时间复杂度为 O(1)，而 C 语言中， 需要从头开始遍历，复杂度为 O（n）; 
- 空间预分配：字符串修改越频繁的话，内存分配越频繁，就会消耗性能，而 SDS 修改和空间扩充，会额外分配未使用的空间，减少性能损耗。 
- 惰性空间释放：SDS 缩短时，不是回收多余的内存空间，而是 free 记录下多余的空间，后续有变更，直接使用 free 中记录的空间，减少分配。
- 二进制安全：Redis 可以存储一些二进制数据，在 C 语言中字符串遇到'\0'会 结束，而 SDS 中标志字符串结束的是 len 属性。

### 字典

Redis 作为 K-V 型内存数据库，所有的键值就是用字典来存储。字典就是哈希表，比如 HashMap，通过 key 就可以直接获取到对应的 value。而哈希表的 特性，在 O(1) 时间复杂度就可以获得对应的值。

### 跳跃表

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230422211927.png)

- 跳跃表是 Redis 特有的数据结构，就是在链表的基础上，增加多级索引提升查找效率。
- 跳跃表支持平均 O(logN)，最坏 O(N) 复杂度的节点查找，还可以通过顺序性操作批量处理节点。

[Redis 之跳跃表](https://blog.51cto.com/u_15659694/5755039)

[[#^4adc6f|附录-什么是跳跃表]]


### 压缩链表

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230422213122.png)

其中：

`<zlbytes>`：一个无符号整数，表示ziplist所占用的字节数。这个值让我们在调整ziplist的大小时无须先遍历它获得其大小。

`<zltail>`：链表中最后一个元素的偏移量。保存这个值可以让我们从链表尾弹出元素而无须遍历整个链表找到最后一个元素的位置。

`<zllen>`：链表中的元素个数。当这个值大于2**16-2时，我们需要遍历真个链表计算出链表中的元素数量。

`<entry>`：链表中的节点。稍后会详细说明节点的数据结构。

`<zlend>`：一个拥有特殊值 `255` 的字节，它标识链表结束。

## 原因3：合理的数据编码

Redis 支持多种数据数据类型，每种基本类型，可能对多种数据结构。什么时候，使用什么样数据结构，使用什么样编码，是 redis 设计者总结优化的结果。

**String：** 如果存储数字的话，是用 int 类型的编码;如果存储非数字，小于等于 39 字节的字符串，是 embstr；大于 39 个字节，则是 raw 编码。 

**List：** 如果列表的元素个数小于 512 个，列表每个元素的值都小于 64 字节 （默认），使用 ziplist 编码，否则使用 linkedlist 编码

**Hash**：哈希类型元素个数小于 512 个，所有值小于 64 字节的话，使用 ziplist 编码，否则使用 hashtable 编码。

**Set**：如果集合中的元素都是整数且元素个数小于 512 个，使用 intset 编码， 否则使用 hashtable 编码。

**Zset**：当有序集合的元素个数小于 128 个，每个元素的值小于 64 字节时，使用 ziplist 编码，否则使用 skiplist（跳跃表）编码

## 原因4：合理的线程模型

### I/O 多路复用

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230422213646.png)

多路 I/O 复用技术可以让单个线程高效的处理多个连接请求，而 Redis 使用用 epoll 作为 I/O 多路复用技术的实现。并且，Redis 自身的事件处理模型将 epoll 中的连接、读写、关闭都转换为事件，不在网络 I/O 上浪费过多的时间。 

**什么是 I/O 多路复用？**

- I/O ：网络 I/O 
- 多路 ：多个网络连接 
- 复用：复用同一个线程。

IO 多路复用其实就是一种同步 IO 模型，它实现了一个线程可以监视多个文件句柄；一旦某个文件句柄就绪，就能够通知应用程序进行相应的读写操作；而没有文件句柄就绪时，就会阻塞应用程序，交出 cpu。

### 单线程模型

- Redis 是单线程模型的，而单线程避免了 CPU 不必要的上下文切换和竞争锁的消耗。也正因为是单线程，如果某个命令执行过长（如 hgetall 命令），会造成阻塞。 Redis 是面向快速执行场景的数据库，所以要慎用如 smembers 和 lrange、hgetall 等命令。 
- Redis 6.0 引入了多线程提速，它的执行命令操作内存的仍然是个单线程。

[参考：Redis为什么这么快？](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247490736&idx=1&sn=95377e729b27f0afefbaa5f20239fc9d&chksm=cf21c399f8564a8ff5239fbaa86d616a48086b47b3bb03c8ccc1d3cc066e41c75e16638c3fc8&token=1495321435&lang=zh_CN&scene=21#wechat_redirect)



# 5. 什么是缓存击穿、缓存穿透、缓存雪崩？

## 缓存穿透

### 什么是缓存穿透？

缓存穿透指查询一个一定不存在的数据，由于缓存是不命中时需要从数据库查询，查不到数据则不写入缓存，这将导致这个不存在的数据每次请求都要到 数据库去查询，进而给数据库带来压力。 

通俗点说，读请求访问时，缓存和数据库都没有某个值，这样就会导致每次对这个值的查询请求都会穿透到数据库，这就是缓存穿透。 

缓存穿透一般都是这几种情况产生的：

- 业务不合理的设计，比如大多数用户都没开守护，但是你的每个请求都去缓存，查 询某个 userid 查询有没有守护。
- 业务/运维/开发失误的操作，比如缓存和数据库的数据都被误删除了。 
- 黑客非法请求攻击，比如黑客故意捏造大量非法请求，以读取不存在的业务数据。

### 如何避免缓存穿透呢？ 一般有三种方法：

1. 如果是非法请求，我们在 API 入口，对参数进行校验，过滤非法值。
2. 如果查询数据库为空，我们可以给缓存设置个空值，或者默认值。但是如有有写请求进来的话，需要更新缓存哈，以保证缓存一致性，同时，最后给缓存设置适当 的过期时间。（业务上比较常用，简单有效）
3. 使用布隆过滤器快速判断数据是否存在。即一个查询请求过来时，先通过布隆过滤器判断值是否存在，存在才继续往下查。

## 缓存雪崩

指缓存中数据**大批量到过期时间**，而查询数据量巨大，请求都直接访问数据库，引起数据库压力过大甚至宕机。

- 缓存雪崩一般是由于大量数据同时过期造成的，对于这个原因，可通过均匀设置过期时间解决，即让过期时间相对离散一点。如采用一个较大固定值+一个较小的随 机值，5 小时+0 到 1800 秒。
- Redis 故障宕机也可能引起缓存雪崩。这就需要构造 Redis 高可用集群啦。

## 缓存击穿问题

指**热点 key 在某个时间点过期**的时候，而恰好在这个时间点对这个 Key 有大量的并发请求过来，从而大量的请求打到 db。

缓存击穿看着有点像，其实它两区别是：

- 缓存雪崩是指数据库压力过大甚至宕机
- 缓存击穿只是大量并发请求到了 DB 数据库层面

>击穿针对某一热点 key 缓存，雪崩则是很多 key。

## 如何解决缓存击穿？

**解决方式一：互斥锁**

当同个业务不同线程访问redis未命中时，先获取一把互斥锁，然后进行数据库操作，此时另外一个线程未命中时，拿不到锁，等待一段时间后重新查询缓存，此时之前的线程已经重新把数据加载到redis之中了，线程二就直接缓存命中。这样就不会使得大量访问进入数据库

>优缺点

优点：没有额外的内存消耗，保证一致性，实现简单

缺点：线程需要等待，性能受影响，可能有死锁风险

```java
//互斥锁
    public Shop queryWithMutex(Long id){
        //1.从redis查询商铺缓存
        String shopJson = stringRedisTemplate.opsForValue().get(RedisConstants.CACHE_SHOP_KEY + id);
        //2.判断是否存在
        if(StrUtil.isNotBlank(shopJson)){
            //3.存在直接返回
            Shop shop = JSONUtil.toBean(shopJson, Shop.class);
            return JSONUtil.toBean(shopJson,shop.getClass());
        }
        /* 判断命中的是否为空 */
        if (shopJson!=null){
            //返回一个错误信息
            return null;
        }
        //4，实现缓存重建
        //4.1 获取互斥锁
        String lockKey="lock:shop"+id;
        Shop shop = null;
        try {
            boolean isLock = tryLock(lockKey);
            //4.2 判断是否获取成功
            if (!isLock){
                //4,3 失败 则休眠并重试
                Thread.sleep(50);
                queryWithMutex(id);
            }
            //4.4 成功 根据id查询数据库
            shop = getById(id);
//        5.不存在 返回错误
            if (shop==null){
                //将空值写入redis(防止缓存击穿问题)
                stringRedisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY+ id,"",2L,TimeUnit.MINUTES);
                return  null;
            }
 
//        6.存在，写入redis
            stringRedisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY+ id,JSONUtil.toJsonStr(shop),RedisConstants.CACHE_SHOP_TTL, TimeUnit.MINUTES);
        } catch (InterruptedException e) {
            throw  new RuntimeException(e);
        } finally {
            //        7，释放互斥锁
            unlock(lockKey);
        }
//        7.返回
        return shop;
    }
```

**解决方式二：逻辑过期**：

给缓存设置一个逻辑过期时间，什么意思呢？缓存本来在redis之中，正常情况下除了主动更新它是不会变的，为了防止缓存击穿，我们以一种预判或者说保守的方式，**主动设置一个过期时间**，当然这个时间过期了，缓存里面的数据是不会消失的，但是我们只需要根据这个假设的过期时间。来进行经常的动态的缓存数据的更新。可以对缓存击穿起一定的预防作用

>优缺点

优点：线程无需等待，性能较好

缺点：不保证一致性，有额外内存消耗，实现复杂

```java
//逻辑过期解决方案
    public Shop queryWithLogicalExpire(Long id){
        //1.从redis查询商铺缓存
        String shopJson = stringRedisTemplate.opsForValue().get(RedisConstants.CACHE_SHOP_KEY + id);
        //2.判断是否存在
        if(StrUtil.isBlank(shopJson)){
         //3如果不存在 直接返回null
            return null;
        }
        //4命中 需要先把json反序列化为对象
        RedisData redisData = JSONUtil.toBean(shopJson, RedisData.class);
        JSONObject data = (JSONObject)redisData.getData();
        Shop shop = JSONUtil.toBean(data, Shop.class);
        LocalDateTime expireTime = redisData.getExpireTime();
        //判断是否过期
        if (expireTime.isAfter(LocalDateTime.now())){
            // 5.1 未过期 直接返回商铺信息
            return shop;
        }
//        5.2 已过期 需要缓存重建
//        6.缓存重建
//        6.1获取互斥锁
        String lockKey="lock:shop"+id;
        boolean isLock = tryLock(lockKey);
//        6.1判断是否获取锁成功
        if(isLock){
            //todo   6.2成功 开启独立线程实现缓存重建
            CACHE_REBUILD_EXECUTOR.submit(()->{
                try {
                    //重建
                    this.saveShopRedis(id,20L);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                } finally {
                    //释放锁
                    unlock(lockKey);
                }
            });
        }
//        6.3失败 ，直接返回旧的商铺
        return shop;
    }
```

# 6. 什么是热 Key 问题，如何解决热 key 问题

## 什么是热 Key

在 Redis 中，我们把访问频率高的 key，称为热点 key。 如果某一热点 key 的请求到服务器主机时，由于请求量特别大，可能会导致主机资源不足，甚至宕机，从而影响正常的服务。

热 Key 产生的原因有2个：

- 用户消费的数据远大于生产的数据，如秒杀、热点新闻等读多写少的场景。
- 请求分片集中，超过单 Redis 服务器的性能，比如固定名称 key，Hash 落入同一台服务器，瞬间访问量极大，超过机器瓶颈，产生热点 Key 问题。

## 在日常开发中，如何识别到热点 key 呢？

- 凭经验判断哪些是热 Key；
- 客户端统计上报；
- 服务代理层上报

## 如何解决热 Key 问题？

- Redis 集群扩容：增加分片副本，均衡读流量；
- 将热 key 分散到不同的服务器中；
- 使用二级缓存，即 JVM 本地缓存,减少 Redis 的读请求。

# 7. Redis 过期策略和内存淘汰策略

## Redis 过期策略

我们在 set key 的时候，可以给它设置一个过期时间，比如 expire key 60，指定这 key60s 后过期，60s 后，redis 是如何处理的嘛？我们先来介绍几种过期策略：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230424175737.png)

### 定时过期

每个设置过期时间的 key 都需要创建一个定时器，到过期时间就会立即对 key 进行清除。该策略可以立即清除过期的数据，对内存很友好；但是会占用大量的 CPU 资源去处理过期的数据，从而影响缓存的响应时间和吞吐量。

### 惰性过期

只有当访问一个 key 时，才会判断该 key 是否已过期，过期则清除。该策略可以最大化地节省 CPU 资源，却对内存非常不友好。极端情况可能出现大量的过期 key 没有再次被访问，从而不会被清除，占用大量内存。

### 定期过期

每隔一定的时间，会扫描一定数量的数据库的 `expires 字典` 中一定数量的 key，并清除其中已过期的 key。该策略是前两者的一个折中方案。通过调整定时扫描的时间间隔和每次扫描的限定耗时，可以在不同情况下使得 CPU 和内存资源达到最优的平衡效果。 

expires 字典会保存所有设置了过期时间的 key 的过期时间数据，其中，key 是指向键空间中的某个键的指针，value 是该键的毫秒精度的 UNIX 时间戳表示的过期时间。键空间是指该 Redis 集群中保存的所有键。

Redis 中同时使用了**惰性过期**和**定期过期**两种过期策略。

假设 Redis 当前存放 30 万个 key，并且都设置了过期时间，如果你每隔 100ms 就去检查这全部的 key，CPU 负载会特别高，最后可能会挂掉。

因此，redis 采取的是定期过期，每隔 100ms 就随机抽取一定数量的 key 来检查和删除的。 但是呢，最后可能会有很多已经过期的 key 没被删除。这时候，redis 采用惰性删除。在你获取某个 key 的时候，redis 会检查一下，这个 key 如果设置了过期时间并且已经过期了，此时就会删除。

## Redis 内存淘汰策略

但是，光有过期策略还不够，如果定期删除漏掉了很多过期的 key，然后也没走惰性删除。就会有很多过期 key 积在内存内存，直接会导致内存爆的。或者有些时候，业务量大起来了，redis 的 key 被大量使用，内存直接不够了。难道 redis 直接这样挂掉？不会的！Redis 用 8 种内存淘汰策略保护自己

>LFU：最近最少使用页面置换算法
>LRU：最近最不常用页面置换算法

### volatile-lru

当内存不足以容纳新写入数据时，从设置了过期时间的 key 中使用 LRU（最近最少使用）算法进行淘汰； 

### allkeys-lru

当内存不足以容纳新写入数据时，从所有 key 中使用 LRU（最近最少使用）算法进行淘汰。 

### volatile-lfu

4.0 版本新增，当内存不足以容纳新写入数据时，在过期的 key 中，使用 LFU 算法进行删除 key。

### allkeys-lfu

4.0 版本新增，当内存不足以容纳新写入数据时，从所有 key 中 使用 LFU 算法进行淘汰； 

### volatile-random

当内存不足以容纳新写入数据时，从设置了过期时间的 key 中，随机淘汰数据。

### allkeys-random

当内存不足以容纳新写入数据时，从所有 key 中随机淘汰数据。

### volatile-ttl

当内存不足以容纳新写入数据时，在设置了过期时间的 key 中，根据过期时间进行淘汰，越早过期的优先被淘汰

### noeviction

默认策略，当内存不足以容纳新写入数据时，新写入操作会报错。


# 8. Redis 的 Hash 冲突怎么办？

Redis 作为一个 K-V 的内存数据库，它使用一张全局的哈希来保存所有的键值对。这张哈希表，有多个哈希桶组成，哈希桶中的 entry 元素保存了 key 和 value 指针，其中 key 指向了实际的键，value 指向了实际的值。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230425110343.png)

哈希表查找速率很快的，有点类似于 Java 中的 HashMap，它让我们在 O(1) 的时间复杂度快速找到键值对。首先通过 key 计算哈希值，找到对应的哈希桶位置，然后定位到 entry，在 entry 找到对应的数据。

**什么是 Hash 冲突？**

通过不同的 key，计算出一样的哈希值，导致落在同一个哈希桶中。

**Redis 如何解决 Hash 冲突？**

Redis 为了解决哈希冲突，采用了链式哈希。**链式哈希**是指同一个哈希桶中， 多个元素用一个链表来保存，它们之间依次用指针连接。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230425110636.png)

哈希冲突链上的元素只能通过指针逐一查找再操作。 当往哈希表插入数据很多，冲突也会越多，冲突链表就会越长，那查询效率就会降低了。

为了保持高效，**Redis 会对哈希表做 rehash 操作**，也就是增加哈希桶，减少冲突。为了 rehash 更高效，Redis 还默认使用了两个全局哈希表，一个用于当前使用，称为**主哈希表**，一个用于扩容，称为**备用哈希表**。

**redis在扩容的时候执行rehash 策略会保留新旧两个 hashtable 结构，** 查询时也会同时查询两个 hashtable，Redis会将旧 hashtable 中的内容一点一点的迁移到新的 hashtable 中，当迁移完成时，就会用新的 hashtable 取代之前的。当 hashtable 移除了最后一个元素之后，这个数据结构将会被删除。

数据搬迁的操作放在 hash 的后续指令中，也就是来自客户端对 hash 的指令操作，一旦客户端后续没有指令操作这个 hash，Redis就会使用定时任务对数据主动搬迁。

正常情况下，**当 hashtable 中元素的个数等于数组的长度时，就会开始扩容，扩容的新数组是原数组大小的 2 倍**，如果 Redis 正在做 bgsave(持久化) 时，可能不会去扩容,因为要减少内存页的过多分离(Copy On Write)。但是**如果 hashtable 已经非常满了，元素的个数达到了数组长度的 5 倍时，Redis 会强制扩容**。

当hashtable 中元素逐渐变少时，Redis 会进行缩容来减少空间占用,并且缩容不会受 bgsave 的影响，**缩容条件是元素个数少于数组长度的 10%**。

# 9. 在生成 RDB 期间，Redis 可以同时处理写请求么？

**可以的**，Redis 提供两个指令生成 RDB，分别是 save 和 bgsave。

- **save 指令**

会阻塞，因为是主线程执行的。 

- **bgsave 指令**

是 fork 一个子进程来写入 RDB 文件的，快照持久化完全交给子进程来处理，父进程则可以继续处理客户端的请求。

# 10. 布隆过滤器

应对缓存穿透问题，我们可以使用布隆过滤器。

## 布隆过滤器是什么呢？

布隆过滤器是一种占用空间很小的数据结构，它由一个很长的二进制向量和一组 Hash 映射函数组成，它用于检索一个元素是否在一个集合中，空间效率和查询时间都比一般的算法要好的多，缺点是有一定的误识别率和删除困难。

## 布隆过滤器原理是？

假设我们有个集合 A，A 中有 n 个元素。利用 k 个哈希散列函数，将 A 中的每个元素映射到一个长度为 a 位的数组 B 中的不同位置上， 这些位置上的二进制数均设置为 1。如果待检查的元素，经过这 k 个哈希散列函数的映射后，**发现其 k 个位置上的二进制数全部为 1，这个元素很可能属于集合 A，反之，一定不属于集合 A。**

# 11. Redis的key和value可以存储的最大值分别是多少？

- 虽然Key的大小上限为`512M`,但是一般建议key的大小不要超过`1KB`，这样既可以节约存储空间，又有利于Redis进行检索。
- value的最大值也是`512M`。对于String类型的value值上限为`512M`，而集合、链表、哈希等key类型，单个元素的value上限也为`512M`。

# 12. 怎么利用Redis实现数据的去重？

- `Set`：它可以去除重复元素，也可以快速判断某一个元素是否存在于集合中，**如果元素很多（比如上亿的计数），占用内存很大**。
-   `Bloomfilter`：布隆过滤器是一种占用空间很小的数据结构，它由一个很长的二进制向量和一组Hash映射函数组成，它用于检索一个元素是否在一个集合中。[[4. Redis/Redis#^9edeb7|布隆过滤器笔记]]

# 13. Redis 什么时候需要序列化？Redis序列化的方式有哪些？

>序列化：将 Java 对象转换成字节流的过程。
>反序列化：将字节流转换成 Java 对象的过程。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230312165613.png)

**使用序列化的场景：**

- 把内存中的对象状态保存到一个文件中或者数据库中的时候（最常用，如保存到redis)
- 再比喻想用套接字在网络上传送对象的时候，都需要序列化。

**序列化的方式：**

RedisSerializer接口是 Redis 序列化接口，用于 Redis KEY 和 VALUE 的序列化

-   JDK 序列化方式 （默认）
-   String 序列化方式
-   JSON 序列化方式
-   XML 序列化方式

# 14. 说一下 Raft 算法？

Raft 算法是分布式系统开发首选的共识算法，它通过“一切以领导者为准”的方式，实现一系列值的共识和各节点日志的一致。

**Raft选举过程涉及三种角色和任期（Term）：**

- Follower（追随者）：默默地接收和处理来自Leader的消息，当等待Leader心跳信息超时的时候，就主动站出来，推荐自己当Candidate。
- Candidate（候选人）：向其他节点发送投票请求，通知其他节点来投票，如果赢得了大多数（N/2+1）选票，就晋升Leader。
- Leader（领导者）：负责处理客户端请求，进行日志复制等操作，每一轮选举的目标就是选出一个领导者；领导者会不断地发送心跳信息，通知其他节点“我是领导者，我还活着，你们不要发起新的选举，不用找个新领导者来替代我。”
- Term（任期）：这跟民主社会的选举很像，每一届新的履职期称之为一届任期。

**领导选举过程：**

1.  在初始时，集群中所有的节点都是Follower状态，都被设定一个随机选举超时时间（一般150ms-300ms）：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230312181744.png)

2. 如果Follower在规定的超时时间，都没有收到来自Leader的心跳，它就发起选举：将自己的状态切为 Candidate，增加自己的任期编号，然后向集群中的其它Follower节点发送请求，询问其是否选举自己成为Leader：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230529231410.png)

3. 其他节点收到候选人A的请求投票消息后，如果在编号为1的这届任期内还没有进行过投票，那么它将把选票投给节点A，并增加自己的任期编号：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230312182036.png)

4. 当收到来自集群中过半节点的接受投票后，A节点即成为本届任期内 Leader，他将周期性地发送心跳消息，通知其他节点我是Leader，阻止Follower发起新的选举：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230312194101.png)

# 15. Redis 持久化有哪几种方式，怎么选？

为了避免数据丢失了，Redis 提供了两种持久化方式，RDB 和 AOF。

## 15.1 AOF 持久化

AOF（append only file） 持久化，采用日志的形式来记录每个写操作，追加到 AOF 文件的末尾。Redis 默认情况是不开启 AOF 的。重启时再重新执行 AOF 文件中的命令来恢复数据。它主要解决数据持久化的实时性问题。**AOF是执行完命令后才记录日志的**。为什么不先记录日志再执行命令呢？这是因为 Redis 在向 AOF 记录日志时，不会先对这些命令进行语法检查，如果先记录日志再执行命令，日志中可能记录了错误的命令，Redis 使用日志回复数据时，可能会出错。 

正是因为执行完命令后才记录日志，所以不会阻塞当前的写操作。但是会存在**两个风险：**

1. 更执行完命令还没记录日志时，宕机了会导致数据丢失
2. AOF 不会阻塞当前命令，但是可能会阻塞下一个操作。

这两个风险最好的解决方案是折中妙用 AOF 机制的三种写回策略：

**always：**

同步写回，每个子命令执行完，都立即将日志写回磁盘。

**[推荐]everysec：**

每个命令执行完，只是先把日志写到 AOF 内存缓冲区，每隔一秒同步到磁盘。

**no：**

只是先把日志写到 AOF 内存缓冲区，有操作系统去决定何时写入磁盘。

如果接受的命令越来越多，AOF 文件也会越来越大，文件过大还是会带来性能问题。日志文件过大怎么办呢？**AOF 重写机制！** 就是随着时间推移，AOF 文件会有一些冗余的命令如：无效命令、过期数据的命令等等，AOF 重写机制就 是把它们合并为一个命令（类似批处理命令），从而达到**精简压缩空间**的目的。 **AOF 重写会阻塞嘛？** AOF 日志是由主线程会写的，而重写则不一样，**重写过程是由后台子进程 bgrewriteaof 完成**。

### AOF 优点

数据的一致性和完整性更高，秒级数据丢失。 

### AOF 缺点

相同的数据集，AOF 文件体积大于 RDB 文件。数据恢复也比较慢。

## 15.2 RDB 持久化

因为 AOF 持久化方式，如果操作日志非常多的话，Redis 恢复就很慢。有没有在宕机快速恢复的方法呢，RDB，就是把内存数据以快照的形式保存到磁盘上。和 AOF 相比，它记录的是某一时刻的数据，并不是操作。

RDB 持久化，是指在指定的时间间隔内，执行指定次数的写操作，将内存中的数据集快照写入磁盘中，它是 Redis 默认的持久化方式。执行完操作后，在指定目录下会生成一个 dump.rdb 文件，Redis 重启的时候，通过加载 dump.rdb 文件来恢复数据。RDB 触发机制主要有以下几种：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530152156.png)

RDB 通过 bgsave 命令的执行全量快照，可以避免阻塞主线程。basave 命令会 fork 一个子进程，然后该子进程会负责创建 RDB 文件，而服务器进程会继续处理命令请求

**快照时，数据能修改吗？**

Redis 接住操作系统的写时复制技术（copy-on-write，COW），在执行快照的同时，正常处理写操作。

虽然 bgsave 执行不会阻塞主线程，但是频繁执行全量快照也会带来性能开销。 比如 bgsave 子进程需要通过 fork 操作从主线程创建出来，创建后不会阻塞主线程，但是创建过程是会阻塞主线程的。可以做增量快照。

## RDB 优点

与 AOF 相比，恢复大数据集的时候会更快，它适合大规模的数据恢复场景，如备份，全量复制等

## RDB 缺点

没办法做到实时持久化/秒级持久化。

**Redis4.0 开始支持 RDB 和 AOF 的混合持久化，就是内存快照以一定频率执行，两次快照之间，再使用 AOF 记录这期间的所有命令操作。**

## 15.3 如何选择 RDB 和 AOF

- 如果数据不能丢失，RDB 和 AOF 混用 
- 如果只作为缓存使用，可以承受几分钟的数据丢失的话，可以只使用 RDB。 
- 如果只使用 AOF，优先使用 everysec 的写回策略。

# 16. Redis 主从同步是怎样的过程？

Redis 主从同步包括三个阶段。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530153921.png)

**第一阶段：主从库间建立连接、协商同步。**

从库向主库发送 psync 命令，告诉它要进行数据同步。 主库收到 psync 命令后，响应 FULLRESYNC 命令（它表示第一次复制采用的是全量复制），并带上主库 runID 和主库目前的复制进度 offset。

**第二阶段：主库把数据同步到从库，从库收到数据后，完成本地加载。**

主库执行 bgsave 命令，生成 RDB 文件，接着将文件发给从库。从库接收到 RDB 文件后，会先清空当前数据库，然后加载 RDB 文件。 主库把数据同步到从库的过程中，新来的写操作，会记录到 replication buffer。

**第三阶段，主库把新写的命令，发送到从库。**

主库完成 RDB 发送后，会把 replication buffer 中的修改操作发给从库， 从库再重新执行这些操作。这样主从库就实现同步啦。

[[4. Redis/Redis#6.6 复制原理和工作流程|复制原理和工作流程]]

# 附录

## 1. 什么是跳跃表？

^4adc6f

跳跃表（skiplist）是一种随机化的数据结构，由 William Pugh 在论文《Skip lists: a probabilistic alternative to balanced trees》中提出，是一种可以与平衡树媲美的层次化链表结构——查找、删除、添加等操作都可以在对数期望时间下完成，以下是一个典型的跳跃表例子：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530155153.png)

我们在上一篇中提到了 Redis 的五种基本结构中，有一个叫做 有序列表 zset 的数据结构，它类似于 Java 中的 SortedSet 和 HashMap 的结合体，一方面它是一个 set 保证了内部 value 的唯一性，另一方面又可以给每个 value 赋予一个排序的权重值 score，来达到 排序 的目的。

它的内部实现就依赖了一种叫做 「跳跃列表」 的数据结构。

**为什么使用跳跃表**

首先，因为 zset 要支持随机的插入和删除，所以它 不宜使用数组来实现，关于排序问题，我们也很容易就想到 红黑树/ 平衡树 这样的树形结构，为什么 Redis 不使用这样一些结构呢？

性能考虑： 在高并发的情况下，树形结构需要执行一些类似于 rebalance 这样的可能涉及整棵树的操作，相对来说跳跃表的变化只涉及局部 (下面详细说)；
实现考虑： 在复杂度与红黑树相同的情况下，跳跃表实现起来更简单，看起来也更加直观；
基于以上的一些考虑，Redis 基于 William Pugh 的论文做出一些改进后采用了 跳跃表 这样的结构。

**本质是解决查找问题**

我们先来看一个普通的链表结构：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530155207.png)

我们需要这个链表按照 score 值进行排序，这也就意味着，当我们需要添加新的元素时，我们需要定位到插入点，这样才可以继续保证链表是有序的，通常我们会使用 二分查找法，但二分查找是有序数组的，链表没办法进行位置定位，我们除了遍历整个找到第一个比给定数据大的节点为止 （时间复杂度 O(n)) 似乎没有更好的办法。

但假如我们每相邻两个节点之间就增加一个指针，让指针指向下一个节点，如下图：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530155218.png)

这样所有新增的指针连成了一个新的链表，但它包含的数据却只有原来的一半 （图中的为 3，11）。

现在假设我们想要查找数据时，可以根据这条新的链表查找，如果碰到比待查找数据大的节点时，再回到原来的链表中进行查找，比如，我们想要查找 7，查找的路径则是沿着下图中标注出的红色指针所指向的方向进行的：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530155226.png)

这是一个略微极端的例子，但我们仍然可以看到，通过新增加的指针查找，我们不再需要与链表上的每一个节点逐一进行比较，这样改进之后需要比较的节点数大概只有原来的一半。

利用同样的方式，我们可以在新产生的链表上，继续为每两个相邻的节点增加一个指针，从而产生第三层链表：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530155237.png)

在这个新的三层链表结构中，我们试着 查找 13，那么沿着最上层链表首先比较的是 11，发现 11 比 13 小，于是我们就知道只需要到 11 后面继续查找，从而一下子跳过了 11 前面的所有节点。

可以想象，当链表足够长，这样的多层链表结构可以帮助我们跳过很多下层节点，从而加快查找的效率。

**更进一步的跳跃表**

跳跃表 skiplist 就是受到这种多层链表结构的启发而设计出来的。按照上面生成链表的方式，上面每一层链表的节点个数，是下面一层的节点个数的一半，这样查找过程就非常类似于一个二分查找，使得查找的时间复杂度可以降低到 O(logn)。

但是，这种方法在插入数据的时候有很大的问题。新插入一个节点之后，就会打乱上下相邻两层链表上节点个数严格的 2:1 的对应关系。如果要维持这种对应关系，就必须把新插入的节点后面的所有节点 （也包括新插入的节点） 重新进行调整，这会让时间复杂度重新蜕化成 O(n)。删除数据也有同样的问题。

skiplist 为了避免这一问题，它不要求上下相邻两层链表之间的节点个数有严格的对应关系，而是 为每个节点随机出一个层数(level)。比如，一个节点随机出的层数是 3，那么就把它链入到第 1 层到第 3 层这三层链表中。为了表达清楚，下图展示了如何通过一步步的插入操作从而形成一个 skiplist 的过程：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530155402.png)

从上面的创建和插入的过程中可以看出，每一个节点的层数（level）是随机出来的，而且新插入一个节点并不会影响到其他节点的层数，因此，插入操作只需要修改节点前后的指针，而不需要对多个节点都进行调整，这就降低了插入操作的复杂度。

现在我们假设从我们刚才创建的这个结构中查找 23 这个不存在的数，那么查找路径会如下图：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530155413.png)