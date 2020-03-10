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

// publicPath
const { appName } = slsConfig;
if (!appName) throw new Error('"appName" is Required!');

// kootConfig 修改
kootConfig.serverless = true;
kootConfig.bundleVersionsKeep = false;
kootConfig.exportGzip = false;
kootConfig.dist = slsConfig.code;
kootConfig.historyType = 'browser';
kootConfig.distClientAssetsDirName = `${appName}_${version}`;

const oldWebpackBefore = kootConfig.webpackBefore;
kootConfig.webpackBefore = async kootConfigWithExtra => {
    if (oldWebpackBefore) await oldWebpackBefore(kootConfigWithExtra);
    const { __CLIENT_ROOT_PATH } = kootConfigWithExtra;
    if (__CLIENT_ROOT_PATH) {
        fs.emptyDirSync(__CLIENT_ROOT_PATH);
    }
};

const oldWebpackAfter = kootConfig.webpackAfter;
kootConfig.webpackAfter = async kootConfigWithExtra => {
    if (oldWebpackAfter) await oldWebpackAfter(kootConfigWithExtra);
    // 整理文件夹
    const { __CLIENT_ROOT_PATH } = kootConfigWithExtra;
    if (__CLIENT_ROOT_PATH) {
        const distPath = __CLIENT_ROOT_PATH;
        fs.removeSync(path.join(distPath, '.server'));
        console.log(`new version: "${version}"`);
        fs.outputFileSync(path.join(distPath, 'version.txt'), version);
    }
};

module.exports = kootConfig;
