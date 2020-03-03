/* global
    __SVG_ICON_PACK__:false
*/

export default {
    performanceInfos: () => `<!-- rendered: ${new Date().toISOString()} -->`,
    svgIconPack: __SVG_ICON_PACK__,
    publicPath: typeof __PUBLIC_PATH__ === 'undefined' ? '' : __PUBLIC_PATH__
};
