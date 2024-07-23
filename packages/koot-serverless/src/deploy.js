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
 *  │    ├── 📂 dist                     打包结果
 *  │    │    ├── 📂 public              静态服务器，需上传到 `COS桶`
 *  │    │    │    └── 📂 [COS桶名称]
 *  │    │    │         └── 📄 [静态资源]...
 *  │    │    └── 📂 server              SSR服务器，需上传到 `Serverless`
 *  │    │         └── 📄 [SSR脚本 & 资源]...
 *  │    ├── 📄 config.js                静态目录配置
 *  │    ├── 📄 deploy.js                发布脚本，打包时自动生成，会调用并运行下面的 `deploy` 方法
 *  │    ├── 📄 koot.config.js           腾讯云 Serverless 相关设置
 *  │    └── 📄 package.json             安装 `koot-serverless` 包
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
    // 读写serverless.yml，文件由运维提供
    const targetYmlPath = path.join(rootPath, `./serverless.${target}.yml`);
    const ymlPath = path.join(rootPath, './serverless.yml');
    const tplPath = path.join(serverlessPath, './serverless.tpl.yml');
    if (!fs.pathExistsSync(targetYmlPath) && !fs.pathExistsSync(ymlPath)) {
        slsErr(
            `"serverless.yml" or "serverless.${target}.yml" could not be found!`
        );
    }
    let slsOptions = yaml.load(
        fs.readFileSync(
            fs.pathExistsSync(targetYmlPath) ? targetYmlPath : ymlPath,
            'utf8'
        )
    );
    // merge
    if (fs.pathExistsSync(tplPath)) {
        // console.log(slsOptions)
        slsLogDeploy('Merge options from "serverless.tpl.yml"');
        const tplOptions = yaml.load(fs.readFileSync(tplPath, 'utf8'));
        const mergefn = (objValue, srcValue) => {
            if (!objValue || objValue === '__NEED_REPLACE__') {
                return srcValue;
            }
            if (_.isArray(objValue)) {
                return objValue.concat(srcValue);
            }
            if (_.isObject(objValue)) {
                return _.mergeWith(objValue, srcValue, mergefn);
            }
            return objValue;
        };
        slsOptions = _.mergeWith(tplOptions, slsOptions, mergefn);
    }

    slsLogDeploy('Update "code" in "serverless.yml"');
    try{
        slsOptions['koot-csr'].inputs.code.root = publicPath;
        slsOptions['koot-ssr'].inputs.code = serverPath;
    }catch(e){}

    const slsYamlContent = yaml.dump(slsOptions, { indent: 4 });
    fs.outputFileSync(path.join(distPath, 'serverless.yml'), slsYamlContent);

    console.log('YML', slsYamlContent)

    // sls发布
    slsLogDeploy('serverless deploy begin!');
    await spawn(`cd ${distPath} && scf deploy --debug`);
};

module.exports = deploy;
