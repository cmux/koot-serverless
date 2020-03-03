# Koot.js SPA × serverless模板
## 全局安装 serverless

```
npm i -g serverless
```

## 配置

### serverless/config.js

可以分环境配置，相关字段由运维提供：code、appName、secretId、secretKey、region、bucketName。

```js
// serverless/config.js

module.exports = {
    qa: {
        code: './dist-qa',
        secretId: '',
        secretKey: '',
        region: 'ap-beijing',
        bucketName: '',
        appName: ''
    },
    prod: {
        code: './dist',
        secretId: '',
        secretKey: '',
        region: 'ap-beijing',
        bucketName: '',
        appName: ''
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
