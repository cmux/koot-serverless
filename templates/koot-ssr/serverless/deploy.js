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

const {
    code,
    appName,
    secretId,
    secretKey,
    region,
    bucketName,
    functionName,
    serviceId
} = slsConfig;

if (!code) throw new Error('code is Required!');
if (!appName) throw new Error('appName is Required!');
if (!secretId) throw new Error('secretId is Required!');
if (!secretKey) throw new Error('secretKey is Required!');
if (!region) throw new Error('region is Required!');
if (!bucketName) throw new Error('bucketName is Required!');
if (!functionName) throw new Error('functionName is Required!');
if (!serviceId) throw new Error('serviceId is Required!');

const distPath = path.resolve(slsConfig.code);
const csrPath = path.join(distPath, 'public');
const ssrPath = path.join(distPath, 'server');
const verPath = path.join(distPath, 'version.txt');
const slsPath = path.join(distPath, `../serverless/${target}`);

if (!fs.pathExistsSync(distPath)) throw new Error(`${distPath} is not exist!`);
if (!fs.pathExistsSync(verPath)) throw new Error(`${verPath} is not exist!`);
if (!fs.pathExistsSync(csrPath)) throw new Error(`${csrPath} is not exist!`);
if (!fs.pathExistsSync(ssrPath)) throw new Error(`${ssrPath} is not exist!`);

const version = fs.readFileSync(verPath, 'utf8');
const publicTmpPath = path.join(slsPath, '.public');

// 生成 .env
const envPath = path.join(slsPath, '.env');
slsLog(`create ${envPath}`);
const envContent = `TENCENT_SECRET_ID=${secretId}
TENCENT_SECRET_KEY=${secretKey}`;
fs.outputFileSync(envPath, envContent);

// 生成 serverless.yml
const ymlPath = path.join(slsPath, 'serverless.yml');
slsLog(`create ${ymlPath}`);
const ymlContent = `name: ${appName}

koot-csr:
    component: 'koot-tencent-website'
    inputs:
        code:
            root: ${publicTmpPath}
        region: ${region}
        bucketName: ${bucketName}
        keepVersion: 2

koot-ssr:
    component: 'koot-tencent-koa'
    inputs:
        code: ${distPath}
        region: ${region}
        functionName: ${functionName}
        serviceId: ${serviceId}
        keepVersion: 2`;

fs.outputFileSync(ymlPath, ymlContent);

// 生成 app.js
const appPath = path.join(distPath, 'app.js');
slsLog(`create ${appPath}`);
const appContent = 'module.exports = require("./server").default;';
fs.outputFileSync(appPath, appContent);

// 复制 publicTmp
const csrPathx = path.join(publicTmpPath, appName + '_' + version);
slsLog(`copy public to ${csrPathx}`);
fs.ensureDirSync(csrPathx);
fs.emptyDirSync(publicTmpPath);
fs.copySync(csrPath, csrPathx);

const run = async () => {
    // 安装依赖
    slsLog('package install');
    const yarnLockFile = path.join(distPath, 'yarn.lock');
    if (!fs.pathExistsSync(yarnLockFile)) {
        await spawn(`cd ${distPath} && npm i`);
    } else {
        await spawn(`cd ${distPath} && yarn`);
    }
    // sls发布
    slsLog('sls deploy');
    await spawn(`cd ${slsPath} && sls --debug`);
};
run();
