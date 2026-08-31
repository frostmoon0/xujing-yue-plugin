import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BotApi } from './model/api/api.js';
import { Data, Version } from './components/index.js'
//import Ver from './components/Version.js'
import chalk from 'chalk'//用粉笔写；用白垩粉擦

if (!global.segment) {
  global.segment = (await import("oicq")).segment
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appsPath = path.join(__dirname, 'apps')
const files = fs.existsSync(appsPath)
  ? fs.readdirSync(appsPath).filter(file => file.endsWith('.js'))
  : []
const apps = await BotApi.Index.toindex({ indexName: 'apps' });
let ret = []

if (Bot?.logger?.info) {
    Bot.logger.info('🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱')
    Bot.logger.info(chalk.cyan(`        ✧  ✦  ✧  ✦  ✧  ✦  ✧  ✦  ✧  ✦  `))
    Bot.logger.info(chalk.magenta(`         /\\_/\\     ✧  虚境  ✧`))
    Bot.logger.info(chalk.magenta(`        ( o.o )  Xujing-Yue-Plugin`))
    Bot.logger.info(chalk.yellow(`         > ^ <   ♡ ⋆˙⟡ 你好呀 ˙⟡⋆ ♡`))
    Bot.logger.info(chalk.cyan(`        ✧  ☆  ⋆  ♡  ✧  ☆  ⋆  ♡  ✧  ☆  `))
    Bot.logger.info('🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴')
} else {
    console.log(`正在载入"🌱虚境插件"~`)
}


if (!await redis.get(`xujing:notice:deltime`)) {
    await redis.set(`xujing:notice:deltime`, "600")
}


// files.forEach((file) => {//forEach() 方法用于调用数组的每个元素，并将元素传递给回调函数。
//     ret.push(import(`./apps/${file}`))
// })//把file放入

// ret = await Promise.allSettled(ret)

// let apps = {}
// //遍历apps目录文件
// for (let i in files) {
//     let name = files[i].replace('.js', '')
//     if (ret[i].status != 'fulfilled') {
//         logger.error(`虚境插件载入apps应用出现错误：${logger.red(name)}`)
//         logger.error(ret[i].reason)
//         continue//报错就跳过本次循环,防止报错的插件被写入
//     }
//     apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
// }
export { apps }

