import fs from 'fs'
import path from 'path'
import { Plugin_Name, Save_Path } from './plugin.js'

const UID_RE = /^\d+$/
const GID_RE = /^\d+$/
const locks = new Map()

export function normalizeUid (value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && !Number.isFinite(value)) return null
  const uid = String(value).trim()
  return uid && uid !== '0' && UID_RE.test(uid) ? uid : null
}
export function isUserId (value) { return normalizeUid(value) !== null }

function memberId (key, value) {
  if (value && typeof value === 'object') {
    for (const field of ['user_id', 'userId', 'uin', 'uid', 'id']) {
      const uid = normalizeUid(value[field])
      if (uid) return uid
    }
  }
  return normalizeUid(key)
}

/** 将 icqq Map、成员数组、entries 数组或对象统一为成员 ID 集合。 */
export function extractMemberIds (source) {
  if (source === null || source === undefined) return null
  if (source instanceof Map) return extractMemberIds([...source.entries()])
  if (Array.isArray(source)) {
    if (source.every(x => Array.isArray(x) && x.length >= 2)) {
      const ids = new Set()
      for (const [key, value] of source) {
        const uid = memberId(key, value)
        if (uid) ids.add(uid)
      }
      return source.length === 0 || ids.size ? ids : null
    }
    const ids = new Set()
    for (const value of source) {
      const uid = value && typeof value === 'object'
        ? memberId(null, value)
        : normalizeUid(value)
      if (uid) ids.add(uid)
    }
    return source.length === 0 || ids.size ? ids : null
  }
  if (typeof source !== 'object') return null
  if (typeof source[Symbol.iterator] === 'function') {
    try { return extractMemberIds([...source]) } catch (err) { return null }
  }
  if (['user_id', 'userId', 'uin', 'uid'].some(k => k in source)) {
    const ids = new Set(); const uid = memberId(null, source)
    if (uid) ids.add(uid)
    return ids
  }
  const entries = Object.entries(source)
  const ids = new Set()
  for (const [key, value] of entries) {
    const uid = memberId(key, value)
    if (uid) ids.add(uid)
  }
  return entries.length === 0 || ids.size ? ids : null
}

export async function getGroupMemberSnapshot (group) {
  if (!group || typeof group.getMemberMap !== 'function') {
    return { ok: false, ids: null, error: new Error('群对象不支持 getMemberMap') }
  }
  try {
    const ids = extractMemberIds(await group.getMemberMap())
    if (!ids) return { ok: false, ids: null, error: new Error('群成员列表格式无法识别') }
    const count = Number(group.info?.member_count)
    if (!ids.size && Number.isFinite(count) && count > 0) {
      return { ok: false, ids: null, error: new Error('群成员列表为空但群资料显示仍有成员') }
    }
    return { ok: true, ids, error: null }
  } catch (error) {
    return { ok: false, ids: null, error }
  }
}

export function buildDeadUserSet ({ storedIds = [], memberIds, blacklistIds = [], memberSnapshotOk = true } = {}) {
  if (!memberSnapshotOk || !memberIds) return { ok: false, ids: new Set(), reason: 'memberSnapshotUnavailable' }
  const members = new Set([...memberIds].map(normalizeUid).filter(Boolean))
  const blacklisted = new Set([...(blacklistIds || [])].map(normalizeUid).filter(Boolean))
  const ids = new Set()
  for (const value of storedIds) {
    const uid = normalizeUid(value)
    if (uid && (!members.has(uid) || blacklisted.has(uid))) ids.add(uid)
  }
  return { ok: true, ids, reason: null }
}

export function spouseUidOf (record) {
  return record && typeof record === 'object' ? normalizeUid(record.s) : null
}
function result () { return { changed: false, removed: 0, referencesCleared: 0 } }
function stale (uid, members, blacklisted) {
  const id = normalizeUid(uid)
  return !!id && (!members.has(id) || blacklisted.has(id))
}

export function cleanUserMap (data, deadIds) {
  const out = result()
  if (!data || typeof data !== 'object' || Array.isArray(data)) return out
  for (const key of Object.keys(data)) {
    if (!deadIds.has(normalizeUid(key))) continue
    delete data[key]; out.changed = true; out.removed++
  }
  return out
}
export function cleanHomeData (data, members, blacklisted) {
  const out = result()
  if (!data || typeof data !== 'object' || Array.isArray(data)) return out
  for (const key of Object.keys(data)) {
    const uid = normalizeUid(key)
    if (uid && stale(uid, members, blacklisted)) {
      delete data[key]; out.changed = true; out.removed++; continue
    }
    const spouse = spouseUidOf(data[key])
    if (spouse && stale(spouse, members, blacklisted)) {
      data[key].s = 0; out.changed = true; out.referencesCleared++
    }
  }
  return out
}
function cleanSections (data, sections, deadIds) {
  const out = result()
  for (const section of sections) {
    const one = cleanUserMap(data && data[section], deadIds)
    out.changed ||= one.changed; out.removed += one.removed
    out.referencesCleared += one.referencesCleared
  }
  return out
}
export const cleanPetData = (data, ids) => cleanSections(data, ['bag', 'search', 'encounter', 'pokedex', 'active'], ids)
export const cleanWanhunData = (data, ids) => cleanSections(data, ['users', 'shops'], ids)
export function cleanWorldData (data, ids) { return cleanSections(data, ['playerLoc', 'moving'], ids) }
export function cleanRaidBackupData (data, group, shouldDelete) {
  const out = result()
  if (!data || typeof data !== 'object' || !data.raids || typeof data.raids !== 'object') return out
  const prefix = `xujing:raid:${group}:`
  for (const key of Object.keys(data.raids)) {
    if (!key.startsWith(prefix)) continue
    const uid = normalizeUid(key.slice(prefix.length))
    if (!uid || !shouldDelete(uid)) continue
    delete data.raids[key]
    out.changed = true
    out.removed++
  }
  return out
}
export function cleanDynastyData (data, ids, members, blacklisted) {
  const out = cleanSections(data, ['unlocked', 'learned'], ids)
  for (const city of Object.values(data?.cities || {})) {
    const uid = normalizeUid(city?.read?.uid)
    if (uid && stale(uid, members, blacklisted)) {
      city.read = null; out.changed = true; out.referencesCleared++
    }
  }
  return out
}

export function cleanRealmData (data, deadIds) {
  const out = result()
  if (!data || typeof data !== 'object') return out
  for (const [id, team] of Object.entries(data.teams || {})) {
    if (!team || team.kind === 'fake') continue
    const before = JSON.stringify(team)
    for (const field of ['members', 'partyMembers']) {
      if (Array.isArray(team[field])) team[field] = team[field].filter(uid => !deadIds.has(normalizeUid(uid)))
    }
    for (const field of ['contrib', 'victory']) {
      if (!team[field] || typeof team[field] !== 'object') continue
      for (const uid of Object.keys(team[field])) if (deadIds.has(normalizeUid(uid))) delete team[field][uid]
    }
    if (deadIds.has(normalizeUid(team.leader))) team.leader = team.members?.[0] || null
    if (deadIds.has(normalizeUid(team.partyLeader))) team.partyLeader = team.partyMembers?.[0] || team.members?.[0] || null
    if ((!team.members || !team.members.length)) { delete data.teams[id]; out.changed = true; out.removed++ }
    if (JSON.stringify(team) !== before) out.changed = true
  }
  for (const uid of Object.keys(data.barrier?.damage || {})) {
    if (deadIds.has(normalizeUid(uid))) {
      delete data.barrier.damage[uid]; out.changed = true; out.referencesCleared++
    }
  }
  return out
}

export function cleanFakeData (data, deadIds) {
  const out = result()
  const staleNames = []
  for (const uid of Object.keys(data?.players || {})) {
    const p = data.players[uid]; const sect = data.sects?.[p?.sect]
    if (!deadIds.has(normalizeUid(uid))) continue
    if (p?.name) staleNames.push({ name: String(p.name), sect: p.sect })
    if (p?.pos === 'zongzhu' && sect && String(sect.owner) === uid) {
      sect.owner = null; out.changed = true; out.referencesCleared++
    }
  }
  /* 玩家姓名也占用宗门职位表；原逻辑只删 players，会留下幽灵职位。 */
  for (const { name, sect } of staleNames) {
    const sm = data?.sectMap?.[sect]
    if (!sm) continue
    if (sm.zongzhu === name) { sm.zongzhu = null; out.changed = true; out.referencesCleared++ }
    for (const field of ['fuzong', 'taishang', 'zhishi', 'dizi']) {
      if (!Array.isArray(sm[field])) continue
      const next = sm[field].filter(x => x !== name)
      if (next.length !== sm[field].length) {
        const removed = sm[field].length - next.length
        sm[field] = next; out.changed = true; out.referencesCleared += removed
      }
    }
  }
  for (const section of ['players', 'injuries', 'sectLeaveBans']) {
    const one = cleanUserMap(data?.[section], deadIds)
    out.changed ||= one.changed; out.removed += one.removed
  }
  for (const list of Object.values(data?.sectJoinReqs || {})) {
    if (!Array.isArray(list)) continue
    const next = list.filter(x => !deadIds.has(normalizeUid(x?.uid)))
    if (next.length !== list.length) {
      const removed = list.length - next.length
      list.splice(0, list.length, ...next)
      out.changed = true
      out.referencesCleared += removed
    }
  }
  for (const list of Object.values(data?.sectJails || {})) {
    if (!Array.isArray(list)) continue
    const next = list.filter(x => !x || !normalizeUid(x.uid) || !deadIds.has(normalizeUid(x.uid)))
    if (next.length !== list.length) {
      const removed = list.length - next.length
      list.splice(0, list.length, ...next)
      out.changed = true
      out.referencesCleared += removed
    }
  }
  return out
}

function readJson (file) {
  if (!fs.existsSync(file)) return { exists: false, data: null, error: null }
  try { return { exists: true, data: JSON.parse(fs.readFileSync(file, 'utf8')), error: null } } catch (error) { return { exists: true, data: null, error } }
}
function writeJson (file, data) {
  const tmp = `${file}.${process.pid}.${Date.now()}.cleanup.tmp`
  try { fs.writeFileSync(tmp, JSON.stringify(data, null, '\t')); fs.renameSync(tmp, file) } catch (error) {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch (err) { }
    throw error
  }
}
function collectIds (data, mode, shouldDelete) {
  const ids = new Set(); const collect = obj => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return
    for (const key of Object.keys(obj)) if (shouldDelete(key)) ids.add(normalizeUid(key))
  }
  if (mode === 'home') {
    collect(data)
    for (const value of Object.values(data || {})) { const uid = normalizeUid(value?.s); if (shouldDelete(uid)) ids.add(uid) }
  } else if (mode === 'fake') {
    for (const section of ['players', 'injuries', 'sectLeaveBans']) collect(data?.[section])
    for (const lists of [data?.sectJails, data?.sectJoinReqs]) for (const list of Object.values(lists || {})) if (Array.isArray(list)) for (const x of list) if (shouldDelete(x?.uid)) ids.add(normalizeUid(x.uid))
  } else if (mode === 'realm') {
    for (const team of Object.values(data?.teams || {})) {
      if (!team || team.kind === 'fake') continue
      for (const uid of [team.leader, team.partyLeader]) if (shouldDelete(uid)) ids.add(normalizeUid(uid))
      for (const field of ['members', 'partyMembers', 'contrib', 'victory']) {
        const value = team[field]; Array.isArray(value) ? value.forEach(uid => { if (shouldDelete(uid)) ids.add(normalizeUid(uid)) }) : collect(value)
      }
    }
    collect(data?.barrier?.damage)
  } else if (!mode || mode === 'all') {
    collect(data)
  } else {
    for (const section of mode || []) collect(data?.[section])
  }
  return ids
}

/** 按群清理所有已定义的用户存档；成员快照由入口先 fail-closed 校验。 */
export async function cleanupGroupSaveUnlocked ({ gid, memberIds, blacklistIds = [], root, redis } = {}) {
  const group = String(gid || '')
  if (!GID_RE.test(group)) throw new Error('群号无效')
  if (!(memberIds instanceof Set) && !Array.isArray(memberIds)) throw new Error('成员快照不可用')
  const members = new Set([...memberIds || []].map(normalizeUid).filter(Boolean))
  const blacklist = new Set([...(blacklistIds || [])].map(normalizeUid).filter(Boolean))
  const shouldDelete = uid => stale(uid, members, blacklist)
  const deadIds = new Set(blacklist)
  const report = { ok: true, dead: [], files: 0, filesChanged: 0, errors: [], home: result(), other: result(), fake: result(), bags: 0, redis: 0 }
  const saveRoot = path.resolve(root || `${Save_Path}`)
  const file = (...parts) => path.join(saveRoot, ...parts)
  const processFile = (label, filename, cleaner, bucket, mode) => {
    const loaded = readJson(filename); if (!loaded.exists) return
    report.files++
    if (loaded.error) { report.errors.push(`${label}: ${loaded.error.message}`); return }
    if (!loaded.data || typeof loaded.data !== 'object' || Array.isArray(loaded.data)) { report.errors.push(`${label}: JSON 顶层不是对象`); return }
    const ids = collectIds(loaded.data, mode, shouldDelete); ids.forEach(uid => deadIds.add(uid))
    const out = cleaner(loaded.data, ids)
    if (!out.changed) return
    try {
      writeJson(filename, loaded.data); report.filesChanged++
      const target = bucket === 'home' ? report.home : bucket === 'fake' ? report.fake : report.other
      target.changed = true; target.removed += out.removed; target.referencesCleared += out.referencesCleared
    } catch (error) { report.errors.push(`${label}: ${error.message}`) }
  }
  processFile('UserHome', file('qylp', 'UserHome', `${group}.json`), data => cleanHomeData(data, members, blacklist), 'home', 'home')
  for (const [label, dir] of [['UserYinPa', 'UserYinPa'], ['UserHouse', 'UserHouse'], ['UserPlace', 'UserPlace']]) processFile(label, file('qylp', dir, `${group}.json`), cleanUserMap, 'other', 'all')
  processFile('battle', file('battle', `${group}.json`), cleanUserMap, 'other', null)
  const bagDir = file('bag', group)
  try {
    if (fs.existsSync(bagDir) && fs.statSync(bagDir).isDirectory()) for (const name of fs.readdirSync(bagDir)) {
      const uid = normalizeUid(name.replace(/\.json$/, ''))
      if (!/^\d+\.json$/.test(name) || !uid || !shouldDelete(uid)) continue
      deadIds.add(uid); const target = path.join(bagDir, name)
      try { if (fs.statSync(target).isFile()) { fs.unlinkSync(target); report.bags++ } } catch (error) { report.errors.push(`背包/${name}: ${error.message}`) }
    }
  } catch (error) { report.errors.push(`背包目录: ${error.message}`) }
  processFile('fake', file('world', `fake_${group}.json`), cleanFakeData, 'fake', 'fake')
  /* 伪玩家灵兽以名字为 owner，不按真实成员 QQ 清理；世界清理时仅保留可解析的独立档。 */
  processFile('fake pet', file('pet', `pet_fake_${group}.json`), data => ({ changed: false, removed: 0, referencesCleared: 0 }), 'other', [])
  processFile('pet', file('pet', `pet_${group}.json`), cleanPetData, 'other', ['bag', 'search', 'encounter', 'pokedex', 'active'])
  processFile('realm', file('realm', `realm_${group}.json`), cleanRealmData, 'other', 'realm')
  processFile('wanhun', file('wanhun', `wanhun_${group}.json`), cleanWanhunData, 'other', ['users', 'shops'])
  processFile('world', file('world', `world_${group}.json`), cleanWorldData, 'other', ['playerLoc', 'moving'])
  processFile('dynasty', file('dynasty', `dynasty_${group}.json`), data => cleanDynastyData(data, deadIds, members, blacklist), 'other', ['unlocked', 'learned'])
  processFile('raid backup', file('raid_backup.json'), data => cleanRaidBackupData(data, group, shouldDelete), 'other', null)
  if (redis) {
    /* 补扫只有 Redis 状态、没有文件存档的失效用户；模式限定当前群，绝不扫全库误删。 */
    try {
      if (typeof redis.keys === 'function') {
        for (const pattern of [`xujing:ambush:${group}:*`, `xujing:ambush-servant:${group}:*`, `xujing:raid:${group}:*`]) {
          for (const key of await redis.keys(pattern) || []) {
            const uid = normalizeUid(String(key).slice(key.lastIndexOf(':') + 1))
            if (uid && shouldDelete(uid)) deadIds.add(uid)
          }
        }
      }
      if (typeof redis.hGetAll === 'function') {
        for (const region of ['center', 'east', 'west', 'north', 'south', 'dynasty']) {
          const fields = await redis.hGetAll(`xujing:shop-act:${group}:${region}`) || {}
          for (const uid of Object.keys(fields)) if (shouldDelete(uid)) deadIds.add(normalizeUid(uid))
        }
      }
    } catch (error) { report.errors.push(`Redis 状态扫描: ${error.message}`) }
    for (const uid of deadIds) {
      for (const region of ['center', 'east', 'west', 'north', 'south', 'dynasty']) {
        try {
          const fn = redis.hDel || redis.hdel
          if (fn) report.redis += Number(await fn.call(redis, `xujing:shop-act:${group}:${region}`, uid)) || 0
        } catch (error) { report.errors.push(`商店活跃/${region}/${uid}: ${error.message}`) }
      }
      for (const key of [`xujing:ambush:${group}:${uid}`, `xujing:ambush-servant:${group}:${uid}`, `xujing:raid:${group}:${uid}`]) {
        try { if (redis.del) report.redis += Number(await redis.del(key)) || 0 } catch (error) { report.errors.push(`Redis/${key}: ${error.message}`) }
      }
    }
  }
  report.dead = [...deadIds]; report.ok = report.errors.length === 0; return report
}

export async function cleanupGroupSave (options = {}) {
  const gid = String(options.gid || '')
  const previous = locks.get(gid) || Promise.resolve()
  let release
  const current = new Promise(resolve => { release = resolve })
  locks.set(gid, current)
  await previous
  try { return await cleanupGroupSaveUnlocked(options) } finally {
    if (locks.get(gid) === current) locks.delete(gid)
    release()
  }
}
