const fs = require('fs-extra');
const path = require('path');
const { getVersion, spawn } = require('./utils');

const target = process.env.target;
const rootPath = process.cwd();

/**
 * getKootConfig
 * @param {*} kootConfig
 */
function getKootConfig(kootConfig, { dsn }) {
    const version = kootConfig.defines.__VERSION__
        ? JSON.parse(kootConfig.defines.__VERSION__)
        : getVersion('release_' + target);

    const name = require(path.join(rootPath, './package.json')).name;
    const release = `${name}@${version}`;

    const template = `
const Sentry = require('@sentry/browser');
Sentry.init({
    release: '${release}',
    dsn: '${dsn}'
});
`;

    const sentryFile = path.join(rootPath, 'src/sentry.js');
    fs.outputFileSync(sentryFile, template);

    const nextKootConfig = {
        ...kootConfig
    };

    const oldWebpackConfig = nextKootConfig.webpackConfig;
    nextKootConfig.webpackConfig = async () => {
        let nextWebpackConfig = oldWebpackConfig || {};
        if (typeof oldWebpackConfig === 'function') {
            nextWebpackConfig = (await oldWebpackConfig()) || {};
        }
        nextWebpackConfig.entry.sentry = sentryFile;
        nextWebpackConfig.devtool = 'source-map';
        return nextWebpackConfig;
    };

    const oldWebpackAfter = kootConfig.webpackAfter;
    nextKootConfig.webpackAfter = async kootConfigWithExtra => {
        if (oldWebpackAfter) await oldWebpackAfter(kootConfigWithExtra);
        const {
            __WEBPACK_OUTPUT_PATH,
            __CLIENT_ROOT_PATH
        } = kootConfigWithExtra;
        // 发布
        if (!__CLIENT_ROOT_PATH && __WEBPACK_OUTPUT_PATH) {
            const serverPath = __WEBPACK_OUTPUT_PATH;
            const pubilcPath = path.join(serverPath, '../public');
            await spawn(
                `sentry-cli releases files "${release}" upload-sourcemaps ${pubilcPath} --rewrite`
            );
        }
    };
    return nextKootConfig;
}

module.exports = getKootConfig;
