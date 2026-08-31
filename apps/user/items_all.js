/* ============================================================
 * 虚境全部物品 · 主人专用
 * - #虚境全部物品: 汇总本群所有玩家 + 存活伪玩家拥有的全部物品及数量,
 *   不记归属, 只写物品与总数, 渲染成图片(长文本失败回退纯文字)
 * - 聚合逻辑在 components/items_all.js, 本文件只做指令入口与展示
 * ============================================================ */
import { plugin } from '../../model/api/api.js'
import { textToImg } from '../../components/common-lib/reply-img.js'
import { aggregateGroupItems, sortTotals, fmtItemRow } from '../../components/items_all.js'

export class items_all extends plugin {
  constructor () {
    super({
      name: '虚境全部物品',
      dsc: '汇总本群玩家与伪玩家拥有的全部物品及数量(主人专用)',
      event: 'message',
      priority: 999,
      rule: [
        { reg: '^[#＃]?虚境全部物品$', fnc: 'allItems', auth: 'master' }
      ]
    })
  }

  /* ---- #虚境全部物品: 全群物品汇总 ---- */
  async allItems (e) {
    try {
      const gid = String(e.group_id || '')
      if (!gid) {
        e.reply('请在群内使用 #虚境全部物品 ~')
        return true
      }
      const { totals, players, fakes, sects, cities } = aggregateGroupItems(gid)
      const entries = sortTotals(totals)
      if (!entries.length) {
        e.reply(`本群暂无物品数据（玩家 ${players} 名 · 伪玩家 ${fakes} 名 · 宗门宝库 ${sects} 座 · 王朝城库存 ${cities} 城）~`)
        return true
      }
      const totalCount = entries.reduce((sum, x) => sum + x.count, 0)
      const extra = []
      if (sects > 0) extra.push(`宗门宝库 ${sects} 座`)
      if (cities > 0) extra.push(`王朝城库存 ${cities} 城`)
      const lines = [
        '📦 虚境物品总览',
        `本群玩家 ${players} 名 · 伪玩家 ${fakes} 名${extra.length ? ' · ' + extra.join(' · ') : ''}`,
        `物品种类 ${entries.length} 种 · 物品总量 ${totalCount.toLocaleString()} 件`,
        '',
        ...entries.map(x => fmtItemRow(x.name, x.count))
      ]
      const img = await textToImg(lines.join('\n'))
      if (img) e.reply(img)
      else e.reply(lines.join('\n'))
      return true
    } catch (err) {
      logger.error(`[虚境全部物品]异常: ${(err && err.stack) || err}`)
      e.reply('虚境全部物品生成失败，请稍后再试~')
      return true
    }
  }
}
