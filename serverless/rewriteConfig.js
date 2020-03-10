const fs = require('fs-extra');

const slsConfigs = require('./config');

const target = process.env.target;

const rewriteConfig = (next, configPath) => {
    // 回写配置
    let need;
    for (const key in next) {
        if (slsConfigs[target][key] !== next[key]) {
            need = true;
            slsConfigs[target][key] = next[key];
        }
    }
    if (need) {
        const configContent = `module.exports = ${JSON.stringify(
            slsConfigs,
            null,
            '    '
        )};`;
        fs.outputFileSync(configPath, configContent);
    }
};

module.exports = rewriteConfig;
