const Koa = require('koa');

const app = new Koa();
const createRedirectMiddleware = require('./middlewares/createRedirectMiddleware');
const createProxyMiddleware = require('./middlewares/createProxyMiddleware');

const redirectOptions = require('./options/redirect.opt');
const proxyOptions = require('./options/proxy.opt');

app.use(createRedirectMiddleware(redirectOptions));

app.use(createProxyMiddleware(proxyOptions));

module.exports = app;
