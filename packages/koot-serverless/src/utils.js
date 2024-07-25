const getVersion = (prefix = 'release-') => {
    const now = new Date();
    const fixZero = el => (el < 10 ? '0' + el : el);
    const YYYY = now.getFullYear();
    const MM = fixZero(now.getMonth() + 1);
    const DD = fixZero(now.getDate());
    const hh = fixZero(now.getHours());
    const mm = fixZero(now.getMinutes());
    const dateString = `${YYYY}${MM}${DD}-${hh}${mm}`;
    return `${prefix}${dateString}`;
};

// 运行命令
const spawn = async cmd => {
    slsLog(`=> ${cmd}`);
    const chunks = cmd.split(' ');
    await new Promise((resolve, reject) => {
        const child = require('child_process').spawn(chunks.shift(), chunks, {
            stdio: 'inherit',
            shell: true,
            cwd: __dirname,
        });

        child.on('error', (err) => {
            console.log('error')
            reject(err);
        });

        child.on('close', (code) => {
            if (code !== 0) {
                slsErr(`Command failed with code ${code}`)
                process.exit(1);
            }

            resolve();
        });
    });
};

const slsErr = msg => {
    console.log(`[koot-serverless] 💥 Error: ${msg}`);
    process.exit(1);
};
const slsLog = (...msgs) => {
    console.log('[koot-serverless]', ...msgs);
};

module.exports = {
    getVersion,
    spawn,
    slsErr,
    slsLog,
};
