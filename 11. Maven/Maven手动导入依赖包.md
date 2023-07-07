通过JAR包在本地生成依赖包

```shell
mvn install:install-file "-Dfile=license-checker-1.0.1-pg.jar" "-DgroupId=com.linewell" "-DartifactId=license-checker" "-Dversion=1.0.1" "-Dpackaging=jar" "-Dclassifier=pg"
```
