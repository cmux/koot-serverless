# 腾讯云koa组件（支持控制旧版本数量）

修改自 https://github.com/serverless-components/tencent-koa

### 配置
增加`keepVersion`字段，默认值为2。

```yml
# serverless.yml

koa:
  component: 'koot-tencent-koa'
  inputs:
    keepVersion: 2
    region: ap-shanghai
```