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
        const getBucket = util.promisify(cos.getBucket.bind(cos))
        const deleteObject = util.promisify(cos.deleteObject.bind(cos))
        let oldVers = []
        // 查找旧版本
        try {
          const res = await getBucket({
            Bucket: inputs.bucketName,
            Region: inputs.region,
            Prefix: prefix,
            Delimiter: '/'
          })
          const dirArr = res.CommonPrefixes
          const objectInfo = await Promise.all(
            dirArr.map(({ Prefix }) => {
              return getBucket({
                Bucket: inputs.bucketName,
                Region: inputs.region,
                Prefix: Prefix,
                MaxKeys: 1
              })
            })
          )
          oldVers = objectInfo.map((el, i) => {
            return {
              Prefix: dirArr[i].Prefix,
              LastModified: el.Contents[0].LastModified
            }
          })
          // console.log(res)
        } catch (e) {
          throw e
        }
        // 删除旧版本
        if (oldVers.length > keepVersion) {
          try {
            const deleteDirArr = oldVers
              .sort((fst, snd) => {
                return new Date(fst.LastModified) - new Date(snd.LastModified)
              })
              .slice(0, oldVers.length - keepVersion)
            await Promise.all(
              deleteDirArr.map(async (deleteDir) => {
                const res = await getBucket({
                  Bucket: inputs.bucketName,
                  Region: inputs.region,
                  Prefix: deleteDir.Prefix
                })
                await Promise.all(
                  res.Contents.map((deleteObj) => {
                    return deleteObject({
                      Bucket: inputs.bucketName,
                      Region: inputs.region,
                      Key: deleteObj.Key
                    })
                  })
                )
              })
            )
          } catch (e) {
            throw e
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
