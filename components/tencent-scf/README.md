# 腾讯云云函数SCF组件（支持控制旧版本数量）

修改自 https://github.com/serverless-components/tencent-scf

### 配置
增加`keepVersion`字段，默认值为2。

```yml
# serverless.yml
myFunction1:
  component: "koot-tencent-scf"
  inputs:
    keepVersion: 2
    name: myFunction1
    codeUri: ./code       # 代码目录
    handler: index.main_handler
    runtime: Nodejs8.9
    region: ap-guangzhou
    description: My Serverless Function
    memorySize: 128
    timeout: 20
    # 打包zip时希望忽略的文件或者目录配置（可选）
    exclude:
      - .gitignore
      - .git/**
      - node_modules/**
      - .serverless
      - .env
    include:
          - /Users/dfounderliu/Desktop/temp/.serverless/myFunction1.zip
    environment:
      variables:
        TEST: vale
    vpcConfig:
      subnetId: ''
      vpcId: ''

myFunction2:
  component: "koot-tencent-scf"
  inputs:
    name: myFunction2
    codeUri: ./code
```