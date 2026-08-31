import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BOSS_YAODAN_RANGES,
  rollBossYaodanTier,
  planBossLoot
} from '../components/boss_data.js'
import { yaodanName } from '../components/equip_data.js'

test('妖丹名按阶数生成', () => {
  assert.equal(yaodanName(1), '一阶妖丹')
  assert.equal(yaodanName(4), '四阶妖丹')
  assert.equal(yaodanName(7), '七阶妖丹')
})

test('世界Boss妖丹掉落阶位范围按档位', () => {
  assert.deepEqual(BOSS_YAODAN_RANGES, { 1: [1, 3], 2: [2, 4], 3: [3, 6], 4: [6, 7] })
  /* 边界: 每档最低/最高 */
  assert.equal(rollBossYaodanTier(1, () => 0), 1)
  assert.equal(rollBossYaodanTier(1, () => 0.999999), 3)
  assert.equal(rollBossYaodanTier(2, () => 0), 2)
  assert.equal(rollBossYaodanTier(2, () => 0.999999), 4)
  assert.equal(rollBossYaodanTier(3, () => 0), 3)
  assert.equal(rollBossYaodanTier(3, () => 0.999999), 6)
  assert.equal(rollBossYaodanTier(4, () => 0), 6)
  assert.equal(rollBossYaodanTier(4, () => 0.999999), 7)
})

test('planBossLoot 每只Boss只掉1枚妖丹, 归伤害最高者', () => {
  const st = { tier: 3, damage: { '100': 8000, '200': 2000 } }
  const plan = planBossLoot(st, () => 0)
  const allPills = plan.flatMap(r => r.got.filter(n => n.endsWith('阶妖丹')))
  /* 整场恰好1枚 */
  assert.equal(allPills.length, 1)
  /* 归伤害最高者 */
  const top = plan.find(r => r.uid === '100')
  assert.equal(top.got.filter(n => n.endsWith('阶妖丹')).length, 1)
  assert.equal(plan.find(r => r.uid === '200').got.some(n => n.endsWith('阶妖丹')), false)
  /* 3档Boss掉3~6阶 */
  assert.ok(['三阶妖丹', '四阶妖丹', '五阶妖丹', '六阶妖丹'].includes(allPills[0]))
})

test('planBossLoot 无参与者时不产出妖丹', () => {
  const plan = planBossLoot({ tier: 1, damage: {} }, () => 0)
  assert.equal(plan.flatMap(r => r.got.filter(n => n.endsWith('阶妖丹'))).length, 0)
})
