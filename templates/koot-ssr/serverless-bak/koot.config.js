/**
 * @module kootConfig
 *
 * Koot.js 项目配置
 *
 * 配置文档请查阅: [https://koot.js.org/#/config]
 */

const fs = require('fs-extra');
const path = require('path');

const slsConfigs = require('./config');
const kootConfig = require('../koot.config');

const target = process.env.target;

if (!target) throw new Error('env "target" is required!');

const slsConfig = slsConfigs[target];

if (!slsConfig) throw new Error(`config "${target}" is required!`);

// version
const version = (isQA => {
    const now = new Date();
    const fixZero = el => (el < 10 ? '0' + el : el);
    const YYYY = now.getFullYear();
    const MM = fixZero(now.getMonth() + 1);
    const DD = fixZero(now.getDate());
    const hh = fixZero(now.getHours());
    const mm = fixZero(now.getMinutes());
    const dateString = `${YYYY}${MM}${DD}-${hh}${mm}`;
    const targetPrefix = 'release-' + (isQA ? 'testonly.' : 'online.');
    return `${targetPrefix}${dateString}`;
})(target === 'qa');

const { appName } = slsConfig;
if (!appName) throw new Error('"appName" is Required!');

let { bucketName, region } = slsConfig;
if (!region && bucketName)
    throw new Error('"region" is Required when bucketName has been set!');

const bucketCreator = async () => {
    const bucketCreate = require('./bucketCreate');
    const log = (...args) => console.log('<Bucket Creator>', ...args);
    log('"bucketName" is not set in config.js! A new bucket will be created!');
    log('Bucket creating!');
    const res = await bucketCreate();
    log('Success!', `"${res.bucketName}" bucket in the "${res.region}" region`);
    return res;
};

// publicPath
let publicPath = `http://${bucketName}.cos-website.${region}.myqcloud.com/${appName}_${version}`;
// kootConfig 修改
kootConfig.serverless = true;
kootConfig.bundleVersionsKeep = false;
kootConfig.exportGzip = false;
kootConfig.dist = slsConfig.code;

const oldWebpackConfig = kootConfig.webpackConfig;
kootConfig.webpackConfig = async () => {
    let nextWebpackConfig = oldWebpackConfig || {};
    if (typeof oldWebpackConfig === 'function') {
        nextWebpackConfig = (await oldWebpackConfig()) || {};
    }
    if (!bucketName) {
        const res = await bucketCreator();
        bucketName = res.bucketName;
        region = res.region;
        publicPath = `http://${bucketName}.cos-website.${region}.myqcloud.com/${appName}_${version}`;
    }
    if (!kootConfig.defines) {
        kootConfig.defines = {};
    }
    kootConfig.defines.__PUBLIC_PATH__ = JSON.stringify(publicPath);
    nextWebpackConfig.output = {
        ...(nextWebpackConfig.output || {}),
        publicPath
    };
    return nextWebpackConfig;
};

const oldWebpackBefore = kootConfig.webpackBefore;
kootConfig.webpackBefore = async kootConfigWithExtra => {
    if (oldWebpackBefore) await oldWebpackBefore(kootConfigWithExtra);
    const { __WEBPACK_OUTPUT_PATH, __CLIENT_ROOT_PATH } = kootConfigWithExtra;
    if (__CLIENT_ROOT_PATH) {
        fs.emptyDirSync(__CLIENT_ROOT_PATH);
    } else if (__WEBPACK_OUTPUT_PATH) {
        fs.emptyDirSync(__WEBPACK_OUTPUT_PATH);
    }
};

const oldWebpackAfter = kootConfig.webpackAfter;
kootConfig.webpackAfter = async kootConfigWithExtra => {
    if (oldWebpackAfter) await oldWebpackAfter(kootConfigWithExtra);
    const { __WEBPACK_OUTPUT_PATH, __CLIENT_ROOT_PATH } = kootConfigWithExtra;
    // 整理文件夹
    if (!__CLIENT_ROOT_PATH && __WEBPACK_OUTPUT_PATH) {
        const serverPath = __WEBPACK_OUTPUT_PATH;
        const distPath = path.join(serverPath, '..');
        ['yarn.lock', 'package-lock.json'].forEach(filename => {
            const filePath = path.resolve(distPath, '..', filename);
            if (fs.pathExistsSync(filePath)) {
                fs.copySync(filePath, path.join(distPath, filename), {
                    overwrite: true
                });
            }
        });
        // 生成 version
        console.log(`new version: "${version}"`);
        fs.outputFileSync(path.join(distPath, 'version.txt'), version);
    }
};

module.exports = kootConfig;
