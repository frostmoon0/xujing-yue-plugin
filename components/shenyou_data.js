import fs from 'fs'
import { Plugin_Name, Save_Path } from './plugin.js'
import { addItem, itemIcon } from './equip_data.js'
import { activeWorldGroups, getWorld, getLoc, regionNameOf } from './world_data.js'

const SAVE_DIR = `${Save_Path}/world`
const MINUTE_MS = 60 * 1000
/** 神游蛊刷新间隔: 以24小时为基准, 上下±6小时波动 → 18~30小时, 具体刷新时刻不可预测 */
const SHENYOU_BASE_DELAY = 24 * 60 * MINUTE_MS
const SHENYOU_JITTER_MS = 6 * 60 * MINUTE_MS
export const SHENYOU_MIN_DELAY = SHENYOU_BASE_DELAY - SHENYOU_JITTER_MS
export const SHENYOU_MAX_DELAY = SHENYOU_BASE_DELAY + SHENYOU_JITTER_MS
/** 神游蛊现世所在大区: 南疆(需身处该大区才能捕获) */
export const SHENYOU_REGION = 'south'
const SHENYOU_SCHEDULE_VERSION = 3

function fileOf (gid) { return `${SAVE_DIR}/shenyou_${String(gid || 'global')}.json` }
function ensureDir () {
  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true })
}
function randomDelay () {
  return SHENYOU_MIN_DELAY + Math.floor(Math.random() * (SHENYOU_MAX_DELAY - SHENYOU_MIN_DELAY + 1))
}
const SPAWN_TEXTS = [
  '🦋 南疆灵气暴涨！【神游蛊】现世！输入 #神游蛊 直接捕获！',
  '🌌 天象异变！南疆发现【神游蛊】踪迹！快输入 #神游蛊 捕获！',
  '✨ 南疆异光冲天！【神游蛊】降临，输入 #神游蛊 抢先捕获！',
  '🌿 南疆深处传来蛊鸣！【神游蛊】出没，输入 #神游蛊 即可捕获！'
]
function randText (arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function emptyState (gid) {
  return {
    gid: String(gid || 'global'),
    scheduleVersion: SHENYOU_SCHEDULE_VERSION,
    spawned: false,
    spawnedAt: 0,
    nextSpawn: Date.now() + randomDelay()
  }
}
function saveState (state) {
  ensureDir()
  const file = fileOf(state.gid)
  const tmp = `${file}.${process.pid}.tmp`
  try {
    fs.writeFileSync(tmp, JSON.stringify(state, null, '\t'))
    fs.renameSync(tmp, file)
    return true
  } catch (err) {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch (e) { }
    globalThis.logger?.error?.('[神游蛊]状态保存失败:', err && err.message)
    return false
  }
}

export function getShenyou (gid) {
  ensureDir()
  const g = String(gid || 'global')
  const file = fileOf(g)
  let state
  let dirty = false
  try {
    state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
  } catch (err) {
    state = null
  }
  if (!state || typeof state !== 'object') {
    state = emptyState(g)
    dirty = true
  }
  state.gid = g
  state.scheduleVersion = Number(state.scheduleVersion) || 0
  state.spawned = !!state.spawned
  state.spawnedAt = Number(state.spawnedAt) || 0
  if (state.scheduleVersion !== SHENYOU_SCHEDULE_VERSION) {
    state.scheduleVersion = SHENYOU_SCHEDULE_VERSION
    if (!state.spawned) state.nextSpawn = Date.now() + randomDelay()
    dirty = true
  }
  if (!Number(state.nextSpawn)) {
    state.nextSpawn = Date.now() + randomDelay()
    dirty = true
  }
  if (!state.spawned && state.nextSpawn <= 0) {
    state.nextSpawn = Date.now() + randomDelay()
    dirty = true
  }
  if (!fs.existsSync(file) || dirty) saveState(state)
  return state
}

export function saveShenyou (state) {
  return saveState(state)
}

function notify (gid, text) {
  try {
    const group = Bot.pickGroup(gid)
    if (group && group.sendMsg) group.sendMsg(text)
  } catch (err) { }
}

/** 每分钟推进一次：每群独立、以24小时为基准±6小时(18~30小时)随机出现一只，出现后一直保留到有人捕获。 */
export function tickShenyou (gid, sendNotice = true, now = Date.now()) {
  const state = getShenyou(gid)
  if (state.spawned || now < state.nextSpawn) return { state, spawned: false }
  state.spawned = true
  state.spawnedAt = now
  saveState(state)
  if (sendNotice) notify(gid, randText(SPAWN_TEXTS))
  return { state, spawned: true }
}

export function tickShenyouGroups (sendNotice = true, now = Date.now()) {
  const result = []
  for (const gid of activeWorldGroups()) {
    try { result.push({ gid, ...tickShenyou(gid, sendNotice, now) }) } catch (err) {
      globalThis.logger?.error?.('[神游蛊]群推进失败:', err && err.message)
    }
  }
  return result
}

export function captureShenyou (uid, gid) {
  const g = String(gid || '')
  if (!g) return { ok: false, msg: '神游蛊只能在群内捕获。' }
  const state = getShenyou(g)
  if (!state.spawned) {
    return { ok: false, msg: '南疆暂时没有现世的神游蛊，异象何时再起无从得知，留意南疆灵气异动吧~' }
  }
  /* 神游蛊现世于南疆: 只有身处南疆的道友才能捕获 */
  const loc = getLoc(getWorld(g), uid)
  if (loc !== SHENYOU_REGION) {
    return { ok: false, msg: `🦋 神游蛊现世于【${regionNameOf(SHENYOU_REGION)}】，你当前在【${regionNameOf(loc)}】，须身处南疆才能捕获！先去 #去南疆 ~` }
  }
  state.spawned = false
  state.spawnedAt = 0
  state.nextSpawn = Date.now() + randomDelay()
  addItem(uid, '神游蛊', 1, null, g)
  saveState(state)
  return { ok: true, msg: `🦋 捕获成功！你直接捕获了在南疆现世的${itemIcon('神游蛊')}神游蛊×1。下一只何时现世无可奉告，多留意南疆异象吧~` }
}

export function shenyouStatus (gid) {
  const state = getShenyou(gid)
  if (state.spawned) return '🦋 南疆【神游蛊】已现世！现在发送 #神游蛊 即可直接捕获！'
  return '🦋 南疆【神游蛊】尚未现世，异象时辰不定，留意南疆灵气异动吧~'
}
