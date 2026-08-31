import fs from 'node:fs'
import path from 'path'
import { __dirname as pluginDir } from '../main.js'
class index {
  toindex = async ({ indexName }) => {
    const filepath = path.join(pluginDir, indexName)
    const name = []
    const sum = []
    const travel = (dir, callback) => {
      fs.readdirSync(dir).forEach((file) => {
        if (file.search('.js') != -1) {
          name.push(file.replace('.js', ''))
        }
        let pathname = path.join(dir, file)
        if (fs.statSync(pathname).isDirectory()) {
          travel(pathname, callback)
        } else {
          callback(pathname)
        }
      })
    }
    if (!fs.existsSync(filepath)) {
      logger?.warn?.(`Plugin path not found: ${filepath}`)
      return {}
    }
    travel(filepath, (filepath) => {
      if (filepath.search('.js') != -1) {
        sum.push(filepath)
      }
    })
    let apps = {}
    for (let item of sum) {
      let address = `../..${item.replace(/\\/g, '/').replace(pluginDir.replace(/\\/g, '/'), '')}`
      let allExport = (await import(address))
      let keys = Object.keys(allExport)
      keys.forEach((key) => {
        if (allExport[key].prototype) {
          if (apps.hasOwnProperty(key)) {
            logger.info(`Template detection:已经存在class ${key}同名导出\n    ${address}`)
          }
          apps[key] = allExport[key]
        } else {
          logger.info(`Template detection:存在非class属性${key}导出\n    ${address}`)
        }
      })
    }
    return apps
  }
}
export default new index()