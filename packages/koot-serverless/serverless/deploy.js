#!/usr/bin/env node

/**
 * 发布脚本
 */

const path = require('path');

const spawn = async cmd => {
    console.log(`=> ${cmd}`);
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

const run = async () => {
    const rootPath = process.cwd();
    const serverlessPath = path.join(rootPath, 'serverless');

    await spawn(`cd ${serverlessPath} && yarn`);

    const { deploy } = require('koot-serverless');
    await deploy();
};

run();
