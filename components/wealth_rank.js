/** 按当前群成员的灵石余额构建财富榜(不创建缺失的玩家存档) */
export function buildWealthRank (homeData, members, limit = Infinity) {
  const rows = []
  for (const [key, member] of memberEntries(members)) {
    const uid = memberId(key, member)
    if (!uid) continue
    const home = homeData && homeData[uid]
    if (!home || typeof home !== 'object') continue
    const money = moneyOf(home)
    if (money === null) continue
    rows.push({
      uid,
      nick: memberName(member, uid),
      money
    })
  }
  rows.sort((a, b) => b.money - a.money || a.uid.localeCompare(b.uid))
  return rows.slice(0, Math.max(0, Number.isFinite(Number(limit)) ? Number(limit) : rows.length))
}

/** 兼容 icqq Map、entries 数组、成员数组和普通对象 */
function memberEntries (members) {
  if (members instanceof Map) return [...members.entries()]
  if (Array.isArray(members)) {
    if (members.every(item => Array.isArray(item) && item.length >= 2)) return members
    return members.map(item => [item?.user_id ?? item?.userId ?? item?.uid, item])
  }
  if (members && typeof members === 'object') return Object.entries(members)
  return []
}

function memberId (key, member) {
  const raw = member && typeof member === 'object'
    ? (member.user_id ?? member.userId ?? member.uid ?? key)
    : key
  const uid = String(raw ?? '').trim()
  return /^\d+$/.test(uid) && uid !== '0' ? uid : null
}

function memberName (member, uid) {
  if (!member || typeof member !== 'object') return uid
  return String(member.card || member.nickname || member.nick || uid).trim() || uid
}

function moneyOf (home) {
  let value = Number(home.money)
  /* 兼容旧版二进制镜像字段, 但不以无效值覆盖正常 money */
  if (!Number.isFinite(value) && typeof home.money2 === 'string' && /^[01]+$/.test(home.money2)) {
    value = parseInt(home.money2, 2)
  }
  if (!Number.isFinite(value)) return null
  return Math.max(0, Math.floor(value))
}

export const _test = { memberEntries, memberId, memberName, moneyOf }
