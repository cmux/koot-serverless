const fs = require('fs-extra');
const path = require('path');
const { getVersion, slsErr, slsLog } = require('./utils');

const rootPath = process.cwd();
const slsLogBuild = (...args) => slsLog('Building:', ...args);

/**
 * getKootConfig
 * @param {*} kootConfig
 */
function getKootConfig(kootConfig) {
    const slsConfigs = require(path.join(rootPath, './serverless/config'));

    const target = process.env.target;
    if (!target) slsErr('env "target" is required in npm script!');

    const slsConfig = slsConfigs[target];
    if (!slsConfig)
        slsErr(`config "${target}" is required in "serverless/config.js"!`);

    const name = require(path.join(rootPath, './package.json')).name;
    if (!name) {
        slsErr('"name" is required in "package.json"!');
    }

    const { code, publicPath } = slsConfig;
    if (!code) {
        slsErr('"code" is required in "serverless/config.js"!');
    }
    if (!publicPath) {
        slsErr('"publicPath" is required in "serverless/config.js"!');
    }

    const nextKootConfig = {
        ...kootConfig,
        serverless: true,
        // bundleVersionsKeep: false,
        exportGzip: false,
        dist: path.join('./serverless', code, 'server'),
    };

    const version = getVersion('release_' + target);

    const relativePath = `${name}_${version}`;
    const _publicPath = `${publicPath.replace(/\/$/, '')}/${relativePath}`;

    if (!nextKootConfig.defines) nextKootConfig.defines = {};
    nextKootConfig.defines.__PUBLIC_PATH__ = JSON.stringify(_publicPath);
    nextKootConfig.defines.__VERSION__ = JSON.stringify(version);

    const oldWebpackConfig = kootConfig.webpackConfig;
    nextKootConfig.webpackConfig = async () => {
        let nextWebpackConfig = oldWebpackConfig || {};
        if (typeof oldWebpackConfig === 'function') {
            nextWebpackConfig = (await oldWebpackConfig()) || {};
        }
        nextWebpackConfig.output = {
            ...(nextWebpackConfig.output || {}),
            publicPath: _publicPath,
        };
        return nextWebpackConfig;
    };

    const oldWebpackBefore = kootConfig.webpackBefore;
    nextKootConfig.webpackBefore = async (kootConfigWithExtra) => {
        if (oldWebpackBefore) await oldWebpackBefore(kootConfigWithExtra);
        const {
            __WEBPACK_OUTPUT_PATH,
            __CLIENT_ROOT_PATH,
        } = kootConfigWithExtra;
        if (__CLIENT_ROOT_PATH) {
            fs.emptyDirSync(__CLIENT_ROOT_PATH);
        } else if (__WEBPACK_OUTPUT_PATH) {
            fs.emptyDirSync(__WEBPACK_OUTPUT_PATH);
        }
    };

    const oldWebpackAfter = kootConfig.webpackAfter;
    nextKootConfig.webpackAfter = async (kootConfigWithExtra) => {
        if (oldWebpackAfter) await oldWebpackAfter(kootConfigWithExtra);
        const {
            __WEBPACK_OUTPUT_PATH,
            __CLIENT_ROOT_PATH,
        } = kootConfigWithExtra;
        // 整理文件夹
        if (!__CLIENT_ROOT_PATH && __WEBPACK_OUTPUT_PATH) {
            const serverPath = __WEBPACK_OUTPUT_PATH;
            const distPath = path.join(serverPath, '..');

            // 移动lock文件
            slsLogBuild('move lock file');
            ['yarn.lock', 'package-lock.json'].forEach((filename) => {
                const filePath = path.resolve(rootPath, filename);
                if (fs.pathExistsSync(filePath)) {
                    fs.copySync(filePath, path.join(distPath, filename), {
                        overwrite: true,
                    });
                }
            });
            // 生成 version
            slsLogBuild(`new version: "${version}"`);
            fs.outputFileSync(path.join(distPath, 'version.txt'), version);
            // 生成 app.js
            slsLogBuild('create app.js for serverless');
            const appContent = 'module.exports = require("./server").default;';
            fs.outputFileSync(path.join(distPath, 'app.js'), appContent);
            // 生成 index.js
            slsLogBuild('create index.js for test');
            const indexContent =
                'require("./server").default.listen(8234,()=>{console.log("http://127.0.0.1:8234")});';
            fs.outputFileSync(path.join(distPath, 'index.js'), indexContent);
            // 复制 publicCode
            const publicCodePath = path.join(distPath, '../public');
            const csrPathx = path.join(publicCodePath, relativePath);
            slsLogBuild(`copy public to ${csrPathx}`);
            fs.emptyDirSync(publicCodePath);
            fs.copySync(path.join(distPath, 'public'), csrPathx);
            nextKootConfig.defines.__RELATIVE_PATH__ = JSON.stringify(publicCodePath);
        }
    };

    return nextKootConfig;
}

module.exports = getKootConfig;
