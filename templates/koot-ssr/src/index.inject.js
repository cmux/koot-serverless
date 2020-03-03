/* global
    __SVG_ICON_PACK__:false
*/

export default {
    performanceInfos: () => `<!-- rendered: ${new Date().toISOString()} -->`,
    svgIconPack: __SVG_ICON_PACK__,
    publicPath: typeof __PUBLICK_PATH__ === 'undefined' ? '' : __PUBLICK_PATH__
};
