/**
 * 发布
 * 生成 .env
 * 生成 serverless.yml
 * 生成 app.js
 * 安装依赖 npm i
 * 发布 sls --debug
 */
const fs = require('fs-extra');
const path = require('path');

const slsConfigs = require('./config');

const slsLog = (...args) => console.log(`<sls:deploy>`, ...args);

// 运行命令
const spawn = async cmd => {
    slsLog(`=> ${cmd}`);
    const chunks = cmd.split(' ');
    await new Promise(resolve => {
        const child = require('child_process').spawn(chunks.shift(), chunks, {
            stdio: 'inherit',
            shell: true,
            cwd: __dirname
        });
        child.on('close', () => {
            resolve();
        });
    });
};

const target = process.env.target;

if (!target) throw new Error('env target is required!');

const slsConfig = slsConfigs[target];

if (!slsConfig) throw new Error(`config "${target}" is required!`);

const { code, appName, secretId, secretKey, region } = slsConfig;

if (!code) throw new Error('code is Required!');
if (!appName) throw new Error('appName is Required!');

const distPath = path.resolve(slsConfig.code);
const slsPath = path.join(distPath, `../serverless/${target}`);
const publicTmpPath = path.join(slsPath, '.public');

const createBucket = async () => {
    // 生成 .env
    if (secretId && secretKey) {
        const envPath = path.join(slsPath, '.env');
        slsLog(`create ${envPath}`);
        const envContent = `TENCENT_SECRET_ID=${secretId}
TENCENT_SECRET_KEY=${secretKey}`;
        fs.outputFileSync(envPath, envContent);
    }

    // 生成 serverless.yml
    const ymlPath = path.join(slsPath, 'serverless.yml');
    slsLog(`create ${ymlPath}`);
    const ymlContent = `name: ${appName}

koot-csr:
    component: 'koot-tencent-website'
    inputs:
        code:
            root: ${publicTmpPath}
        region: ${region || 'ap-beijing'}
        bucketName: ${appName}`;

    fs.outputFileSync(ymlPath, ymlContent);

    fs.ensureDirSync(publicTmpPath);
    fs.outputFileSync(path.join(publicTmpPath, '.create'), '');

    const run = async () => {
        // sls发布
        slsLog('sls deploy');
        await spawn(`cd ${slsPath} && sls --debug`);

        // 回写配置
        const csrJsonPath = path.resolve(
            slsPath,
            '.serverless/Template.koot-csr.websiteBucket.json'
        );
        if (!fs.pathExistsSync(csrJsonPath)) {
            throw new Error(`${csrJsonPath} not exist!`);
        } else {
            const next = fs.readJsonSync(csrJsonPath);
            const rewriteConfig = require('./rewriteConfig');
            slsLog('rewrite serverless/config.js');
            rewriteConfig(
                {
                    bucketName: next.bucket,
                    region: next.region
                },
                path.join(slsPath, '../config.js')
            );
            return {
                bucketName: next.bucket,
                region: next.region
            };
        }
    };

    const res = await run();
    return res;
};

module.exports = createBucket;
