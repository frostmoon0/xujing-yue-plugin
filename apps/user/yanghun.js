import { plugin } from '../../model/api/api.js'
import { itemIcon } from '../../components/equip_data.js'
import Yanghun from '../../components/yanghun_data.js'
import { textToImg } from '../../components/common-lib/reply-img.js'

function reply (e, text) {
  e.reply(text)
  return true
}

function ensureGroup (e) {
  if (e.group_id) return true
  reply(e, '养魂阵只能在群内使用。')
  return false
}

export class yanghun extends plugin {
  constructor () {
    super({
      name: '养魂阵',
      dsc: '养魂阵与万魂幡魂魄供养',
      event: 'message',
      priority: 44,
      rule: [
        { reg: '^[#＃]?布置养魂阵$', fnc: 'buildYanghun' },
        { reg: '^[#＃]?升级养魂阵$', fnc: 'upgradeYanghun' },
        { reg: '^[#＃]?运行养魂阵$', fnc: 'runYanghun' },
        { reg: '^[#＃]?停止养魂阵$', fnc: 'stopYanghun' },
        { reg: '^[#＃]?摧毁养魂阵-?$', fnc: 'destroyYanghun' },
        { reg: '^[#＃]?养魂阵状态$', fnc: 'yanghunStatus' },
        { reg: '^[#＃]?养魂阵玩法$', fnc: 'yanghunGuide' }
      ]
    })
    this.task = {
      cron: '*/1 * * * *',
      name: '养魂阵静默结算',
      fnc: () => Yanghun.settleAll(),
      log: false
    }
  }

  async buildYanghun (e) {
    if (!ensureGroup(e)) return true
    return reply(e, (await Yanghun.build(e.user_id, e.group_id)).msg)
  }

  async upgradeYanghun (e) {
    if (!ensureGroup(e)) return true
    return reply(e, (await Yanghun.upgrade(e.user_id, e.group_id)).msg)
  }

  async runYanghun (e) {
    if (!ensureGroup(e)) return true
    return reply(e, (await Yanghun.run(e.user_id, e.group_id)).msg)
  }

  async stopYanghun (e) {
    if (!ensureGroup(e)) return true
    return reply(e, (await Yanghun.stop(e.user_id, e.group_id)).msg)
  }

  async destroyYanghun (e) {
    if (!ensureGroup(e)) return true
    return reply(e, (await Yanghun.destroy(e.user_id, e.group_id)).msg)
  }

  async yanghunStatus (e) {
    if (!ensureGroup(e)) return true
    const result = await Yanghun.status(e.user_id, e.group_id)
    try {
      const img = await textToImg(result.text)
      if (img) {
        e.reply(img)
        return true
      }
    } catch (err) { }
    return reply(e, result.text)
  }

  async yanghunGuide (e) {
    if (!ensureGroup(e)) return true
    const text = [
      '━━━🌀 养魂阵玩法 ━━━',
      `1. #布置养魂阵：消耗${itemIcon('万阵核心')}万阵核心×1、${itemIcon('无主幽魂')}无主幽魂×1、${itemIcon('万魂帝晶')}万魂帝晶×5、${itemIcon('阴魂砂')}阴魂砂×20、${itemIcon('游魂骨')}游魂骨×20、${itemIcon('鬼火草')}鬼火草×10、${itemIcon('幽冥木')}幽冥木×10。`,
      '2. #运行养魂阵：启动及每小时各消耗「阶级×10000」灵石（1阶1万、2阶2万……10阶10万），每满1小时产出魂魄。',
      '3. 养魂阵一至十阶每小时产出1至10魂；魂魄只有在已装备万魂幡且有容量时才会存入，无法存入的魂魄静默消散。',
      '4. #停止养魂阵：结算完整小时并暂停，未满一小时进度保留；灵石不足时会自动暂停。',
      '5. #升级养魂阵：升级材料按目标等级为一阶基准的2、4、6、8、10、12、14、16、18倍，最高十阶。',
      '6. #摧毁养魂阵：拆除阵法，已投入材料和未满一小时进度不返还。',
      '查看：#养魂阵状态 · #我的信息会显示当前阵法。'
    ].join('\n')
    try {
      const img = await textToImg(text)
      if (img) {
        e.reply(img)
        return true
      }
    } catch (err) { }
    return reply(e, text)
  }
}
