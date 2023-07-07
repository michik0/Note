****

# 1. 什么时候索引会失效?

^2f185b

[[1. SQL/MySQL#2. 索引失效案例|参考：什么时候索引会失效？]]

```mysql
CREATE TABLE `user` (
	`id` int NOT NULL AUTO_INCREMENT,
	`userId` int NOT NULL,
	`age` int NOT NULL,
	`name` varchar(255) NOT NULL,
	PRIMARY KEY (`id`),
	KEY `user_userId_IDX` (`userId`,`age`,`name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=26001 DEFAULT CHARSET=utf8mb3;
```

## 1. 未按照索引字段的顺序，从左到右匹配时，索引失效（部分或者全部）

## 2. 在索引上使用mysql内置函数，索引失效

`索引：user_name_IDX(name)`

```mysql
EXPLAIN SELECT SQL_NO_CACHE * FROM user WHERE LEFT(name,3) = 'abc';
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230408101550.png)

## 3. like以通配符%开头使索引失效

`索引：user_name_IDX(name)`

```mysql
EXPLAIN SELECT SQL_NO_CACHE * FROM user WHERE name like '%abc';
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230408101842.png)

如果换为左匹配，则会走索引

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230408101932.png)

## 4. 类型转换使索引失效

`索引：user_name_IDX(name)`

```mysql
EXPLAIN SELECT SQL_NO_CACHE * FROM user WHERE name = 123;
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230408102225.png)

## 5. 范围条件右边的列索引失效

`索引：user_userId_age_name_IDX(userId, age, name)`

```mysql
explain select * from user where userId = 1 and age > 5 and name = 'abc'
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230408115428.png)

发现 key_length 只有 8

>4（int）+ 4（int）
>由于 userId 和 age 都是为 NOT NULL，所以行记录没有 是否为NULL字段 所占用的1个字节
>由于 userId 和 age 是 int，是固定长度，所有行记录没有可变长度字段所占用的2个字节

## 6. 类型转换导致索引失效

`索引：user_name_IDX(name)`

```mysql
EXPLAIN SELECT * FROM `user` u WHERE name = 123
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230410165951.png)

## 7. 计算导致索引失效

`索引：user_userId_IDX(userId)`

```mysql
EXPLAIN SELECT * FROM `user` u WHERE userId+1 = 1
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230410170253.png)

## 8. 不等于(!= 或者<>)索引失效

`索引：user_name_IDX(name)`

```mysql
EXPLAIN SELECT * FROM `user` u WHERE name != '1'
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230410170432.png)

## 9. is null 可以使用索引，is not null / not like 无法使用索引

`索引：user_name_IDX(name)`

```mysql
EXPLAIN SELECT * FROM `user` u WHERE name is not null
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230410171202.png)

## 10. OR 前后存在非索引的列，索引失效

`索引：user_name_IDX(name)、user_userId_IDX(userId)`

```mysql
EXPLAIN SELECT * FROM `user` u WHERE name is null or age = 1
```

因为 age 没有索引，所以没有走索引

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230410171507.png)

**换成 name 与 age，其中 name 与 age 都有建立索引**

```mysql
EXPLAIN SELECT * FROM `user` u WHERE name is null or userId = 1
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230410171701.png)

## 11. 若使用全表扫描要比使用索引快，则不使用索引

- 当表的索引被查询，会使用最好的索引，除非优化器使用全表扫描更有效。优化器优化成全表扫描取决与使用最好索引查出来的数据是否超过表的30%的数据。
    
- 不要给'性别'等增加索引。如果某个数据列里包含了均是"0/1"或“Y/N”等值，即包含着许多重复的值，就算为它建立了索引，索引效果不会太好，还可能导致全表扫描。



# 2. 索引不适合哪些场景

- 数据量少的不适合加索引（全表读取花费的时间也不多，数据量少的时候可能走索引花费的时间还多，占用写入时间）

- 更新比较频繁的也不适合加索引 （因为索引的写入比不加索引要耗时）

- 区分度低的字段不适合加索引，比如索引（区分度低，就是一个页里面可能都是一样的数据，检索效率不高）

# 3. 索引的一些潜规则

## 解释一下覆盖索引？

^16956b

[[1. SQL/MySQL#8.1 什么是覆盖索引？|什么是覆盖索引？]]

**理解方式一**：索引是高效找到行的一个方法，但是一般数据库也能使用索引找到一个列的数据，因此它不必读取整个行。毕竟索引叶子节点存储了它们索引的数据；当能通过读取索引就可以得到想要的数据，那就不需要读取行了。**一个索引包含了满足查询结果的数据就叫做覆盖索引**。

**理解方式二**：非聚簇复合索引的一种形式，它包括在查询里的SELECT、JOIN和WHERE子句用到的所有列 （即建索引的字段正好是覆盖查询条件中所涉及的字段）。

简单说就是， `索引列+主键` 包含 `SELECT 到 FROM 之间查询的列` 。

## 什么是回表？

当根据[[1. SQL/MySQL#2. 二级索引（辅助索引、非聚簇索引）|非聚簇索引]]进行列的查询的时候，如果SELECT的列中不仅仅包含索引中的列，那么就需要根据索引列的值，再去聚簇索引中查询一边，这个操作叫做**回表**

## 索引数据结构（B+树）

### 为什么选择B+树？

1. B+树的磁盘读写代价更低
	B+树的内部结点并没有指向关键字具体信息的指针。因此其内部结点相对B树更小。如果把所有同一内部结点的关键字存放在同一盘块中，那么盘块所能容纳的关键字数量也越多。一次性读入内存中的需要查找的关键字也就越多。相对来说IO读写次数也就降低了。

2. B+树的查询效率更加稳定
	由于非终结点并不是最终指向文件内容的结点，而只是叶子结点中关键字的索引。所以任何关键字的查找必须走一条从根结点到叶子结点的路。所有关键字查询的路径长度相同，导致每一个数据的查询效率相当。

### 为什么B+树只有四层 / B+树的存储能力如何？为何说一般查找行记录，最多只需1~3次磁盘IO？

InnoDB存储引擎中页的大小为16KB，一般表的主键类型为INT (占用4个字节)或BIGINT (占用8个字节)，指针类型也一般为4或8个字节，也就是说一个页(B+Tree 中的一个节点)中大概存储16KB/ (8B+8B)=1K个键值(因为是估值，为方便计算，这里的K取值为10^3。也就是说一个深度为3的 B+Tree 索引可以维护10^3 * 10^3 * 10^3=10亿条记录。(这里假定一个数据页也存储10^3条行记录数据了) 实际情况中每个节点可能不能填充满，因此在数据库中，B+Tree的高度一般都在2~4层。MySQL的InnoDB存储引擎在设计时是将根节点常驻内存的，也就是说查找某一键值的行记录时最多只需要1~3次磁盘I/O操作。

>[[1. SQL/MySQL#3.4 InnoDB的B+树索引的注意事项|B+树的注意事项]]

## 解释一下最左前缀原则

最左前缀原则是发生在复合索引上的，只有复合索引才会有所谓的左和右之分

在MySQL建立联合索引时会遵守最左前缀匹配原则，即最左优先，**在检索数据时从联合索引的最左边开始匹配**

【例】
存在索引 `(col1, col2)`，那么在进行复合索引检索的时候，会根据col1进行判断，同样的，在插入的时候也是从左到右进行顺序的插入

## 解释一下索引下推

如果部分 `WHERE` 条件可以仅使用索引中的列进行筛选，则MySQL服务器会把这部分 WHERE 条件放到存储引擎筛选。然后，存储引擎通过使用索引条目来筛选数据，然后再**进行回表**操作，而不是直接进行回表

[[1. SQL/MySQL#10. 索引下推|参考索引下推]]

>注意区分 [[#^16956b|覆盖索引]]
>
>覆盖索引是一个索引包含了满足查询结果的数据就叫做覆盖索引

# 4. MySQL遇到过死锁问题吗？如何解决？

- 查看死锁日志 show engine innodb status; 
- 找出死锁 sql 
- 分析 sql 加锁情况 
- 模拟死锁案发 
- 分析死锁日志 
- 分析死锁结果

参考：
- [手把手教你分析MySQL死锁问题](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247487979&idx=1&sn=588c83d77a8851f3b3c18cd68ed9c454&chksm=cf21cec2f85647d4a77cc239ae9a4cfd31bb8832be3d98540a08ea8b4a1f46b38cf736210a02&token=1495321435&lang=zh_CN&scene=21#wechat_redirect)
- [两万字详解！InnoDB 锁专题！](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247499275&idx=1&sn=ca72f48a290e4fd2a2ded6ef6fd045be&chksm=cf222122f855a8347b911352cebdd722b17ea45733b91ff169353c0805d9f31cea5261ef01b9&token=1712314640&lang=zh_CN#rd)

# 5. 日常工作中你是怎么优化 SQL 的？

**1. 加索引，避免索引失效** 

添加索引，避免索引失效

参考：[[#^2f185b|哪些情况下索引会失效？]]

**2. 在适当的时候，请选择覆盖索引**

覆盖索引能够使得你的SQL语句不需要回表，仅仅访问索引就能够得到所有需要的数据，大大提高了查询效率。

```mysql
# 索引 user_id_name_idx(id, name)
select userid, id from user where userid = '123';
```

**3. 避免返回不必要的数据**

不要使用 `select *` ，而是 `select 具体字段`

- 只取需要的字段，节省资源、减少网络开销。
-   select * 进行查询时，很可能就不会使用到覆盖索引了，就会造成回表查询。

**4. 适当分批量进行**

(1) 如果插入数据过多，请考虑批量插入

【不推荐】

```java
for(User u :list) {
	INSERT into user(name,age)values(#name#,#age#)
}
```

【推荐】

```java
insert into user(name,age) values
<foreach collection="list" item="item" index="index" separator=",">
	(#{item.name},#{item.age})
</foreach>
```

(2) 避免同时修改或删除过多数据，因为会造成cpu利用率过高，从而影响别人对数据库的访问。

【不推荐】
```java
//方式二：一次删除10万或者100万+？
delete from user where id <100000;
    
// 方式二：采用单一循环操作，效率低，时间漫长
for（User user：list）{
	delete from user;
}
```

【推荐】

```java
//分批进行删除,如每次500
delete user where id<500
    
delete product where id>=500 and id<1000;
```

**5. 删除冗余和重复索引**

`idx_userId_age (userId,age)`  = `idx_userId(userId)` + `idx_userId_age (userId,age)`

重复的索引需要维护，并且优化器在优化查询的时候也需要逐个地进行考虑，这会影响性能的。

**6. 不要有超过5个以上的表连接**

-   连表越多，编译的时间和开销也就越大。
-   把连接表拆开成较小的几个执行，可读性更高。
-   如果一定需要连接很多表才能得到数据，那么意味着糟糕的设计了。

**7. exist & in 的合理利用**

exist 与 in 请遵从小表驱动大表，左表小用 exist，左表大用 in

[[1. SQL/MySQL#12.1 EXISTS 和 IN 的区分|参考：in 和 exist 到底该用谁？]]

>详细参考：[书写高质量SQL](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247487972&idx=1&sn=cd035a7fcd7496658846ab9f914be2db&chksm=cf21cecdf85647dbc53e212bf1a2b95d0eb2bffe08dc0141e01f8a9b2088abffc385a2ef584e&token=1495321435&lang=zh_CN&scene=21#wechat_redirect)

**8. 分库分表**

如果业务量剧增，数据库可能会出现性能瓶颈，这时候我们就需要考虑拆分数据库。

[[1. SQL/MySQL#4.3 分库分表|参考：分库分表]]

**9. 读写分离**

经典的数据库拆分方案，主库负责写，从库负责读。

* 一主一从模式：
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230206200727.png)

* 双主双从模式：
![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230206200848.png)


# 6. 说说分库与分表的设计

分库分表方案，分库分表中间件，分库分表可能遇到的问题 

**分库分表方案：**

- 水平分库：以字段为依据，按照一定策略（hash、range 等），将一个库中的数据拆分到多个库中。 
- 水平分表：以字段为依据，按照一定策略（hash、range 等），将一个表中的数据拆分到多个表中。 
- 垂直分库：以表为依据，按照业务归属不同，将不同的表拆分到不同的库中。 
- 垂直分表：以字段为依据，按照字段的活跃性，将表中字段拆到不同的表（主表和扩展表）中。

**分库分表可能遇到的问题：**

- 事务问题：需要用分布式事务
- 跨节点 Join 的问题：解决这一问题可以分两次查询实现 
- 跨节点的 count，order by，group by 以及聚合函数问题：分别在各个节点上得到结果后在应用程序端进行合并。
- 数据迁移，容量规划，扩容等问题 
- ID 问题：数据库被切分后，不能再依赖数据库自身的主键生成机制啦，最简单可以考虑 UUID 跨分片的排序分页问题（后台加大 pagesize 处理？）

# 7. InnoDB 与 MyISAM 的区别

- InnoDB 支持事务，MyISAM 不支持事务
- InnoDB 支持外键，MyISAM 不支持外键 
- InnoDB 支持 [[1. SQL/MySQL#1. 什么是MVCC|MVCC(多版本并发控制)]]，MyISAM 不支持 
- `select count(*) from table` 时，MyISAM 更快，因为它有一个变量保存了整个表的总行数，可以直接读取，InnoDB 就需要全表扫描。
- Innodb 不支持全文索引，而 MyISAM 支持[[1. SQL/MySQL#1.1 索引的分类|全文索引]]（5.7 以后的 InnoDB 也支持全文索引） 
- InnoDB 支持表、行级锁，而 MyISAM 支持表级锁
- InnoDB 表必须有主键，而 MyISAM 可以没有主键 
- Innodb 表需要更多的内存和存储，而 MyISAM 可被压缩，存储空间较小
- Innodb 按主键大小有序插入，MyISAM 记录插入顺序是按记录插入顺序保存
- InnoDB 存储引擎提供了具有提交、回滚、崩溃恢复能力的事务安全，与 MyISAM 比 InnoDB 写的效率差一些，并且会占用更多的磁盘空间以保留数据和索引

# 8. MySQL索引为什么要用 B+树？

可以从几个维度去看这个问题，查询是否够快，效率是否稳定，存储数据多少， 以及查找磁盘次数，为什么不是二叉树，为什么不是平衡二叉树，为什么不是 B 树，而偏偏是 B+树呢？ 

**为什么不是一般二叉树？** 

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230413103836.png)

**如果二叉树特殊化为一个链表，相当于全表扫描。** 平衡二叉树相比于二叉查找树来说，查找效率更稳定，总体的查找速度也更快。 

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230413134251.png)

**为什么不是 平衡二叉树 而是 B树 呢？**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230413134544.png)

我们知道，在内存比在磁盘的数据，查询效率快得多。如果树这种数据结构作为索引，那**我们每查找一次数据就需要从磁盘中读取一个节点，也就是我们说的一个磁盘块，但是平衡二叉树可是每个节点只存储一个键值和数据的**，如果是 B树 ，可以存储更多的节点数据，树的高度也会降低，因此读取磁盘的次数 就降下来啦，查询效率就快啦。

**那为什么不是 B树 而是 B+树 呢？**

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230413134628.png)

1. B+树 非叶子节点上是不存储数据的，仅存储键值，而 B树 节点中不仅存储键值，也会存储数据。innodb 中页的默认大小是 16KB，如果不存储数据，那么就会存储更多的键值，相应的树的阶数（节点的子节点树）就会更大，树就会更矮更胖，如此一来我们查找数据进行磁盘的 I/O 次数有会再次减少，数据询的效率也会更快。
2. B+树 索引的所有数据均存储在叶子节点，而且数据是按照顺序排列的，链表连着的。那么 B+树 使得范围查找，排序查找，分组查找以及去重查找变得异常简单。

>【B树 和 B+树 的区别】
>1. 在 B树 中，键和值即存放在内部节点又存放在叶子节点；在 B+树 中，内部节点只存键，叶子节点则同时存放键和值。 
>2. B+树 的叶子节点有一条链相连，而 B树 的叶子节点各自独立的。

[参考：MySQL为什么用B+树作为索引？](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247487988&idx=1&sn=eccbb31faa4f580ae71fbea5cd4ff01b&source=41#wechat_redirect)

# 9. 聚集索引与非聚集索引的区别

- 一个表中只能拥有一个聚集索引，而非聚集索引一个表可以存在多个。 
- 聚簇索引的叶节点就是数据节点。而非聚簇索引的叶节点仍然是索引节点
- 聚集索引中物理存储按照索引排序；非聚集索引中物理存储不按照索引排序；非聚簇索引不会影响数据表的物理存储顺序。

# 10. limit 1000000, 10 加载很慢的话，如何解决？

**方案一：如果 id 是连续的，可以这样，返回上次查询的最大记录(偏移量)，再往下 limit**

```mysql
select id，name from employee where id>1000000 limit 10
```

**方案二：order by + 索引（id 为索引）**

```mysql
select id, name from employee order by id limit 1000000, 10
```

**方案三：利用延迟关联或者子查询优化超多分页场景。（先快速定位需要获取的 id 段，然后再关联）**

```mysql
select a.* from employee a, (select id from employee where 条件 limit 1000000, 10) b where a.id = b.id
```

[参考：如何解决MySQL深分页问题](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247499838&idx=1&sn=e30f577d2a5e4fc52e40fb070293be9d&chksm=cf221f17f85596018dde39ddfd281a527bd92c5f654d76d7313b8485d04660e559090fc0d87b&token=1712314640&lang=zh_CN#rd)

# 11. 如何选择合适的分布式主键方案呢？

- 数据库自增长序列或字段
- UUID
- Redis 生成 ID 
- Twitter 的 snowflake（雪花） 算法 
- 利用 Zookeeper 生成唯一 ID 
- MongoDB 的 ObjectId

# 12. 解释一下事务的ACID？

-   **原子性：** 事务作为一个整体被执行，包含在其中的对数据库的操作要么全部都执行，要么都不执行。
-   **一致性：** 指在事务开始之前和事务结束以后，数据不会被破坏，假如A账户给B账户转10块钱，不管成功与否，A和B的总金额是不变的。
-   **隔离性：** 多个事务并发访问时，事务之间是相互隔离的，一个事务不应该被其他事务干扰，多个并发事务之间要相互隔离。
-   **持久性：** 表示事务完成提交后，该事务对数据库所作的操作更改，将持久地保存在数据库之中。

# 12. 事务的隔离级别有哪些？MySQL 的默认隔离级别是什么？

- 读未提交（Read Uncommitted）
- 读已提交（Read Committed）
- 可重复读（Repeatable Read）
- 串行化（Serializable）

Mysql 默认的事务隔离级别是可重复读（Repeatable Read）

# 13. 什么是脏写、脏读、不可重复读、幻读？

**1. 脏写**

一个A事务中修改了另一个未提交事务B的记录值，并且A事务提交，但是B事务进行了回滚，但是A事务中提交的事务未生效，此时就发生了**脏写**。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230414080307.png)

**2. 脏读**

事务A读取了事务B中**修改但未提交**的字段，之后事务B回滚，导致事务A读取到的记录是未修改过的。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230414084843.png)

**3. 不可重复读**

对于两个事务Session A、Session B，Session A `读取`了一个字段，然后 Session B `更新`了该字段。 之后 Session A `再次读取` 同一个字段， `值就不同` 了。那就意味着发生了不可重复读。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230414085001.png)

**4. 幻读**

对于两个事务Session A、Session B, Session A 从一个表中 `读取` 了一个字段, 然后 Session B 在该表中 `插入` 了一些新的行。 之后, 如果 Session A `再次读取` 同一个表, 就会多出几行。那就意味着发生了**幻读**。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230414085410.png)

# 14. 在高并发情况下，如何做到安全的修改同一行数据？

要安全的修改同一行数据，就要保证一个线程在修改时其它线程无法更新这行记录，一般采用的是悲观锁和乐观锁两种方案。

**使用悲观锁**

悲观锁思想就是，当前线程要进来修改数据时，别的线程都得，比如使用：

```mysql
select * from user where name = 'jack' for update
```

以上这条 sql 语句会锁定了 User 表中所有符合检索条件的记录。本次事务提交之前，别的线程都无法修改这些记录。

**使用乐观锁**

乐观锁思想就是，有线程过来，先放过去修改，如果看到别的线程没修改过， 就可以修改成功，如果别的线程修改过，就修改失败或者重试。实现方式：乐观锁一般会使用版本号机制或 CAS 算法实现。

# 15. 解释一下数据库的乐观锁和悲观锁

**悲观锁**

一个事务拥有（获得）悲观锁后，其他任何事务都不能对数据进行修改啦，只能等待锁被释放才可以执行。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230415102627.png)

**乐观锁**

乐观锁的“乐观情绪”体现在，它认为数据的变动不会太频繁。因此，它允许多 个事务同时对数据进行变动。实现方式：乐观锁一般会使用版本号机制或 CAS 算法实现。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230415102713.png)

# 16. SQL 优化的一般步骤是什么，怎么看执行计划（explain）

- 使用 [[1. SQL/MySQL#2. 查看系统性能参数（ShOW STATUS命令）|SHOW STATUS 命令]] 了解各种SQL的执行频率
- 统计SQL查询成本（[[1. SQL/MySQL#3. 统计SQL的查询成本: last_query_cost|last_query_cost]]）
- 通过 [[1. SQL/MySQL#4. 定位执行慢的 SQL：慢查询日志|慢查询日志]] 定位那些执行效率较低的 sql 语句
- [[1. SQL/MySQL#6. 分析查询语句：EXPLAIN|EXPLAIN]] 分析低效 sql 的执行计划

# 17. select for update 有什么含义，会锁表还是锁行还是其他？

`select for update` 会进行加锁，而且它是悲观锁哦。至于加了是行锁还是表锁，这就要看是不是用了索引/主键啦。 没用索引/主键的话就是表锁，否则就是是行锁。

# 18. 事务 ACID 特性的实现思想

- **原子性：** 是使用 undo log 来实现的，如果事务执行过程中出错或者用户执行了 rollback，系统通过 undo log 日志返回事务开始的状态。
- **持久性：** 使用 redo log 来实现，只要 redo log 日志持久化了，当系统崩溃，即可通过 redo log 把数据恢复。
- **隔离性：** 通过锁以及 MVCC，使事务相互隔离开。 
- **一致性：** 通过回滚、恢复，以及并发情况下的隔离性，从而实现一致性。

# 19. 如何写 sql 能够有效的使用到复合索引

复合索引，也叫联合索引，用户可以在多个列上建立索引,这种索引叫做复合索引。

当我们创建一个组合索引的时候，如 `(k1, k2, k3)` ，相当于创建了 `(k1)` ，`(k1,k2)` 和`(k1,k2,k3)` 三个索引，这就是最左匹配原则。

# 20. mysql 中 in 与 exists 的区别

**exists**

先执行主查询，获得数据后，再放到子查询中做 条件验证，根据验证结果（true 或者 false），来决定主查询的数据结果是否得意保留。

**in**

首先查询子查询的表，然后将内表和外表做一个笛卡尔积，然后按照条件进行筛选。

**【总结】**

小表用 exists，大表用 in

[[1. SQL/MySQL#12.1 EXISTS 和 IN 的区分|参考：in 和 exist 到底该用谁？]]

# 21. 数据库自增主键可能遇到什么问题

- 使用自增主键对数据库做分库分表，可能出现诸如主键重复等的问题。解决方案的话，简单点的话可以考虑使用 UUID 

- 自增主键会产生表锁，从而引发问题

	InnoDB自增值是通过其本身的自增长计数器来获取值，该实现方式是通过表锁机制来完成的（`AUTO-INC LOCKING`）。**锁不是在每次事务完成后释放，而是在完成对自增长值插入的SQL语句后释放，要等待其释放才能进行后续操作**。比如说当表里有一个 `auto_increment` 字段的时候，innoDB 会在内存里保存一个计数器用来记录 `auto_increment` 的值，当插入一个新行数据时，就会用一个表锁来锁住这个计数器，直到插入结束。如果大量的并发插入，表锁会引起SQL堵塞

- 自增主键可能用完

# 22. MVCC 熟悉吗，它的底层原理？

MVCC，多版本并发控制，它是通过读取历史版本的数据，来降低并发事务冲突， 从而提高并发性能的一种机制。

**MVCC 需要关注这几个知识点：**

- 事务版本号 
- 表的隐藏列 
- undo log 
- read view

[[1. SQL/MySQL#1. 什么是MVCC|参考MVCC]]

# 23. MYSQL 的主从延迟如何解决？

## 主从复制的原理

- **步骤一：** 主库的更新事件(update、insert、delete)被写到 `binlog` 
- **步骤二：** 从库发起连接，连接到主库。 
- **步骤三：** 此时主库创建一个 `binlog dump thread`，把 `binlog` 的内容发送到从库。 
- **步骤四：** 从库启动之后，创建一个 I/O 线程，读取主库传过来的 binlog 内容并写入到 relay log 
- **步骤五：** 还会创建一个 SQL 线程，从 relay log 里面读取内容，从 Exec_Master_Log_Pos 位置开始执行读取到的更新事件，将更新内容写入到 slave 的 db

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230417170447.png)

## 主从同步的延迟的原因

一个服务器开放Ｎ个链接给客户端来连接的，这样有会有大并发的更新操作, 但是从服务器的里面读取 binlog 的线程仅有一个，当某个 SQL 在从服务器上执行的时间稍长或者由于某个 SQL 要进行锁表就会导致，主服务器的 SQL 大量积压，未被同步到从服务器里。这就导致了主从不一致， 也就是主从延迟。

## 主从同步延迟的解决办法

- 主服务器要负责更新操作，对安全性的要求比从服务器要高，所以有些设置参数可以修改，比如 sync_binlog=1(表示每次提交事务都会执行fsync，将 binlog cache写入日志文件落入磁盘)，innodb_flush_log_at_trx_commit=1(每次提交事务的时候，都把数据写入日志，并把日志写入磁盘)之类的设置等。 
- 选择更好的硬件设备作为 slave。把一台从服务器作为备份使用，而不提供查询，那边他的负载下来了， 执行 relay log 里面的 SQL 效率自然就高了。
- 增加从服务，这个目的还是分散读的压力，从而降低服务器负载。

# 24. 说一下大表查询的优化方案

- 优化 schema
- 物理表加索引
- 可以考虑加缓存，memcached，redis，或者 JVM 本地缓存
- 主从复制，读写分离
- 分库分表

# 25. 什么是数据库连接池?为什么需要数据库连接池呢?


**连接池基本原理：**

在内部对象池中，维护一定数量的数据库连接，并对外暴露数据库连接的获取和返回方法。 

**应用程序和数据库建立连接的过程：**

- 通过 TCP 协议的三次握手和数据库服务器建立连接
- 发送数据库用户账号密码，等待数据库验证用户身份
- 完成身份验证后，系统可以提交 SQL 语句到数据库执行
- 把连接关闭，TCP 四次挥手告别

**数据库连接池好处：**

- 资源重用（连接复用）
- 更快的系统响应速度
- 新的资源分配手段
- 统一的连接管理，避免数据库连接泄漏

# 26. 一条 SQL 语句在 MySQL 中如何执行的？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230418091051.png)

- 先检查该语句是否有权限 
- 如果没有权限，直接返回错误信息
- 如果有权限，在 MySQL8.0 版本以前，会先查询缓存。 如果没有缓存，分析器进行词法分析，提取 sql 语句 select 等的关键元素。然后判断 sql 语句是否有语法错误，比如关键词是否正确等等
- 优化器进行确定执行方案
- 进行权限校验，如果没有权限就直接返回错误信息，如果有权限就会调用数据库引擎接口，返回执行结果

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230420171938.png)

>参考：[MySQL是如何执行的？](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485097&idx=1&sn=84c89da477b1338bdf3e9fcd65514ac1&chksm=cea24962f9d5c074d8d3ff1ab04ee8f0d6486e3d015cfd783503685986485c11738ccb542ba7&token=79317275&lang=zh_CN#rd)

# 27. InnoDB 引擎中的索引策略，了解过吗？

- **覆盖索引**

覆盖索引只需要在一棵索引树上就能获取 SQL 所需的所有列数据，无需回表，速度更快。例如，存在 ``

- **最左前缀原则**

MySQl 建立联合索引时，会遵循最左前缀匹配的原则， 即最左优先。如果你建立一个（a,b,c）的联合索引，相当于建立了 (a)、(a,b)、(a,b,c)三个索引。

- **索引下推**

索引下推优化是 MySQL 5.6 引入的， 可以在索引遍历过程中，对索引中包含的字段先做判断，直接过滤掉不满足条件的记录，**减少回表次数**。例如，存在 `索引(a, b, c)`，在执行 `select * from t where a = '1' and b = '2'` 的时候，会在二级索引先进行 a、b 列的过滤，然后再进行回表操作。

# 28. 一条 sql 执行过长的时间，你如何优化，从哪些方面入手？

- 查看是否涉及多表和子查询，优化 Sql 结构，如去除冗余字段，是否可拆表等 
- 优化索引结构，看是否可以适当添加索引 
- 数量大的表，可以考虑进行分库/分表（如交易流水表） 
- 数据库主从分离，读写分离 
- explain 分析 sql 语句，查看执行计划，优化 sql

# 29. Blob 和 text 有什么区别？

- Blob 用于存储二进制数据，而 Text 用于存储大字符串。 
- Blob 值被视为二进制字符串（字节字符串）,它们没有字符集，并且排序和比较基于列值中的字节的数值。 
- text 值被视为非二进制字符串（字符字符串）。它们有一个字符集，并根据字符集的排序规则对值进行排序和比较。

# 30. mysql 里记录货币用什么字段类型比较好？

- 货币在数据库中 MySQL 常用 Decimal 和 Numric 类型表示，这两种类型被 MySQL 实现为同样的类型。他们被用于保存与金钱有关的数据。 
- salary DECIMAL(9,2)，9(precision)代表将被用于存储值的总的小数位数，而 2(scale)代表将被用于存储小数点后的位数。存储在 salary 列中的值的范围是从9999999.99 到 9999999.99。 
- DECIMAL 和 NUMERIC 值作为字符串存储，而不是作为二进制浮点数，以便保存 那些值的小数精度。

>1. 当小数位超过指定的小数长度后，将会对小数位进行四舍五入
>2. 当整数位大于指定的整数位数后，将会报错 (`Out of range value for column 'salary_decimal'`)

# 31. Mysql 中有哪几种锁，列举一下？

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230419201426.png)

如果按锁粒度划分，有以下 3 种：

- 表锁： 开销小，加锁快；锁定力度大，发生锁冲突概率高，并发度最低；不会出现死锁。
- 行锁： 开销大，加锁慢；会出现死；锁定粒度小，发生锁冲突的概率低，并发度高。
- 页锁： 开销和加锁速度介于表锁和行锁之间；会出现死锁；锁定粒度介于表锁和 
- 行锁之间，并发度一般

[[1. SQL/MySQL#3. 锁的不同角度分类|参考：锁]]

[InnoDB锁专题](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247499275&idx=1&sn=ca72f48a290e4fd2a2ded6ef6fd045be&chksm=cf222122f855a8347b911352cebdd722b17ea45733b91ff169353c0805d9f31cea5261ef01b9&token=1712314640&lang=zh_CN#rd)

# 32. Hash 索引和 B+树区别是什么？你在设计索引是怎么抉择的？

- B+树可以进行范围查询，Hash 索引不能。 
- B+树支持联合索引的最左侧原则，Hash 索引不支持。
- B+树支持 order by 排序，Hash 索引不支持。
- Hash 索引在等值查询上比 B+树 效率更高。
- B+树使用 like 进行模糊查询的时候，like 后面（比如%开头）的话可以起到优化的作用，Hash 索引根本无法进行模糊查询。

# 33. mysql 的内连接、左连接、右连接有什么区别？

- Inner join 内连接，在两张表进行连接查询时，只保留两张表中完全匹配的结果集 
- left join 在两张表进行连接查询时，会返回左表所有的行，即使在右表中没有匹配的记录。 
- right join 在两张表进行连接查询时，会返回右表所有的行，即使在左表中没有匹配的记录。

# 34. 说说 MySQL 的基础架构图

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230419205427.png)

# 35. 说一下数据库的三大范式

- 第一范式：数据表中的每一列（每个字段）都不可以再拆分。
- 第二范式：在第一范式的基础上，非主键列完全依赖于主键，而不能是依赖于主键的一部分。
- 第三范式：在满足第二范式的基础上，表中的非主键只依赖于主键，而不依赖于其他非主键。

# 36. Mysql 的 binlog 有几种录入格式？分别有什么区别？

有三种格式：

**statement**

记录的是 SQL 的原文。不需要记录每一行的变化，减少了 binlog 日志量，节约了 IO，提高性能。由于 sql 的执行是有上下文的，因此在保存的时候需要保存相关的信息，同时还有一些使用了函数之类的语句无法被记录复制。

**row**

不记录 sql 语句上下文相关信息，仅保存哪条记录被修改。记录单元为每一行的改动，基本是可以全部记下来但是由于很多操作，会导致大量行的改动(比如 alter table)，因此这种模式的文件保存的信息太多，日志量太大。

**mixed**

一种折中的方案，普通操作使用 statement 记录，当无法使用 statement 的时候使用 row。

[参考：MySQL主从机制](https://mp.weixin.qq.com/s?__biz=Mzg3NzU5NTIwNg==&mid=2247497982&idx=1&sn=bb589329cceb5462fc41f66ec63dbf56&chksm=cf2227d7f855aec16dd4d3b3425c0401850eeaf2c9cdc82e82722d38a00c24ee9ccfa3353774&token=1712314640&lang=zh_CN#rd)

# 37. 索引有哪些优缺点？索引有哪几种类型？

## 索引有哪些优缺点

**优点** 

- 唯一索引可以保证数据库表中每一行的数据的唯一性 
- 索引可以加快数据查询速度，减少查询时间

**缺点**

- 创建索引和维护索引要耗费时间 
- 索引需要占物理空间，除了数据表占用数据空间之外，每一个索引还要占用一定的物理空间
- 以表中的数据进行增、删、改的时候，索引也要动态的维护。

## 索引有哪几种类型？

- **主键索引:** 数据列不允许重复，不允许为 NULL，一个表只能有一个主键。
- **唯一索引:** 数据列不允许重复，允许为 NULL 值，一个表允许多个列创建唯一索引。
- **普通索引:** 基本的索引类型，没有唯一性的限制，允许为 NULL 值。
- **全文索引:** 是目前搜索引擎使用的一种关键技术，对文本的内容进行分词、搜索。
- **覆盖索引:** 查询列要被所建的索引覆盖，不必读取数据行
- **组合索引:** 多列值组成一个索引，用于组合搜索，效率大于索引合并

# 38. 创建索引有什么原则呢？

- 最左前缀匹配原则
- 频繁作为查询条件的字段才去创建索引
- 频繁更新的字段不适合创建索引
- 索引列不能参与计算，不能有函数操作
- 优先考虑扩展索引，而不是新建索引，避免不必要的索引
- 在 `order by` 或者 `group by` 子句中，创建索引需要注意顺序
- 区分度低的数据列不适合做索引列（如性别） 定义有外键的数据列一定要建立索引 
- 对于定义为 text、image 数据类型的列不要建立索引
- 删除不再使用或者很少使用的索引

# 39. 创建索引的三种方式

**1. 在执行 CREATE TABLE 时创建索引**

```mysql
CREATE TABLE employee (
	`id` int(11) NOT NULL,
	`name` varchar(255) DEFAULT NULL,
	`age` int(11) DEFAULT NULL,
	`date` datetime DEFAULT NULL,
	`sex` int(1) DEFAULT NULL,
	PRIMARY KEY (`id`),
	KEY `idx_name` USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

**2. 使用 ALTER TABLE 命令添加索引**

```mysql
ALTER TABLE table_name ADD INDEX index_name (column);
```

**3. 使用 CREATE INDEX 命令创建**

```mysql
CREATE INDEX index_name ON table_name (column);
```

# 40. 百万级别或以上的数据，你是如何删除的？

1. 可以先删除索引
2. 批量删除其中无用数据
3. 删除完成后重新创建索引

# 41. 什么是死锁？怎么解决？

死锁是指两个或多个事务在同一资源上相互占用，并请求锁定对方的资源，从 而导致恶性循环的现象。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230420165552.png)

解决死锁思路，一般就是切断环路，尽量避免并发形成环路：

- 如果不同程序会并发存取多个表，尽量约定以相同的顺序访问表，可以大大降低死锁机会。
- 在同一个事务中，尽可能做到一次锁定所需要的所有资源，减少死锁产生概率。
- 对于非常容易产生死锁的业务部分，可以尝试使用升级锁定颗粒度，通过表级锁定来减少死锁产生的概率。
- 如果业务处理不好可以用分布式事务锁或者使用乐观锁。
- 死锁与索引密不可分，解决索引问题，需要合理优化你的索引。

# 42. count(1)、count( * ) 与 count(列名) 的区别？

- **count(`*`)** 包括了所有的列，相当于行数，在统计结果的时候，不会忽略列值为 NULL
- **count(1)** 包括了忽略所有列，用 1 代表代码行，在统计结果的时候，不会忽略列值为 NULL
- **count(列名)** 只包括列名那一列，在统计结果的时候，会忽略列值为空（这里的空不是指空字符串或者0，而是表示null）的计数，即某个字段值为 NULL 时，不统计。

# 43. 什么是存储过程？有哪些优缺点？

存储过程，就是一些编译好了的 SQL 语句，这些 SQL 语句代码像一个方法一样实现一些功能（对单表或多表的增删改查），然后给这些代码块取一个名字， 在用到这个功能的时候调用即可。

**优点：**

- 存储过程是一个预编译的代码块，执行效率比较高
- 存储过程在服务器端运行，减少客户端的压力
- 允许模块化程序设计，只需要创建一次过程，以后在程序中就可以调用该过程任意次，类似方法的复用 
- 一个存储过程替代大量 T_SQL 语句 ，可以降低网络通信量，提高通信速率 
- 可以一定程度上确保数据安全

**缺点：**

- 调试麻烦
- 可移植性不灵活
- 重新编译问题

# 44. SQL 约束有哪几种呢？

**NOT NULL**

约束字段的内容一定不能为 NULL

**UNIQUE**

约束字段唯一性，一个表允许有多个 Unique 约束

**PRIMARY KEY**

约束字段唯一，不可重复，并且不允许位NULL，一个表只允许存在一个

**FOREIGN KEY**

用于预防破坏表之间连接的动作，也能防止非法数据插入外键

**CHECK**

用于控制字段的值范围

# 45. varchar(50)中 50 的含义

- 字段最多存放 50 个**字符（非字节）**
- 如 `varchar(50)` 和 `varchar(200)` 存储 `'jay'` 字符串所占空间是一样的，后者在排序时会消耗更多内存

# 46. mysql 中 int(20)和 char(20)以及 varchar(20)的区别

**int(20)** 

表示字段是 int 类型，显示长度是 20 

**char(20)**

表示字段是固定长度字符串，长度为 20 

**varchar(20)**

表示字段是可变长度字符串，长度为 20

# 47. drop、delete 与 truncate 的区别

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230420171409.png)

# 48. UNION 与 UNION ALL 的区别？

**Union**

对两个结果集进行并集操作，同时进行默认规则的排序，并且进行去重操作

**Union All**

对两个结果集进行并集操作，不进行排序，不进行去重

**UNION 的效率高于 UNION ALL**

# 49. 主键使用自增 ID 还是 UUID，为什么？mysql 自增主键用完了怎么办？

## 主键使用自增 ID 还是 UUID？

如果是单机的话，选择自增 ID；如果是分布式系统，优先考虑 UUID 吧

**自增 ID：** 数据存储空间小，查询效率高。但是如果数据量过大,会超出自增长的值范围，多库合并，也有可能有问题。 

**uuid：** 适合大量数据的插入和更新操作，但是它无序的，插入数据效率慢，占用空间大。

## mysql 自增主键用完了怎么办?

自增主键一般用 int 类型，一般达不到最大值，可以考虑提前分库分表的。

# 50. 你们数据库是否支持 emoji 表情存储，如果不支持，如何操作？

更换字符集 utf8-->utf8mb4

# 51. 一个 6 亿的表 a，一个 3 亿的表 b，通过外间 tid 关联， 你如何最快的查询出满足条件的第 50000 到第 50200 中的这 200 条数据记录。

1. 如果 A 表 TID 是自增长,并且是连续的,B 表的 ID 为索引 `select * from a,b where a.tid = b.id and a.tid > 500000 limit 200;`

1. 如果 A 表的 TID 不是连续的，那么就需要使用覆盖索引，TID 要么是主键，要么是辅助索引，B 表 ID 也需要有索引。 `select * from b, (select tid from a limit 50000,200) a where b.id = a .tid;`

# 52. Innodb 的事务与日志的实现方式

## 有多少种日志？

redo log、undo log、bin log、relay log

## 日志的存放形式

**redo log**

在页修改的时候，先写到 redo log buffer 里面， 然后写到 redo log 的文件系统缓存里面(fwrite)，然后再同步到磁盘文件（ fsync）。 

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230422113100.png)

**undo log**

在 MySQL5.5 之前， undo 只能存放在 ibdata 文件里面， 5.6 之后， 可以通过设置 innodb_undo_tablespaces 参数把 undo log 存放在 ibdata 之外。

## 事务是如何通过日志来实现的

两阶段提交

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230422112048.png)

# 53. 常见的索引结构有？哈希表结构属于哪种场景？

哈希表、有序数组和搜索树。

- 哈希表这种结构适用于只有等值查询的场景 
- 有序数组适合范围查询，用二分法快速得到，时间复杂度为 O(log(N))。查询还好， 如果是插入，就得挪动后面所有的记录，成本太高。因此它一般只适用静态存储引擎，比如保存 2018 年某个城市的所有人口信息。 
- B+树适合范围查询，我们一般建的索引结构都是 B+树。

# 54. 为什么 MySQL 官方默认隔离级别是 RR，而有些大厂选择了 RC 作为默认的隔离级别呢？

**1. 提升并发**

RC 在加锁的过程中，不需要添加 Gap Lock 和 Next-Key Lock 的，只对要修改的记录添加行级锁就行了。因此 RC 的支持的并发度比 RR 高得多

**2. 减少死锁**

正式因为 RR 隔离级别增加了 Gap Lock 和 Next-Key Lock 锁，因此它相对于RC，更容易产生死锁。

# 55. MySQL 的 B+树的高度怎么计算？

InnoDB 存储引擎最小储存单元是页，一页大小就是 16k。 B+树叶子存的是数据，内部节点存的是键值+指针。索引组织表通过非叶子节点的二分查找法以及指针确定数据在哪个页中，进而再去数据页中找到需要的数据；

假设 B+树 的高度为 2 的话，即有一个根结点和若干个叶子结点。这棵 B+树 的存放总记录数为：`根结点指针数*单个叶子节点记录行数`。

如果一行记录的数据大小为 1k，那么单个叶子节点可以存的记录数 = 16k/1k = 16.

非叶子节点内存放多少指针呢？我们假设主键 ID 为 bigint 类型，长度为 8 字节 (面试官问你 int 类型，一个 int 就是 32 位，4 字节)，而指针大小在 InnoDB 源 码中设置为 6 字节，所以就是 8+6=14 字节，`16k/14B =16*1024B/14B = 1170`

因此，一棵高度为 2 的 B+树，能存放 `1170 * 16 = 18720` 条这样的数据记录。 同理一棵高度为 3 的 B+树，能存放 `1170 *1170 *16 =21902400`也就是说，可以存放两千万左右的记录。B+树高度一般为 1-3 层，已经满足千万级别的数据存储。

# 56. # 13. B+树是不是有序？B+树和 B-树的主要区别？B+树索引，二级索引的查找过程?

**B+树是不是有序？**

是的

**B+树和 B-树的主要区别？**

- B-树内部节点是保存数据的；而 B+树内部节点是不保存数据的，只作索引作用，它的叶子节点才保存数据。

- B+树相邻的叶子节点之间是通过链表指针连起来的，B-树却不是。

- 查找过程中，B-树在找到具体的数值以后就结束，而B+树则需要通过索引找到叶子结点中的数据才结束 

**二级索引的查找过程？**

```mysql
select * from employee where age = 32;
```

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530114737.png)

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530114748.png)

SQL查询语句执行大概流程：

- 搜索 idx_age 索引树，将磁盘块1加载到内存，由于32<37，搜索左路分支，到磁盘寻址磁盘块2
- 将磁盘块2加载到内存中，在内存继续遍历，找到age=32的记录，取得id =400
- 拿到id=400后，回到id主键索引树
- 搜索id主键索引树，将磁盘块1加载内存，在内存遍历，找到了400，但是B+树索引非叶子节点是不保存数据的。索引会继续搜索400的右分支，到磁盘寻址磁盘块3
- 将磁盘块3加载内存，在内存遍历，找到id=400的记录，拿到R4这一行的数据，好的，大功告成。

# 57. 聊聊 binlog 日志

binlog 是归档日志，属于 MySQL Server 层的日志。可以实现**主从复制和数据恢复**两个作用。当需要恢复数据时，可以取出某个时间范围内的 binlog 进行重放恢复即可。

binlog 日志有三种格式，分别是 statement，row 和 mixed。 如果是 statement 格式，binlog 记录的是 SQL 的原文，他可能会导致主库不一 致(主库和从库选的索引不一样时)。我们来分析一下。假设主库执行删除这个 SQL（其中 a 和 create_time 都有索引）如下：

```mysql
delete from t where a > '666' and create_time < '2022-03-01' limit 1;
```

我们知道，数据选择了 a 索引和选择 create_time 索引，最后 limit 1 出来的数据一般是不一样的。所以就会存在这种情况：在 binlog = statement 格式时， 主库在执行这条 SQL 时，使用的是索引 a，而从库在执行这条 SQL 时，使用了索引 create_time。最后主从数据不一致了。 

**如何解决这个问题呢？**

可以把 binlog 格式修改为 row。row 格式的 binlog 日志，记录的不是 SQL 原文， 而是两个 event:Table_map 和 Delete_rows。Table_map event 说明要操作的 表，Delete_rows event 用于定义要删除的行为，记录删除的具体行数。row 格式的 binlog 记录的就是要删除的主键 ID 信息，因此不会出现主从不一致的问题。

但是如果 SQL 删除 10 万行数据，使用 row 格式就会很占空间的，10 万条数据都在 binlog 里面，写 binlog 的时候也很耗 IO。但是 statement 格式的 binlog 可能会导致数据不一致，因此设计 MySQL 的大叔想了一个折中的方案， mixed 格式的 binlog。所谓的 mixed 格式其实就是 row 和 statement 格式混合使用，**当 MySQL 判断可能数据不一致时，就用 row 格式，否则使用就用 statement 格式**。

# 58. 读写分离的场景下，怎么保证从数据库读到最新的数据？

数据库读写分离，主要解决高并发时，提高系统的吞吐量。来看下读写分离数据库模型：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530171816.png)

- 写请求是直接写主库，然后同步数据到从库
- 读请求一般直接读从库，除非强制读主库

在高并发场景或者网络不佳的场景，如果存在较大的主从同步数据延迟，这时候读请求去读从库，就会读到旧数据。这时候最简单暴力的方法，就是强制读主库。实际上可以使用**缓存标记法**。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530171903.png)

1. A 发起写请求，更新主库数据，并在缓存中设置一个标记，表示数据已更新，标记格式为：userId+业务 Id。
2. 设置此标记，设置过期时间（估值为主库和从库同步延迟的时间） 
3. B 发起读请求，先判断此请求，在缓存中有没有更新标记。 
4. 如果存在标记，走主库；如果没有，请求走从库。

这个方案，解决了数据不一致问题，但是每次请求都要先跟缓存打交道，会影响系统吞吐。

# 59. 如何保证 MySQL 数据不丢？

MySQL 这种关系型数据库，是日志先行策略（Write-Ahead Logging），只要 binlog 和 redo log 日志能保证持久化到磁盘，我们就能确保 MySQL 异常重启后，数据不丢失。

## 59.1 binlog 日志

binlog，又称为二进制日志，它会记录数据库执行更改的所有操作，但是不包 括查询 select 等操作。一般用于恢复、复制等功能。它的格式有三种： statement、mixed 和 row。

- statement：每一条会修改数据的 sql 都会记录到 binlog 中，不建议使用。
- row：不记录sql语句上下文相关信息，仅保存哪条记录被修改。row 的日志内容会非常清楚的记录下每一行数据修改的细节。而且不会出现某些特定情况下的存储过程，或 function ，以及trigger 的调用和触发无法被正确复制的问题，**推荐使用**。
- mixed：混合 statement 和 row 两个模式，不建议使用。

**binlog 的写入机制是怎样的呢？**

>事务执行过程中，先把日志写到 binlog cache，事务提交的时候，再把 binlog cache 写到 binlog 文件中 。

系统为每个客户端线程分配一个 binlog cache，其大小值控制参数是 binlog_cache_size。如果 binlog cache 的值超过阀值，就会临时持久化到磁盘。当事务提交的时候，再将 binlog cache 中完整的事务持久化到磁盘中，并且清空 binlog cache。

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530173622.png)

binlog 写文件分 write 和 fsync 两个过程：

- write：指把日志写到文件系统的 page cache，并没有把数据持久化到磁盘，因此速度较快。
- fsync，实际的写盘操作，即把数据持久化到磁盘。

write 和 fsync 的写入时机，是由变量 sync_binlog 控制的：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530173641.png)

如果 IO 出现性能瓶颈，可以将 sync_binlog 设置成一个较大的值。比如设置为（100~1000）。但是，会存在数据丢失的风险，当主机异常重启时，会丢失 N 个最近提交的事务 binlog。

# 59.2 redo log 日志

redo log，又称为重做日志文件，只记录事务对数据页做了哪些修改，它记录的是数据修改之后的值。redo 有三种状态：

![image.png](https://raw.githubusercontent.com/michik0/notes-image/master/20230530173728.png)

- 物理上是在 MySQL 进程内存中，存在 redo log buffer 中
- 物理上在文件系统的 page cache 里，写到磁盘 (write)，但是还没有持久化（fsync)。
- 存在 hard disk，已经持久化到磁盘。

日志写到 redo log buffer 是很快的；write 到 page cache 也很快，但是持久化到磁盘的速度就慢多了。为了控制 redo log 的写入策略，Innodb 根据 innodb_flush_log_at_trx_commit 参数不同的取值采用不同的策略，它有三种不同的取值：

- 0：表示每次事务提交时都只是把 redo log 留在 redo log buffer 中;
- 1：表示每次事务提交时都将 redo log 直接持久化到磁盘；
- 2：，表示每次事务提交时都只是把 redo log 写到 page cache。

三种模式下，0 的性能最好，但是不安全，MySQL 进程一旦崩溃会导致丢失一秒的数据。1 的安全性最高，但是对性能影响最大，2 的话主要由操作系统自行控制刷磁盘的时间，如果仅仅是 MySQL 宕机，对数据不会产生影响，如果是主机异常宕机了，同样会丢失数据。