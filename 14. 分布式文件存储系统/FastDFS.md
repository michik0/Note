#TODO

# 一.简介

## 1.1 描述

随着文件数据的越来越多，通过tomcat或nginx虚拟化的静态资源文件在单一的一个服务器节点内是存不下的，如果用多个节点来存储也可以，但是不利于管理和维护，所以我们需要一个系统来管理多台计算机节点上的文件数据，这就是分布式文件系统。

FastDFS是一个开源的轻量级分布式文件系统，他对文件进行管理，功能包括：文件存储、文件同步、文件访问（文件上传、下载）等，解决了大容量存储和负载均衡的问题，高度追求高性能和扩展性。特别适合以文件为载体的在线服务，如相册万盏、视频网站等等。FastDFS可以看作是基于文件的key-Value存储系统，也可以称之为 分布式文件存储服务。

分布式文件系统是一个允许文件通过网络在多台节点上分享的文件系统，多台计算机节点共同组成一个整体，为更多的用户提供分享文件和存储空间。比如常见的网盘，本质就是一个分布式的文件存储系统。虽然我们是一个分布式的文件系统，但是对用户来说是透明的，用户使用的时候，就像是访问本地磁盘一样。

## 1.2 优缺点

**优点：**

- 分布式文件系统可以提供冗余备份，所以容错能力很高。 系统中有某些节点宕机，但是整体文件服务不会停止，还是能够为用户提供服务，整体还是运作的，数据也不会丢失。分布式文件系统的可扩展性强，增加或减少节点都很简单，不会影响线上服务，增加完毕后会发布到线上，加入到集群中为用户提供服务。
- 分布式文件系统可以提供负载均衡能力，在读取文件副本的时候可以由多个节点共同提供服务，而且可以通过横向扩展来确保性能的提升与负载。

**缺点：**

- 通过API下载，存在单点的性能瓶颈
- 不支持断点续传，对大文件将是噩梦(Hadoop中的文件系统HDFS主要解决并行计算中分布式存储数据的问题。其单个数据文件通常很大，采用了分块（切分）存储的方式，所以是大数据大文件存储来使用的场景。)
- 同步机制不支持文件正确性校验，降低了系统的可用性
- 不支持POSIX通用接口访问，通用性比较的低
- 对跨公网的文件同步，存在着比较大的延迟，需要应用做相应的容错策略

## 1.3 常见术语

- tracker：追踪者服务器，主要用于协调调度，可以起到负载均衡的作用，记录storage的相关状态信息。
- storage：存储服务器，用于保存文件以及文件的元数据信息。
- group：组，同组节点提供冗余备份，不同组用于扩容。为了支持大容量，存储节点（服务器）采用了分卷（或分组）的组织方式。存储系统由一个或多个卷组成，卷与卷之间的文件是相互独立的，所有卷的文件容量累加就是整个存储系统中的文件容量。一个卷可以由一台或多台存储服务器组成，一个卷下的存储服务器中的文件都是相同的，卷中的多台存储服务器起到了冗余备份和负载均衡的作用。在卷中增加服务器时，同步已有的文件由系统自动完成，同步完成后，系统自动将新增服务器切换到线上提供服务。当存储空间不足或即将耗尽时，可以动态添加卷。只需要增加一台或多台服务器，并将它们配置为一个新的卷，这样就扩大了存储系统的容量。
- mata data：文件的元数据信息，比如长宽信息，图片后缀，视频的帧数等。

## 1.4 目录结构

tracker server目录结构：

```
${base_path}
|__data
| |__storage_groups.dat：存储分组信息
| |__storage_servers.dat：存储服务器列表
|__logs
|__trackerd.log：tracker server日志文件
数据文件storage_groups.dat和storage_servers.dat中的记录之间以换行符（\n）分隔，字段之间以西文逗号（,）分隔。
storage_groups.dat中的字段依次为：
(1) group_name：组名
(2) storage_port：storage server端口号
storage_servers.dat中记录storage server相关信息，字段依次为：
(1) group_name：所属组名
(2) ip_addr：ip地址
(3) status：状态
(4) sync_src_ip_addr：向该storage server同步已有数据文件的源服务器
(5) sync_until_timestamp：同步已有数据文件的截至时间（UNIX时间戳）
(6) stat.total_upload_count：上传文件次数
(7) stat.success_upload_count：成功上传文件次数
(8) stat.total_set_meta_count：更改meta data次数
(9) stat.success_set_meta_count：成功更改meta data次数
(10) stat.total_delete_count：删除文件次数
(11) stat.success_delete_count：成功删除文件次数
(12) stat.total_download_count：下载文件次数
(13) stat.success_download_count：成功下载文件次数
(14) stat.total_get_meta_count：获取meta data次数
(15) stat.success_get_meta_count：成功获取meta data次数
(16) stat.last_source_update：最近一次源头更新时间（更新操作来自客户端）
(17) stat.last_sync_update：最近一次同步更新时间（更新操作来自其他storage server的同步）
```

storage server目录及文件结构：

```
|+data 
| …{ip_addr}_${port}.mark：存放向目标服务器同步的完成情况
| |
| |__一级目录：256个存放数据文件的目录，目录名为十六进制字符，如：00, 1F
| |__二级目录：256个存放数据文件的目录，目录名为十六进制字符，如：0A, CF
|__logs
|__storaged.log：storage server日志文件
.data_init_flag文件格式为ini配置文件方式，各个参数如下：
#storage_join_time：本storage server创建时间；
#sync_old_done：本storage server是否已完成同步的标志（源服务器向本服务器同步已有数据）；
#sync_src_server：向本服务器同步已有数据的源服务器IP地址，没有则为空；
#sync_until_timestamp：同步已有数据文件截至时间（UNIX时间戳）；
storage_stat.dat文件格式为ini配置文件方式，各个参数如下：
#total_upload_count：上传文件次数
#success_upload_count：成功上传文件次数
#total_set_meta_count：更改meta data次数
#success_set_meta_count：成功更改meta data次数
#total_delete_count：删除文件次数
#success_delete_count：成功删除文件次数
#total_download_count：下载文件次数
#success_download_count：成功下载文件次数
#total_get_meta_count：获取meta data次数
#success_get_meta_count：成功获取meta data次数
#last_source_update：最近一次源头更新时间（更新操作来自客户端）
#last_sync_update：最近一次同步更新时间（更新操作来自其他storage server）
binlog.index中只有一个数据项：当前binlog的文件索引号
binlog.###，###为索引号对应的3位十进制字符，不足三位，前面补0。索引号基于0，最大为999。一个binlog文件最大为1GB。记录之间以换行符（\n）分隔，字段之间以西文空格分隔。字段依次为：
(1)timestamp：更新发生时间（Unix时间戳）
(2)op_type：操作类型，一个字符
(3)filename：操作（更新）的文件名，包括相对路径，如：5A/3D/FE_93_SJZ7pAAAO_BXYD.S
KaTeX parse error: Expected group after '_' at position 10: {ip_addr}_̲{port}.mark：ip_addr为同步的目标服务器IP地址，port为本组storage server端口。例如：10.0.0.1_23000.mark。文件格式为ini配置文件方式，各个参数如下：
#binlog_index：已处理（同步）到的binlog索引号
#binlog_offset：已处理（同步）到的binlog文件偏移量（字节数）
#need_sync_old：同步已有数据文件标记，0表示没有数据文件需要同步
#sync_old_done：同步已有数据文件是否完成标记，0表示未完成，1表示已完成
#until_timestamp：同步已有数据截至时间点（UNIX时间戳）
#scan_row_count：已扫描的binlog记录
#sync_row_count：已同步的binlog记录数
数据文件名由系统自动生成，包括三部分：当前时间（Unix时间戳）、文件大小（字节数）和随机数。文件名长度为16字节。文件按照PJW Hash算法hash到65536（256*256，默认配置下）个目录中分散存储。
```

## 1.5 FastDFS安装

>参考：[FastDFS安装](https://blog.csdn.net/weixin_45081813/article/details/127313666)

# 2. Java集成FastDFS

1. 引入依赖：

```xml
<!-- https://mvnrepository.com/artifact/com.github.tobato/fastdfs-client -->
<dependency>
    <groupId>com.github.tobato</groupId>
    <artifactId>fastdfs-client</artifactId>
    <version>1.27.2</version>
</dependency>
```

2. 在resources根目录下新建 `fdfs_client.conf` 配置文件

```txt
tracker_server = 192.168.150.129:22122
```

3. 上传文件

```java
package cn.itcloud.fastdfs.demo;
 
import org.csource.common.MyException;
import org.csource.fastdfs.ClientGlobal;
import org.csource.fastdfs.StorageClient;
import org.csource.fastdfs.TrackerClient;
import org.csource.fastdfs.TrackerServer;
 
import java.io.File;
import java.io.IOException;
 
/**
 * @author zqing
 * @description: TODO
 * @date: 2022/7/10 16:28
 */
public class Upload {
 
    public static void main(String[] args) throws MyException, IOException {
 
        //1、加载配置文件 tracker（ip：port）
        ClientGlobal.init("fdfs_client.conf");
        //2、创建TrackerClient对象
        TrackerClient trackerClient = new TrackerClient();
        //3、使用TrackerClient对象获取trackerserver对象
        TrackerServer trackerServer = trackerClient.getTrackerServer();
        //4、创建StorageClient对象，trackerServer、storageServer两个参数
        StorageClient storageClient = new StorageClient(trackerServer);
        //5、图片存放路径以及名称
        String path = System.getProperty("user.dir")+ File.separator+"upload.png";
        //6、使用StorageClient对象上传文件
        String[] strings = storageClient.upload_file(path, "png", null);
        //打印上传后的路径
        for (String s: strings) {
            System.out.println(s);
        }
    }
}
```

4. 下载文件

```java
package cn.itcloud.fastdfs.demo;
 
import org.csource.common.MyException;
import org.csource.fastdfs.ClientGlobal;
import org.csource.fastdfs.StorageClient;
import org.csource.fastdfs.TrackerClient;
import org.csource.fastdfs.TrackerServer;
 
import java.io.File;
import java.io.IOException;
 
/**
 * @author zqing
 * @description: TODO
 * @date: 2022/7/10 16:07
 */
public class Download {
 
    public static void main(String[] args) {
 
        try {
            //1、加载配置文件 tracker（ip：port）
            ClientGlobal.init("fdfs_client.conf");
            //2、创建TrackerClient对象
            TrackerClient trackerClient = new TrackerClient();
            //3、使用TrackerClient对象获取trackerserver对象
            TrackerServer trackerServer = trackerClient.getTrackerServer();
            //4、创建StorageClient对象
            StorageClient storageClient = new StorageClient(trackerServer);
            //5、图片存放路径以及名称
            String path = System.getProperty("user.dir")+ File.separator+"a.jpg";
            //6、使用StorageClient对象下载文件
            storageClient.download_file("group1","M00/00/00/wKiWgmLIPVCAevMWAABMAsc2ezc842.jpg",path);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (MyException e) {
            e.printStackTrace();
        }
    }
}
```

# 3. SpringBoot集成FastDFS

1. 引入依赖

```xml
<dependency>
    <groupId>com.github.tobato</groupId>
    <artifactId>fastdfs-client</artifactId>
    <version>1.27.2</version>
</dependency>
```

2. application.yml

```yml
# ===================================================================
# 分布式文件系统FDFS配置
# ===================================================================
fdfs:
  so-timeout: 1500
  connect-timeout: 600
  thumb-image:             #缩略图生成参数
    width: 150
    height: 150
  tracker-list:            #TrackerList参数,支持多个
    - 192.168.150.129:22122
    - 192.168.150.130:22122
  #连接池
  pool:
    #从池中借出的对象的最大数目（配置为-1表示不限制）
    max-total: -1
    #获取连接时的最大等待毫秒数(默认配置为5秒)
    max-wait-millis: 5000
    #每个key最大连接数
    max-total-per-key: 50
    #每个key对应的连接池最大空闲连接数
    max-idle-per-key: 10
    #每个key对应的连接池最小空闲连接数
    min-idle-per-key: 5
 
upload: #自定义Url,方便测试
  base-url: http://fastdfs2.com:8888/
```

3. 文件上传

```java
package cn.itcloud.fastdfs.service;
 
import com.github.tobato.fastdfs.domain.fdfs.StorePath;
import com.github.tobato.fastdfs.service.FastFileStorageClient;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
 
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
 
/**
 * @author zqing
 * @description: TODO
 * @date: 2022/7/10 17:13
 */
@Service
@Slf4j
public class UploadService {
 
    @Autowired
    private FastFileStorageClient fastFileStorageClient;
 
    @Value("${upload.base-url}")
    private String baseUrl;
 
    public String uploadImage(MultipartFile file) {
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null || image.getWidth() == 0 || image.getHeight() == 0) {
                throw new RuntimeException("上传的文件不是图片");
            }
        } catch (IOException e) {
            log.error("校验文件内容失败...{}", e);
            throw new RuntimeException("校验文件内容失败..." + e.getMessage());
        }
 
        try {
            //获取文件扩展名称
            String extension = StringUtils.substringAfterLast(file.getOriginalFilename(), ".");
            //上传文件并且生成略缩图
            StorePath storePath = fastFileStorageClient.uploadImageAndCrtThumbImage(file.getInputStream(), file.getSize(), extension, null);
            //返回路径
            return baseUrl+storePath.getFullPath();
        } catch (IOException e) {
            log.error("上传文件失败...{}",e);
            throw new RuntimeException("上传文件失败..." + e.getMessage());
        }
    }
}
```

4. 文件下载和删除

```java
package cn.itcloud.fastdfs;
 
import com.github.tobato.fastdfs.domain.proto.storage.DownloadByteArray;
import com.github.tobato.fastdfs.service.FastFileStorageClient;
import org.csource.fastdfs.StorageClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
 
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
 
@SpringBootTest
class FastdfsApplicationTests {
 
    @Autowired
    private FastFileStorageClient fastFileStorageClient;
 
    /**
     * 测试文件下载
     */
    @Test
    void downLoad() {
        try {
            byte[] bytes = fastFileStorageClient.downloadFile("group1", "M00/00/00/wKiWgWLKnwSAT5y8AARklwe2Zn4820_150x150.png", new DownloadByteArray());
            FileOutputStream stream = new FileOutputStream("downLoad.png");
            stream.write(bytes);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * 文件删除
     */
    @Test
    void delete(){
        fastFileStorageClient.deleteFile("group1/M00/00/00/wKiWgWLKnwSAT5y8AARklwe2Zn4820_150x150.png");
    }
}
```