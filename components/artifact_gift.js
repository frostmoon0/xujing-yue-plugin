// 法宝赠送: 傀儡/万魂幡/定仙游 存于 bag.artifacts(非背包物品), 供 trade.js 赠送与单测复用。
// 纯函数: 只读写传入的 bag 对象, 不落盘; 调用方负责 saveBag。
import { hasDingxianyou, isDingxianyouEquipped, EQUIP_TPL, ITEM_TPL, MATERIAL_TPL, GONGFA_TPL } from './equip_data.js'
import { PUPPET_RANK_ICONS, puppetRankName } from './puppet_data.js'

function clampRank (rank) {
  return Math.max(1, Math.min(7, Math.floor(Number(rank) || 1)))
}

function isKnownItem (name) {
  return !!(EQUIP_TPL[name] || ITEM_TPL[name] || MATERIAL_TPL[name] || GONGFA_TPL[name])
}

/**
 * 解析赠送文本为"傀儡"法宝规格(显式 傀儡 前缀, 在通用道具解析失败后调用, 普通道具名优先)。
 * @param {string} text 去掉指令前缀与@后的纯文本
 * @param {object} bag 发送者背包
 * @returns {null} 与傀儡无关
 * @returns {{ok:true, kind:'puppet', index:number}} 可赠送的傀儡序号
 * @returns {{ok:false, msg:string}} 命中傀儡但无法赠送(未拥有/越界/同名/未指定)
 */
export function resolvePuppetGift (text, bag) {
  const t = String(text || '').trim()
  /* 傀儡 前缀的普通道具(如 傀儡术上/中/下篇 功法)仍是道具, 交回通用道具路径 */
  if (isKnownItem(t.replace(/\s*\d+\s*$/, ''))) return null
  const m = t.match(/^傀儡(.*)$/)
  if (!m) return null
  const rest = String(m[1]).trim()
  const puppets = Array.isArray(bag?.artifacts?.puppets) ? bag.artifacts.puppets : []
  if (!puppets.length) return { ok: false, msg: '你还没有傀儡，无法赠送。' }
  if (!rest) {
    if (puppets.length === 1) return { ok: true, kind: 'puppet', index: 0 }
    const lines = puppets.map((p, i) => `${i + 1}. ${PUPPET_RANK_ICONS[clampRank(p.rank)]}${p.name}（${puppetRankName(p.rank)}，战力${p.power}）`)
    return { ok: false, msg: `你有 ${puppets.length} 只傀儡，请指定序号或名字赠送：\n${lines.join('\n')}\n例：#虚境赠送 @群友 傀儡1` }
  }
  if (/^\d+$/.test(rest)) {
    const idx = Number(rest) - 1
    if (idx < 0 || idx >= puppets.length) return { ok: false, msg: `傀儡序号应为 1~${puppets.length}。` }
    return { ok: true, kind: 'puppet', index: idx }
  }
  const exact = puppets.filter(p => p.name === rest)
  if (exact.length === 1) return { ok: true, kind: 'puppet', index: puppets.indexOf(exact[0]) }
  if (exact.length > 1) return { ok: false, msg: `有多只傀儡都叫“${rest}”，请改用序号赠送。` }
  const partial = puppets.filter(p => p.name.includes(rest))
  if (partial.length === 1) return { ok: true, kind: 'puppet', index: puppets.indexOf(partial[0]) }
  if (partial.length > 1) return { ok: false, msg: `找到多只匹配“${rest}”的傀儡，请改用序号。` }
  return { ok: false, msg: `没有找到傀儡“${rest}”。` }
}

/**
 * 解析赠送文本为"万魂幡/定仙游"法宝规格(在通用道具解析失败后调用, 普通道具名优先)。
 * 法宝唯一, 忽略数量后缀(万魂幡 2 / 定仙游1)。
 * @returns {null} 与万魂幡/定仙游无关
 * @returns {{ok:true, kind:'wanhun'|'dingxianyou'}}
 * @returns {{ok:false, msg:string}} 命中但无法赠送(未拥有)
 */
export function resolveWanhunGift (text, bag) {
  const t = String(text || '').trim().replace(/\s*\d+\s*$/, '')
  if (!t) return null
  const wanhun = bag?.artifacts?.wanhun
  if (t === '万魂幡' || (wanhun && t === String(wanhun.name || '万魂幡').trim())) {
    if (!wanhun) return { ok: false, msg: '你还没有万魂幡，无法赠送。' }
    return { ok: true, kind: 'wanhun' }
  }
  if (t === '定仙游') {
    if (!hasDingxianyou(bag)) return { ok: false, msg: '你还没有定仙游，无法赠送。' }
    return { ok: true, kind: 'dingxianyou' }
  }
  return null
}

/**
 * 执行法宝转移(纯函数): 从 fromBag 摘出法宝放入 toBag, 均以 JSON 克隆切断共享引用。
 * 前置条件由调用方保证(已通过解析/修为/同区校验); 这里复查装备/祭出与唯一性。
 * @param {object} fromBag 发送者背包(会被修改)
 * @param {object} toBag 接收者背包(会被修改)
 * @param {{kind:string, index?:number}} spec resolvePuppetGift/resolveWanhunGift 返回的规格
 * @returns {{ok:true, icon:string, name:string}} 已转移(调用方负责 saveBag 双方)
 * @returns {{ok:false, msg:string}} 不可赠送
 */
export function transferArtifact (fromBag, toBag, spec) {
  if (!fromBag || typeof fromBag !== 'object' || !toBag || typeof toBag !== 'object') {
    return { ok: false, msg: '背包读取失败，请稍后再试。' }
  }
  if (spec && spec.kind === 'wanhun') {
    const art = fromBag.artifacts?.wanhun
    if (!art) return { ok: false, msg: '你还没有万魂幡，无法赠送。' }
    if (art.equipped) return { ok: false, msg: '万魂幡正在装备中，请先 #卸下万魂幡 再赠送。' }
    if (art.deployed) return { ok: false, msg: '万魂幡正在祭出中，请先 #收回万魂幡 再赠送。' }
    if (toBag.artifacts?.wanhun) return { ok: false, msg: '对方已经拥有万魂幡，无法重复赠送。' }
    const moved = JSON.parse(JSON.stringify(art))
    moved.equipped = false
    moved.deployed = false
    moved.aidUntil = 0
    toBag.artifacts = toBag.artifacts || {}
    toBag.artifacts.wanhun = moved
    delete fromBag.artifacts.wanhun
    return { ok: true, icon: '🏴', name: String(art.name || '万魂幡') }
  }
  if (spec && spec.kind === 'dingxianyou') {
    const art = fromBag.artifacts?.dingxianyou
    if (!art || art.owned === false) return { ok: false, msg: '你还没有定仙游，无法赠送。' }
    if (isDingxianyouEquipped(fromBag)) return { ok: false, msg: '定仙游正在装备中，请先卸下定仙游再赠送。' }
    if (hasDingxianyou(toBag)) return { ok: false, msg: '对方已经拥有定仙游，无法重复赠送。' }
    const moved = JSON.parse(JSON.stringify(art))
    moved.equipped = false
    toBag.artifacts = toBag.artifacts || {}
    toBag.artifacts.dingxianyou = moved
    delete fromBag.artifacts.dingxianyou
    return { ok: true, icon: '🦋', name: '定仙游' }
  }
  if (spec && spec.kind === 'puppet') {
    const puppets = fromBag.artifacts?.puppets
    if (!Array.isArray(puppets) || !puppets[spec.index]) return { ok: false, msg: '找不到要赠送的傀儡，可能已被赠送或分解。' }
    const puppet = puppets[spec.index]
    if (puppet.equipped) return { ok: false, msg: `${puppet.name}正在装备中，请先 #卸下傀儡 再赠送。` }
    if (puppet.deployed) return { ok: false, msg: `${puppet.name}正在祭出中，请先 #收回傀儡 再赠送。` }
    const [moved] = puppets.splice(spec.index, 1)
    const clone = JSON.parse(JSON.stringify(moved))
    clone.equipped = false
    clone.deployed = false
    clone.deployedUntil = 0
    clone.nextChargeAt = 0
    toBag.artifacts = toBag.artifacts || {}
    if (!Array.isArray(toBag.artifacts.puppets)) toBag.artifacts.puppets = []
    toBag.artifacts.puppets.push(clone)
    return { ok: true, icon: PUPPET_RANK_ICONS[clampRank(clone.rank)], name: `${clone.name}（${puppetRankName(clone.rank)}·战力${clone.power}）` }
  }
  return { ok: false, msg: '未知的法宝类型。' }
}
