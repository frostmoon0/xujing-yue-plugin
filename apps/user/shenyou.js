import { plugin } from '../../model/api/api.js'
import { captureShenyou, shenyouStatus, tickShenyou } from '../../components/shenyou_data.js'
import { getBag, saveBag, hasDingxianyou, isDingxianyouEquipped, itemIcon } from '../../components/equip_data.js'
import { disablePuppets } from '../../components/puppet_data.js'

export class shenyou extends plugin {
  constructor () {
    super({
      name: '神游蛊',
      dsc: '南疆神游蛊捕获与定仙游材料',
      event: 'message',
      priority: 58,
      rule: [
        { reg: '^[#＃]?神游蛊$', fnc: 'capture' },
        { reg: '^[#＃]?抓捕神游蛊$', fnc: 'capture' },
        { reg: '^[#＃]?(神游蛊状态|南疆蛊虫)$', fnc: 'shenyouStatus' },
        { reg: '^[#＃]?(定仙游|定仙游信息)$', fnc: 'dingxianyou' },
        { reg: '^[#＃]?装备定仙游$', fnc: 'equipDingxianyou' },
        { reg: '^[#＃]?卸下定仙游$', fnc: 'unequipDingxianyou' }
      ]
    })
  }

  async capture (e) {
    if (!e.group_id) {
      e.reply('神游蛊只能在群内捕获~')
      return true
    }
    tickShenyou(e.group_id, false)
    const ret = captureShenyou(e.user_id, e.group_id)
    e.reply(ret.msg)
    return true
  }

  async dingxianyou (e) {
    const bag = getBag(e.user_id, e.group_id)
    if (!hasDingxianyou(bag)) {
      e.reply(`你还没有定仙游。合成材料：${itemIcon('神游蛊')}神游蛊×1、${itemIcon('玄阴玉')}玄阴玉×5、${itemIcon('镇魂晶')}镇魂晶×5、${itemIcon('血煞髓')}血煞髓×5；使用 #合成定仙游。`)
      return true
    }
    const equipped = isDingxianyouEquipped(bag)
    e.reply(`━━━ 🦋 定仙游 ━━━\n拥有状态：已拥有\n装备状态：${equipped ? '已装备' : '未装备'}\n装备效果：生命+10%（仅装备后生效）\n被动效果：万魂窟遇到阴魂时撤退成功率100%（拥有即生效）\n被动效果：可使用 #去<大区>传送 免费跨区瞬移（拥有即生效）\n${equipped ? '#卸下定仙游 可关闭生命加成' : '#装备定仙游 可开启生命+10%'}`)
    return true
  }

  async equipDingxianyou (e) {
    try {
      const bag = getBag(e.user_id, e.group_id)
      if (!hasDingxianyou(bag)) {
        e.reply('你还没有定仙游，请先使用 #合成定仙游。')
        return true
      }
      if (isDingxianyouEquipped(bag)) {
        e.reply('定仙游已经装备，生命+10%正在生效~')
        return true
      }
      if (bag.artifacts?.puppets?.some(p => p && p.deployed)) {
        e.reply('傀儡正在祭出中，请先使用 #收回傀儡 再切换法宝。')
        return true
      }
      bag.artifacts.dingxianyou.equipped = true
      disablePuppets(bag)
      if (bag.artifacts.wanhun?.equipped) {
        bag.artifacts.wanhun.equipped = false
        bag.artifacts.wanhun.deployed = false
        bag.artifacts.wanhun.aidUntil = 0
      }
      try { saveBag(e.user_id, bag, e.group_id) } catch (err) {
        try { logger.error('[定仙游] 保存异常: ' + (err && err.stack)) } catch (_e) {}
      }
      try {
        e.reply('🦋 定仙游装备成功！生命+10%已生效；万魂窟撤退100%和免费跨区仍属于拥有即生效的被动。')
      } catch (err) {
        try { logger.error('[定仙游] 回复异常: ' + (err && err.stack)) } catch (_e) {}
      }
      return true
    } catch (err) {
      try { logger.error('[定仙游] equipDingxianyou异常: ' + (err && err.stack)) } catch (_e) {}
      try { e.reply('定仙游装备失败，请稍后再试或联系管理员~') } catch (_e) {}
      return true
    }
  }

  async unequipDingxianyou (e) {
    const bag = getBag(e.user_id, e.group_id)
    if (!hasDingxianyou(bag)) {
      e.reply('你还没有定仙游~')
      return true
    }
    if (!isDingxianyouEquipped(bag)) {
      e.reply('定仙游当前未装备，生命加成没有开启；两个被动效果仍然生效。')
      return true
    }
    bag.artifacts.dingxianyou.equipped = false
    saveBag(e.user_id, bag, e.group_id)
    e.reply('已卸下定仙游，生命+10%已关闭；万魂窟撤退100%和免费跨区被动仍然生效。')
    return true
  }

  async shenyouStatus (e) {
    if (!e.group_id) {
      e.reply('请在群内查看神游蛊状态~')
      return true
    }
    tickShenyou(e.group_id, false)
    e.reply(shenyouStatus(e.group_id))
    return true
  }
}

