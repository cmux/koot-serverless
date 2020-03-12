/**
 * publicPath
 * 腾讯云提供的网址：http://${bucketName}.cos-website.${region}.myqcloud.com
 * 也可以使用自定义域名
 */


module.exports = {
    "qa": {
        "code": "./dist-qa",
        "publicPath": "http://bucketName-123.cos-website.ap-beijing.myqcloud.com"
    },
    "prod": {
        "code": "./dist",
        "publicPath": "http://bucketName-123.cos-website.ap-beijing.myqcloud.com"
    }
};
