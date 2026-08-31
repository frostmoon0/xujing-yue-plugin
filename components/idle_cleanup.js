/* ============================================================
 * 闲置灵石清理 · 自动挂机检测扩展
 * - 在插件统一入口(model/api/api.js 代理)每次有效虚境指令后, 用 recordLastCmd 记录
 *   该玩家最后使用虚境指令的时间(redis hash: xujing:lastcmd:<gid> -> uid -> 时间戳)
 * - 每日定时检查一次: 扫描各群 UserHome 存档, 超过 idle_cfg.days(默认5天)未使用过
 *   虚境指令的玩家, 灵石余额(money)清零; 从未使用过指令的玩家首次见到只记录时间
 *   (宽限期), 不清零, 避免新号一进群就被清掉初始灵石
 * - 用 hash 而不是单 key: 保留"从未使用过指令"(无字段) 与 "很久前用过"(字段旧) 的
 *   区分; 检查完成后顺手裁剪超过30天的旧记录, 防止 hash 无限增长
 * ============================================================ */
import fs from 'fs'
import path from 'path'
import command from './command.js'
import { Save_Path } from './plugin.js'
import { writeJsonAtomic } from './json_store.js'

const HOME_DIR = `${Save_Path}/qylp/UserHome`
export const DAY_MS = 24 * 60 * 60 * 1000
/* 裁剪阈值: 超过30天未使用指令的旧记录直接删(早已被清空灵石, 留着无意义) */
const PRUNE_DAYS = 30

/* redis key: xujing:lastcmd:<gid> -> hash { uid: 最后虚境指令时间戳(ms) } */
export const lastCmdKey = gid => `xujing:lastcmd:${gid}`

/* 配置缓存:1分钟刷新一次,guoba改配置后最多1分钟生效
   配置缺失时自动用默认值(默认开启/默认5天/空=所有群), 避免旧配置导致功能失效 */
let cfgCache = { time: 0, enable: 'T', days: 5, groups: [] }
async function getCfg () {
  if (Date.now() - cfgCache.time > 60000) {
    try {
      const enable = await command.getConfig('idle_cfg', 'enable')
      const days = await command.getConfig('idle_cfg', 'days')
      const groups = await command.getConfig('idle_cfg', 'group')
      cfgCache = {
        time: Date.now(),
        enable: enable === undefined || enable === null ? 'T' : String(enable),
        days: Math.max(1, Number(days) || 5),
        groups: (groups || []).map(String)
      }
    } catch (err) { console.log('读取闲置灵石清理配置失败:', err.message) }
  }
  return cfgCache
}

/** 记录一次虚境指令使用时间(由 model/api/api.js 代理在有效指令后调用) */
export async function recordLastCmd (gid, uid) {
  if (!gid || !uid) return
  try { await redis.hSet(lastCmdKey(String(gid)), String(uid), String(Date.now())) } catch (err) {}
}

/* ================= 纯逻辑(可单测) ================= */

/** 读取玩家当前灵石余额(兼容旧版二进制 money2, 与财富榜同源; 无效值返回 null 不动) */
export function moneyOf (u) {
  if (!u || typeof u !== 'object') return null
  let value = Number(u.money)
  if (!Number.isFinite(value) && typeof u.money2 === 'string' && /^[01]+$/.test(u.money2)) {
    value = parseInt(u.money2, 2)
  }
  if (!Number.isFinite(value)) return null
  return Math.max(0, Math.floor(value))
}

/** 判断该玩家本次是否应清零:
 *   'grace' 从未使用过虚境指令(无记录) -> 只记录时间给宽限期, 不清零
 *   'clear' 最后使用距 now >= dayMs       -> 超期, 清零
 *   'ok'    近期仍在使用                  -> 跳过
 */
export function classifyIdle (lastTs, now, dayMs) {
  if (lastTs === null || lastTs === undefined || lastTs === '') return 'grace'
  const age = now - Number(lastTs)
  if (!(age > 0)) return 'ok'
  return age >= dayMs ? 'clear' : 'ok'
}

/** 对一个群的 UserHome 对象执行判定, 返回 { cleared(清零人数), graced(需补宽限期记录的uid) };
 *   只改内存, 不写盘(由调用方统一落盘) */
export function clearIdleInHomeData (home, lastCmdMap, now, dayMs) {
  let cleared = 0
  const graced = []
  for (const uid of Object.keys(home || {})) {
    const u = home[uid]
    const money = moneyOf(u)
    if (money === null || money <= 0) continue
    const st = classifyIdle(lastCmdMap && lastCmdMap[uid], now, dayMs)
    if (st === 'clear') { u.money = 0; cleared++ }
    else if (st === 'grace') graced.push(uid)
  }
  return { cleared, graced }
}

/** 写盘前同步二进制字段(getQQYUserHome 保存同款逻辑, 防止旧二进制镜像回灌) */
export function syncBin (home) {
  for (const uid of Object.keys(home || {})) {
    const u = home[uid]
    if (!u || typeof u !== 'object') continue
    if (Number.isFinite(Number(u.money))) u.money2 = Number(u.money).toString(2)
    if (Number.isFinite(Number(u.love))) u.love2 = Number(u.love).toString(2)
  }
}

/** 列出 UserHome 目录下的群存档文件(不存在目录返回空数组) */
export function listUserHomeFiles (homeDir) {
  try { return fs.readdirSync(homeDir).filter(f => /^\d+\.json$/.test(f)).map(f => path.join(homeDir, f)) } catch (err) { return [] }
}

/* ================= 扫描并清理(依赖注入, 便于单测) ================= */

/**
 * 扫描 homeDir 下所有群存档, 清空超期未使用虚境指令玩家的灵石。
 * 依赖可注入: homeDir/redis 便于测试; 返回 { enabled, groups, cleared, graced }
 * 损坏/不可读的存档跳过(不覆盖现场); 写盘失败跳过该群(不虚报已清理)。
 */
export async function scanAndClear ({ homeDir = HOME_DIR, redis = global.redis, now = Date.now(), enable = 'T', days = 5, groups = [] } = {}) {
  const report = { enabled: String(enable) === 'T', groups: 0, cleared: 0, graced: 0 }
  if (!report.enabled) return report
  const dayMs = Math.max(1, Number(days) || 5) * DAY_MS
  const groupSet = new Set((groups || []).map(String))
  const pruneBefore = now - PRUNE_DAYS * DAY_MS

  for (const file of listUserHomeFiles(homeDir)) {
    const gid = path.basename(file).replace(/\.json$/, '')
    if (groupSet.size && !groupSet.has(gid)) continue
    let home
    try { home = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (err) { continue }
    if (!home || typeof home !== 'object' || Array.isArray(home)) continue

    let lastCmdMap = {}
    try { lastCmdMap = await redis.hGetAll(lastCmdKey(gid)) || {} } catch (err) {}

    const { cleared, graced } = clearIdleInHomeData(home, lastCmdMap, now, dayMs)

    /* 补宽限期记录: 首次见到的玩家记当前时间, 下次检查才算真正超期 */
    if (graced.length) {
      const upd = {}
      for (const uid of graced) upd[uid] = String(now)
      try { await redis.hSet(lastCmdKey(gid), upd) } catch (err) {}
    }

    /* 裁剪超过30天的旧记录(防 hash 无限增长) */
    try {
      const stale = Object.keys(lastCmdMap).filter(uid => {
        const t = Number(lastCmdMap[uid])
        return Number.isFinite(t) && t < pruneBefore
      })
      for (const uid of stale) await redis.hDel(lastCmdKey(gid), uid)
    } catch (err) {}

    /* 有玩家被清零才写盘(避免只读检查也整文件写回) */
    if (cleared > 0) {
      syncBin(home)
      try { writeJsonAtomic(file, home) } catch (err) {
        console.log(`闲置灵石清理写盘失败, 跳过该群 ${gid}:`, err.message)
        continue
      }
    }
    report.groups++
    report.cleared += cleared
    report.graced += graced.length
  }
  return report
}

/** 生产入口: 读配置后执行一次完整清理 */
export async function runIdleCleanup (now = Date.now()) {
  const cfg = await getCfg()
  if (String(cfg.enable) !== 'T') return { enabled: false, groups: 0, cleared: 0, graced: 0 }
  return scanAndClear({ now, days: cfg.days, groups: cfg.groups })
}
