> 官方网址：https://easyexcel.opensource.alibaba.com/

# POM 依赖

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>easyexcel</artifactId>
    <version>3.3.2</version>
</dependency>
```

# EXCEL映射类

表示实体类与EXCEL列的对应关系

```java
@Getter
@Setter
@EqualsAndHashCode
public class AiPromptExcelData {
    @ExcelProperty("提示词标题")
    private String title;
    @ExcelProperty("提示词内容")
    private String content;
    @ExcelProperty(value = "更新时间", converter = LocalDateTimeStringConverter.class)  
	@DateTimeFormat("yyyy-MM-dd HH:mm:ss")  
	private LocalDateTime updateTime;
}
```

# Web下载

```java
@GetMapping("/template")
@ApiOperation("下载模版")
public void downloadTemplate(HttpServletResponse response) throws IOException {
  
    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setCharacterEncoding("utf-8");
    String fileName = URLEncoder.encode("提示词模版", "UTF-8").replaceAll("\\+", "%20");
    // 前端暴露Header中的Content-Disposition属性
    response.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");
    EasyExcel.write(response.getOutputStream(), AiPromptExcelData.class).sheet("模板").doWrite(data());
}


/**
 * 模板内容
 * @return
 */
private List<AiPromptExcelData> data() {
    List<AiPromptExcelData> list = new ArrayList<>();
    AiPromptExcelData data = new AiPromptExcelData();
    data.setTitle("了解AI");
    data.setContent("请介绍下你自己");
    list.add(data);
    return list;
}
```

# Excel数据监听器

Excel数据监听器用于解析Excel中的每一行数据

```java
@Slf4j
public class AiPromptUploadDataListener implements ReadListener<AiPromptExcelData> {
    /**
     * 每隔100条存储数据库，然后清理list ，方便内存回收
     */
    private static final int BATCH_COUNT = 100;
    private List<AiPromptExcelData> cachedDataList = ListUtils.newArrayListWithExpectedSize(BATCH_COUNT);

    private AiPromptService aiPromptService;

    public AiPromptUploadDataListener(AiPromptService aiPromptService) {
        this.aiPromptService = aiPromptService;
    }

    /**
     * 解析每一行数据
     *
     * @param data    每行数据
     * @param context
     */
    @Override
    public void invoke(AiPromptExcelData data, AnalysisContext context) {
        log.info("解析到一条数据:{}", JSON.toJSONString(data));
        cachedDataList.add(data);
        if (cachedDataList.size() >= BATCH_COUNT) {
            saveData();
            cachedDataList.clear();
        }
    }

    /**
     * 数据解析后调用该方法
     *
     * @param context
     */
    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        // 这里也要保存数据，确保最后遗留的数据也存储到数据库
        saveData();
        log.info("所有数据解析完成！");
    }

    /**
     * 存储数据库
     */
    private void saveData() {
        for (AiPromptExcelData data : cachedDataList) {
            AiPromptDTO dto = AiPromptDTO.builder().title(data.getTitle()).content(data.getContent()).build();
            aiPromptService.addPromptAndModel(dto);
        }
        log.info("存储数据库成功！");
    }
}
```

# Web上传

```java
@PostMapping("/upload")
@ApiOperation("通过模版文件导入提示词")
public String uploadPrompt(MultipartFile file) throws IOException {
    // AiPromptUploadDataListener：用于监听Excel中的每一行数据
    EasyExcel.read(file.getInputStream(), AiPromptExcelData.class, new AiPromptUploadDataListener(aiPromptService)).sheet().doRead();
    return "success";
}
```
