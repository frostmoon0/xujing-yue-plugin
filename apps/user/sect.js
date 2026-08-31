/* ============================================================
 * 玩家宗门系统 · 第一步：玩家宗门身份 + 白名单
 * - 白名单: #宗门系统白名单 添加|移除 [群号] (主人)
 * - 加入/退出/逐出宗门, #我的宗门
 * 数据存 fake_{gid}.json 的 f.players(玩家宗门身份, 按uid)
 * ============================================================ */
import { plugin } from '../../model/api/api.js'
import { getFake, saveFake, sectIdByName, sectName } from '../../components/fake_data.js'
import { sectRegion, injuryInfo, getVault, kickFakeFromSect } from '../../components/sect_system.js'
import { readCfg, saveCfg, isEnabled } from '../../components/sect/config.js'
import { fmtTime, replyLines, getPlayer, posCn } from '../../components/sect/helpers.js'

const MAX_PLAYER = 20 // 弟子上限(无演武场=20)

export class sect extends plugin {
  constructor () {
    super({
      name: '宗门系统',
      dsc: '玩家宗门系统',
      event: 'message',
      priority: 270,
      rule: [
        { reg: '^[#＃]?宗门系统白名单\\s*(添加|移除)?\\s*([0-9０-９]*)$', fnc: 'sectWhitelist', auth: 'master' },
        { reg: '^[#＃]?加入宗门\\s*(\\S*)$', fnc: 'joinSect' },
        { reg: '^[#＃]?退出宗门$', fnc: 'leaveSect' },
        { reg: '^[#＃]?逐出\\s*@?(\\S*)$', fnc: 'kickMember' },
        { reg: '^[#＃]?我的宗门$', fnc: 'mySect' }
      ]
    })
  }

  /** 白名单管理(主人): 添加/移除/查看 */
  async sectWhitelist (e) {
    try {
      const m = String(e.msg || '').match(/宗门系统白名单\s*(添加|移除)?\s*(\d*)/)
      const act = (m && m[1]) || ''
      const gid = (m && m[2]) || ''
      if (!act) {
        const list = (readCfg().enabledGroups || []).join('、') || '（空）'
        e.reply(`🛡️ 宗门系统白名单群：${list}`)
        return true
      }
      if (!gid) { e.reply('用法：#宗门系统白名单 添加/移除 [群号]'); return true }
      const cfg = readCfg()
      if (!Array.isArray(cfg.enabledGroups)) cfg.enabledGroups = []
      if (act === '添加') {
        if (cfg.enabledGroups.includes(gid)) e.reply(`群 ${gid} 已在白名单~`)
        else { cfg.enabledGroups.push(gid); saveCfg(cfg); e.reply(`✅ 已开启群 ${gid} 的宗门系统`) }
      } else {
        cfg.enabledGroups = cfg.enabledGroups.filter(x => x !== gid)
        saveCfg(cfg)
        e.reply(`✅ 已关闭群 ${gid} 的宗门系统`)
      }
      return true
    } catch (err) {
      logger.error('[宗门系统]白名单异常:' + (err && err.stack))
      e.reply('白名单操作出错了，请稍后再试~')
      return true
    }
  }

  /** 白名单闸门: 未开启返回true(已提示), 开启返回false */
  gate (e) {
    if (!e.group_id) { e.reply('需在群内使用~'); return true }
    if (!isEnabled(e.group_id)) { e.reply('🛡️ 本群未开启宗门系统，请联系主人开启~'); return true }
    return false
  }

  /** #加入宗门 [名] */
  async joinSect (e) {
    try {
      if (this.gate(e)) return true
      const gid = String(e.group_id)
      const uid = e.user_id
      const f = getFake(gid)
      if (getPlayer(f, uid)) { e.reply('你已有宗门，先 #退出宗门 吧~'); return true }
      /* 被逐出宗门后 2 天内不能主动入宗 */
      const kc = await redis.ttl(`xujing:sect-kick-cd:${gid}:${uid}`)
      if (kc !== -2 && kc > 0) { e.reply(`你被逐出宗门不久，${Math.ceil(kc / 86400)} 天内不能再加入~`); return true }
      const m = String(e.msg || '').match(/加入宗门\s*(\S*)/)
      const name = (m && m[1]) ? m[1].trim() : ''
      if (!name) { e.reply('用法：#加入宗门 [宗门名]（#天下宗门 看宗门名单）'); return true }
      const sid = sectIdByName(f, name)
      if (!sid) { e.reply(`没有找到宗门【${name}】~`); return true }
      /* 弟子上限: 20 + 目标宗门演武场等级×10(设施建成后扩容) */
      const yanwu = (f.sects[sid] && f.sects[sid].facilities && f.sects[sid].facilities.yanwu) || 0
      const cap = MAX_PLAYER + yanwu * 10
      const count = Object.values(f.players || {}).filter(x => x && x.sect === sid).length
      if (count >= cap) { e.reply(`【${sectName(f, sid)}】弟子已满（${cap}人），暂时无法加入~`); return true }
      f.players[String(uid)] = { name: e.nickname || String(uid), sect: sid, pos: 'dizi', joinAt: Date.now(), contribution: 0 }
      saveFake(f, gid)
      e.reply(`🎉 你已拜入【${sectName(f, sid)}】成为弟子！`)
      return true
    } catch (err) {
      logger.error('[宗门系统]加入异常:' + (err && err.stack))
      e.reply('加入宗门出错了，请稍后再试~')
      return true
    }
  }

  /** #退出宗门 (7天冷却) */
  async leaveSect (e) {
    try {
      if (this.gate(e)) return true
      const gid = String(e.group_id)
      const uid = e.user_id
      const f = getFake(gid)
      const p = getPlayer(f, uid)
      if (!p) { e.reply('你还不是任何宗门成员~'); return true }
      const cd = await redis.ttl(`xujing:sect-leave-cd:${gid}:${uid}`)
      if (cd !== -2 && cd > 0) { e.reply(`退出宗门冷却中：${Math.ceil(cd / 86400)} 天后再试~`); return true }
      const sname = sectName(f, p.sect)
      /* 玩家宗主退出: 宗门回归江湖管理(置空owner, 由伪玩家系统接管), 避免孤儿owner导致宗门僵死 */
      if (p.pos === 'zongzhu' && f.sects[p.sect]) f.sects[p.sect].owner = null
      delete f.players[String(uid)]
      saveFake(f, gid)
      await redis.set(`xujing:sect-leave-cd:${gid}:${uid}`, 1, { EX: 7 * 86400 })
      e.reply(`👋 你已退出【${sname}】，7 天内不能再加入~`)
      return true
    } catch (err) {
      logger.error('[宗门系统]退出异常:' + (err && err.stack))
      e.reply('退出宗门出错了，请稍后再试~')
      return true
    }
  }

  /** #逐出 @xx 或 #逐出 名字/QQ号 (宗主/副宗): 踢玩家2天不能主动入宗; 踢伪玩家转散修+2天kickBans */
  async kickMember (e) {
    try {
      if (this.gate(e)) return true
      const gid = String(e.group_id)
      const uid = e.user_id
      const f = getFake(gid)
      const me = getPlayer(f, uid)
      if (!me) { e.reply('你不是宗门成员~'); return true }
      if (me.pos !== 'zongzhu' && me.pos !== 'fuzong' && me.pos !== 'taishang') { e.reply('只有宗主/副宗主/太上长老可以逐出弟子~'); return true }
      let target = e.at ? String(e.at) : ''
      if (!target) {
        const m = String(e.msg || '').match(/逐出\s*@?(\S+)/)
        if (m) target = m[1]
      }
      if (!target) { e.reply('用法：#逐出 @目标 或 #逐出 名字/QQ号'); return true }
      /* 踢玩家成员(QQ号): 2天内不能主动入宗 */
      const tp = getPlayer(f, target)
      if (tp) {
        if (String(uid) === String(target)) { e.reply('不能逐出自己~'); return true }
        if (tp.sect !== me.sect) { e.reply('对方不是你宗门成员~'); return true }
        if (tp.pos === 'zongzhu') { e.reply('不能逐出宗主~'); return true }
        delete f.players[String(target)]
        saveFake(f, gid)
        try { await redis.set(`xujing:sect-kick-cd:${gid}:${target}`, 1, { EX: 2 * 86400 }) } catch (err) { }
        e.reply(`🗡️ 已将 ${tp.name} 逐出【${sectName(f, me.sect)}】，2天内不能主动入宗~`)
        return true
      }
      /* 踢伪玩家弟子(名字): 转散修 + 2天内不主动入宗 */
      const r = kickFakeFromSect(f, gid, me.sect, target)
      e.reply(r.msg)
      return true
    } catch (err) {
      logger.error('[宗门系统]逐出异常:' + (err && err.stack))
      e.reply('逐出成员出错了，请稍后再试~')
      return true
    }
  }

  /** #我的宗门 (查看, 渲染图片; 须在自己宗门大区) */
  async mySect (e) {
    try {
      if (this.gate(e)) return true
      const gid = String(e.group_id)
      const uid = e.user_id
      const f = getFake(gid)
      const p = getPlayer(f, uid)
      if (!p) { e.reply('你还不是任何宗门成员，发 #天下宗门 看有哪些宗门可加入~'); return true }
      /* 大区限制: 查看宗门信息须在自己宗门大区 */
      const w = getWorld(gid)
      const myLoc = getLoc(w, uid)
      const sReg = sectRegion(f, p.sect)
      if (myLoc !== sReg) { e.reply(`你位于【${regionNameOf(myLoc)}】，宗门【${sectName(f, p.sect)}】在【${regionNameOf(sReg)}】，请先 #去${regionNameOf(sReg)} 再查看~`); return true }
      const sname = sectName(f, p.sect)
      const s = f.sects[p.sect]
      const players = Object.values(f.players || {}).filter(x => x && x.sect === p.sect)
      const fakeCount = Object.values(f.roster || {}).filter(x => x && x.alive && x.status === 'sect' && x.sect === p.sect).length
      const zzName = (f.sectMap[p.sect] && f.sectMap[p.sect].zongzhu) || ''
      const zzTxt = s.owner ? '🌙玩家' : (zzName ? zzName : '（空缺）')
      const v = getVault(f, p.sect)
      const fac = s.facilities || {}
      const inj = injuryInfo(p)
      const lines = [
        `宗门：${sname}（${regionNameOf(sReg)}）${s.owner ? ' 🌙玩家主导' : ''}`,
        `职位：${posCn(p.pos)}`, `贡献：${p.contribution || 0}`, `入宗：${fmtTime(p.joinAt)}`,
        ...(inj.level ? [`伤势：${['', '轻伤', '中伤', '重伤'][inj.level]}（战力-${inj.pct}%，还需 ${inj.remainMin} 分钟恢复）`] : []),
        '',
        `宗主：${zzTxt}`,
        `宝库灵石：${v.stones || 0}`,
        `设施：演武场${fac.yanwu || 0}级 / 护山阵${fac.hushan || 0}级 / 灵脉${fac.lingmai || 0}级`,
        '',
        `👥 玩家成员（${players.length}）：`,
        ...(players.length ? players.map(x => `${posCn(x.pos)} ${x.name}${x.pos === 'zongzhu' ? ' 👑' : ''}`) : ['（暂无）']),
        '',
        `🙈 宗门门人（伪玩家 ${fakeCount} 人）`
      ]
      await replyLines(e, `🏯 ${sname}`, lines)
      return true
    } catch (err) {
      logger.error('[宗门系统]我的宗门异常:' + (err && err.stack))
      e.reply('查询宗门信息出错了，请稍后再试~')
      return true
    }
  }
}
