#!/usr/bin/env node

/**
 * 发布脚本
 *
 * 安装发布脚本依赖
 * 安装服务端环境依赖
 * 读取&修改 serverless.yml
 * 发布 sls --debug
 *
 */
const path = require("path");
const rootPath = process.cwd();

const serverlessPath = path.join(rootPath, "serverless");
const slsConfigs = require(path.join(serverlessPath, "config"));

const target = process.env.target;
if (!target) throw new Error('env "target" is required!');

const slsConfig = slsConfigs[target];
if (!slsConfig) throw new Error(`config "${target}" is required!`);

const { code } = slsConfig;

if (!code) throw new Error('"code" is Required!');

const slsLog = (...args) => console.log(`<sls:deploy>`, ...args);

// 运行命令
const spawn = async cmd => {
  slsLog(`=> ${cmd}`);
  const chunks = cmd.split(" ");
  await new Promise(resolve => {
    const child = require("child_process").spawn(chunks.shift(), chunks, {
      stdio: "inherit",
      shell: true,
      cwd: __dirname
    });
    child.on("close", () => {
      resolve();
    });
  });
};

const serverPath = path.join(serverlessPath, code, "server");
const publicPath = path.join(serverlessPath, code, "public");

const run = async () => {
  // 安装依赖
  slsLog("Installing dependencies");
  // 生成脚本依赖 package.json
  require("fs").writeFileSync(
    path.join(serverlessPath, "package.json"),
    JSON.stringify({
      dependencies: {
        "fs-extra": "*",
        "js-yaml": "*",
        lodash: "*"
      }
    })
  );
  await spawn(`cd ${serverlessPath} && yarn`);
  await spawn(`cd ${serverPath} && yarn`);
  // 读写serverless.yml
  slsLog("rewrite serverless.yml");
  const fs = require("fs-extra");
  const yaml = require("js-yaml");
  const _ = require("lodash");
  const ymlPath = path.join(rootPath, "./serverless.yml");
  const tplPath = path.join(serverlessPath, "./serverless.tpl.yml");
  if (!fs.pathExistsSync(ymlPath)) {
    throw new Error(`serverless.yml can not find!`);
  }
  let slsOptions = yaml.safeLoad(fs.readFileSync(ymlPath, "utf8"));
  // merge
  if (fs.pathExistsSync(tplPath)) {
    // console.log(slsOptions)
    const tplOptions = yaml.safeLoad(fs.readFileSync(tplPath, "utf8"));
    const mergefn = (objValue, srcValue) => {
      if (objValue === "__NEED_REPLACE__") {
        return srcValue;
      }
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue);
      }
      if (_.isObject(objValue)) {
        return _.mergeWith(objValue, srcValue, mergefn);
      }
      return objValue;
    };
    slsOptions = _.mergeWith(tplOptions, slsOptions, mergefn);
  }

  slsOptions["koot-csr"].inputs.code.root = publicPath;
  slsOptions["koot-ssr"].inputs.code = serverPath;

  const slsYamlContent = yaml.safeDump(slsOptions, { indent: 4 });
  fs.outputFileSync(ymlPath, slsYamlContent);
  // sls发布
  slsLog('sls deploy');
  await spawn(`cd ${rootPath} && sls --debug`);
};

run();
