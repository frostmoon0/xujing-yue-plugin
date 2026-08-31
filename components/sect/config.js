import fs from 'fs'
import { Save_Path } from '../plugin.js'

export const CFG_DIR = `${Save_Path}/world`
export const CFG_FILE = `${CFG_DIR}/sect_cfg.json`

export function readCfg () {
  try {
    if (fs.existsSync(CFG_FILE)) return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) || {}
  } catch (err) { }
  return {}
}

export function saveCfg (cfg) {
  try {
    if (!fs.existsSync(CFG_DIR)) fs.mkdirSync(CFG_DIR, { recursive: true })
    fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, '\t'))
  } catch (err) { console.log('[宗门系统]保存配置失败:', err && err.message) }
}

export const isEnabled = (gid) => (readCfg().enabledGroups || []).includes(String(gid))
