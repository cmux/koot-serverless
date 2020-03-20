const COS = require('cos-nodejs-sdk-v5')
const util = require('util')
const fs = require('fs')
const { Component } = require('@serverless/core')

class Website extends Component {
  async default(inputs = {}) {
    const website = await this.load('@serverless/tencent-website')
    const websiteOutput = await website(inputs)

    // 控制旧版本数量
    const tencentConf = this.context.instance.credentials.tencent
    const dirToUploadPath = inputs.code.src || inputs.code.root
    const uploadDict = {}
    if (fs.lstatSync(dirToUploadPath).isDirectory()) {
      uploadDict.dir = dirToUploadPath
    } else {
      uploadDict.file = dirToUploadPath
    }
    if (uploadDict.dir) {
      const cos = new COS({
        SecretId: tencentConf.SecretId,
        SecretKey: tencentConf.SecretKey,
        TmpSecretId: tencentConf.SecretId,
        TmpSecretKey: tencentConf.SecretKey,
        XCosSecurityToken: tencentConf.token,
        ExpiredTime: tencentConf.timestamp,
        UserAgent: 'ServerlessComponent'
      })
      // 控制旧版本数量
      const keepVersion = (inputs.keepVersion || 2) + 1
      const dir = fs.readdirSync(dirToUploadPath)[0]
      const match = dir ? dir.match(/(.+?)[\d\-_.|:]+$/) : null
      const prefix = match ? match[1] : null
      if (prefix) {
        let handler
        let oldVers = []
        // 查找旧版本
        try {
          handler = util.promisify(cos.getBucket.bind(cos))
          const res = await handler({
            Bucket: inputs.bucketName,
            Region: inputs.region,
            Prefix: prefix
          })
          oldVers = res.Contents
        } catch (e) {
          throw e
        }
        // 删除旧版本
        if (oldVers.length > keepVersion) {
          handler = util.promisify(cos.deleteObject.bind(cos))
          const arr = oldVers
            .sort((fst, snd) => {
              return new Date(fst.LastModified) - new Date(snd.LastModified)
            })
            .slice(0, oldVers.length - keepVersion)
          for (const oldVer of arr) {
            await handler({
              Bucket: inputs.bucketName,
              Region: inputs.region,
              Key: oldVer.Key
            })
          }
        }
      }
    }

    return websiteOutput
  }

  /**
   * Remove
   */

  async remove(inputs = {}) {
    const website = await this.load('@serverless/tencent-website')
    await website.remove(inputs)
    return {}
  }
}

module.exports = Website
