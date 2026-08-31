/* ============================================================
 * 遗蜕秘境 - 指令与流程
 * #进入秘境 / #攻击屏障 / #撤离 / #秘境状态 / #使用遗蜕古钥 / #秘境开关 / #秘境刷新
 * 公开秘境: 定时刷新, 大区破界, 多队同场
 * 专属秘境: #使用遗蜕古钥 开启, 仅本队可入, 无破界直接探索, 不会遇到其他玩家队
 * 探索和伪玩家行动均由系统 tick 驱动; 玩家只在收到节点后回复数字。
 * ============================================================ */
import { plugin } from '../../model/api/api.js'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import schedule from 'node-schedule'
import puppeteer from '../../../../lib/puppeteer/puppeteer.js'
import { Plugin_Name, Plugin_Path } from '../../components/plugin.js'
import {
  getRealm, saveRealm, getRealmCfg, realmCfgRefresh,
  getPrivateRealm, getPrivateRealms, savePrivateRealm, openPrivateRealm, activePrivateRealms,
  TERRAINS, DIFFS, BARRIERS, activeRealmGroups, partyIdOf, partyInfoOf,
  spawnRealm, attackBarrier, fakeAttackBarrier, breakBarrier, stopBarrierAuto,
  enterRealm, leaveTeam, teamOf, advanceTeams, advanceFakeArrivals, driveFakeTeams, syncPlayerTeam,
  resolveNode, resolveDisposal, menuText, rollEvent, applyEvent, settleAll, actionDelay, REALM_QUALITY_WEIGHTS, planSplit, fmtRewards,
  isNight, reconcileFakeBusy, withRealmLock, autoPickForPlayer, beginAmbush, processAmbushRound, replaceRealmPlayerIds
} from '../../components/realm_data.js'
import { SECRET_KEY, consumeItem, addItem, QUALITY, itemIcon } from '../../components/equip_data.js'
import { getFake, withFakeLock } from '../../components/fake_data.js'
import { forceLock, isCurrent, unlock, currentInteract } from '../../components/interact.js'
import { guardActionLocked } from '../../components/action_lock.js'
import { textToImg } from '../../components/common-lib/reply-img.js'
import { getWorld, getLoc, regionNameOf } from '../../components/world_data.js'

const NODE_TIMEOUT_MIN = 5
const AMBUSH_MINUTES = 2.5 // 出口围剿: 公开秘境探索最后2.5分钟触发
const cfgPath = () => `./plugins/${Plugin_Name}/config/xujing.config.yaml`
function sendToGroup (gid, msg) { try { const g = Bot.pickGroup(gid); if (g?.sendMsg) g.sendMsg(msg) } catch (err) {} }
async function notifyAt (gid, uid, text) {
  try {
    const g = Bot.pickGroup(gid)
    if (g?.sendMsg) g.sendMsg([segment.at(Number(uid)), `\n${await formatRealmPush(gid, text)}`])
  } catch (err) {}
}
function isInRegion (gid, uid, region) { try { return getLoc(getWorld(gid), uid) === region } catch (err) { return false } }

/** 用户在哪个秘境(公开或专属)的队伍里 */
function realmOfUser (gid, uid) {
  const p = getPrivateRealms(gid).find(x => ['barrier', 'explore'].includes(x.phase) && teamOf(x, uid))
  if (p) return p
  const pub = getRealm(gid)
  if (teamOf(pub, uid)) return pub
  return null
}

/** 随机帮助背景图(与功法图鉴/配方台一致) */
function rodom () {
  try {
    const imageDir = path.join(Plugin_Path, 'resources', 'help', 'imgs')
    if (!fs.existsSync(imageDir)) return ''
    const list = fs.readdirSync(imageDir)
    if (!list.length) return ''
    return list.length === 1 ? list[0] : list[Math.floor(Math.random() * list.length)]
  } catch (err) { return '' }
}

/** 当前时间 MM月DD日 HH:mm */
function fmtDateTime () {
  const n = new Date()
  return `${n.getMonth() + 1}月${n.getDate()}日 ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

/** 阶别配色: 黄=金 玄=蓝 地=紫 天=彩 */
const DIFF_Q = { huang: 5, xuan: 3, di: 4, tian: 7 }

/** 群成员昵称映射: uid -> 群名片/昵称（查询失败时绝不回退显示 QQ 号） */
async function memberNamesOf (gid) {
  const names = new Map()
  try {
    const memberMap = await Bot.pickGroup(gid).getMemberMap()
    for (const entry of memberMap || []) {
      const info = entry[1]
      const name = String(info?.card || info?.nickname || '').trim()
      if (info?.user_id && name) names.set(String(info.user_id), name)
    }
  } catch (err) { }
  return names
}

function memberNameOf (names, uid) { return names.get(String(uid)) || '无名修士' }

/** 替换秘境推送中带结构标记的玩家 QQ 号；找不到群名片时使用安全占位名。 */
async function formatRealmPush (gid, text) {
  const names = await memberNamesOf(gid)
  return replaceRealmPlayerIds(text, names)
}

/** 场内队伍展示行(公开/专属共用) */
async function teamRows (st, gid) {
  const rows = []
  const teams = Object.values(st.teams || {}).filter(t => !t.dead && (t.members || []).length && (t.kind === 'fake' || st.phase === 'barrier' || t.entered !== false))
  const fakeWorld = getFake(gid)
  const memberNames = await memberNamesOf(gid)
  for (const t of teams) {
    let action
    if (t.node) action = t.node.title
    else if (t.arrivalAt && Date.now() < t.arrivalAt) action = `🛣️ 赶路中（约${Math.max(1, Math.ceil((t.arrivalAt - Date.now()) / 60000))}分钟到）`
    else if (t.kind === 'fake' && st.phase === 'barrier') action = '⚔️ 持续攻击屏障（每20秒）'
    else if (t.kind === 'fake' && t.entered === false) action = '🚪 即将进入秘境'
    else action = '⏳ 待命'
    let name = t.name
    let tag = t.kind === 'fake' ? '伪玩家' : `${(t.members || []).length}人`
    if (t.kind === 'fake') {
      name = (t.members || []).map(n => {
        const p = fakeWorld.roster && fakeWorld.roster[n]
        return p ? `${n}@${regionNameOf(p.loc)}` : n
      }).join('、')
    }
    const lootPlan = planSplit(t)
    const memberLoot = (t.members || []).map(uid => {
      const part = lootPlan.find(x => String(x.uid) === String(uid))
      const items = part?.items || []
      const label = t.kind === 'fake' ? (fakeWorld.roster?.[uid]?.name || '无名散修') : memberNameOf(memberNames, uid)
      return `${label}：${items.length ? fmtRewards(items) : '暂无收获'}`
    }).join('；')
    rows.push({ name, tag, kind: t.kind, action, loot: memberLoot || '暂无收获' })
  }
  return rows
}

/** 构建秘境总览数据(公开+专属), 供图片模板/纯文本回退共用 */
async function buildRealmOverview (gid) {
  const realms = []
  const renderOne = async (st, isPrivate) => {
    if (!st || !['barrier', 'explore'].includes(st.phase)) return
    const diff = DIFFS[st.diff] || {}
    const terrain = TERRAINS[st.terrain]
    const item = {
      cardCls: isPrivate ? 'private' : 'public',
      label: isPrivate ? `🗝️ 专属秘境${st.privateId ? `·${String(st.privateId).slice(-4)}` : ''}` : '公开秘境',
      title: st.title,
      diffQ: DIFF_Q[st.diff] || 5,
      diffName: diff.name || st.diff,
      diffRealm: diff.realm ? `建议${diff.realm}` : '',
      region: regionNameOf(st.region),
      isBarrier: st.phase === 'barrier',
      isExplore: st.phase === 'explore',
      exploreLeft: 0,
      barrierName: (terrain && BARRIERS[terrain.barrier]) ? BARRIERS[terrain.barrier].name : '',
      barrierPct: 0,
      barrierHp: '',
      barrierMax: '',
      autoPlayers: '',
      desc: st.desc || '',
      rewards: [],
      teams: await teamRows(st, gid)
    }
    if (st.phase === 'barrier') {
      const hp = st.barrier?.hp || 0; const max = st.barrier?.maxHp || 0
      item.barrierPct = max ? Math.round(hp / max * 100) : 0
      item.barrierHp = hp.toLocaleString()
      item.barrierMax = max.toLocaleString()
      if (st.barrier?.auto) {
        const names = await memberNamesOf(gid)
        item.autoPlayers = Object.keys(st.barrier.auto).map(uid => memberNameOf(names, uid)).join('、')
      }
    } else {
      item.exploreLeft = Math.max(0, Math.ceil((st.endAt - Date.now()) / 60000))
    }
    /* 掉落品质概率：按阶别配置的品质权重展示 */
    const qualityWeights = REALM_QUALITY_WEIGHTS[st.diff] || REALM_QUALITY_WEIGHTS.tian
    const weightTotal = Object.values(qualityWeights).reduce((sum, weight) => sum + weight, 0)
    item.rewards = Object.entries(qualityWeights)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([quality, weight]) => {
        const q = Number(quality)
        return { q, icon: QUALITY[q]?.icon || '⚪', name: QUALITY[q]?.name || `品质${q}`, pct: Math.round(weight / weightTotal * 10000) / 100 }
      })
    realms.push(item)
  }
  const pub = getRealm(gid)
  await renderOne(pub, false)
  for (const priv of getPrivateRealms(gid)) await renderOne(priv, true)
  return { realms, count: realms.length, empty: !realms.length }
}

/** 纯文本回退 */
function buildRealmText (data) {
  const lines = ['🌌 虚境 · 天下秘境']
  if (data.empty) { lines.push('', '当前没有现世的秘境。'); return lines.join('\n') }
  for (const r of data.realms) {
    lines.push('', `${r.label} ${r.title}（${r.diffName}${r.diffRealm ? '·' + r.diffRealm : ''}）`)
    lines.push(`📍 ${r.region}`)
    if (r.isBarrier) {
      lines.push(`🛡️ ${r.barrierName} ${r.barrierPct}% · ${r.barrierHp}/${r.barrierMax}`)
      if (r.autoPlayers) lines.push(`⚔️ 玩家持续破界：${r.autoPlayers}（每20秒自动攻击）`)
    } else {
      lines.push(`⏳ 探索中 · 剩余 ${r.exploreLeft} 分钟`)
    }
    if (r.rewards.length) lines.push(`🎁 品质掉落：${r.rewards.map(x => `${x.icon}${x.name} ${x.pct}%`).join('、')}`)
    if (!r.teams.length) { lines.push('👥 场内暂无队伍'); continue }
    for (const t of r.teams) {
      lines.push(`· ${t.name}（${t.tag}）—— ${t.action}`)
      lines.push(`  🎁 当前收获：${t.loot}`)
    }
  }
  lines.push('', '#进入秘境 · #攻击屏障 · #撤离 · #使用遗蜕古钥')
  return lines.join('\n')
}

export class realm extends plugin {
  constructor () {
    super({
      name: '遗蜕秘境', dsc: '遗蜕秘境探索/破界/PvP夺宝/专属秘境', event: 'message', priority: 42,
      rule: [
        { reg: '^[#＃]?天下秘境$', fnc: 'realmAll' },
        { reg: '^[#＃]?秘境状态$', fnc: 'status' },
        { reg: '^[#＃]?(进入秘境|进入遗蜕秘境)$', fnc: 'enter' },
        { reg: '^[#＃]?(攻击屏障|破界|攻打屏障)$', fnc: 'atkBarrier' },
        { reg: '^[#＃]?(停止攻击屏障|停止破界)$', fnc: 'stopBarrier' },
        { reg: '^[#＃]?(撤离|离开秘境)$', fnc: 'quit' },
        { reg: '^[#＃]?(使用遗蜕古钥|使用古钥|开启专属秘境|开启遗蜕秘境)$', fnc: 'useKey' },
        { reg: '^[#＃]?秘境开关\\s*(开|关|开启|关闭)\\s*$', fnc: 'toggle', auth: 'master' },
        { reg: '^[#＃]?秘境刷新$', fnc: 'forceSpawn', auth: 'master' },
        { reg: '^[#＃]?[0-9]+$', fnc: 'pick' }
      ]
    })
    if (!global.__xujingRealmTick__) {
      global.__xujingRealmTick__ = true
      schedule.scheduleJob('* * * * *', () => { realmTick().catch(err => logger.error('[遗蜕秘境]推进异常:' + (err && err.stack))) })
    }
  }

  /** #秘境状态 / #天下秘境: 同一视图, 渲染本群所有现世秘境(公开+专属)及各队伍当前行为 */
  async status (e) { return this.renderRealmOverview(e) }
  async realmAll (e) { return this.renderRealmOverview(e) }

  async renderRealmOverview (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id)
    const cfg = await getRealmCfg()
    if (!cfg.group.includes(gid)) return false
    const data = await buildRealmOverview(gid)
    /* 图片渲染, 失败回退纯文本 */
    const bg = rodom()
    const resPath = `../../../../../plugins/${Plugin_Name}/resources/`
    try {
      const img = await puppeteer.screenshot(`${Plugin_Name}/realm/index`, {
        tplFile: path.join(Plugin_Path, 'resources', 'realm', 'index.html'),
        pluResPath: resPath,
        _res_path: resPath,
        saveId: `realm-${Date.now()}`,
        bg,
        sub: (data.count ? `${data.count} 座秘境现世` : '暂无秘境') + ' · ' + fmtDateTime(),
        empty: data.empty,
        realms: data.realms
      })
      if (img) { e.reply(img); return true }
    } catch (err) {
      logger.error('[遗蜕秘境]渲染失败:' + (err && err.message))
    }
    e.reply(buildRealmText(data))
    return true
  }

  async enter (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id); const cfg = await getRealmCfg()
    if (!cfg.group.includes(gid)) return false
    /* 专属秘境: 本队成员任何时候可进(钥匙开的, 不受自动刷新开关限制) */
    const partyId = partyIdOf(gid, e.user_id)
    const p = getPrivateRealms(gid).find(x => ['barrier', 'explore'].includes(x.phase) && (
      partyId === x.ownerPartyId || Object.values(x.teams || {}).some(t => t.kind === 'player' && (t.partyMembers || []).map(String).includes(String(e.user_id)))
    ))
    if (p) {
      const r = await withRealmLock(gid, async () => await withFakeLock(gid, async () => {
        const current = getPrivateRealm(gid, p.privateId)
        return current ? enterRealm(current, gid, e.user_id) : null
      }))
      if (r?.ok) { e.reply([segment.at(e.user_id), `\n🗝️ ${r.msg}`]); return true }
      return false
    }
    /* 公开秘境: 受开关控制 */
    const ok = cfg.enable === 'T' || cfg.enable === true
    if (!ok) return false
    const st = getRealm(gid)
    if (!['barrier', 'explore'].includes(st.phase)) return false
    const r = await withRealmLock(gid, async () => await withFakeLock(gid, async () => enterRealm(getRealm(gid), gid, e.user_id)))
    if (!r?.ok) return false
    e.reply([segment.at(e.user_id), `\n🌌 ${r.msg}`]); return true
  }

  async atkBarrier (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id); const cfg = await getRealmCfg()
    if (!cfg.group.includes(gid)) return false
    const st = getRealm(gid)
    if (st.phase !== 'barrier' || !isInRegion(gid, e.user_id, st.region)) return false
    const r = await withRealmLock(gid, async () => await withFakeLock(gid, async () => {
      const current = getRealm(gid)
      if (current.phase !== 'barrier' || !isInRegion(gid, e.user_id, current.region)) return null
      const key = `xujing:realm-barrier:${gid}:${e.user_id}`
      try { const ttl = await redis.ttl(key); if (ttl > 0) return { cd: ttl }; await redis.set(key, 1, { EX: 2 }) } catch (err) {}
      if (current.barrier?.auto?.[String(e.user_id)]) return { already: true }
      const b = await attackBarrier(current, e.user_id, gid)
      saveRealm(current, gid)
      if (b.broke) { const broken = await breakBarrier(current, gid); return { broke: true, dmg: b.dmg, reward: broken.reward, hero: broken.hero } }
      return b
    }))
    if (!r) return false
    if (r.cd) { e.reply([segment.at(e.user_id), `\n🛡️ 你刚攻击过屏障，还需 ${r.cd} 秒~`]); return true }
    if (r.already) { e.reply([segment.at(e.user_id), '\n⚔️ 你已加入屏障持续攻击，每20秒自动攻击一次。']); return true }
    if (r.broke) {
      e.reply([segment.at(e.user_id), '\n💥 屏障破碎！已进入探索阶段，只有发送过 #进入秘境 的队伍会进入。'])
      await bcastBarrierBroke(getRealm(gid), r.hero)
    }
    else e.reply([segment.at(e.user_id), `\n⚔️ 你已加入屏障持续攻击！首击造成 ${r.dmg} 伤害，屏障剩余 ${Math.round(r.hp / r.maxHp * 100)}%。\n之后每20秒自动攻击一次，可 #停止攻击屏障 退出。`])
    return true
  }

  async stopBarrier (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id); const cfg = await getRealmCfg()
    if (!cfg.group.includes(gid)) return false
    const st = getRealm(gid)
    if (st.phase !== 'barrier' || !st.barrier?.auto?.[String(e.user_id)]) return false
    await withRealmLock(gid, async () => { const current = getRealm(gid); stopBarrierAuto(current, e.user_id) })
    e.reply([segment.at(e.user_id), '\n🛑 已停止自动攻击屏障。']); return true
  }

  async quit (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id); const cfg = await getRealmCfg()
    if (!cfg.group.includes(gid)) return false
    const st = realmOfUser(gid, e.user_id)
    if (!st || !['barrier', 'explore'].includes(st.phase)) return false
    const r = await withRealmLock(gid, async () => await withFakeLock(gid, async () => await leaveTeam(st.private ? getPrivateRealm(gid, st.privateId) : getRealm(gid), gid, e.user_id)))
    if (!r?.ok) return false
    await unlock(gid, e.user_id, 'realm').catch(() => {})
    const settlement = await formatRealmPush(gid, r.msgs.join('、'))
    e.reply([segment.at(e.user_id), `\n🏃 你已${r.barrier ? '退出破界候选' : '撤离秘境'}${settlement ? `，结算获得：${settlement}` : '。'}`]); return true
  }

  async useKey (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id); const cfg = await getRealmCfg()
    /* 钥匙可用条件 = 自动刷新开关开启(enable=T); 不是白名单 */
    if (!(cfg.enable === 'T' || cfg.enable === true)) { e.reply('遗蜕秘境当前未开启，钥匙暂不可用~'); return true }
    const uid = e.user_id
    const result = await withRealmLock(gid, async () => await withFakeLock(gid, async () => {
      /* 队长或单人使用；检查、扣钥、建档必须处于同一组锁内。 */
      const party = partyInfoOf(gid, uid)
      if (party && String(uid) !== String(party.leader)) return { ok: false, msg: `只有队长才能使用${itemIcon(SECRET_KEY)}【遗蜕古钥】开启专属秘境~` }
      if (!consumeItem(uid, SECRET_KEY, 1, null, gid)) return { ok: false, msg: `你没有${itemIcon(SECRET_KEY)}【遗蜕古钥】，可在世界Boss/洗劫藏宝阁/每日秘境/万魂窟中获得（彩级稀有）~` }
      const result = await openPrivateRealm(gid, cfg, uid, party ? `party:${party.id}` : `solo:${uid}`, party ? party.members : [uid])
      if (!result.ok) addItem(uid, SECRET_KEY, 1, null, gid)
      return result
    }))
    if (!result.ok) { e.reply(result.msg); return true }
    const info = result.info
    const names = await memberNamesOf(gid)
    sendToGroup(gid, replaceRealmPlayerIds(`🗝️ 有人使用${itemIcon(SECRET_KEY)}【遗蜕古钥】开启了一座专属秘境！\n🆔 秘境编号：${String(info.privateId).slice(-4)}\n📍 ${regionNameOf(info.region)} · ${info.diffName}（建议${info.realm}）\n📜 ${result.st.desc}（仅本队可入，探索 ${info.exploreMin} 分钟）`, names))
    e.reply([segment.at(uid), `\n🗝️ 专属秘境【${info.title}】已开启！队长已进入，其他队员请各自发送 #进入秘境。\n探索 ${info.exploreMin} 分钟；秘境中只有本队，不会遇到其他玩家队伍或凭空出现伪玩家。`])
    return true
  }

  async toggle (e) {
    const m = String(e.msg || '').match(/(开|关|开启|关闭)\s*$/)
    const on = m && (m[1] === '开' || m[1] === '开启')
    try {
      const all = YAML.parse(fs.readFileSync(cfgPath(), 'utf8')) || {}; if (!all.realm_cfg) all.realm_cfg = {}; all.realm_cfg.enable = on ? 'T' : 'F'; fs.writeFileSync(cfgPath(), YAML.stringify(all)); realmCfgRefresh(); e.reply(`✅ 遗蜕秘境已${on ? '开启' : '关闭'}（关闭不影响进行中的秘境）~`)
    } catch (err) { logger.error('[遗蜕秘境]开关写入失败:' + (err && err.stack)); e.reply('❌ 配置写入失败~') }
    return true
  }

  async forceSpawn (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id); const cfg = await getRealmCfg()
    if (!(cfg.enable === 'T' || cfg.enable === true)) { e.reply('遗蜕秘境开关当前为关闭状态，不能手动刷新~'); return true }
    if (!cfg.group.map(String).includes(gid)) { e.reply('此群不在秘境白名单中~'); return true }
    const info = await withRealmLock(gid, async () => { const st = getRealm(gid); if (st.phase !== 'idle') return null; const r = await spawnRealm(st, gid, cfg); saveRealm(st, gid); return r })
    if (!info) { e.reply('当前已有秘境进行中，不能覆盖~'); return true }
    await bcastSpawn(gid, info); return true
  }

  async pick (e) {
    if (!e.group_id) return false
    const gid = String(e.group_id); const uid = String(e.user_id)
    if (!(await isCurrent(gid, uid, 'realm'))) {
      /* 转让队长后: 新队长不是秘境锁持有者, 但其队伍在秘境有待处理节点时接管(把秘境锁从旧队长迁到新队长) */
      const cur = await currentInteract(gid, uid)
      if (cur) return false
      const st = realmOfUser(gid, uid)
      const t = st && teamOf(st, uid)
      const party = t && partyInfoOf(gid, uid)
      if (!st || !t || !(t.node || t.ambushNode) || !party || String(party.leader) !== String(uid) || String(t.leader) === String(uid)) return false
      await unlock(gid, String(t.leader), 'realm').catch(() => {})
      await forceLock(gid, uid, 'realm')
    }
    /* 状态锁复查: 洗劫/伏击/讨伐/万魂/天牢/战争等锁定状态下禁止用数字探索秘境 (skipRealm: 秘境自身数字决策豁免秘境锁) */
    if (await guardActionLocked(e, undefined, { skipRealm: true })) return true
    const out = await withRealmLock(gid, async () => await withFakeLock(gid, async () => {
      const st = realmOfUser(gid, uid)
      if (!st) return null
      const t = teamOf(st, uid)
      if (!t) return null
      /* 出口围剿表态: 菜单优先于探索节点(1参与围剿 / 2悄悄溜走) */
      if (t.ambushNode) {
        const n = Number(String(e.msg || '').replace(/[^\d]/g, ''))
        if (n !== 1 && n !== 2) return null
        t.ambush = n === 1 ? 'fight' : 'flee'
        t.ambushNode = null
        if (st.private) savePrivateRealm(st, gid)
        else saveRealm(st, gid)
        return { r: { valid: true, msgs: [t.ambush === 'fight' ? '你已决定参与围剿混战，守住出口伏击抢夺！' : '你已决定悄悄溜走，将寻机突围！'] }, leader: t.leader }
      }
      if (!t.node) return null
      /* 同步当前队长(#转让队长后把决策权交给新队长, 后续节点/结算都指向他) */
      const party = partyInfoOf(gid, uid)
      const leader = party ? String(party.leader) : String(t.leader)
      if (String(t.leader) !== leader) {
        t.leader = leader
        t.partyLeader = leader
        if (st.private) savePrivateRealm(st, gid)
        else saveRealm(st, gid)
      }
      if (String(t.leader) !== uid) return null
      const n = Number(String(e.msg || '').replace(/[^\d]/g, '')); const cfg = await getRealmCfg(); const node = t.node
      const r = node.type === 'disposal' ? await resolveDisposal(st, gid, t, n, cfg) : await resolveNode(st, gid, t, node, n, cfg)
      if (st.private) savePrivateRealm(st, gid)
      else saveRealm(st, gid)
      return { r, leader: t.leader }
    }))
    if (!out) { await unlock(gid, uid, 'realm').catch(() => {}); return false }
    if (!out.r.valid) {
      await forceLock(gid, uid, 'realm')
      const names = await memberNamesOf(gid)
      e.reply([segment.at(e.user_id), `\n${out.r.msgs.map(line => replaceRealmPlayerIds(line, names)).join('\n')}`])
      return true
    }
    await unlock(gid, uid, 'realm').catch(() => {})
    if (out.r.msgs.length) {
      const names = await memberNamesOf(gid)
      e.reply([segment.at(e.user_id), `\n${out.r.msgs.map(line => replaceRealmPlayerIds(line, names)).join('\n')}`])
    }
    if (out.r.disposalFor) { await forceLock(gid, out.r.disposalFor.leaderUid, 'realm'); notifyAt(gid, out.r.disposalFor.leaderUid, out.r.disposalFor.text) }
    return true
  }
}

/** 散修队成员名单(非散修队/队长时为 [uid]) */
function partyMembers (gid, uid) {
  try {
    const f = getFake(gid)
    for (const t of Object.values(f.rogueTeams || {})) if (String(t.leader) === String(uid)) return (t.members || []).map(String)
  } catch (err) { }
  return [String(uid)]
}

async function bcastSpawn (gid, info) {
  const text = `🌌 ${info.title} 现世！\n📍 ${regionNameOf(info.region)} · ${info.diffName}（建议${info.realm}）\n🛡️ 屏障强度 ${info.barrierHp.toLocaleString()}（${info.barrierName}）\n📜 ${info.desc}\n\n对应大区内回复 #攻击屏障；#进入秘境 参加探索。屏障破碎后探索 ${info.exploreMin} 分钟！`
  sendToGroup(gid, await formatRealmPush(gid, text))
}

/** 屏障破碎群提示 */
async function bcastBarrierBroke (st, hero) {
  const text = `💥 屏障破碎！【${st.title}】全面开放探索！\n📍 ${regionNameOf(st.region)} · 探索剩余 ${st.exploreMin} 分钟\n${hero ? `🏆 首功：${hero} 完成最后一击！\n` : ''}发送 #进入秘境 参加探索！`
  sendToGroup(String(st.gid), await formatRealmPush(String(st.gid), text))
}

/** 群内推送文本，渲染成图片（失败回退纯文本） */
async function sendRealmGroupText (gid, text) {
  if (!text || !text.trim()) return
  const safeText = await formatRealmPush(gid, text)
  const img = await textToImg(safeText)
  sendToGroup(gid, img || safeText)
}

/** 探索推进(公开与专属共用) */
async function processExplore (st, gid, cfg, now, extra) {
  if (now >= st.endAt) {
    const result = await settleAll(st, gid, cfg)
    const names = await memberNamesOf(gid)
    const text = result.msgs.map(line => replaceRealmPlayerIds(line, names)).join('\n')
    const img = await textToImg(text)
    sendToGroup(gid, img || text)
    return
  }
  /* 出口围剿(仅公开秘境): 探索最后5分钟触发, 不再推进探索节点 */
  if (!st.private) {
    if (!st.ambushAt && now >= st.endAt - AMBUSH_MINUTES * 60000) {
      const pending = beginAmbush(st, gid, now)
      sendToGroup(gid, `⚔️ ${st.title} 即将关闭，出口围剿开始！\n各队可参与围剿伏击抢夺，也可悄悄溜走提前带战果离场（溜走可能被抓）！`)
      for (const p of pending) { await forceLock(gid, p.team.leader, 'realm'); notifyAt(gid, p.team.leader, menuText(p.node)) }
      if (st.private) savePrivateRealm(st, gid)
      else saveRealm(st, gid)
      return
    }
    if (st.ambushAt) {
      const msgs = await processAmbushRound(st, gid, now)
      if (msgs.length) await sendRealmGroupText(gid, msgs.join('\n'))
      if (st.private) savePrivateRealm(st, gid)
      else saveRealm(st, gid)
      return
    }
  }
  for (const t of Object.values(st.teams)) if (t.node && now - (t.lastActionAt || 0) > NODE_TIMEOUT_MIN * 60000) {
    const targetId = t.node.data && t.node.data.target
    if (targetId && st.teams[targetId] && st.teams[targetId].engagedBy === t.id) delete st.teams[targetId].engagedBy
    /* 伪玩家队节点由 driveFakeTeams 即时处理, 不进超时代选 */
    if (t.kind !== 'player') { t.lastActionAt = now; continue }
    /* 玩家队超时未回复: 系统代选保守决策并@队长播报, 不丢指令、不挂起 */
    syncPlayerTeam(st, gid, t)
    const idx = autoPickForPlayer(t.node)
    const r = t.node.type === 'disposal' ? await resolveDisposal(st, gid, t, idx, cfg) : await resolveNode(st, gid, t, t.node, idx, cfg)
    if (r.msgs.length) notifyAt(gid, t.leader, `⏳ 你上一轮抉择超时未回复，系统已代为选择：\n${r.msgs.join('\n')}`)
  }
  advanceFakeArrivals(st, gid, now)
  const fakeResult = await driveFakeTeams(st, gid, cfg)
  if (fakeResult.msgs.length) await sendRealmGroupText(gid, fakeResult.msgs.join('\n'))
  for (const p of fakeResult.pushes) { await forceLock(gid, p.leaderUid, 'realm'); notifyAt(gid, p.leaderUid, p.text) }
  const pending = await advanceTeams(st, gid, cfg)
  for (const p of pending) { await forceLock(gid, p.team.leader, 'realm'); notifyAt(gid, p.team.leader, menuText(p.node)) }
  const ev = rollEvent(st, cfg)
  if (ev) { const applied = await applyEvent(st, gid, ev); sendToGroup(gid, `⚠️ ${ev.text}`); if (applied.msgs.length) await sendRealmGroupText(gid, applied.msgs.join('\n')); for (const p of applied.pushes) { await forceLock(gid, p.team.leader, 'realm'); notifyAt(gid, p.team.leader, menuText(p.node)) } }
  if (st.private) savePrivateRealm(st, gid)
  else saveRealm(st, gid)
}

async function realmTick () {
  const cfg = await getRealmCfg(); const enabled = cfg.enable === 'T' || cfg.enable === true; const configuredGroups = (cfg.group || []).map(String); const now = Date.now()
  /* 公开秘境: 白名单群 + 已有存档群 */
  const publicGroups = [...new Set([...configuredGroups, ...activeRealmGroups()])]
  for (const gid of publicGroups) {
    try {
      await withRealmLock(gid, async () => await withFakeLock(gid, async () => {
        const st = getRealm(gid)
        reconcileFakeBusy(gid, st)
        if (st.phase === 'idle') {
          if (!enabled || !configuredGroups.includes(gid) || (isNight() && cfg.night_stop !== 'F') || now < st.nextSpawn) return
          const info = await spawnRealm(st, gid, cfg); saveRealm(st, gid); await bcastSpawn(gid, info); return
        }
        if (st.phase === 'barrier') {
          let broke = false
          for (const t of Object.values(st.teams)) if (t.kind === 'fake' && fakeAttackBarrier(st, t, gid, now)) broke = true
          if (!broke && st.barrier?.auto) {
            for (const uid of Object.keys(st.barrier.auto)) {
              if (!isInRegion(gid, uid, st.region)) continue
              const rec = st.barrier.auto[uid]
              if (now - (rec.lastHit || 0) < 20000) continue
              const hit = await attackBarrier(st, uid, gid, true)
              if (hit.broke) { broke = true; break }
            }
          }
          if (broke) { const broken = await breakBarrier(st, gid); await bcastBarrierBroke(st, broken.hero) }
          else saveRealm(st, gid)
          return
        }
        if (st.phase === 'explore') await processExplore(st, gid, cfg, now)
      }))
    } catch (err) { logger.error('[遗蜕秘境]公开单群推进异常:' + (err && err.stack)) }
  }
  /* 专属秘境: 无刷新/无破界, 只推进探索与结算 */
  for (const ref of activePrivateRealms()) {
    try {
      await withRealmLock(ref.gid, async () => await withFakeLock(ref.gid, async () => {
        const st = getPrivateRealm(ref.gid, ref.id)
        if (!st || st.phase !== 'explore') return
        reconcileFakeBusy(ref.gid, st)
        await processExplore(st, ref.gid, cfg, now)
      }))
    } catch (err) { logger.error(`[遗蜕秘境]专属秘境${ref.gid}/${ref.id}推进异常:` + (err && err.stack)) }
  }
}
