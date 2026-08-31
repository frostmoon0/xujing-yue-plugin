import test from 'node:test'
import assert from 'node:assert/strict'
import { payPlayerSectSalaries, salaryRecipients, claimSalary } from '../components/sect/economy.js'
import { CFG } from '../components/sect/utils.js'

const HOUR = CFG.SALARY_INTERVAL

function makeSect (owner, stones = 10000, lastSalaryAt = 0) {
  return {
    name: owner ? '玩家宗门' : '伪玩家宗门',
    owner,
    wipeAt: 0,
    lastSalaryAt,
    salaryOwner: owner ? String(owner) : undefined,
    vault: { stones, mats: {}, pills: {}, equips: {}, gongfas: {} }
  }
}

function makeFake (sects, roster = {}, players = {}) {
  return { sects, roster, players, sectMap: {}, major: [], minor: [], byPerson: {}, bySect: {}, evSeq: 0 }
}

test('玩家主导宗门每小时按弟子人数发放500灵石', async () => {
  const now = 2 * HOUR
  const f = makeFake(
    { player: makeSect('100', 5000, now - HOUR) },
    { 甲: { name: '甲', alive: true, status: 'sect', sect: 'player', pos: 'dizi', money: 20 },
      乙: { name: '乙', alive: true, status: 'sect', sect: 'player', pos: 'dizi', realmBusy: { realmId: 'r1' }, money: 30 } },
    { '200': { name: '玩家弟子', sect: 'player', pos: 'dizi' },
      '201': { name: '另一位弟子', sect: 'player', pos: 'dizi' } }
  )
  const homes = { '200': { money: 100 }, '201': { money: 200 } }
  const r = await payPlayerSectSalaries(f, 'g', now, {
    loadPlayer: async (gid, uid) => ({ uid, filename: 'test.json', home: { ...homes } }),
    savePlayer: async ({ uids, home }) => { for (const uid of uids) homes[uid] = { ...home[uid] } }
  })

  assert.deepEqual(salaryRecipients(f, 'player').players.map(x => x.uid), ['200', '201'])
  assert.equal(r.paid, 4)
  assert.equal(r.amount, 2000)
  assert.equal(f.sects.player.vault.stones, 3000)
  assert.equal(f.roster.甲.money, 520)
  assert.equal(f.roster.乙.money, 530)
  assert.equal(homes['200'].money, 600)
  assert.equal(homes['201'].money, 700)
})

test('伪玩家宗门不发俸禄，非弟子职位不计入人数', async () => {
  const now = HOUR
  const f = makeFake(
    { fake: makeSect(null, 5000, now - HOUR), player: makeSect('100', 5000, now - HOUR) },
    {
      伪弟子: { name: '伪弟子', alive: true, status: 'sect', sect: 'fake', pos: 'dizi', money: 10 },
      执事: { name: '执事', alive: true, status: 'sect', sect: 'player', pos: 'zhishi', money: 10 }
    },
    { '200': { name: '伪玩家宗门中的玩家', sect: 'fake', pos: 'dizi' } }
  )
  const r = await payPlayerSectSalaries(f, 'g', now)

  assert.equal(r.paid, 0)
  assert.equal(f.sects.fake.vault.stones, 5000)
  assert.equal(f.roster.伪弟子.money, 10)
  assert.equal(f.sects.player.vault.stones, 5000)
  assert.match((await claimSalary(f, 'g', '200')).msg, /伪玩家宗门，不发放/)
})

test('宝库不足时整宗不发，且同一小时不会重复结算', async () => {
  const now = HOUR
  const f = makeFake(
    { player: makeSect('100', CFG.SALARY_PER_MEMBER - 1, now - HOUR) },
    {
      甲: { name: '甲', alive: true, status: 'sect', sect: 'player', pos: 'dizi', money: 20 },
      乙: { name: '乙', alive: true, status: 'sect', sect: 'player', pos: 'dizi', money: 30 }
    }
  )
  const first = await payPlayerSectSalaries(f, 'g', now)
  const second = await payPlayerSectSalaries(f, 'g', now + 10 * 60 * 1000)

  assert.equal(first.paid, 0)
  assert.equal(first.skipped, 2)
  assert.equal(f.sects.player.vault.stones, CFG.SALARY_PER_MEMBER - 1)
  assert.equal(f.roster.甲.money, 20)
  assert.equal(f.roster.乙.money, 30)
  assert.equal(second.paid, 0)
  assert.equal(second.changed, false)
})

test('旧宗门首次补齐俸禄时间戳时不追溯发放', async () => {
  const now = 5 * HOUR
  const f = makeFake(
    { player: { ...makeSect('100', 5000), lastSalaryAt: undefined } },
    { 甲: { name: '甲', alive: true, status: 'sect', sect: 'player', pos: 'dizi', money: 20 } }
  )
  const r = await payPlayerSectSalaries(f, 'g', now)

  assert.equal(r.changed, true)
  assert.equal(r.paid, 0)
  assert.equal(f.sects.player.lastSalaryAt, now)
  assert.equal(f.sects.player.vault.stones, 5000)
  assert.equal(f.roster.甲.money, 20)
})

test('玩家接管伪玩家宗门时从接管时刻起算，不补发历史俸禄', async () => {
  const now = 3 * HOUR
  const f = makeFake(
    { sect: { ...makeSect('100', 5000, 0), salaryOwner: 'old-owner' } },
    { 甲: { name: '甲', alive: true, status: 'sect', sect: 'sect', pos: 'dizi', money: 20 } }
  )
  const r = await payPlayerSectSalaries(f, 'g', now)

  assert.equal(r.paid, 0)
  assert.equal(f.sects.sect.lastSalaryAt, now)
  assert.equal(f.sects.sect.salaryOwner, '100')
  assert.equal(f.sects.sect.vault.stones, 5000)
  assert.equal(f.roster.甲.money, 20)
})
