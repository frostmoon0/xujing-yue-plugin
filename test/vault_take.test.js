import test from 'node:test'
import assert from 'node:assert/strict'
import { parseVaultTake, resolveVaultName } from '../components/sect/economy.js'

/* ---------- 取用宝库 · 数量/名称模糊解析 ---------- */

test('parseVaultTake: 数量任意顺序, 可带可不带空格', () => {
  assert.deepEqual(parseVaultTake('灵石 100'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('100 灵石'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('灵石100'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('100灵石'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('灵石×100'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('灵石 ×100'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('100个灵石'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('灵石100个'), { name: '灵石', count: 100, all: false })
})

test('parseVaultTake: 万/千/亿 单位折算', () => {
  assert.deepEqual(parseVaultTake('灵石 5万'), { name: '灵石', count: 50000, all: false })
  assert.deepEqual(parseVaultTake('5万灵石'), { name: '灵石', count: 50000, all: false })
  assert.deepEqual(parseVaultTake('灵石5万'), { name: '灵石', count: 50000, all: false })
  assert.deepEqual(parseVaultTake('灵石 万'), { name: '灵石', count: 10000, all: false })
  assert.deepEqual(parseVaultTake('灵石 8千'), { name: '灵石', count: 8000, all: false })
  assert.deepEqual(parseVaultTake('灵石 3亿'), { name: '灵石', count: 300000000, all: false })
})

test('parseVaultTake: 全部/全 取光', () => {
  assert.deepEqual(parseVaultTake('灵石 全部'), { name: '灵石', count: 1, all: true })
  assert.deepEqual(parseVaultTake('全部 灵石'), { name: '灵石', count: 1, all: true })
  assert.deepEqual(parseVaultTake('灵石全部'), { name: '灵石', count: 1, all: true })
  assert.deepEqual(parseVaultTake('全部灵石'), { name: '灵石', count: 1, all: true })
  assert.deepEqual(parseVaultTake('月魄 全'), { name: '月魄', count: 1, all: true })
})

test('parseVaultTake: 全角数字与分隔符', () => {
  assert.deepEqual(parseVaultTake('５００ 灵石'), { name: '灵石', count: 500, all: false })
  assert.deepEqual(parseVaultTake('灵石，100'), { name: '灵石', count: 100, all: false })
  assert.deepEqual(parseVaultTake('灵石,5万'), { name: '灵石', count: 50000, all: false })
})

test('parseVaultTake: 物品名本身以万字开头不被误当单位', () => {
  assert.deepEqual(parseVaultTake('万魂幡残卷 3'), { name: '万魂幡残卷', count: 3, all: false })
  assert.deepEqual(parseVaultTake('万阵核心 2'), { name: '万阵核心', count: 2, all: false })
})

test('parseVaultTake: 无有效物品名返回 null', () => {
  assert.equal(parseVaultTake(''), null)
  assert.equal(parseVaultTake('   '), null)
  assert.equal(parseVaultTake('5000'), null)
  assert.equal(parseVaultTake('全部'), null)
})

/* ---------- 宝库物品名模糊解析 ---------- */

function mkVault () {
  return {
    stones: 100000,
    mats: { 月魄石: 50, 星璇石: 30, 凤栖花: 8, 三阶妖丹: 4 },
    pills: { 聚宝丹: 20, 修为丹: 9 },
    equips: { 青虹剑: 2 }
  }
}

test('resolveVaultName: 精确命中返回现存合计', () => {
  const v = mkVault()
  assert.deepEqual(resolveVaultName(v, '月魄石'), { name: '月魄石', have: 50, needChoice: false })
  assert.deepEqual(resolveVaultName(v, '聚宝丹'), { name: '聚宝丹', have: 20, needChoice: false })
  assert.deepEqual(resolveVaultName(v, '青虹剑'), { name: '青虹剑', have: 2, needChoice: false })
})

test('resolveVaultName: 输入子串唯一命中', () => {
  const v = mkVault()
  assert.deepEqual(resolveVaultName(v, '月魄'), { name: '月魄石', have: 50, needChoice: false })
  assert.deepEqual(resolveVaultName(v, '青虹'), { name: '青虹剑', have: 2, needChoice: false })
  assert.deepEqual(resolveVaultName(v, '聚宝'), { name: '聚宝丹', have: 20, needChoice: false })
})

test('resolveVaultName: 多个候选列出待明确', () => {
  const v = mkVault()
  const r = resolveVaultName(v, '石')
  assert.equal(r.needChoice, true)
  assert.deepEqual(r.choices.sort(), ['星璇石', '月魄石'])
})

test('resolveVaultName: 同名跨仓(材料+丹药)合并现存', () => {
  const v = mkVault()
  v.mats['聚宝丹'] = 5
  assert.deepEqual(resolveVaultName(v, '聚宝丹'), { name: '聚宝丹', have: 25, needChoice: false })
})

test('resolveVaultName: 无命中返回 name:null', () => {
  const v = mkVault()
  assert.deepEqual(resolveVaultName(v, '灵石'), { name: null })
  assert.deepEqual(resolveVaultName(v, '不存在'), { name: null })
  assert.deepEqual(resolveVaultName(v, ''), { name: null })
})
