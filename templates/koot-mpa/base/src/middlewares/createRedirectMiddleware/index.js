const { match, compile } = require('path-to-regexp');
/**
 * createRedirectMiddleware
 * @description dependent on 'path-to-regexp'
 * @param {*} opts
 * @example
 * [
 *   { from: "/aaa", to: "/bbb", type: 302 },
 *   { from: "/article/:id", to: "/news/:id", type: 301 }
 * ]
 */
const createRedirectMiddleware = opts => async (ctx, next) => {
    for (const opt of opts) {
        const matchFunc = match(opt.from, { decode: decodeURIComponent });
        const matchRes = matchFunc(ctx.path);
        if (matchRes) {
            const toPath = compile(opt.to, { encode: encodeURIComponent });
            const to = toPath(matchRes.params);
            ctx.status = opt.type || 301;
            console.log(`<Redirect:${ctx.status}> From ${ctx.path} To ${to}`)
            ctx.redirect(to);
            return;
        }
    }
    await next();
};

module.exports = createRedirectMiddleware;
