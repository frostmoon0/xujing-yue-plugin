import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { addBagToTotals, addVaultToTotals, addDynastyStockToTotals, aggregateGroupItems, sortTotals, fmtItemRow, itemQuality, listGroupBagFiles } from '../components/items_all.js'

/** 写一份玩家背包存档到临时目录 */
function writeBag (dir, gid, uid, bag) {
  fs.mkdirSync(path.join(dir, String(gid)), { recursive: true })
  fs.writeFileSync(path.join(dir, String(gid), `${uid}.json`), JSON.stringify(bag))
}

test('addBagToTotals: 计入背包物品 + 已穿戴装备 + 彩虹武器, 不记归属', () => {
  const totals = new Map()
  const bag = {
    items: { '修为丹': { count: 3 }, '桃木剑': { count: 2 }, '月魄石': { count: 5 } },
    equipped: { weapon: '桃木剑', chest: '素纱衣', pants: '', shoes: '', ring: '', helmet: '' },
    equippedAttr: {},
    artifacts: {},
    rainbows: [{ id: 'w1', name: '七彩神兵' }]
  }
  addBagToTotals(totals, bag, true)
  assert.equal(totals.get('修为丹'), 3)
  assert.equal(totals.get('桃木剑'), 3) // 背包2 + 穿戴1
  assert.equal(totals.get('月魄石'), 5)
  assert.equal(totals.get('素纱衣'), 1)
  assert.equal(totals.get('rainbow:七彩神兵'), 1)
})

test('addBagToTotals: 兼容旧档裸数字 count, 零/负数量不计入', () => {
  const totals = new Map()
  addBagToTotals(totals, { items: { '灵石': 7, '破障丹': 0, '魂石': -2 } }, true)
  assert.equal(totals.get('灵石'), 7)
  assert.equal(totals.has('破障丹'), false)
  assert.equal(totals.has('魂石'), false)
})

test('addBagToTotals: countEquipped=false 不计已穿戴(伪玩家防重复)', () => {
  const totals = new Map()
  const bag = {
    items: { '桃木剑': { count: 1 } },
    equipped: { weapon: '桃木剑' },
    equippedAttr: {},
    artifacts: {}
  }
  addBagToTotals(totals, bag, false)
  assert.equal(totals.get('桃木剑'), 1) // 只计背包, 不重复加穿戴
})

test('addBagToTotals: 彩虹槽位引用不被当作装备再计(只按 rainbows 数组计一次)', () => {
  const totals = new Map()
  const bag = {
    items: {},
    equipped: { weapon: 'rainbow:w1' },
    equippedAttr: { weapon: { atk: 2000 } },
    artifacts: {},
    rainbows: [{ id: 'w1', name: '七彩神兵' }]
  }
  addBagToTotals(totals, bag, true)
  assert.equal(totals.has('rainbow:w1'), false)
  assert.equal(totals.get('rainbow:七彩神兵'), 1)
})

test('aggregateGroupItems: 聚合玩家背包 + 存活伪玩家, 死亡/无bag伪玩家不计', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'items-all-'))
  writeBag(dir, '999', '100', {
    items: { '修为丹': { count: 3 }, '桃木剑': { count: 2 } },
    equipped: { weapon: '桃木剑' },
    equippedAttr: {},
    artifacts: {}
  })
  writeBag(dir, '999', '101', {
    items: { '月魄石': { count: 5 } },
    equipped: {},
    equippedAttr: {},
    artifacts: {}
  })
  const fake = {
    roster: {
      '张三': { alive: true, bag: { items: { '聚宝功': { count: 1 }, '月魄石': { count: 3 } }, equipped: {}, equippedAttr: {}, artifacts: {} } },
      '李四': { alive: true, bag: { items: { '星霜草': { count: 4 } }, equipped: {}, equippedAttr: {}, artifacts: {} } },
      '死人': { alive: false, bag: { items: { '太阴月华诀': { count: 1 } }, equipped: {}, equippedAttr: {}, artifacts: {} } },
      '无bag': { alive: true }
    }
  }
  const { totals, players, fakes, sects, cities } = aggregateGroupItems('999', { bagDir: dir, fakeData: fake, dynastyData: {} })

  assert.equal(players, 2)
  assert.equal(fakes, 2) // 死人/无bag不计
  assert.equal(sects, 0) // 该 fixture 无 sects
  assert.equal(cities, 0)
  assert.equal(totals.get('修为丹'), 3)
  assert.equal(totals.get('桃木剑'), 3) // 玩家100 背包2 + 穿戴1
  assert.equal(totals.get('月魄石'), 8) // 玩家101 5 + 伪玩家张三 3
  assert.equal(totals.get('聚宝功'), 1)
  assert.equal(totals.get('星霜草'), 4)
  assert.equal(totals.has('太阴月华诀'), false) // 死亡伪玩家的物品不计

  fs.rmSync(dir, { recursive: true, force: true })
})

test('aggregateGroupItems: 伪玩家已穿装备留在 items 时不计穿戴(不重复计)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'items-all-fake-eq-'))
  writeBag(dir, '777', '100', { items: {}, equipped: {}, equippedAttr: {}, artifacts: {} })
  const fake = {
    roster: {
      '张三': {
        alive: true,
        bag: {
          items: { '桃木剑': { count: 1 } }, // 迁移路径: 已穿装备仍在 items
          equipped: { weapon: '桃木剑' },
          equippedAttr: {},
          artifacts: {}
        }
      }
    }
  }
  const { totals } = aggregateGroupItems('777', { bagDir: dir, fakeData: fake, dynastyData: {} })
  assert.equal(totals.get('桃木剑'), 1) // 只计一次, 不因 equipped 重复
  fs.rmSync(dir, { recursive: true, force: true })
})

test('aggregateGroupItems: 损坏/缺失背包档跳过, 传入空伪玩家档不计', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'items-all-bad-'))
  writeBag(dir, '888', '200', { items: { '修为丹': { count: 2 } }, equipped: {}, equippedAttr: {}, artifacts: {} })
  writeBag(dir, '888', '201', 'not-json{{{') // 损坏档: 应跳过, 不抛错
  const { totals, players, fakes } = aggregateGroupItems('888', { bagDir: dir, fakeData: {}, dynastyData: {} })
  assert.equal(players, 1)
  assert.equal(fakes, 0)
  assert.equal(totals.get('修为丹'), 2)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('sortTotals: 品质降序优先, 同品质按数量降序, 彩虹排最前, 再按名称', () => {
  const totals = new Map([
    ['太阴月华诀', 1],        // 彩7
    ['月魄石', 9],             // 紫4
    ['修为丹', 3],             // 无模板品质 -> 0
    ['rainbow:七彩神兵', 2],   // 彩虹 -> 7
    ['聚宝功', 5]              // 金5
  ])
  const sorted = sortTotals(totals).map(x => x.name)
  assert.deepEqual(sorted, ['rainbow:七彩神兵', '太阴月华诀', '聚宝功', '月魄石', '修为丹'])
})

test('fmtItemRow: 每个物品带对应品质图标, 彩虹武器还原名字并带🌈', () => {
  assert.equal(fmtItemRow('月魄石', 5), '🟣月魄石 ×5')
  assert.equal(fmtItemRow('rainbow:七彩神兵', 3), '🌈七彩神兵 ×3')
  assert.equal(fmtItemRow('凝露丹', 2), '🌸凝露丹 ×2')
})

test('itemQuality: 模板品质与彩虹固定7, 无模板为0', () => {
  assert.equal(itemQuality('太阴月华诀'), 7)
  assert.equal(itemQuality('月魄石'), 4)
  assert.equal(itemQuality('修为丹'), 0)
  assert.equal(itemQuality('rainbow:任意'), 7)
})

test('listGroupBagFiles: 只列本群 json 档, 目录不存在返回空数组', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'items-all-list-'))
  writeBag(dir, '777', '300', { items: {} })
  fs.writeFileSync(path.join(dir, '777', 'notjson.txt'), 'x')
  fs.writeFileSync(path.join(dir, '777', 'ignore.json.bak'), 'x')
  assert.deepEqual(listGroupBagFiles('777', dir), [path.join(dir, '777', '300.json')])
  assert.deepEqual(listGroupBagFiles('9999', dir), [])
  fs.rmSync(dir, { recursive: true, force: true })
})

test('addVaultToTotals: 宗门宝库计入灵石/材料/丹药/装备/功法书, 零值不计', () => {
  const totals = new Map()
  addVaultToTotals(totals, {
    stones: 500000,
    mats: { '造梦神玉': 3, '月魄石': 12, '空': 0 },
    pills: { '修为丹': 5 },
    equips: { '霓裳剑': 2 },
    gongfas: { '聚宝功': 1, '太阴月华诀': 0 }
  })
  assert.equal(totals.get('灵石'), 500000)
  assert.equal(totals.get('造梦神玉'), 3)
  assert.equal(totals.get('月魄石'), 12)
  assert.equal(totals.get('修为丹'), 5)
  assert.equal(totals.get('霓裳剑'), 2)
  assert.equal(totals.get('聚宝功'), 1)
  assert.equal(totals.has('空'), false)
  assert.equal(totals.has('太阴月华诀'), false)
})

test('addVaultToTotals: 空/缺字段宝库不抛错', () => {
  const totals = new Map()
  addVaultToTotals(totals, null)
  addVaultToTotals(totals, { stones: 0 })
  addVaultToTotals(totals, {})
  assert.equal(totals.size, 0)
})

test('addDynastyStockToTotals: 王朝各城库存云裳仙蕊合计, 废墟/无库存不计', () => {
  const totals = new Map()
  addDynastyStockToTotals(totals, {
    cities: {
      '简月皇城': { stock: 5 },
      '平川城': { stock: 0 },
      '永宁城': { stock: 3 },
      '无字段城': {}
    }
  })
  assert.equal(totals.get('云裳仙蕊'), 8)
})

test('aggregateGroupItems: 玩家+伪玩家+宗门宝库+王朝库存全量聚合', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'items-all-full-'))
  writeBag(dir, '555', '100', {
    items: { '修为丹': { count: 3 }, '桃木剑': { count: 1 } },
    equipped: { weapon: '桃木剑' },
    equippedAttr: {},
    artifacts: {}
  })
  const fake = {
    roster: {
      '张三': { alive: true, bag: { items: { '聚宝功': { count: 1 } }, equipped: {}, equippedAttr: {}, artifacts: {} } }
    },
    sects: {
      s1: { vault: { stones: 100000, mats: { '月魄石': 4 }, pills: {}, equips: {}, gongfas: { '凝霜诀': 1 } } },
      s2: { vault: { stones: 0, mats: {}, pills: { '破障丹': 2 }, equips: {}, gongfas: {} } }
    }
  }
  const dynasty = {
    cities: {
      '简月皇城': { stock: 5 },
      '平川城': { stock: 1 }
    }
  }
  const { totals, players, fakes, sects, cities } = aggregateGroupItems('555', { bagDir: dir, fakeData: fake, dynastyData: dynasty })

  assert.equal(players, 1)
  assert.equal(fakes, 1)
  assert.equal(sects, 2)
  assert.equal(cities, 1)
  assert.equal(totals.get('修为丹'), 3)
  assert.equal(totals.get('桃木剑'), 2) // 背包1 + 穿戴1
  assert.equal(totals.get('聚宝功'), 1)
  assert.equal(totals.get('灵石'), 100000) // 仅 s1 有灵石
  assert.equal(totals.get('月魄石'), 4)
  assert.equal(totals.get('凝霜诀'), 1)
  assert.equal(totals.get('破障丹'), 2)
  assert.equal(totals.get('云裳仙蕊'), 6) // 王朝两城库存 5+1

  fs.rmSync(dir, { recursive: true, force: true })
})
