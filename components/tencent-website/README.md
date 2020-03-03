# 腾讯云静态网站组件（支持控制旧版本数量）

修改自 https://github.com/serverless-components/tencent-website

### 配置
增加`keepVersion`字段，默认值为2。
发布路径下需加一层文件夹，命名规则为名称+版本号，版本号需要通过`/[\d\-_.|]/`检测，及仅可使用数字和符号(`-_.|`)，例：`appName_online-20200303-1010`。

```yml
# serverless.yml

myWebsite:
  component: 'koot-tencent-website'
  inputs:
    keepVersion: 2
    code:
      src: ./code
      index: index.html
      error: index.html
    region: ap-guangzhou
    bucketName: my-bucket
```
