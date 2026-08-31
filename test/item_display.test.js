import test from 'node:test'
import assert from 'node:assert/strict'
import { fmtItem, fmtItems, itemIcon } from '../components/equip_data.js'
import { lootIcon } from '../components/raid_data.js'

test('物品展示统一带对应图标', () => {
  assert.equal(itemIcon('冥蝶手'), '🔴')
  assert.equal(itemIcon('聚宝功'), '🟡')
  assert.equal(itemIcon('月魄石'), '🟣')
  assert.equal(itemIcon('凝露丹'), '🌸')
  assert.equal(itemIcon('行运丹'), '🍀')
  assert.equal(itemIcon('灵石'), '💰')
  assert.equal(itemIcon('定仙游'), '🦋')
  assert.equal(itemIcon('万魂幡'), '🏴')
  assert.equal(itemIcon('未知物品'), '📦')
})

test('物品列表中的每个名称都带图标', () => {
  assert.equal(fmtItem('冥蝶手', 3), '🔴冥蝶手×3')
  assert.equal(fmtItems({ 冥蝶手: 3, 聚宝功: 5, 月魄石: 4 }), '🔴冥蝶手×3、🟡聚宝功×5、🟣月魄石×4')
  assert.equal(lootIcon('凝露丹'), '🌸')
})
