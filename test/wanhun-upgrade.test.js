import test from 'node:test'
import assert from 'node:assert/strict'
import Wanhun, { fmtUpgradeCost, missingCost, fmtMissing } from '../components/wanhun_data.js'

test('万魂幡各阶进阶材料逐阶逐项列出(与升级实际消耗同一来源)', () => {
  assert.equal(fmtUpgradeCost(1), '⚪阴魂砂×20、⚪游魂骨×20、🟢鬼火草×5、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
  assert.equal(fmtUpgradeCost(2), '⚪阴魂砂×30、⚪游魂骨×30、🟢鬼火草×30、🟢幽冥木×10、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
  assert.equal(fmtUpgradeCost(3), '⚪阴魂砂×40、⚪游魂骨×40、🟢鬼火草×40、🟢幽冥木×40、🔵摄魂铁×15、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
  assert.equal(fmtUpgradeCost(4), '⚪阴魂砂×50、⚪游魂骨×50、🟢鬼火草×50、🟢幽冥木×50、🔵摄魂铁×50、🔵阴魂石×20、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
  assert.equal(fmtUpgradeCost(5), '⚪阴魂砂×60、⚪游魂骨×60、🟢鬼火草×60、🟢幽冥木×60、🔵摄魂铁×60、🔵阴魂石×60、🟣玄阴玉×25、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
  assert.equal(fmtUpgradeCost(6), '⚪阴魂砂×70、⚪游魂骨×70、🟢鬼火草×70、🟢幽冥木×70、🔵摄魂铁×70、🔵阴魂石×70、🟣玄阴玉×70、🟡镇魂晶×30、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
  assert.equal(fmtUpgradeCost(7), '⚪阴魂砂×80、⚪游魂骨×80、🟢鬼火草×80、🟢幽冥木×80、🔵摄魂铁×80、🔵阴魂石×80、🟣玄阴玉×80、🟡镇魂晶×80、🔴血煞髓×35、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
  assert.equal(fmtUpgradeCost(8), '⚪阴魂砂×90、⚪游魂骨×90、🟢鬼火草×90、🟢幽冥木×90、🔵摄魂铁×90、🔵阴魂石×90、🟣玄阴玉×90、🟡镇魂晶×90、🔴血煞髓×90、🌈万魂帝晶×40、🌈云裳仙蕊×1、🌈万魂幡残卷×5')
})

test('路线展示的升级材料与升级实际消耗同源', () => {
  for (let r = 1; r <= 8; r++) {
    assert.equal(Wanhun.upgradeCostText(r), fmtUpgradeCost(r))
  }
})

test('missingCost 只列当前不够的材料及缺少数量', () => {
  /* 1→2: 有20游魂骨满足, 其余四项都不够 */
  const bag = { items: { 阴魂砂: { count: 5 }, 游魂骨: { count: 20 } } }
  const cost = { 阴魂砂: 20, 游魂骨: 20, 鬼火草: 5, 云裳仙蕊: 1, 万魂幡残卷: 5 }
  assert.deepEqual(missingCost(bag, cost), [
    { name: '阴魂砂', need: 20, have: 5 },
    { name: '鬼火草', need: 5, have: 0 },
    { name: '云裳仙蕊', need: 1, have: 0 },
    { name: '万魂幡残卷', need: 5, have: 0 }
  ])
})

test('fmtMissing 逐项展示当前持有与缺少数量', () => {
  const bag = { items: { 阴魂砂: { count: 5 }, 游魂骨: { count: 20 } } }
  const cost = { 阴魂砂: 20, 游魂骨: 20, 鬼火草: 5, 云裳仙蕊: 1, 万魂幡残卷: 5 }
  assert.equal(
    fmtMissing(missingCost(bag, cost)),
    '⚪阴魂砂×20（当前5，缺15）、🟢鬼火草×5（当前0，缺5）、🌈云裳仙蕊×1（当前0，缺1）、🌈万魂幡残卷×5（当前0，缺5）'
  )
})

test('材料全部满足时 missingCost 为空', () => {
  const bag = { items: { 阴魂砂: { count: 20 }, 游魂骨: { count: 20 }, 鬼火草: { count: 5 }, 云裳仙蕊: { count: 1 }, 万魂幡残卷: { count: 5 } } }
  assert.deepEqual(missingCost(bag, { 阴魂砂: 20, 游魂骨: 20, 鬼火草: 5, 云裳仙蕊: 1, 万魂幡残卷: 5 }), [])
})
