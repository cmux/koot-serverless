const getKootConfig = require('./getKootConfig');
const deploy = require('./deploy');
const utils = require('./utils');

module.exports = {
    getKootConfig,
    deploy,
    ...utils
};
