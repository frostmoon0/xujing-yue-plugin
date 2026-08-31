/* ============================================================
 * 伏击玩法 · 指令层
 * #伏击 开始(10分钟准备) → 0~30分钟随机触发 → 模糊提示(不点破身份)
 * 抉择: #伏击打(偷袭·先手) / #伏击试探(现身) / #伏击放
 * 打赢后: #伏击处置 全放|搜刮再放|全杀|搜刮再杀|收服|勒索
 * 仆从: #我的仆从 查看(最多2名, 伏击救场+献礼)
 * #伏击状态 / #取消伏击
 * ============================================================ */
import { plugin } from '../../model/api/api.js'
import schedule from 'node-schedule'
import { startAmbush, cancelAmbush, ambushStatus, ambushAct, ambushDispose, ambushWonOf, ambushTick, servantStatus, servantDismiss } from '../../components/ambush.js'
import { forceLock, isCurrent, unlock } from '../../components/interact.js'

export class ambush extends plugin {
  constructor () {
    super({
      name: '伏击',
      dsc: '伏击劫道·抢伪玩家',
      event: 'message',
      priority: 250,
      rule: [
        { reg: '^[#＃]?伏击$', fnc: 'ambushCmd' },
        { reg: '^[#＃]?(伏击打|伏击偷袭|伏击动手|伏击上)$', fnc: 'ambushHitCmd' },
        { reg: '^[#＃]?(伏击放|伏击放走)$', fnc: 'ambushLetCmd' },
        { reg: '^[#＃]?(伏击试探|现身拦路|现身)$', fnc: 'ambushTalkCmd' },
        { reg: '^[#＃]?(伏击处置|处置猎物)\\s*(搜刮再杀|搜刮再放|全杀再搜|杀了再搜|先杀再搜|勒索放走|收为仆从|全杀|全放|收服|勒索|[1-7０-７])$', fnc: 'ambushDisposeCmd' },
        { reg: '^[#＃]?(伏击状态|我的伏击)$', fnc: 'ambushStatusCmd' },
        { reg: '^[#＃]?(取消伏击|伏击取消)$', fnc: 'ambushCancelCmd' },
        { reg: '^[#＃]?(我的仆从|收服的仆从)$', fnc: 'servantStatusCmd' },
        { reg: '^[#＃]?(驱散仆从|释放仆从|逐出仆从)\\s*(\\S*)$', fnc: 'servantDismissCmd' },
        /* 打赢后可直接回复裸数字 1~7 处置猎物; 无待处置猎物/有其他数字交互进行中则放行, 不与其他序号指令(逛街/丹阁/跨区/赠送)冲突 */
        { reg: '^[#＃]?[0-9０-９]+$', fnc: 'ambushDisposePickCmd' }
      ]
    })
    /* 每分钟推进所有伏击状态机(准备→触发→抉择→处置) */
    if (!global.__xujingAmbushTick__) {
      global.__xujingAmbushTick__ = true
      schedule.scheduleJob('* * * * *', () => {
        try { ambushTick() } catch (err) { logger.error('[伏击]推进异常:' + (err && err.stack)) }
      })
    }
  }

  /** #伏击 开始 */
  async ambushCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const r = await startAmbush(String(e.group_id), String(e.user_id))
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #伏击打(偷袭·先手) */
  async ambushHitCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const r = await ambushAct(String(e.group_id), String(e.user_id), 'hit')
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #伏击放 */
  async ambushLetCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const r = await ambushAct(String(e.group_id), String(e.user_id), 'let')
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #伏击试探(现身) */
  async ambushTalkCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const r = await ambushAct(String(e.group_id), String(e.user_id), 'talk')
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #伏击处置 XX */
  async ambushDisposeCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const m = String(e.msg || '').match(/(伏击处置|处置猎物)\s*(搜刮再杀|搜刮再放|全杀再搜|杀了再搜|先杀再搜|勒索放走|收为仆从|全杀|全放|收服|勒索|[1-7０-７])/)
      const rawAction = (m && m[2]) || ''
      const code = rawAction.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
      const action = {
        1: '全放', 2: '搜刮再放', 3: '全杀', 4: '杀了再搜',
        5: '搜刮再杀', 6: '收服', 7: '勒索'
      }[code] || rawAction
      const r = await ambushDispose(String(e.group_id), String(e.user_id), action)
      /* 文字处置同样摘锁(成功或目标消失), 避免打赢压栈后残留 */
      const still = await ambushWonOf(String(e.group_id), String(e.user_id))
      if (!still) await unlock(String(e.group_id), String(e.user_id), 'ambush')
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** 裸数字回复: 打赢后直接回复 1~7 处置猎物; 无待处置猎物或伏击处置未在栈顶则放行, 避免与逛街/丹阁/跨区/赠送等序号指令冲突 */
  async ambushDisposePickCmd (e) {
    try {
      if (!e.group_id) { return false }
      const won = await ambushWonOf(String(e.group_id), String(e.user_id))
      if (!won) {
        /* 伏击状态丢失但锁残留(打赢过程异常留下的孤儿锁): 摘除避免堵死后续数字, 无需 #取消伏击 解锁 */
        if (await isCurrent(String(e.group_id), String(e.user_id), 'ambush')) {
          await unlock(String(e.group_id), String(e.user_id), 'ambush')
        }
        return false
      }
      /* 处置数字: 伏击处置需在栈顶才处理; 若不在栈顶则先压栈激活(自愈, 兜底打赢时压栈失败), 不误抢其它交互 */
      if (!(await isCurrent(String(e.group_id), String(e.user_id), 'ambush'))) {
        await forceLock(String(e.group_id), String(e.user_id), 'ambush')
      }
      const numStr = String(e.msg || '').replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
      const num = parseInt(numStr.replace(/[^\d]/g, ''), 10)
      const action = {
        1: '全放', 2: '搜刮再放', 3: '全杀', 4: '杀了再搜',
        5: '搜刮再杀', 6: '收服', 7: '勒索'
      }[num]
      if (!action) {
        e.reply('❌ 没有该处置选项，请回复 1~7（1全放 2搜刮再放 3全杀 4杀了再搜 5搜刮再杀 6收服 7勒索）~')
        return true
      }
      const r = await ambushDispose(String(e.group_id), String(e.user_id), action)
      /* 处置结束(成功或目标已消失)后摘锁, 让下层交互浮上; 处置失败但猎物仍在则保留锁继续处置 */
      const still = await ambushWonOf(String(e.group_id), String(e.user_id))
      if (!still) await unlock(String(e.group_id), String(e.user_id), 'ambush')
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #伏击状态 */
  async ambushStatusCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const gid = String(e.group_id)
      const uid = String(e.user_id)
      /* 重新激活: 打赢未处置时压栈(处置数字可路由, 打断其它交互); 无待处置时摘除残留锁 */
      const won = await ambushWonOf(gid, uid)
      if (won) {
        if (!(await isCurrent(gid, uid, 'ambush'))) await forceLock(gid, uid, 'ambush')
      } else if (await isCurrent(gid, uid, 'ambush')) {
        await unlock(gid, uid, 'ambush')
      }
      const r = await ambushStatus(gid, uid)
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #取消伏击 */
  async ambushCancelCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const r = await cancelAmbush(String(e.group_id), String(e.user_id))
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #我的仆从 */
  async servantStatusCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const r = await servantStatus(String(e.group_id), String(e.user_id))
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('伏击出错了，请稍后再试~')
      return true
    }
  }

  /** #驱散仆从 [名字]: 释放仆从离开, 腾出位置 */
  async servantDismissCmd (e) {
    try {
      if (!e.group_id) { e.reply('需在群内使用~'); return true }
      const m = String(e.msg || '').match(/(驱散仆从|释放仆从|逐出仆从)\s*(\S*)/)
      const name = (m && m[2]) ? m[2].trim() : ''
      if (!name) { e.reply('用法：#驱散仆从 [名字]（#我的仆从 查看名字）~'); return true }
      const r = await servantDismiss(String(e.group_id), String(e.user_id), name)
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[伏击]异常:' + (err && err.stack))
      e.reply('驱散仆从出错了，请稍后再试~')
      return true
    }
  }
}
