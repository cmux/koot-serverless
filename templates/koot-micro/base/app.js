const Koa = require('koa');

const app = new Koa();
const { createProxyMiddleware } = require('http-proxy-middleware');
const k2c = require('koa2-connect');

const router = {
    '/a': 'http://service-718xpo8f-1252144562.bj.apigw.tencentcs.com/',
    '/': 'http://service-da5gn47d-1252144562.bj.apigw.tencentcs.com/'
};

app.use(async (ctx, next) => {
    const keys = Object.keys(router);
    for (const key of keys) {
        if (ctx.path.startsWith(key)) {
            ctx.respond = false;
            await k2c(
                createProxyMiddleware({
                    target: router[key],
                    changeOrigin: true
                })
            )(ctx, next);
        }
    }
    await next();
});

module.exports = app;
