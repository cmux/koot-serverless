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

if (!target) throw new Error('env target is required!');

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
const { bucketName, region, appName } = slsConfig;
const publicPath = `http://${bucketName}.cos-website.${region}.myqcloud.com/${appName}_${version}`;

// kootConfig 修改
kootConfig.serverless = true;
kootConfig.bundleVersionsKeep = false;
kootConfig.exportGzip = false;
kootConfig.dist = slsConfig.code;
kootConfig.defines.__PUBLICK_PATH__ = JSON.stringify(publicPath);

const oldWebpackConfig = kootConfig.webpackConfig;

kootConfig.webpackConfig = async () => {
    let nextWebpackConfig = oldWebpackConfig || {};
    if (typeof oldWebpackConfig === 'function') {
        nextWebpackConfig = (await oldWebpackConfig()) || {};
    }
    nextWebpackConfig.output = {
        ...(nextWebpackConfig.output || {}),
        publicPath
    };
    return nextWebpackConfig;
};

kootConfig.webpackBefore = async kootConfigWithExtra => {
    const { __WEBPACK_OUTPUT_PATH, __CLIENT_ROOT_PATH } = kootConfigWithExtra;
    if (__CLIENT_ROOT_PATH) {
        fs.emptyDirSync(__CLIENT_ROOT_PATH);
    } else if (__WEBPACK_OUTPUT_PATH) {
        fs.emptyDirSync(__WEBPACK_OUTPUT_PATH);
    }
};

kootConfig.webpackAfter = async kootConfigWithExtra => {
    const { __WEBPACK_OUTPUT_PATH, __CLIENT_ROOT_PATH } = kootConfigWithExtra;
    // 整理文件夹
    if (!__CLIENT_ROOT_PATH && __WEBPACK_OUTPUT_PATH) {
        // const serverPath = __WEBPACK_OUTPUT_PATH;

        // // 创建 server/server
        // const serverPathx = path.join(serverPath, 'server');
        // fs.ensureDirSync(serverPathx);

        // // 移动 server 到 server/server
        // const serverDir = fs.readdirSync(serverPath);
        // serverDir.forEach(el => {
        //     if (el === 'server') return;
        //     fs.moveSync(path.join(serverPath, el), path.join(serverPathx, el));
        // });

        // // 移动 package.json 到 server
        // const distPath = path.join(serverPath, '..');
        // fs.moveSync(
        //     path.join(distPath, 'package.json'),
        //     path.join(serverPath, 'package.json')
        // );

        // // 复制 lock 到 server
        // ['yarn.lock', 'package-lock.json'].forEach(filename => {
        //     const filePath = path.resolve(distPath, '..', filename);
        //     if (fs.pathExistsSync(filePath)) {
        //         fs.copySync(filePath, path.join(serverPath, filename), {
        //             overwrite: true
        //         });
        //     }
        // });
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
        console.log('new version: ', version);
        fs.outputFileSync(path.join(distPath, 'version.txt'), version);
    }
};

module.exports = kootConfig;
