/* ============================================================
 * 虚境全部物品 · 全群物品汇总
 * - 主人指令 #虚境全部物品 使用: 汇总本群所有玩家背包 + 存活伪玩家
 *   拥有的全部物品及数量, 不记归属, 只写物品名 + 总数, 渲染成图片
 * - 数据来源: 玩家背包在 <Save_Path>/bag/<gid>/<uid>.json(逐文件直接读取),
 *   伪玩家在 <Save_Path>/world/fake_<gid>.json 的 roster[p].bag(canonical 结构)
 * - 纯逻辑函数支持注入 bagDir/fakeData, 便于单测
 * ============================================================ */
import fs from 'fs'
import path from 'path'
import { Save_Path } from './plugin.js'
import { activeFakeGroups, getFake } from './fake_data.js'
import { activeDynastyGroups, getDynasty } from './dynasty_data.js'
import { EQUIP_TPL, GONGFA_TPL, MATERIAL_TPL, isRainbowRef, itemIcon } from './equip_data.js'

/** 玩家背包目录: data/<插件名>/save/bag */
export const BAG_DIR = `${Save_Path}/bag`

/** 物品品质(用于排序): 装备/功法/材料按模板品质, 彩虹武器固定 7, 其余(丹药/未知)0 */
export function itemQuality (name) {
  if (typeof name === 'string' && name.startsWith('rainbow:')) return 7
  if (EQUIP_TPL[name]) return EQUIP_TPL[name].quality
  if (GONGFA_TPL[name]) return GONGFA_TPL[name].quality
  if (MATERIAL_TPL[name]) return MATERIAL_TPL[name].quality
  return 0
}

/**
 * 把单个背包的物品计入 totals。
 * - bag.items: 每个 name -> { count }(兼容旧档裸数字), count 即该物品总数
 * - bag.equipped: 已穿戴装备(玩家穿上后会从 bag.items 扣回, 需补计; 彩虹槽位由 rainbows 计入)
 * - bag.rainbows: 成长型彩虹神兵(不入 bag.items, 按 rainbow:<名> 记账供展示带🌈)
 * @param {Map<string, number>} totals 物品名 -> 总数
 * @param {object} bag 背包(canonical 结构)
 * @param {boolean} [countEquipped] 是否补计已穿戴装备。玩家背包传 true;
 *   伪玩家因历史迁移走 removeEquippedFromItems:false, 已穿装备可能仍留在 bag.items,
 *   再计会重复, 故伪玩家传 false(只计 bag.items)
 */
export function addBagToTotals (totals, bag, countEquipped = true) {
  if (!bag || typeof bag !== 'object') return totals
  for (const [name, raw] of Object.entries(bag.items || {})) {
    if (!name) continue
    const count = typeof raw === 'number' ? raw : Math.max(0, Math.floor(Number(raw && raw.count) || 0))
    if (count > 0) totals.set(name, (totals.get(name) || 0) + count)
  }
  if (countEquipped) {
    for (const name of Object.values(bag.equipped || {})) {
      if (!name || isRainbowRef(name) || !EQUIP_TPL[name]) continue
      totals.set(name, (totals.get(name) || 0) + 1)
    }
  }
  for (const w of (bag.rainbows || [])) {
    if (!w || !w.id) continue
    const n = `rainbow:${w.name || '七彩神兵'}`
    totals.set(n, (totals.get(n) || 0) + 1)
  }
  return totals
}

/** 列出本群玩家背包存档文件(bag/<gid>/<uid>.json); 目录不存在返回空数组 */
export function listGroupBagFiles (gid, bagDir = BAG_DIR) {
  const dir = path.join(bagDir, String(gid))
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f))
  } catch (err) {
    return []
  }
}

/**
 * 聚合本群全部物品: 玩家背包(bag/<gid>/ 下每个文件) + 存活伪玩家(roster 中 alive 的 p.bag)
 * + 宗门宝库(f.sects[sid].vault) + 王朝城库存(各城 stock 的云裳仙蕊)。
 * 不记归属, 只汇总物品名与总数。
 * @param {string|number} gid 群号
 * @param {object} [opts]
 * @param {string} [opts.bagDir] 背包目录(测试注入)
 * @param {object} [opts.fakeData] 伪玩家存档对象(测试注入); 不传则生产路径
 * @param {object} [opts.dynastyData] 王朝存档对象(测试注入); 不传则生产路径
 * @returns {{ totals: Map<string, number>, players: number, fakes: number, sects: number, cities: number }}
 */
export function aggregateGroupItems (gid, { bagDir = BAG_DIR, fakeData = null, dynastyData = null } = {}) {
  const totals = new Map()
  let players = 0
  let fakes = 0
  let sects = 0
  let cities = 0
  for (const file of listGroupBagFiles(gid, bagDir)) {
    let bag
    try {
      bag = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (err) {
      continue // 损坏/不可读跳过, 不覆盖现场
    }
    if (!bag || typeof bag !== 'object') continue
    addBagToTotals(totals, bag, true)
    players++
  }
  /* 伪玩家 + 宗门宝库: 传 fakeData 用注入数据; 生产路径仅当该群已有独立伪玩家存档才读取,
   * 避免只读指令凭空创建空档(getFake 对缺失群会自动初始化) */
  let f = fakeData
  if (f === null || f === undefined) {
    f = activeFakeGroups().includes(String(gid)) ? getFake(gid) : null
  }
  if (f && f.roster) {
    for (const p of Object.values(f.roster)) {
      if (!p || !p.alive || !p.bag) continue
      addBagToTotals(totals, p.bag, false)
      fakes++
    }
  }
  if (f && f.sects) {
    for (const sm of Object.values(f.sects)) {
      if (!sm || typeof sm !== 'object' || !sm.vault) continue
      addVaultToTotals(totals, sm.vault)
      sects++
    }
  }
  /* 王朝城库存: 传 dynastyData 用注入数据; 生产路径仅当该群已有王朝存档才读取(getDynasty 对缺失群会初始化) */
  let dyn = dynastyData
  if (dyn === null || dyn === undefined) {
    dyn = activeDynastyGroups().includes(String(gid)) ? getDynasty(gid) : null
  }
  if (dyn && dyn.cities) {
    addDynastyStockToTotals(totals, dyn)
    cities++
  }
  return { totals, players, fakes, sects, cities }
}

/** 宗门宝库计入总量: 灵石 + 材料/丹药/装备/功法书(宝库 canonical 结构 { stones, mats, pills, equips, gongfas }) */
export function addVaultToTotals (totals, vault) {
  if (!vault || typeof vault !== 'object') return totals
  const stones = Math.max(0, Math.floor(Number(vault.stones) || 0))
  if (stones > 0) totals.set('灵石', (totals.get('灵石') || 0) + stones)
  for (const group of ['mats', 'pills', 'equips', 'gongfas']) {
    const map = vault[group]
    if (!map || typeof map !== 'object') continue
    for (const [name, count] of Object.entries(map)) {
      const c = Math.max(0, Math.floor(Number(count) || 0))
      if (name && c > 0) totals.set(name, (totals.get(name) || 0) + c)
    }
  }
  return totals
}

/** 王朝各城库存计入总量: 城库存的云裳仙蕊(city.stock 合计) */
export function addDynastyStockToTotals (totals, dynasty) {
  if (!dynasty || !dynasty.cities || typeof dynasty.cities !== 'object') return totals
  let sum = 0
  for (const city of Object.values(dynasty.cities)) {
    if (!city || typeof city !== 'object') continue
    sum += Math.max(0, Math.floor(Number(city.stock) || 0))
  }
  if (sum > 0) totals.set('云裳仙蕊', (totals.get('云裳仙蕊') || 0) + sum)
  return totals
}

/** 汇总条目: 品质降序 -> 数量降序 -> 名称升序(彩虹武器固定品质7, 排最前) */
export function sortTotals (totals) {
  return [...totals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const qa = itemQuality(a.name)
      const qb = itemQuality(b.name)
      if (qb !== qa) return qb - qa
      if (b.count !== a.count) return b.count - a.count
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    })
}

/** 物品行文本: 名称前带品质图标; 彩虹武器(rainbow: 前缀)还原名字并固定带🌈 */
export function fmtItemRow (name, count) {
  const display = typeof name === 'string' && name.startsWith('rainbow:') ? name.slice(8) : name
  return `${itemIcon(display)}${display} ×${count.toLocaleString()}`
}
