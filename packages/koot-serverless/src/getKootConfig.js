const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

const rootPath = process.cwd();

const slsConfigs = require(path.join(rootPath, './serverless/config'));

const err = msg => {
    throw new Error(`getKootConfig: ${msg}`);
};
const target = process.env.target;
if (!target) throw new Error('env "target" is required in npm script!');

const slsConfig = slsConfigs[target];
if (!slsConfig)
    err(`config "${target}" is required in "serverless/config.js"!`);

const name = require(path.join(rootPath, './package.json')).name;
if (!name) {
    err('"name" is required in "package.json"!');
}

/**
 * getKootConfig
 * @param {*} kootConfig
 */
function getKootConfig(kootConfig) {
    const { code, publicPath } = slsConfig;
    if (!code) {
        err('"code" is required in "serverless/config.js"!');
    }
    if (!publicPath) {
        err('"publicPath" is required in "serverless/config.js"!');
    }

    const nextKootConfig = {
        ...kootConfig,
        serverless: true,
        bundleVersionsKeep: false,
        exportGzip: false,
        dist: path.join('./serverless', code, 'server')
    };

    const version = utils.getVersion('release_' + target);

    const relativePath = `${name}_${version}`;
    const _publicPath = `${publicPath.replace(/\/$/, '')}/${relativePath}`;

    const oldWebpackConfig = kootConfig.webpackConfig;
    nextKootConfig.webpackConfig = async () => {
        let nextWebpackConfig = oldWebpackConfig || {};
        if (typeof oldWebpackConfig === 'function') {
            nextWebpackConfig = (await oldWebpackConfig()) || {};
        }
        if (!nextKootConfig.defines) {
            nextKootConfig.defines = {};
        }
        nextKootConfig.defines.__PUBLIC_PATH__ = JSON.stringify(_publicPath);
        nextWebpackConfig.output = {
            ...(nextWebpackConfig.output || {}),
            publicPath: _publicPath
        };
        return nextWebpackConfig;
    };

    const oldWebpackBefore = kootConfig.webpackBefore;
    nextKootConfig.webpackBefore = async kootConfigWithExtra => {
        if (oldWebpackBefore) await oldWebpackBefore(kootConfigWithExtra);
        const {
            __WEBPACK_OUTPUT_PATH,
            __CLIENT_ROOT_PATH
        } = kootConfigWithExtra;
        if (__CLIENT_ROOT_PATH) {
            fs.emptyDirSync(__CLIENT_ROOT_PATH);
        } else if (__WEBPACK_OUTPUT_PATH) {
            fs.emptyDirSync(__WEBPACK_OUTPUT_PATH);
        }
    };

    const oldWebpackAfter = kootConfig.webpackAfter;
    nextKootConfig.webpackAfter = async kootConfigWithExtra => {
        if (oldWebpackAfter) await oldWebpackAfter(kootConfigWithExtra);
        const {
            __WEBPACK_OUTPUT_PATH,
            __CLIENT_ROOT_PATH
        } = kootConfigWithExtra;
        // 整理文件夹
        if (!__CLIENT_ROOT_PATH && __WEBPACK_OUTPUT_PATH) {
            const serverPath = __WEBPACK_OUTPUT_PATH;
            const distPath = path.join(serverPath, '..');
            const log = (...args) =>
                console.log('<SERVERLESS PREPARE FLOW>', ...args);

            // 移动lock文件
            log('move lock file');
            ['yarn.lock', 'package-lock.json'].forEach(filename => {
                const filePath = path.resolve(rootPath, filename);
                if (fs.pathExistsSync(filePath)) {
                    fs.copySync(filePath, path.join(distPath, filename), {
                        overwrite: true
                    });
                }
            });
            // 生成 version
            log(`new version: "${version}"`);
            fs.outputFileSync(path.join(distPath, 'version.txt'), version);
            // 生成 app.js
            log('create app.js for serverless');
            const appContent = 'module.exports = require("./server").default;';
            fs.outputFileSync(path.join(distPath, 'app.js'), appContent);
            // 复制 publicCode
            const publicCodePath = path.join(distPath, '../public');
            const csrPathx = path.join(publicCodePath, relativePath);
            log(`copy public to ${csrPathx}`);
            fs.emptyDirSync(publicCodePath);
            fs.copySync(path.join(distPath, 'public'), csrPathx);
        }
    };

    return nextKootConfig;
}

module.exports = getKootConfig;
