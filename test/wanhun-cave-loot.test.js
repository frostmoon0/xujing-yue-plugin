import test from 'node:test'
import assert from 'node:assert/strict'
import { caveAdvancedChance, caveRollOne, caveDropCount, caveColorChance, wanhunScrollChance } from '../components/wanhun_data.js'

/* 固定随机序列: 每次调用按顺序取一个值, 用尽后返回 1(跳过各判定档) */
function seqRand (values) {
  let i = 0
  return () => i < values.length ? values[i++] : 1
}

test('进阶材料(紫/金/红)爆率为基准的3倍', () => {
  /* 30分钟前统一极低概率 0.015 (0.005×3) */
  assert.equal(caveAdvancedChance('玄阴玉', 10), 0.015)
  assert.equal(caveAdvancedChance('镇魂晶', 10), 0.015)
  assert.equal(caveAdvancedChance('血煞髓', 10), 0.015)
  /* 30分钟后正式曲线(原值×3) */
  assert.equal(caveAdvancedChance('玄阴玉', 30), 0.06)
  assert.equal(caveAdvancedChance('镇魂晶', 30), 0.045)
  assert.equal(caveAdvancedChance('血煞髓', 30), 0.03)
  /* 每10分钟增幅 0.015 */
  assert.equal(caveAdvancedChance('玄阴玉', 40), 0.075)
  assert.equal(caveAdvancedChance('镇魂晶', 40), 0.06)
  assert.equal(caveAdvancedChance('血煞髓', 40), 0.045)
  /* 封顶(原值×3) */
  assert.equal(caveAdvancedChance('玄阴玉', 99999), 0.3)
  assert.equal(caveAdvancedChance('镇魂晶', 99999), 0.24)
  assert.equal(caveAdvancedChance('血煞髓', 99999), 0.15)
  /* 非进阶材料无概率 */
  assert.equal(caveAdvancedChance('阴魂砂', 40), 0)
})

test('进阶材料可被单次掉落命中', () => {
  /* 前几次随机分别用于 彩色×2/进阶×3 判定, 命中即返回 */
  assert.equal(caveRollOne(40, seqRand([1, 1, 0.05])), '玄阴玉')
  assert.equal(caveRollOne(40, seqRand([1, 1, 0.99, 0.03])), '镇魂晶')
  assert.equal(caveRollOne(40, seqRand([1, 1, 0.99, 0.99, 0.02])), '血煞髓')
})

test('普通材料兜底按权重抽取: 白色>绿色>蓝色', () => {
  /* 前5次随机(彩色×2+进阶×3)返回1跳过, 第6次控制普通材料加权抽取 */
  assert.equal(caveRollOne(10, seqRand([1, 1, 1, 1, 1, 0.24])), '阴魂砂')
  assert.equal(caveRollOne(10, seqRand([1, 1, 1, 1, 1, 0.49])), '游魂骨')
  assert.equal(caveRollOne(10, seqRand([1, 1, 1, 1, 1, 0.6])), '鬼火草')
  assert.equal(caveRollOne(10, seqRand([1, 1, 1, 1, 1, 0.7])), '幽冥木')
  assert.equal(caveRollOne(10, seqRand([1, 1, 1, 1, 1, 0.85])), '摄魂铁')
  assert.equal(caveRollOne(10, seqRand([1, 1, 1, 1, 1, 0.95])), '阴魂石')
})

test('每战掉落次数随时间提高', () => {
  assert.equal(caveDropCount(10, seqRand([0])), 1)
  assert.equal(caveDropCount(10, seqRand([0.999])), 4)
  assert.equal(caveDropCount(40, seqRand([0.999])), 8)
  assert.equal(caveDropCount(60, seqRand([0.999])), 12)
})

test('万魂幡残卷爆率下调为原来的1/3', () => {
  assert.equal(wanhunScrollChance(10), 0.02 / 3)
  assert.equal(wanhunScrollChance(30), 0.05 / 3)
  assert.equal(wanhunScrollChance(40), 0.06 / 3)
  assert.equal(wanhunScrollChance(99999), 0.25 / 3)
})

test('万魂帝晶爆率翻倍(50分钟前后与封顶都×2)', () => {
  assert.equal(caveColorChance('万魂帝晶', 10), 0.005 * 2)
  assert.equal(caveColorChance('万魂帝晶', 50), 0.03 * 2)
  assert.equal(caveColorChance('万魂帝晶', 60), 0.04 * 2)
  assert.equal(caveColorChance('万魂帝晶', 99999), 0.4)
})
