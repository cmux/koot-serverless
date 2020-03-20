'use strict'
const { Component } = require('@serverless/core')

class TencentKoa extends Component {
  async default(inputs = {}) {
    const koa = await this.load('@serverless/tencent-koa')
    const koaOutput = await koa(inputs)
    // 腾讯官方默认10天自动删除cos上的zip包
    return koaOutput
  }

  /**
   * Remove
   */

  async remove(inputs = {}) {
    const koa = await this.load('@serverless/tencent-koa')
    await koa.remove(inputs)
    return {}
  }
}

module.exports = TencentKoa
