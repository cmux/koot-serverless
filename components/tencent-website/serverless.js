const COS = require('cos-nodejs-sdk-v5')
const util = require('util')
const fs = require('fs')
const { Component } = require('@serverless/core')

class Website extends Component {
  async default(inputs = {}) {
    const website = await this.load('@serverless/tencent-website')
    const websiteOutput = await website(inputs)

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
