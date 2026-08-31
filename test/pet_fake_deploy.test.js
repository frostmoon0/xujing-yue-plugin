import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import { Save_Path } from '../components/plugin.js'
import { getPetState, savePetState, getActivePetInfo, getActivePetPower } from '../components/pet_data.js'
import { withDeferredSaveContext, flushDeferredSaves } from '../components/deferred_save.js'

const DIR = `${Save_Path}/pet`
const gid = 'testfake0001'
const file = `${DIR}/pet_fake_${gid}.json`

/** 造一只可战斗灵兽(只算战力, 不依赖物种表) */
function mkPet (pid, quality, stage, maxAtk, maxDef, maxHp) {
  return {
    pid, speciesId: 'test-species', quality, stage,
    customName: '', maxAtk, maxDef, maxHp,
    growthStart: 0, obtainedAt: 0, lastAt: 0
  }
}

test.afterEach(() => {
  flushDeferredSaves()
  try { fs.unlinkSync(file) } catch (err) { }
})

test('伪玩家自动出战的灵兽在延迟保存窗口内立即生效(不走旧档)', async () => {
  /* 布置: 铁笛有两只可战斗灵兽, 当前出战的是弱的那只(已落盘) */
  const state = getPetState(gid, 'fake')
  state.bag['铁笛'] = [
    mkPet(1, 3, '少年', 20, 10, 50),
    mkPet(2, 4, '成年', 60, 30, 200)
  ]
  state.active['铁笛'] = 1
  savePetState(state)

  const weakPower = getActivePetPower(gid, '铁笛', 'fake')
  assert.ok(weakPower > 0, '出战灵兽应有战力')

  /* 模拟 fakePetTick 在延迟保存上下文内自动换成更强的灵兽 */
  let during = 0
  await withDeferredSaveContext(async () => {
    state.active['铁笛'] = 2
    savePetState(state)
    /* 修复前: 直读磁盘旧档, 这里会返回旧灵兽战力; 修复后: 走内存缓存, 立即返回新灵兽 */
    during = getActivePetPower(gid, '铁笛', 'fake')
    const info = getActivePetInfo(gid, '铁笛', 'fake')
    assert.equal(info && info.stage, '成年', '延迟窗口内应读到新出战的灵兽阶段')
  })
  assert.ok(during > weakPower, `延迟窗口内应取到新灵兽战力(${during}) > 旧灵兽(${weakPower})`)

  /* flush 落盘后仍一致 */
  flushDeferredSaves()
  assert.equal(getActivePetPower(gid, '铁笛', 'fake'), during)
})

test('无灵兽档/未出战返回 null, 不会为未启用灵兽的群建档', () => {
  assert.equal(getActivePetInfo(gid, '无名氏', 'fake'), null)
  assert.equal(fs.existsSync(file), false)
})
