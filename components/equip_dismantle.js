/** 红装分解的矿物返还规则 */
export const RED_DISMANTLE_ORE = ['月魄石', '星璇石', '流光玉', '织云石', '凤羽玉']
export const RED_DISMANTLE_RED_ORE = '凤羽玉'
export const RED_DISMANTLE_COLOR_ORE = '造梦神玉'

/** 彩装分解固定返还: 制造彩装所需6个造梦神玉的一半 */
export const COLOR_DISMANTLE_ORE = '造梦神玉'
export const COLOR_DISMANTLE_ORE_RETURN = 3

/** 红矿整体出现概率: 每次分解最多命中一次, 不随返还材料数量放大 */
export const RED_DISMANTLE_RED_CHANCE = 0.12
export const RED_DISMANTLE_COLOR_CHANCE = 0.01

/** 将分解材料合并进背包,兼容旧存档中的数字格式 */
export function addDismantleMats (items, mats) {
  if (!items || !mats) return items
  for (const [name, rawCount] of Object.entries(mats)) {
    const count = Math.max(0, Math.floor(Number(rawCount) || 0))
    if (!count) continue
    const current = items[name]
    const currentCount = current && typeof current === 'object'
      ? Number(current.count) || 0
      : Number(current) || 0
    items[name] = { ...(current && typeof current === 'object' ? current : {}), count: currentCount + count }
  }
  return items
}

/** 彩装分解返还3个造梦神玉(制造彩装所需彩矿的一半) */
export function colorDismantleReward () {
  return { [COLOR_DISMANTLE_ORE]: COLOR_DISMANTLE_ORE_RETURN }
}

/** 从池中无放回抽取指定数量, 保证同次分解不会返还重复材料 */
function pickDistinct (pool, count, rng) {
  const available = [...pool]
  const selected = []
  while (selected.length < count && available.length) {
    const index = Math.floor(rng() * available.length)
    selected.push(available.splice(Math.max(0, Math.min(index, available.length - 1)), 1)[0])
  }
  return selected
}

/**
 * 分解1件红装返还2~3种非彩色矿物(同次不重复)
 * 凤羽玉按整次12%概率出现, 另有1%概率额外返还造梦神玉
 * rng仅用于测试注入, 正常调用使用Math.random
 */
export function rollRedReward (rng = Math.random) {
  const count = 2 + Math.floor(rng() * 2)
  const commonOre = RED_DISMANTLE_ORE.filter(name => name !== RED_DISMANTLE_RED_ORE)
  const selected = []
  if (rng() < RED_DISMANTLE_RED_CHANCE) selected.push(RED_DISMANTLE_RED_ORE)
  selected.push(...pickDistinct(commonOre, count - selected.length, rng))

  const mats = {}
  for (const name of selected) mats[name] = 1
  let color = 0
  if (rng() < RED_DISMANTLE_COLOR_CHANCE) {
    mats[RED_DISMANTLE_COLOR_ORE] = 1
    color = 1
  }
  return { mats, color }
}
