import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWealthRank } from '../components/wealth_rank.js'

test('财富榜按群成员灵石余额降序排列并限制数量', () => {
  const homes = {
    '100': { money: 1200 },
    '101': { money: 5000 },
    '102': { money: 5000 },
    '999': { money: 999999 }
  }
  const members = new Map([
    ['100', { user_id: 100, card: '甲' }],
    ['101', { user_id: 101, nickname: '乙' }],
    ['102', { user_id: 102, card: '丙' }],
    ['103', { user_id: 103, card: '丁' }]
  ])

  assert.deepEqual(buildWealthRank(homes, members, 2), [
    { uid: '101', nick: '乙', money: 5000 },
    { uid: '102', nick: '丙', money: 5000 }
  ])
})

test('财富榜兼容成员数组和旧版二进制灵石字段', () => {
  const homes = {
    '100': { money2: '1010' },
    '101': { money: -20 },
    '102': { money: '无效' }
  }
  const members = [
    { user_id: 100, nickname: '甲' },
    { user_id: 101, nickname: '乙' },
    { user_id: 102, nickname: '丙' }
  ]

  assert.deepEqual(buildWealthRank(homes, members), [
    { uid: '100', nick: '甲', money: 10 },
    { uid: '101', nick: '乙', money: 0 }
  ])
})
