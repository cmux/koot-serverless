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
    if (!target) throw new Error('USAGE: koot-serverless <target>');

    const rootPath = process.cwd();
    const serverlessPath = path.join(rootPath, 'serverless');
    const slsConfigs = require(path.join(serverlessPath, 'config'));
    const slsConfig = slsConfigs[target];
    if (!slsConfig)
        slsErr(`Config "${target}" is required in "serverless/config.js"!`);

    const { code } = slsConfig;

    const serverPath = path.join(serverlessPath, code, 'server');
    const publicPath = path.join(serverlessPath, code, 'public');

    if (!code) slsErr('Prop "code" is Required in "serverless/config.js"!');
    // 安装依赖
    slsLogDeploy('Installing dependencies');
    await spawn(`cd ${serverPath} && yarn`);
    // 读写serverless.yml
    const fs = require('fs-extra');
    const yaml = require('js-yaml');
    const _ = require('lodash');
    const ymlPath = path.join(rootPath, './serverless.yml');
    const tplPath = path.join(serverlessPath, './serverless.tpl.yml');
    if (!fs.pathExistsSync(ymlPath)) {
        throw new Error('"serverless.yml" could not be found!');
    }
    let slsOptions = yaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'));
    // merge
    if (fs.pathExistsSync(tplPath)) {
        // console.log(slsOptions)
        slsLogDeploy('Merge options from "serverless.tpl.yml"');
        const tplOptions = yaml.safeLoad(fs.readFileSync(tplPath, 'utf8'));
        const mergefn = (objValue, srcValue) => {
            if (objValue === '__NEED_REPLACE__') {
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

    const slsYamlContent = yaml.safeDump(slsOptions, { indent: 4 });
    fs.outputFileSync(ymlPath, slsYamlContent);
    // sls发布
    slsLogDeploy('serverless deploy begin!');
    await spawn(`cd ${rootPath} && sls --debug`);
};

module.exports = deploy;
