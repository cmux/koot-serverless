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

if (!code) throw new Error('code is Required!');
if (!appName) throw new Error('appName is Required!');
if (!secretId) throw new Error('secretId is Required!');
if (!secretKey) throw new Error('secretKey is Required!');
if (!region) throw new Error('region is Required!');
if (!bucketName) throw new Error('bucketName is Required!');

const distPath = path.resolve(slsConfig.code);
const verPath = path.join(distPath, 'version.txt');
const slsPath = path.join(distPath, `../serverless/${target}`);

if (!fs.pathExistsSync(distPath)) throw new Error(`${distPath} is not exist!`);
if (!fs.pathExistsSync(verPath)) throw new Error(`${verPath} is not exist!`);

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
            root: ${distPath}
            index: index.html
            error: index.html
        region: ${region}
        bucketName: ${bucketName}
        keepVersion: 2`;

fs.outputFileSync(ymlPath, ymlContent);

const run = async () => {
    // sls发布
    slsLog('sls deploy');
    await spawn(`cd ${slsPath} && sls --debug`);
};
run();
