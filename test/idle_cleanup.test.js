import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { classifyIdle, moneyOf, clearIdleInHomeData, syncBin, scanAndClear, DAY_MS } from '../components/idle_cleanup.js'

const now = Date.now()
const fiveDays = 5 * DAY_MS

test('classifyIdle: 无记录给宽限期, 超期清零, 近期活跃跳过', () => {
  assert.equal(classifyIdle(null, now, fiveDays), 'grace')
  assert.equal(classifyIdle('', now, fiveDays), 'grace')
  assert.equal(classifyIdle(undefined, now, fiveDays), 'grace')
  assert.equal(classifyIdle(String(now - fiveDays), now, fiveDays), 'clear') // 恰好满5天
  assert.equal(classifyIdle(String(now - fiveDays - 1), now, fiveDays), 'clear')
  assert.equal(classifyIdle(String(now - fiveDays + 1), now, fiveDays), 'ok') // 差1ms不到5天
  assert.equal(classifyIdle(String(now - 60000), now, fiveDays), 'ok')
})

test('moneyOf: 兼容旧版二进制灵石字段, 无效值返回 null', () => {
  assert.equal(moneyOf({ money: 1200 }), 1200)
  assert.equal(moneyOf({ money2: '1010' }), 10)
  assert.equal(moneyOf({ money: -20 }), 0)
  assert.equal(moneyOf({ money: '无效' }), null)
  assert.equal(moneyOf(null), null)
})

test('clearIdleInHomeData: 只清零超期且有灵石者, 宽限者不动, 无灵石不动', () => {
  const home = {
    '100': { money: 1200 },          // 近期活跃, 保留
    '101': { money: 5000 },          // 超期, 清零
    '102': { money: 0 },             // 无灵石, 不动
    '103': { money: 999 }            // 无记录, 进宽限期
  }
  const lastCmdMap = {
    '100': String(now - 3600000),
    '101': String(now - 6 * DAY_MS),
    '102': String(now)
  }
  const { cleared, graced } = clearIdleInHomeData(home, lastCmdMap, now, fiveDays)
  assert.equal(cleared, 1)
  assert.deepEqual(graced.sort(), ['103'])
  assert.equal(home['100'].money, 1200)
  assert.equal(home['101'].money, 0)
  assert.equal(home['102'].money, 0)
  assert.equal(home['103'].money, 999)
})

test('clearIdleInHomeData: 二进制灵石字段也按同口径判定', () => {
  const home = { '200': { money2: '1010' } } // 二进制=10灵石
  const { cleared } = clearIdleInHomeData(home, { '200': String(now - 6 * DAY_MS) }, now, fiveDays)
  assert.equal(cleared, 1)
  assert.equal(home['200'].money, 0)
})

test('syncBin: 清零后二进制字段同步为 0, 不与旧镜像回灌', () => {
  const home = { '101': { money: 0, money2: '10011100010000' } }
  syncBin(home)
  assert.equal(home['101'].money2, '0')
})

test('scanAndClear: 全流程扫描临时目录, 清空超期灵石并给新玩家补宽限期', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idle-cleanup-'))
  const homeFile = path.join(dir, '136303457.json')
  fs.writeFileSync(homeFile, JSON.stringify({
    '100': { money: 1200 },
    '101': { money: 5000 },
    '102': { money: 0 },
    '103': { money: 999 }
  }, null, '\t'))
  // 损坏存档: 应跳过, 不覆盖现场
  fs.writeFileSync(path.join(dir, '123456789.json'), 'not-json{{{')

  const store = {
    'xujing:lastcmd:136303457': {
      '100': String(now - 3600000),
      '101': String(now - 6 * DAY_MS),
      '102': String(now)
    }
  }
  const redis = {
    async hGetAll (k) { return { ...(store[k] || {}) } },
    async hSet (k, a, b) {
      if (typeof a === 'object') store[k] = { ...(store[k] || {}), ...a }
      else store[k] = { ...(store[k] || {}), [a]: b }
    },
    async hDel (k, ...fields) { const o = store[k]; if (o) for (const f of fields) delete o[f] }
  }

  const report = await scanAndClear({ homeDir: dir, redis, now, enable: 'T', days: 5, groups: [] })

  assert.equal(report.enabled, true)
  assert.equal(report.groups, 1)          // 损坏档不计入
  assert.equal(report.cleared, 1)         // 只清 '101'
  assert.equal(report.graced, 1)          // '103' 进宽限期

  // 存档落盘结果
  const saved = JSON.parse(fs.readFileSync(homeFile, 'utf8'))
  assert.equal(saved['100'].money, 1200)
  assert.equal(saved['101'].money, 0)
  assert.equal(saved['101'].money2, '0')  // 二进制同步
  assert.equal(saved['103'].money, 999)

  // 宽限期记录已写入 redis, 下次检查该玩家才算真正超期
  assert.equal(store['xujing:lastcmd:136303457']['103'], String(now))
  // 仍在宽限内/近期的玩家记录保持原值
  assert.equal(store['xujing:lastcmd:136303457']['100'], String(now - 3600000))
  // 损坏存档未被覆盖
  assert.equal(fs.readFileSync(path.join(dir, '123456789.json'), 'utf8'), 'not-json{{{')

  fs.rmSync(dir, { recursive: true, force: true })
})

test('scanAndClear: 总开关关闭时不执行任何清理', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idle-cleanup-off-'))
  fs.writeFileSync(path.join(dir, '136303457.json'), JSON.stringify({ '101': { money: 5000 } }))
  const report = await scanAndClear({ homeDir: dir, redis: { async hGetAll () { return {} } }, now, enable: 'F', days: 5, groups: [] })
  assert.deepEqual(report, { enabled: false, groups: 0, cleared: 0, graced: 0 })
  const saved = JSON.parse(fs.readFileSync(path.join(dir, '136303457.json'), 'utf8'))
  assert.equal(saved['101'].money, 5000)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('scanAndClear: 裁剪超过30天的旧记录, 防 hash 无限增长', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idle-cleanup-prune-'))
  fs.writeFileSync(path.join(dir, '136303457.json'), JSON.stringify({ '300': { money: 0 } }))
  const store = { 'xujing:lastcmd:136303457': { '300': String(now - 31 * DAY_MS) } }
  const redis = {
    async hGetAll (k) { return { ...(store[k] || {}) } },
    async hSet (k, a, b) {
      if (typeof a === 'object') store[k] = { ...(store[k] || {}), ...a }
      else store[k] = { ...(store[k] || {}), [a]: b }
    },
    async hDel (k, ...fields) { const o = store[k]; if (o) for (const f of fields) delete o[f] }
  }
  await scanAndClear({ homeDir: dir, redis, now, enable: 'T', days: 5, groups: [] })
  assert.deepEqual(store['xujing:lastcmd:136303457'], {})
  fs.rmSync(dir, { recursive: true, force: true })
})
