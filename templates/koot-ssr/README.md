# Koot.js SSR × serverless模板
## 全局安装 serverless

```
npm i -g serverless
```

## 配置

### serverless/config.js

可以分环境配置，相关字段由运维提供：code、appName、secretId、secretKey、region、bucketName、functionName、serviceId。

```js
// serverless/config.js

module.exports = {
    qa: {
        code: './dist-qa',
        secretId: '',
        secretKey: '',
        region: 'ap-beijing',
        bucketName: '',
        appName: '',
        functionName: '',
        serviceId: ''
    },
    prod: {
        code: './dist',
        secretId: '',
        secretKey: '',
        region: 'ap-beijing',
        bucketName: '',
        appName: '',
        functionName: '',
        serviceId: ''
    }
};
```

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
