/**
 * @module kootConfig
 *
 * Koot.js 项目配置
 *
 * 配置文档请查阅: [https://koot.js.org/#/config]
 */
const { getKootConfig } = require('koot-serverless');
const kootConfig = require('../koot.config');

const kootSlsConfig = getKootConfig(kootConfig);
// 其他处理

module.exports = kootSlsConfig;
