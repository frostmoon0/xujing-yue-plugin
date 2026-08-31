import path from 'path'
import { fileURLToPath } from 'node:url'
const Path = process.cwd();
const __filename = fileURLToPath(import.meta.url)
/* 插件根目录：components 的上一级 */
const Plugin_Path = path.resolve(path.dirname(__filename), '..')
const Plugin_Name = path.basename(Plugin_Path)
import Version from './Version.js'
import Data from './Data.js'
import Cfg from './Cfg.js'
import Common from './Common.js'
import Config from './Config.js'

export { Cfg, Common, Config, Data, Version, Path, Plugin_Name, Plugin_Path }