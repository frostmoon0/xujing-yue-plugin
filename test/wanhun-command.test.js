import test from 'node:test'
import assert from 'node:assert/strict'
import { parseWanhunNamedCmd, wanhunNamedCmdReg } from '../components/wanhun_data.js'

test('改名后"动词+名字"指令解析出名字', () => {
  assert.equal(parseWanhunNamedCmd('#祭出日月幡', '祭出'), '日月幡')
  assert.equal(parseWanhunNamedCmd('祭出日月幡', '祭出'), '日月幡')
  assert.equal(parseWanhunNamedCmd('祭出 日月幡', '祭出'), '日月幡')
  /* 动词不符 / 无名字 / 只有空白 -> 不解析 */
  assert.equal(parseWanhunNamedCmd('#祭出日月幡', '收回'), null)
  assert.equal(parseWanhunNamedCmd('#祭出', '祭出'), null)
  assert.equal(parseWanhunNamedCmd('#祭出  ', '祭出'), null)
})

test('改名后"动词+名字"指令正则命中动词后带名字的指令', () => {
  assert.ok(new RegExp(wanhunNamedCmdReg('祭出')).test('#祭出日月幡'))
  assert.ok(new RegExp(wanhunNamedCmdReg('收回')).test('#收回日月幡'))
  assert.ok(new RegExp(wanhunNamedCmdReg('卸下')).test('#卸下日月幡'))
  assert.ok(new RegExp(wanhunNamedCmdReg('祭出')).test('#祭出 日月幡'))
  assert.ok(!new RegExp(wanhunNamedCmdReg('祭出')).test('#祭出'))
  /* 原名"万魂幡"也会命中通配正则, 但规则数组里精确规则在前、先处理 */
  assert.ok(new RegExp(wanhunNamedCmdReg('祭出')).test('#祭出万魂幡'))
})
