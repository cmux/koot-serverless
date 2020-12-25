const fs = require('fs-extra');
const path = require('path');
const { getVersion, spawn } = require('./utils');

const target = process.env.target || process.env.WEBPACK_BUILD_ENV || 'prod';
const rootPath = process.cwd();

/**
 * getKootConfig
 * @param {*} kootConfig
 */
function getKootConfig(kootConfig, sentryOptions) {
    kootConfig.defines = kootConfig.defines || {}
    const version = kootConfig.defines.__VERSION__
        ? JSON.parse(kootConfig.defines.__VERSION__)
        : getVersion('release_' + target);

    const name = require(path.join(rootPath, './package.json')).name;
    const release = `${name}@${version}`;

    const template = `const isWindow = typeof window !== 'undefined';

if(isWindow){
    const Sentry = require('@sentry/browser');
    Sentry.init({
        release: '${release}',
        dsn: '${sentryOptions.dsn}'
    });
    window.__SentryTest = () => Sentry.captureException(new Error('Sentry Test!'));
}
`;

    const sentryFile = path.join(rootPath, 'src/sentry.js');
    fs.outputFileSync(sentryFile, template);

    const nextKootConfig = {
        ...kootConfig,
    };

    try {
        nextKootConfig.client.before = sentryFile;
    } catch(e) {
        nextKootConfig.before = sentryFile;
    }

    const isOldWebpackConfigMethod = typeof nextKootConfig.webpack === 'object'

    const oldWebpackConfig = isOldWebpackConfigMethod
        ? nextKootConfig.webpack.config
        : nextKootConfig.webpackConfig;
    const newWebpackConfig = async () => {
        let nextWebpackConfig = oldWebpackConfig || {};
        if (typeof oldWebpackConfig === 'function') {
            nextWebpackConfig = (await oldWebpackConfig()) || {};
        }
        nextWebpackConfig.devtool = 'hidden-source-map';
        // nextWebpackConfig.devtool = 'hidden-cheap-module-source-map';
        return nextWebpackConfig;
    };
    if (isOldWebpackConfigMethod) {
        nextKootConfig.webpack.config = newWebpackConfig
    } else {
        nextKootConfig.webpackConfig = newWebpackConfig
    }

    const oldWebpackAfter = isOldWebpackConfigMethod
        ? nextKootConfig.webpack.afterBuild
        : kootConfig.webpackAfter;
    const newWebpackAfter = async (kootConfigWithExtra) => {
        if (oldWebpackAfter) await oldWebpackAfter(kootConfigWithExtra);
        const { __WEBPACK_OUTPUT_PATH, __CLIENT_ROOT_PATH } = kootConfigWithExtra;

        const needPublish = !process.env.KOOT_SENTRY_PUBLISHED && (
            (
                process.env.WEBPACK_BUILD_TYPE === 'spa' && !!__CLIENT_ROOT_PATH
            ) || (
                !__CLIENT_ROOT_PATH && __WEBPACK_OUTPUT_PATH
            )
        )

        // 发布
        if (needPublish) {
            const serverPath = __WEBPACK_OUTPUT_PATH;
            const distPath = path.join(serverPath, '..');
            let realPublicPath = __CLIENT_ROOT_PATH;
            ['.public-chunkmap.json', '.koot-public-manifest.json'].forEach((filename) => {
                const jsonFilePath = path.resolve(distPath, filename);
                if (fs.pathExistsSync(jsonFilePath)) {
                    const json = fs.readJSONSync(jsonFilePath);
                    if (json['.public']) {
                        realPublicPath = path.join(distPath, json['.public']);
                    } else {
                        for (var key in json) {
                            if (json[key]['.public'])
                                realPublicPath = path.join(distPath, json[key]['.public']);
                            break;
                        }
                    }
                }
            });

            const definePublicPath = kootConfig.defines.__RELATIVE_PATH__
                ? JSON.parse(kootConfig.defines.__RELATIVE_PATH__)
                : null;

            const publicPath = definePublicPath || realPublicPath || path.join(distPath, 'public');

            await spawn(
                `sentry-cli releases files "${release}" upload-sourcemaps ${publicPath} --rewrite`
            );

            process.env.KOOT_SENTRY_PUBLISHED = true
        }
    };
    if (isOldWebpackConfigMethod) {
        nextKootConfig.webpack.afterBuild = newWebpackAfter
    } else {
        nextKootConfig.webpackAfter = newWebpackAfter
    }

    return nextKootConfig;
}

module.exports = getKootConfig;
