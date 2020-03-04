/**
 * 发布
 * 生成 .env
 * 生成 serverless.yml
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

const { code, appName, secretId, secretKey, region, bucketName } = slsConfig;

if (!code) throw new Error('"code" is Required!');
if (!appName) throw new Error('"appName" is Required!');

const distPath = path.resolve(slsConfig.code);
const verPath = path.join(distPath, 'version.txt');
const slsPath = path.join(distPath, `../serverless/${target}`);

if (!fs.pathExistsSync(distPath))
    throw new Error(`Path "${distPath}" is not exist!`);
if (!fs.pathExistsSync(verPath))
    throw new Error(`Path "${verPath}" is not exist!`);

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
let packageObj = '';
const websiteJsonPath = path.join(
    slsPath,
    '.serverless/Template.koot-website.json'
);
if (fs.pathExistsSync(websiteJsonPath)) {
    packageObj = fs.readJsonSync(websiteJsonPath);
}

const ymlContent = `name: ${appName}

koot-website:
    component: 'koot-tencent-website'
    inputs:
        code:
            root: ${distPath}
            index: index.html
            error: index.html
        region: ${region || packageObj.region || 'ap-beijing'}
        bucketName: ${bucketName || packageObj.bucketName || appName}
        keepVersion: 2`;

fs.outputFileSync(ymlPath, ymlContent);

const run = async () => {
    // sls发布
    slsLog('sls deploy');
    await spawn(`cd ${slsPath} && sls --debug`);

    if (fs.pathExistsSync(websiteJsonPath)) {
        packageObj = fs.readJsonSync(websiteJsonPath);
    }
    // 回写配置
    if (packageObj.region !== region || packageObj.bucketName !== bucketName) {
        slsLog('rewrite serverless/config.js');
        const configPath = path.resolve(slsPath, '../config.js');
        if (packageObj.region !== region) {
            slsConfigs[target].region = packageObj.region;
        }
        if (packageObj.bucketName !== bucketName) {
            slsConfigs[target].bucketName = packageObj.bucketName;
        }
        const configContent = `module.exports = ${JSON.stringify(
            slsConfigs,
            null,
            '    '
        )};`;
        fs.outputFileSync(configPath, configContent);
    }
};

run();
