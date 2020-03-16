# Koot.js SSR × serverless 模板

## 全局安装 serverless

```
npm i -g serverless
```

## 安装 koot-serverless

```
yarn add koot-serverless
```

## 配置

### package.json

确保同一个环境的 npm scripts 中打包和发布的环境变量`target`。

```
{
    ...
    "scripts": {
        ...
        "build:qa": "koot-build --config ./serverless/koot.config.js -- target=qa",
        "build:prod": "koot-build --config ./serverless/koot.config.js -- target=prod",
        "deploy:qa": "./serverless/deploy.js qa",
        "deploy:prod": "./serverless/deploy.js prod",
        ...
    }
    ...
}
```

### serverless/config.js

```js
/**
 * qa/prod
 * 配置两个环境或者服务器，可以自行添加
 * publicPath
 * 自定义域名，或者免费域名：http://${bucketName}.cos-website.${region}.myqcloud.com
 */
module.exports = {
    qa: {
        code: './dist-qa',
        publicPath: 'http://bucketName-123.cos-website.ap-beijing.myqcloud.com'
    },
    prod: {
        code: './dist',
        publicPath: 'http://bucketName-123.cos-website.ap-beijing.myqcloud.com'
    }
};
```

### .env

位于项目根目录，
支持分环境进行配置。执行`deploy:prod`时会优先读取`.env.prod`，其次读取`.env`。

```
TENCENT_SECRET_ID=aaa
TENCENT_SECRET_KEY=bbb
```

### serverless.yml

位于项目根目录，\$开头的值需要运维修改，
支持分环境进行配置。执行`deploy:prod`时会优先读取`serverless.prod.yml`，其次读取`serverless.yml`。
更多配置参考：

-   https://github.com/serverless-components/tencent-website/blob/master/docs/configure.md
-   https://github.com/serverless-components/tencent-koa/blob/master/docs/configure.md

```
name: $name
koot-csr:
    component: 'koot-tencent-website'
    inputs:
        code:
            root: ./public
        region: $region
        bucketName: $bucketName
koot-ssr:
    component: 'koot-tencent-koa'
    inputs:
        code: ./server
        region: $region
        functionName: $functionName
        serviceId: $serviceId
```

### serverless/serverless.tpl.yml

用来在发布时增加一些通用配置，如果值是`__NEED_REPLACE__`，会被替换掉，可以用来保存完整的配置信息。

> Tips
>
> -   如果没有腾讯云账号，请先 [注册新账号](https://cloud.tencent.com/register)。
> -   没有读取到`.env`文件时需要扫码授权。也可以在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中获取 SecretId 和 SecretKey。
> -   `koot-tencent-website`和`koot-tencent-koa`移植自腾讯官方 component，具有删除旧版本的功能。

## 打包并发布到生产环境

```
npm run build:prod
npm run deploy:prod
```
