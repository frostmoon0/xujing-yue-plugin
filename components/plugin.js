import path from 'path'
import { fileURLToPath } from 'node:url'
/* 插件根目录：components 的上一级 */
export const Plugin_Path = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/* 插件文件夹名（随目录改名自动适配） */
export const Plugin_Name = path.basename(Plugin_Path)
/* Yunzai 根目录与插件数据目录：不依赖启动时的 process.cwd() */
export const Yunzai_Path = path.resolve(Plugin_Path, '..', '..')
export const Data_Path = path.join(Yunzai_Path, 'data')
export const Save_Path = path.join(Data_Path, Plugin_Name, 'save')
