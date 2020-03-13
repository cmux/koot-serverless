const {
    createProxyMiddleware: _createProxyMiddleware
} = require('http-proxy-middleware');
const k2c = require('koa2-connect');

/**
 * createProxyMiddleware
 * @deprecated dependent on http-proxy-middleware
 * @param {*} opts 
 * @example
 * {
 *   "/api2" : "http://api2.abcd.com",
 *   "/api" : "http://api.abcd.com",
 *   "/" : "http://www.abcd.com"
 * }
 */
const createProxyMiddleware = opts => async (ctx, next) => {
    const keys = Object.keys(opts);
    for (const key of keys) {
        if (ctx.path.startsWith(key)) {
            ctx.respond = false;
            await k2c(_createProxyMiddleware(opts[key]))(ctx, next);
        }
    }
    await next();
};

module.exports = createProxyMiddleware;
