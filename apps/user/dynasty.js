/* ============================================================
 * 简月王朝(凡人王朝) - 指令与流程
 * #王朝小区 / #王朝: 王朝城池与产出面板
 * #虚境地图: 整个虚境全图(五大区 + 简月王朝)
 * #进入王朝 / #去简月王朝: 消耗【简月舆图】永久解锁进入
 * #离开王朝: 返回中州
 * #学习血炼阵 / #学会血炼阵: 消耗【血炼阵图】学会屠城阵法
 * #屠城 [城名] / #布置血炼大阵 [城名]: 布置读阵(30分钟), 启动中每分钟消耗1万灵石, 无城名弹数字选城
 * #阻止屠城 [城名]: 阻止他人读阵, 所属宗门该城好感+10
 * #取消屠城 [城名]: 放弃自己的读阵, 不返还布阵材料
 * #王朝好感 [城名]: 城池好感度明细
 * 每分钟推进所有活跃群(产出/人口/废墟恢复/读阵结算)
 * ============================================================ */
import { plugin } from '../../model/api/api.js'
import schedule from 'node-schedule'
import { textToImg } from '../../components/common-lib/reply-img.js'
import { getWorld, getLoc, REGIONS, REGION_KEYS } from '../../components/world_data.js'
import {
  DYN_KEY, SOUTH_KEY, CITIES, CITY_NAMES,
  getDynasty, activeDynastyGroups, tickDynasty,
  enterDynasty as doEnter, leaveDynasty as doLeave, learnFormation as doLearn,
  cityPanel as panel, favorPanel as favorView,
  startSlaughter as siegeStart, interruptSlaughter as siegeStop, cancelSlaughter as siegeCancel
} from '../../components/dynasty_data.js'
import { forceLock, isCurrent, unlock } from '../../components/interact.js'
import { guardActionLocked } from '../../components/action_lock.js'

const dynastyTickInFlight = new Set()

function reply (e, text) { e.reply(text); return true }

export class dynasty extends plugin {
  constructor () {
    super({
      name: '简月王朝',
      dsc: '凡人王朝·仙蕊产出/屠城/好感',
      event: 'message',
      priority: 60,
      rule: [
        { reg: '^[#＃]?(王朝小区|王朝)$', fnc: 'dynastyPanel' },
        { reg: '^[#＃]?虚境地图$', fnc: 'realmMap' },
        { reg: '^[#＃]?(进入王朝|去简月王朝)$', fnc: 'enterDynasty' },
        { reg: '^[#＃]?离开王朝$', fnc: 'leaveDynasty' },
        { reg: '^[#＃]?(学习血炼阵|学会血炼阵)$', fnc: 'learnFormation' },
        { reg: '^[#＃]?(屠城|布置血炼大阵)\\s*(\\S*)$', fnc: 'startSlaughter' },
        { reg: '^[#＃]?阻止屠城\\s*(\\S*)$', fnc: 'interruptSlaughter' },
        { reg: '^[#＃]?取消屠城\\s*(\\S*)$', fnc: 'cancelSlaughter' },
        { reg: '^[#＃]?王朝好感\\s*(\\S*)$', fnc: 'favorPanel' },
        { reg: '^[#＃]?[0-9]+$', fnc: 'pick' }
      ]
    })
    /* 每分钟推进所有活跃群王朝状态(产出/人口/废墟/读阵)
       防重复注册: 插件重复加载时只保留一个定时器 */
    if (!global.__xujingDynastyTick__) {
      global.__xujingDynastyTick__ = true
      schedule.scheduleJob('* * * * *', () => { dynastyTick().catch(err => logger.error('[简月王朝]推进异常:' + (err && err.stack))) })
    }
  }

  /* ---- #王朝小区 ---- */
  async dynastyPanel (e) {
    if (!e.group_id) return reply(e, '需在群内查看~')
    const r = panel(e.user_id, e.group_id)
    return this.maybeImg(e, r.text)
  }

  /* ---- #虚境地图: 整个虚境全图 ---- */
  async realmMap (e) {
    if (!e.group_id) return reply(e, '需在群内查看~')
    const gid = String(e.group_id)
    const w = getWorld(gid)
    const loc = getLoc(w, e.user_id)
    const lines = ['🗺️ 虚境全图', '']
    for (const k of REGION_KEYS) {
      if (REGIONS[k] && REGIONS[k].special) continue
      const mark = loc === k ? '　（📍你在此）' : ''
      lines.push(`━━━ ${REGIONS[k].name} ━━━${mark}`)
      lines.push(REGIONS[k].areas.join(' · '))
    }
    lines.push('', '↓ 自南疆再往南（须先到南疆才能进入）')
    lines.push(`━━━ 简月王朝（凡人王朝·不可占领）━━━${loc === DYN_KEY ? '　（📍你在此）' : ''}`)
    lines.push(CITY_NAMES.join(' · '))
    lines.push('', '· 五大区由宗门占领、动态税率；简月王朝只产云裳仙蕊（#王朝小区 查看）')
    return this.maybeImg(e, lines.join('\n'))
  }

  /* ---- #进入王朝 ---- */
  async enterDynasty (e) {
    if (!e.group_id) return reply(e, '需在群内使用~')
    /* 王朝在南疆以南: 非南疆且非已在王朝则先拦截, 避免无谓抢占旧交互 */
    const cur = getLoc(getWorld(e.group_id), e.user_id)
    if (cur !== DYN_KEY && cur !== SOUTH_KEY) {
      return reply(e, '【简月王朝】在南疆以南，须先 #去南疆 再越过界碑进入~')
    }
    const r = doEnter(e.user_id, e.group_id)
    if (!r.ok) return reply(e, r.msg)
    await redis.del(`xujing:world-go:${e.group_id}:${e.user_id}`)
    await forceLock(e.group_id, e.user_id, 'go')
    return reply(e, r.msg)
  }

  /* ---- #离开王朝 ---- */
  async leaveDynasty (e) {
    if (!e.group_id) return reply(e, '需在群内使用~')
    const r = doLeave(e.user_id, e.group_id)
    return reply(e, r.msg)
  }

  /* ---- #学习血炼阵 ---- */
  async learnFormation (e) {
    if (!e.group_id) return reply(e, '需在群内使用~')
    const r = doLearn(e.user_id, e.group_id)
    return reply(e, r.msg)
  }

  /* ---- #屠城 [城名] / #布置血炼大阵 [城名] ---- */
  async startSlaughter (e) {
    if (!e.group_id) return reply(e, '需在群内使用~')
    const m = String(e.msg || '').match(/(屠城|布置血炼大阵)\s*(\S*)/)
    const name = m ? m[2] : ''
    if (name) {
      /* 直接指定城名时清掉此前弹出的数字选城状态，避免后续裸数字误走旧路由 */
      const pickKey = `xujing:dynasty-siege:${e.group_id}:${e.user_id}`
      await redis.del(pickKey)
      await unlock(e.group_id, e.user_id, 'dynasty-siege')
      const r = await siegeStart(e.user_id, e.group_id, name)
      return reply(e, r.msg)
    }
    /* 无城名: 弹编号列表 → 数字选城(斥驳路由: 校验本交互才处理) */
    const gid = String(e.group_id)
    const uid = e.user_id
    const d = getDynasty(gid)
    const now = Date.now()
    const lines = ['🏯 选择要屠的城池：']
    CITIES.forEach((c, i) => {
      const city = d.cities[c.name] || {}
      let st = '正常'
      if (city.read) st = '读阵中'
      else if (city.recoverAt > now) st = '废墟中'
      lines.push(`${i + 1}. ${c.name}（${c.capital ? '皇城·' : ''}${st}）`)
    })
    lines.push('', `请回复数字（或直接 #屠城 城名）`)
    await forceLock(gid, uid, 'dynasty-siege')
    await redis.set(`xujing:dynasty-siege:${gid}:${uid}`, JSON.stringify({ at: Date.now() }), { EX: 60 })
    return reply(e, lines.join('\n'))
  }

  /* ---- #阻止屠城 [城名] ---- */
  async interruptSlaughter (e) {
    if (!e.group_id) return reply(e, '需在群内使用~')
    const m = String(e.msg || '').match(/阻止屠城\s*(\S*)/)
    const r = await siegeStop(e.user_id, e.group_id, m ? m[1] : '')
    return reply(e, r.msg)
  }

  /* ---- #取消屠城 [城名] ---- */
  async cancelSlaughter (e) {
    if (!e.group_id) return reply(e, '需在群内使用~')
    const m = String(e.msg || '').match(/取消屠城\s*(\S*)/)
    const r = await siegeCancel(e.user_id, e.group_id, m ? m[1] : '')
    return reply(e, r.msg)
  }

  /* ---- #王朝好感 [城名] ---- */
  async favorPanel (e) {
    if (!e.group_id) return reply(e, '需在群内使用~')
    const m = String(e.msg || '').match(/王朝好感\s*(\S*)/)
    const r = await favorView(e.user_id, e.group_id, m ? m[1] : '')
    if (!r.ok) return reply(e, r.msg)
    return reply(e, r.text)
  }

  /* ---- 数字选城(斥驳: 非本交互则放行给别的数字处理器) ---- */
  async pick (e) {
    const gid = String(e.group_id || '')
    const uid = e.user_id
    if (!gid) return false
    const key = `xujing:dynasty-siege:${gid}:${uid}`
    const raw = await redis.get(key)
    if (!raw) {
      /* 待选状态过期/丢失: 摘除残留的攻城锁, 避免堵住后续交互 */
      await unlock(gid, uid, 'dynasty-siege')
      return false
    }
    /* 校验: 仅当攻城选择在栈顶才处理(被其它交互埋住则让位, 保留待选状态等回到栈顶再恢复) */
    if (!(await isCurrent(gid, uid, 'dynasty-siege'))) {
      return false
    }
    /* 状态锁复查: 洗劫/伏击/讨伐/万魂/天牢/战争等锁定状态下禁止用数字屠城/布阵 */
    if (await guardActionLocked(e)) return true
    const n = Number(String(e.msg || '').replace(/[^\d]/g, ''))
    if (n < 1 || n > CITIES.length) return reply(e, `请输入 1~${CITIES.length} 之间的数字~`)
    await redis.del(key)
    await unlock(gid, uid, 'dynasty-siege')
    const r = await siegeStart(uid, gid, CITIES[n - 1].name)
    return reply(e, r.msg)
  }

  /** 长文本渲染图片, 失败回退纯文字 */
  async maybeImg (e, text) {
    try {
      const img = await textToImg(text)
      if (img) { e.reply(img); return true }
    } catch (err) { }
    return reply(e, text)
  }
}

/* ---------- 每分钟推进所有活跃群(同一群串行防重入) ---------- */
async function dynastyTick () {
  for (const gid of activeDynastyGroups()) {
    if (dynastyTickInFlight.has(gid)) continue
    dynastyTickInFlight.add(gid)
    try {
      await tickDynasty(gid)
    } catch (err) {
      logger.error('[简月王朝]群推进异常:' + (err && err.stack))
    } finally {
      dynastyTickInFlight.delete(gid)
    }
  }
}
