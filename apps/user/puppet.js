import { plugin } from '../../model/api/api.js'
import {
  PUPPET_CHAPTERS, PUPPET_PASSIVES, PUPPET_PASSIVE_KEYS, PUPPET_PASSIVE_CORE,
  puppetPanel as getPuppetPanel, puppetCorePanel, puppetCoreCount, puppetTechniquePanel, availablePassiveLines,
  craftPuppet, upgradePuppet, renamePuppet, equipPuppet, unequipPuppet,
  deployPuppet, recallPuppet, dismantlePuppet, dismantlePuppetTechnique,
  getPuppets, resolvePuppet
} from '../../components/puppet_data.js'
import { getBag, getLearnedGongfa, itemIcon } from '../../components/equip_data.js'
import { forceLock, isCurrent, unlock } from '../../components/interact.js'
import { guardActionLocked } from '../../components/action_lock.js'
import { textToImg } from '../../components/common-lib/reply-img.js'

const pending = new Map()
const PENDING_TTL = 5 * 60 * 1000
function keyOf (e) { return `${e.group_id}:${e.user_id}` }
function reply (e, text) { e.reply(text); return true }
function passiveName (key) { return PUPPET_PASSIVES[key]?.name || key }

export class puppet extends plugin {
  constructor () {
    super({
      name: '傀儡法宝',
      dsc: '傀儡术与傀儡法宝',
      event: 'message',
      priority: 44,
      rule: [
        { reg: '^[#＃]?(傀儡术|傀儡列表|傀儡信息)$', fnc: 'puppetPanel' },
        { reg: '^[#＃]?傀儡晶核$', fnc: 'corePanel' },
        { reg: '^[#＃]?打造傀儡(?:\\s*\\S+)?$', fnc: 'craft' },
        { reg: '^[#＃]?傀儡命名\\s+\\S+\\s+\\S+$', fnc: 'rename' },
        { reg: '^[#＃]?装备傀儡\\s*\\S+$', fnc: 'equip' },
        { reg: '^[#＃]?卸下傀儡$', fnc: 'unequip' },
        { reg: '^[#＃]?升级傀儡(?:\\s*\\S+)?$', fnc: 'upgrade' },
        { reg: '^[#＃]?分解傀儡\\s+\\S+$', fnc: 'dismantle' },
        { reg: '^[#＃]?祭出傀儡$', fnc: 'deploy' },
        { reg: '^[#＃]?收回傀儡$', fnc: 'recall' },
        { reg: '^[#＃]?分解傀儡术\\s+\\S+(?:\\s+\\d+)?$', fnc: 'dismantleTechnique' },
        { reg: '^[#＃]?[0-9]+$', fnc: 'pick' }
      ]
    })
  }

  async puppetPanel (e) {
    const tech = await puppetTechniquePanel(e.user_id)
    const p = getPuppetPanel(e.user_id, e.group_id)
    const text = `${tech}\n\n${p.text}\n\n指令：#打造傀儡 · #装备傀儡 序号/名字 · #升级傀儡 [序号/名字] · #祭出傀儡\n#傀儡命名 序号 名字 · #分解傀儡 序号 · #收回傀儡 · #卸下傀儡\n重复功法：#分解傀儡术 傀儡术下篇 数量`
    try {
      const img = await textToImg(text)
      if (img) { e.reply(img); return true }
    } catch (err) { }
    return reply(e, text)
  }

  async corePanel (e) {
    const p = puppetCorePanel(e.user_id, e.group_id)
    try {
      const img = await textToImg(p.text)
      if (img) { e.reply(img); return true }
    } catch (err) { }
    return reply(e, p.text)
  }

  async craft (e) {
    const raw = String(e.msg || '').replace(/^[#＃]?打造傀儡\s*/, '').trim()
    const bag = getBag(e.user_id, e.group_id)
    const hasCore = puppetCoreCount(bag) > 0
    if (!raw && hasCore) {
      await forceLock(e.group_id, e.user_id, 'puppet-craft')
      pending.set(keyOf(e), { type: 'craft', at: Date.now() })
      return reply(e, `你拥有${itemIcon(PUPPET_PASSIVE_CORE)}${PUPPET_PASSIVE_CORE}，请选择本次傀儡的固有被动：\n0. 随机被动（不消耗晶核）\n${availablePassiveLines().join('\n')}\n回复数字0～${PUPPET_PASSIVE_KEYS.length}。`)
    }
    if (/^\d+$/.test(raw)) {
      const n = Number(raw)
      if (n < 0 || n > PUPPET_PASSIVE_KEYS.length) return reply(e, `请选择0～${PUPPET_PASSIVE_KEYS.length}。`)
      if (n > 0 && !hasCore) return reply(e, `自选被动需要${itemIcon(PUPPET_PASSIVE_CORE)}${PUPPET_PASSIVE_CORE}×1，你当前没有；可直接发送 #打造傀儡 随机获得被动。`)
      const ret = await craftPuppet(e.user_id, e.group_id, n ? PUPPET_PASSIVE_KEYS[n - 1] : '')
      return reply(e, ret.msg)
    }
    /* 被动解析: 支持 完整名称 / 短名 / 唯一子串(如 #打造傀儡战意 选中 傀儡战意); 无匹配则明确提示 */
    let passive = PUPPET_PASSIVE_KEYS.find(key => passiveName(key) === raw)
    if (!passive) {
      const hits = PUPPET_PASSIVE_KEYS.filter(key => passiveName(key).includes(raw))
      if (hits.length === 1) passive = hits[0]
      else if (hits.length > 1) return reply(e, `“${raw}”匹配到多个被动，请用完整名称：${availablePassiveLines().join(' / ')}`)
      else return reply(e, `没有找到被动“${raw}”，可选：${availablePassiveLines().join(' / ')}`)
    }
    const ret = await craftPuppet(e.user_id, e.group_id, passive)
    return reply(e, ret.msg)
  }

  async rename (e) {
    const m = String(e.msg || '').match(/^[#＃]?傀儡命名\s+(\S+)\s+(\S+)$/)
    if (!m) return false
    const ret = renamePuppet(e.user_id, e.group_id, m[1], m[2])
    return reply(e, ret.msg)
  }

  async equip (e) {
    const m = String(e.msg || '').match(/^[#＃]?装备傀儡\s*(\S+)$/)
    if (!m) return false
    const ret = equipPuppet(e.user_id, e.group_id, m[1])
    return reply(e, ret.msg)
  }

  async unequip (e) { return reply(e, unequipPuppet(e.user_id, e.group_id).msg) }

  async upgrade (e) {
    const raw = String(e.msg || '').replace(/^[#＃]?升级傀儡\s*/, '').trim()
    const ret = await upgradePuppet(e.user_id, e.group_id, raw)
    return reply(e, ret.msg)
  }

  async dismantle (e) {
    const m = String(e.msg || '').match(/^[#＃]?分解傀儡\s+(\S+)$/)
    if (!m) return false
    const ret = await dismantlePuppet(e.user_id, e.group_id, m[1])
    return reply(e, ret.msg)
  }

  async deploy (e) { return reply(e, (await deployPuppet(e.user_id, e.group_id)).msg) }
  async recall (e) { return reply(e, recallPuppet(e.user_id, e.group_id).msg) }

  async dismantleTechnique (e) {
    const m = String(e.msg || '').match(/^[#＃]?分解傀儡术\s+(\S+)(?:\s+(\d+))?$/)
    if (!m) return false
    const ret = await dismantlePuppetTechnique(e.user_id, e.group_id, m[1], m[2] ? Number(m[2]) : 1)
    return reply(e, ret.msg)
  }

  async pick (e) {
    const k = keyOf(e)
    const st = pending.get(k)
    if (!st || Date.now() - st.at > PENDING_TTL) {
      /* 傀儡打造状态过期/丢失: 摘除自己的锁, 让后续交互正常路由 */
      await unlock(e.group_id, e.user_id, 'puppet-craft')
      pending.delete(k)
      return false
    }
    /* 校验: 仅当傀儡打造在栈顶才处理(被其它交互埋住则让位, 保留待选状态等回到栈顶再恢复) */
    if (!(await isCurrent(e.group_id, e.user_id, 'puppet-craft'))) {
      return false
    }
    /* 状态锁复查: 洗劫/伏击/讨伐/万魂/天牢/战争等锁定状态下禁止用数字打造/操作傀儡(战斗中打造傀儡=玩家自身操作, skipBattle 豁免战斗玩法锁, 惩罚锁照拦) */
    if (await guardActionLocked(e, undefined, { skipBattle: true })) return true
    const n = Number(String(e.msg || '').replace(/\D/g, ''))
    if (!Number.isInteger(n) || n < 0 || n > PUPPET_PASSIVE_KEYS.length) return reply(e, `请选择0～${PUPPET_PASSIVE_KEYS.length}。`)
    pending.delete(k)
    await unlock(e.group_id, e.user_id, 'puppet-craft')
    const ret = await craftPuppet(e.user_id, e.group_id, n ? PUPPET_PASSIVE_KEYS[n - 1] : '')
    return reply(e, ret.msg)
  }
}
