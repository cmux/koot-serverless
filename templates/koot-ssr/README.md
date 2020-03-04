# Koot.js SSR × serverless模板
## 全局安装 serverless

```
npm i -g serverless
```

## 配置

### serverless/config.js

可以分环境配置发布信息。

```js
// serverless/config.js

module.exports = {
    qa: { // 测试环境
        code: './dist-qa',  // 必填 代码生成目录
        appName: 'my-app',  // 必填 项目英文名称
        region: '', // 选填 区域
        bucketName: '', // 选填 COS存储桶名称
        functionName: '', // 选填 SCF云函数名称
        serviceId: '', // 选填 API网关ID
        secretId: '',  // 选填
        secretKey: ''  // 选填
    },
    prod: { // 生产环境
        code: './dist',
        appName: 'my-app',
        region: '',
        bucketName: '',
        functionName: '',
        serviceId: '',
        secretId: '',
        secretKey: ''
    }
};
```

>Tips
>- 如果没有腾讯云账号，请先 [注册新账号](https://cloud.tencent.com/register)。
>- 不填写secretId和secretKey可以通过扫码授权。也可以在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中获取 SecretId 和 SecretKey。
>- region 默认值为 `ap-beijing`
>- bucketName、functionName、serviceId 如果不填写，会自动生成

### package.json

确保同一个环境的npm scripts中打包和发布的环境变量`target`。

```
// package.json
{
    // ...
    "scripts": {
        // ...
        "build:qa": "koot-build --config ./serverless/koot.config.js -- target=qa",
        "build:prod": "koot-build --config ./serverless/koot.config.js -- target=prod",
        "deploy:qa": "export target=qa && node serverless/deploy.js",
        "deploy:prod": "export target=prod && node serverless/deploy.js",
        // ...
    }
    // ...
}
```

## 打包并发布到生产环境
```
npm run build:prod
npm run deploy:prod
```
