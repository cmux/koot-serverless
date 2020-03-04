# Koot.js SPA × serverless 模板

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
    qa: {
        // 测试环境
        code: './dist-qa', // 必填 代码生成目录
        appName: 'my-app', // 必填 项目英文名称
        region: '', // 选填 区域
        bucketName: '', // 选填 COS存储桶名称
        secretId: '', // 选填
        secretKey: '' // 选填
    },
    prod: {
        // 生产环境
        code: './dist',
        appName: 'my-app',
        region: '',
        bucketName: '',
        secretId: '',
        secretKey: ''
    }
};
```

> Tips
>
> -   如果没有腾讯云账号，请先 [注册新账号](https://cloud.tencent.com/register)。
> -   不填写 secretId 和 secretKey 可以通过扫码授权。也可以在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中获取 SecretId 和 SecretKey。
> -   region 默认值为 `ap-beijing`
> -   bucketName 如果不填，会自动生成

### package.json

确保同一个环境的 npm scripts 中打包和发布的环境变量`target`。

```
// package.json
{
    // ...
    "scripts": {
        // ...
        "build:qa": "koot-build --type spa --config ./serverless/koot.config.spa.js -- target=qa",
        "build:prod": "koot-build --type spa --config ./serverless/koot.config.spa.js -- target=prod",
        "deploy:qa": "export target=qa && node serverless/deploy.spa.js",
        "deploy:prod": "export target=prod && node serverless/deploy.spa.js",
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
