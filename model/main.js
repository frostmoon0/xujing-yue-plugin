import path from 'path'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
/* 插件根目录：model 的上一级 */
export const __dirname = path.resolve(path.dirname(__filename), '..')
export const appname = path.basename(__dirname)
/** 打印插件名*/
logger.info(`${appname}[2023-1-19]`);