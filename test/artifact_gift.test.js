import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolvePuppetGift,
  resolveWanhunGift,
  transferArtifact
} from '../components/artifact_gift.js'

function puppet (id, name, rank = 1, power = 500, extra = {}) {
  return {
    id,
    name,
    rank,
    power,
    passive: 'atk',
    equipped: false,
    deployed: false,
    deployedUntil: 0,
    nextChargeAt: 0,
    ...extra
  }
}

function bagWith (artifacts = {}) {
  return { items: {}, equipped: {}, equippedAttr: {}, artifacts }
}

const wanhun = (extra = {}) => ({ name: '万魂幡', rank: 3, attack: 320, souls: 100, totalSouls: 500, equipped: false, deployed: false, shieldReady: false, aidUntil: 0, ...extra })

test('傀儡按序号赠送: 发送者移除、接收者获得且属性原样保留', () => {
  const from = bagWith({ puppets: [puppet('a', '玄甲', 3, 2000), puppet('b', '青鸾', 1, 500)] })
  const to = bagWith({})
  const res = transferArtifact(from, to, { kind: 'puppet', index: 0 })
  assert.equal(res.ok, true)
  assert.equal(res.icon, '🔵')
  assert.ok(res.name.includes('玄甲') && res.name.includes('三阶') && res.name.includes('2000'))
  assert.equal(from.artifacts.puppets.length, 1)
  assert.equal(from.artifacts.puppets[0].id, 'b')
  assert.equal(to.artifacts.puppets.length, 1)
  assert.equal(to.artifacts.puppets[0].id, 'a')
  assert.equal(to.artifacts.puppets[0].rank, 3)
  assert.equal(to.artifacts.puppets[0].power, 2000)
  assert.equal(to.artifacts.puppets[0].passive, 'atk')
})

test('傀儡赠送走 JSON 克隆, 接收者得到独立副本', () => {
  const from = bagWith({ puppets: [puppet('a', '玄甲', 2, 900)] })
  const to = bagWith({})
  const before = from.artifacts.puppets[0]
  const res = transferArtifact(from, to, { kind: 'puppet', index: 0 })
  assert.equal(res.ok, true)
  assert.equal(from.artifacts.puppets.length, 0)
  assert.equal(to.artifacts.puppets.length, 1)
  /* 克隆而非同一引用: 外部改原对象不影响接收者副本 */
  assert.notEqual(to.artifacts.puppets[0], before)
  before.name = '外部修改'
  assert.equal(to.artifacts.puppets[0].name, '玄甲')
})

test('傀儡解析: 傀儡<序号> / 傀儡 <序号> / 傀儡 <名字> / 裸名字', () => {
  const bag = bagWith({ puppets: [puppet('a', '玄甲'), puppet('b', '青鸾'), puppet('c', '青鸾')] })
  assert.deepEqual(resolvePuppetGift('傀儡1', bag), { ok: true, kind: 'puppet', index: 0 })
  assert.deepEqual(resolvePuppetGift('傀儡 2', bag), { ok: true, kind: 'puppet', index: 1 })
  assert.deepEqual(resolvePuppetGift('傀儡 玄甲', bag), { ok: true, kind: 'puppet', index: 0 })
  assert.deepEqual(resolvePuppetGift('傀儡青鸾', bag), { ok: false, msg: '有多只傀儡都叫“青鸾”，请改用序号赠送。' })
})

test('傀儡解析: 非 傀儡 前缀返回 null(交给道具/万魂幡路径)', () => {
  const bag = bagWith({ puppets: [puppet('a', '玄甲')] })
  assert.equal(resolvePuppetGift('修为丹 5', bag), null)
  assert.equal(resolvePuppetGift('万魂幡', bag), null)
})

test('傀儡解析: 傀儡 前缀的普通道具(傀儡术上中下篇功法)仍是道具, 不归法宝路径', () => {
  const bag = bagWith({ puppets: [puppet('a', '玄甲')] })
  assert.equal(resolvePuppetGift('傀儡术下篇', bag), null)
  assert.equal(resolvePuppetGift('傀儡术中篇 2', bag), null)
  assert.equal(resolvePuppetGift('傀儡术上篇', bag), null)
})

test('傀儡解析: 无傀儡/越界/未指定时给出明确提示', () => {
  const empty = bagWith({})
  assert.equal(resolvePuppetGift('傀儡1', empty).ok, false)
  assert.equal(resolvePuppetGift('傀儡1', empty).msg.includes('你还没有傀儡'), true)
  const bag = bagWith({ puppets: [puppet('a', '玄甲'), puppet('b', '青鸾')] })
  assert.equal(resolvePuppetGift('傀儡', bag).ok, false)
  assert.equal(resolvePuppetGift('傀儡', bag).msg.includes('请指定序号或名字'), true)
  assert.equal(resolvePuppetGift('傀儡5', bag).ok, false)
  assert.equal(resolvePuppetGift('傀儡 不存在', bag).ok, false)
})

test('傀儡单只时裸 傀儡 直接赠送', () => {
  const bag = bagWith({ puppets: [puppet('a', '玄甲')] })
  assert.deepEqual(resolvePuppetGift('傀儡', bag), { ok: true, kind: 'puppet', index: 0 })
})

test('傀儡装备中/祭出中不可赠送', () => {
  const equipped = bagWith({ puppets: [puppet('a', '玄甲', 1, 500, { equipped: true })] })
  assert.equal(transferArtifact(equipped, bagWith({}), { kind: 'puppet', index: 0 }).ok, false)
  const deployed = bagWith({ puppets: [puppet('a', '玄甲', 1, 500, { deployed: true })] })
  assert.equal(transferArtifact(deployed, bagWith({}), { kind: 'puppet', index: 0 }).ok, false)
  const free = bagWith({ puppets: [puppet('a', '玄甲')] })
  assert.equal(transferArtifact(free, bagWith({}), { kind: 'puppet', index: 0 }).ok, true)
})

test('万魂幡按名赠送: 裸 万魂幡 / 改名后的名字 / 忽略数量后缀', () => {
  const bag = bagWith({ wanhun: wanhun() })
  assert.deepEqual(resolveWanhunGift('万魂幡', bag), { ok: true, kind: 'wanhun' })
  assert.deepEqual(resolveWanhunGift('万魂幡 2', bag), { ok: true, kind: 'wanhun' })
  const renamed = bagWith({ wanhun: wanhun({ name: '天玄幡' }) })
  assert.deepEqual(resolveWanhunGift('天玄幡', renamed), { ok: true, kind: 'wanhun' })
  assert.deepEqual(resolveWanhunGift('万魂幡', renamed), { ok: true, kind: 'wanhun' })
  /* 未拥有时命中 万魂幡 报未拥有 */
  assert.equal(resolveWanhunGift('万魂幡', bagWith({})).ok, false)
  /* 万魂幡残卷是普通材料, 不归法宝路径 */
  assert.equal(resolveWanhunGift('万魂幡残卷', bagWith({ wanhun: wanhun() })), null)
})

test('万魂幡赠送: 接收者获得、发送者移除、装备/祭出中与对方已有均拒绝', () => {
  const from = bagWith({ wanhun: wanhun({ rank: 5, name: '天玄幡' }) })
  const to = bagWith({})
  const res = transferArtifact(from, to, { kind: 'wanhun' })
  assert.equal(res.ok, true)
  assert.equal(res.icon, '🏴')
  assert.equal(res.name, '天玄幡')
  assert.equal(from.artifacts.wanhun, undefined)
  assert.equal(to.artifacts.wanhun.rank, 5)
  /* 装备中 */
  const equipped = bagWith({ wanhun: wanhun({ equipped: true }) })
  assert.equal(transferArtifact(equipped, bagWith({}), { kind: 'wanhun' }).ok, false)
  /* 祭出中 */
  const deployed = bagWith({ wanhun: wanhun({ deployed: true }) })
  assert.equal(transferArtifact(deployed, bagWith({}), { kind: 'wanhun' }).ok, false)
  /* 对方已有 */
  assert.equal(transferArtifact(bagWith({ wanhun: wanhun() }), bagWith({ wanhun: wanhun() }), { kind: 'wanhun' }).ok, false)
})

test('定仙游赠送: 拥有判定与装备/对方已有拒绝', () => {
  const bag = bagWith({ dingxianyou: { owned: true, equipped: false } })
  assert.deepEqual(resolveWanhunGift('定仙游', bag), { ok: true, kind: 'dingxianyou' })
  /* 未拥有命中 定仙游 报未拥有(优于通用"没有道具") */
  assert.equal(resolveWanhunGift('定仙游', bagWith({})).ok, false)
  const from = bagWith({ dingxianyou: { owned: true, equipped: false } })
  const to = bagWith({})
  const res = transferArtifact(from, to, { kind: 'dingxianyou' })
  assert.equal(res.ok, true)
  assert.equal(res.icon, '🦋')
  assert.equal(from.artifacts.dingxianyou, undefined)
  assert.equal(to.artifacts.dingxianyou.owned, true)
  const equipped = bagWith({ dingxianyou: { owned: true, equipped: true } })
  assert.equal(transferArtifact(equipped, bagWith({}), { kind: 'dingxianyou' }).ok, false)
  assert.equal(transferArtifact(bagWith({ dingxianyou: { owned: true } }), bagWith({ dingxianyou: { owned: true } }), { kind: 'dingxianyou' }).ok, false)
})

test('未知法宝类型 / 空背包返回错误', () => {
  assert.equal(transferArtifact(bagWith({}), bagWith({}), { kind: 'xxx' }).ok, false)
  assert.equal(transferArtifact(null, bagWith({}), { kind: 'wanhun' }).ok, false)
})
