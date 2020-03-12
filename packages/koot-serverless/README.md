# Serverless迁移步骤
## 确认安装koot@0.13.3以上版本
可以使用koot-cli进行升级
```
npx koot-cli
```
版本跨度较大时，需要进行迁移测试。
## 下载koot-serverless模板里的serverless文件夹
下载serverless文件夹，复制到项目根目录下  
https://github.com/cmux/koot-serverless/tree/master/packages/koot-serverless
>Tips：  
>可以使用chrome插件[GitZip](https://chrome.google.com/webstore/detail/gitzip-for-github/ffabmkklhbepgcgfonabamgnfafbdlkn)进行github文件夹打包下载
## 确认编译和发布脚本
确保同一个环境的npm scripts中打包和发布的环境变量target。
prod对应生产环境，qa对应测试环境。
```
// package.json
{
    ...
    "scripts": {
        ...
        "build:qa": "koot-build --config ./serverless/koot.config.js -- target=qa",
        "build:prod": "koot-build --config ./serverless/koot.config.js -- target=prod",
        "deploy:qa": "./serverless/deploy.js qa",
        "deploy:prod": "./serverless/deploy.js prod"
    }
    ...
}
```
## 整理依赖
把package.json里，dependencies里的依赖移到devDependencies里，服务端依赖除外。  
## 与运维对接创建发布流程
### 配置publicPath
需要运维提供cos绑定的域名或者腾讯提供的免费域名，写入serverless/config.js的`publicPath`。
### 需要运维配置
1. 选择serverless专用的docker
2. 确定触发的tag前缀
3. 需要在项目根目录生成.env文件
```
TENCENT_SECRET_ID=aaa
TENCENT_SECRET_KEY=bbb
```
4. 需要在项目根目录生成serverless.yml文件,`$`开头的值需要运维修改
```yml
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
5. 执行发布脚本
```
npm run deploy:prod #发布环境对应的脚本
```
## 打包发布
打包和发布步骤：
```
npm run build:prod # 打包
git add serverless
git commit -m "build:prod" # 提交
git push
git tag release-xxxxxxxx # 打tag
git push --tag
# 审批流程
```


