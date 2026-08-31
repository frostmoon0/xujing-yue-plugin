/* ============================================================
 * 存档自动备份
 * 每半小时把 save/ 复制到 D:/Yunzai-Bot-backup/xujing-yue-plugin/save_时间戳/
 * 保留最近 MAX_BACKUPS(100) 份, 超出自动删除最旧的备份
 * ============================================================ */
import fs from 'fs'
import path from 'path'
import { Plugin_Name, Save_Path } from './plugin.js'

const SAVE_DIR = Save_Path
export const BACKUP_DIR = process.env.XUJING_BACKUP_DIR
  ? path.resolve(process.env.XUJING_BACKUP_DIR)
  : path.resolve('D:/Yunzai-Bot-backup', Plugin_Name)
export const MAX_BACKUPS = 100

const pad = n => String(n).padStart(2, '0')
/** 备份目录名(时间戳可排序): save_YYYYMMDD_HHmmss */
function stampOf (d) {
  return `save_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/** 执行一次备份: 复制 save → D盘备份目录/save_时间戳/, 超过 MAX_BACKUPS 删最旧 */
export function backupSaves () {
  try {
    if (!fs.existsSync(SAVE_DIR)) return { ok: false, msg: '存档目录不存在: ' + SAVE_DIR }
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
    const dest = path.join(BACKUP_DIR, stampOf(new Date()))
    fs.cpSync(SAVE_DIR, dest, { recursive: true })
    /* 清理旧备份: 按时间戳排序(名字可排序), 超出上限删最旧 */
    const dirs = fs.readdirSync(BACKUP_DIR).filter(n => /^save_\d{8}_\d{6}$/.test(n)).sort()
    while (dirs.length > MAX_BACKUPS) {
      const rm = dirs.shift()
      try { fs.rmSync(path.join(BACKUP_DIR, rm), { recursive: true, force: true }) } catch (err) { }
    }
    return { ok: true, msg: `存档已备份(共 ${dirs.length} 份, 最多 ${MAX_BACKUPS})` }
  } catch (err) {
    return { ok: false, msg: '备份失败: ' + (err && err.message) }
  }
}
