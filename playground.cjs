
const { spawn, slsErr, slsLog } = require('./packages/koot-serverless/src/utils');

const slsLogDeploy = (...args) => slsLog('Deploying:', ...args);

const run = async () => {
    slsLogDeploy('Infos...');
    await spawn(`node -v`);
    await spawn(`node -v`);
}

run()
