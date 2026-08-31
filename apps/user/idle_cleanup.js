/* ============================================================
 * 闲置灵石清理 · 自动挂机检测扩展 - 指令入口与每日定时
 * - 每日定时检查一次(一天一次): 超过 idle_cfg.days(默认5天)未使用过虚境指令的
 *   玩家, 自动清空其灵石余额(money)。检测逻辑在 components/idle_cleanup.js。
 * - 主人可手动触发: #闲置灵石清理 / #清理闲置灵石
 * - 时间戳记录在 model/api/api.js 统一代理(每次有效虚境指令后写入 redis)
 * ============================================================ */
import schedule from 'node-schedule'
import { plugin } from '../../model/api/api.js'
import { runIdleCleanup } from '../../components/idle_cleanup.js'

export class idleclean extends plugin {
  constructor () {
    super({
      name: '闲置灵石清理',
      dsc: '超期未使用虚境指令的玩家自动清空灵石',
      event: 'message',
      priority: 999,
      rule: [
        { reg: '^[#＃]?(闲置灵石清理|清理闲置灵石)$', fnc: 'idleCleanupNow', auth: 'master' }
      ]
    })
  }

  /* ---- 主人手动触发一次清理 ---- */
  async idleCleanupNow (e) {
    try {
      const r = await runIdleCleanup()
      if (!r.enabled) {
        e.reply('闲置灵石清理未开启（idle_cfg.enable 配置为 F）~')
        return true
      }
      e.reply(`✅ 闲置灵石清理完成：检查 ${r.groups} 个群，清空 ${r.cleared} 名超期玩家灵石，${r.graced} 名新玩家进入宽限期~`)
    } catch (err) {
      logger.error(`[闲置灵石清理]手动执行异常: ${(err && err.stack) || err}`)
      e.reply('闲置灵石清理执行失败，请稍后再试~')
    }
    return true
  }
}

/* 每日定时检查(一天一次): 凌晨4:23执行, 与存档清理(4:17)错开 */
if (!global.__xujingIdleCleanupTick__) {
  global.__xujingIdleCleanupTick__ = true
  schedule.scheduleJob('23 4 * * *', () => {
    runIdleCleanup().catch(err => logger.error(`[闲置灵石清理]定时执行异常: ${(err && err.stack) || err}`))
  })
  console.log('[闲置灵石清理] 每日定时任务已注册(每天04:23检查, 超期未使用虚境指令自动清空灵石)')
}
