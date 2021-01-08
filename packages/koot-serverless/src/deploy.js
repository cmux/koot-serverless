/**
 * 发布脚本
 *
 * 安装发布脚本依赖
 * 安装服务端环境依赖
 * 读取&修改 serverless.yml
 * 发布 sls --debug
 */

const path = require('path');
const { spawn, slsErr, slsLog } = require('../src/utils');

const slsLogDeploy = (...args) => slsLog('Deploying:', ...args);

const deploy = async () => {
    const target = process.argv[2];
    if (!target) slsErr('USAGE: koot-serverless <target>');

    const rootPath = process.cwd();
    const serverlessPath = path.join(rootPath, 'serverless');
    const slsConfigs = require(path.join(serverlessPath, 'config'));
    const slsConfig = slsConfigs[target];
    if (!slsConfig)
        slsErr(`Config "${target}" is required in "serverless/config.js"!`);

    const { code } = slsConfig;
    const distPath = path.join(serverlessPath, code);
    const serverPath = path.join(distPath, 'server');
    const publicPath = path.join(distPath, 'public');

    if (!code) slsErr('Prop "code" is Required in "serverless/config.js"!');
    // 安装依赖
    slsLogDeploy('Installing dependencies');
    await spawn(`cd ${serverPath} && yarn`);
    const fs = require('fs-extra');
    const yaml = require('js-yaml');
    const _ = require('lodash');
    // 读写.env
    const targetEnvPath = path.join(rootPath, `./.env.${target}`);
    const envPath = path.join(rootPath, './.env');
    if (fs.pathExistsSync(targetEnvPath)) {
        fs.copySync(targetEnvPath, path.join(distPath, '.env'));
    } else if (fs.pathExistsSync(envPath)) {
        fs.copySync(envPath, path.join(distPath, '.env'));
    }
    // 读写serverless.yml
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
    slsOptions['koot-csr'].inputs.code.root = publicPath;
    slsOptions['koot-ssr'].inputs.code = serverPath;

    const slsYamlContent = yaml.dump(slsOptions, { indent: 4 });
    fs.outputFileSync(path.join(distPath, 'serverless.yml'), slsYamlContent);
    // sls发布
    slsLogDeploy('serverless deploy begin!');
    await spawn(`cd ${distPath} && sls --debug`);
};

module.exports = deploy;
