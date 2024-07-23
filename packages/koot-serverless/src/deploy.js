/**
 * 发布脚本
 *
 * 安装发布脚本依赖
 * 安装服务端环境依赖
 * 读取&修改 serverless.yml
 * 发布 scf --debug
 *
 * [2024/07/19] UPDATE!
 * - 由于腾讯云的变化，现在需要使用 `scf` 命令来发布
 *
 * 目录结构
 * 📂 项目根目录
 *  ├── 📂 serverless
 *  │    ├── 📂 dist                        打包结果
 *  │    │    ├── 📂 public                 静态服务器，需上传到 `COS桶`
 *  │    │    │    └── 📂 [COS桶名称]
 *  │    │    │         └── 📄 [静态资源]...
 *  │    │    ├── 📂 server                 SSR服务器，需上传到 `Serverless`
 *  │    │    │    └── 📄 [SSR脚本 & 资源]...
 *  │    │    ├── 📄 serverless_public.yml  **⚠运维提供⚠** 静态服务器上传配置
 *  │    │    └── 📄 serverless_server.yml  **⚠运维提供⚠** SSR服务器上传配置
 *  │    ├── 📄 config.js                   静态目录配置
 *  │    ├── 📄 deploy.js                   发布脚本，打包时自动生成，会调用并运行下面的 `deploy` 方法
 *  │    ├── 📄 koot.config.js              腾讯云 Serverless 相关设置
 *  │    └── 📄 package.json                安装 `koot-serverless` 包
 *  └── 📄 [项目代码库]...
 */

const path = require('path');
const { spawn, slsErr, slsLog } = require('../src/utils');

const slsLogDeploy = (...args) => slsLog('Deploying:', ...args);

/**
 * 发布到腾讯云 Serverless
 * - 触发的命令需要提供目标环境为参数，例 `node ./serverless/deploy.js prod`，其 `prod` 为目标环境
 * - 该命令以项目根目录为运行目录
 */
const deploy = async () => {
    /** 目标环境，如 `prod`，取自运行的命令 */
    const target = process.argv[2];
    if (!target) slsErr('USAGE: koot-serverless <target>');

    /** 项目代码库根目录 */
    const rootPath = process.cwd();
    /** 打包结果根目录，下属 `📂 dist` `📄 deploy.js` */
    const serverlessPath = path.join(rootPath, 'serverless');
    const slsConfigs = require(path.join(serverlessPath, 'config'));
    const slsConfig = slsConfigs[target];
    if (!slsConfig)
        slsErr(`Config "${target}" is required in "serverless/config.js"!`);

    const { code } = slsConfig;
    /** 目标环境的打包结果目录，如 `./serverless/dist` */
    const distPath = path.join(serverlessPath, code);
    /** 预计上传到 `Serverless` 服务的根目录 */
    const serverPath = path.join(distPath, 'server');
    /** 预计上传到 `COS桶` 服务的根目录 */
    const publicPath = path.join(distPath, 'public');

    if (!code) slsErr('Prop "code" is Required in "serverless/config.js"!');
    // 安装依赖
    slsLogDeploy('Installing dependencies');
    await spawn(`cd ${serverPath} && yarn`);
    const fs = require('fs-extra');
    const yaml = require('js-yaml');
    const _ = require('lodash');

    // 读写.env，环境变量由运维提供
    const targetEnvPath = path.join(rootPath, `./.env.${target}`);
    const envPath = path.join(rootPath, './.env');
    if (fs.pathExistsSync(targetEnvPath)) {
        fs.copySync(targetEnvPath, path.join(distPath, '.env'));
    } else if (fs.pathExistsSync(envPath)) {
        fs.copySync(envPath, path.join(distPath, '.env'));
    }

    /**
     * 发布到……
     * @param {'public'|'server'} to
     */
    const deployTo = async (to) => {
        slsLogDeploy(`Deploying to "${to}"...`);

        const distYmlPath = path.join(distPath, 'serverless.yml');

        slsLogDeploy(`Removing "serverless.yml" from "dist" folder if exists...`);
        try{
            fs.removeSync(distYmlPath);
        } catch(e) {}

        const toPath = path.join(distPath, to);
        if (!fs.pathExistsSync(toPath)) {
            slsErr(
                `Folder "${toPath}" could not be found!`
            );
        }

        const ymlFilename = `serverless_${to}.yml`;
        const ymlPath = path.join(distPath, ymlFilename);
        if (!fs.pathExistsSync(ymlPath)) {
            slsErr(
                `YAML file "${ymlPath}" could not be found!`
            );
        }

        const ymlOptions = yaml.load(fs.readFileSync(ymlPath, 'utf8'));
        slsLogDeploy(`Update "src"`);
        ymlOptions.inputs.src.src = toPath;

        slsLogDeploy(`Writing "${to}" config to "serverless.yml" in "dist" folder...`);
        const ymlContent = yaml.dump(ymlOptions, { indent: 4 });
        fs.outputFileSync(distYmlPath, ymlContent);

        slsLogDeploy(`Start deploying to "${to}"...`);
        await spawn(`cd ${distPath} && scf deploy --debug`);

        slsLogDeploy(`Cleaning...`);
        fs.removeSync(distYmlPath);

        slsLogDeploy(`✅Complete! Deployed to "${to}"!\n\n\n`);
    }

    // 发布静态资源
    await deployTo('public');

    // 发布SSR
    await deployTo('server');
};

module.exports = deploy;
