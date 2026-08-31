// 虚境秘境开放定时播报：每天20:00准点向白名单群播报当天开放的秘境
import { BotApi, plugin } from '../../model/api/api.js'
import fs from 'fs'
import YAML from 'yaml'
import schedule from "node-schedule"
import command from '../../components/command.js'
import moment from "moment"
import { Plugin_Name } from '../../components/plugin.js'
import { textToImg } from '../../components/common-lib/reply-img.js'

const cfgPath = `./plugins/${Plugin_Name}/config/xujing.config.yaml`

/** 读取配置: 优先嵌套结构,兼容锅巴面板写入的扁平 key(如 wife_cfg.secret_group) */
async function readCfg(name, key) {
    try {
        const v = await command.getConfig(name, key)
        if (v !== undefined && v !== null && v !== '') return v
    } catch (err) { }
    try {
        const all = YAML.parse(fs.readFileSync(cfgPath, 'utf8'))
        const flat = all[`${name}.${key}`]
        if (flat !== undefined && flat !== null && flat !== '') return flat
    } catch (err) { }
    return undefined
}

/* 与 getwife.js 保持一致的限时秘境表 */
const SECRET_REALMS = {
    '青云秘境': { day: 1, emoji: '🌿', desc: '采仙草' },
    '玄晶秘境': { day: 2, emoji: '💎', desc: '挖灵石' },
    '丹火秘境': { day: 3, emoji: '🔥', desc: '炼丹药' },
    '镜湖秘境': { day: 4, emoji: '🐟', desc: '钓灵鱼' },
    '天机秘境': { day: 5, emoji: '🔮', desc: '探天机' },
    '太虚秘境': { day: 6, emoji: '🌌', desc: '太虚寻宝' },
    '瑶池秘境': { day: 0, emoji: '✨', desc: '瑶池仙缘' }
}
const WEEKDAY_CN = { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' }

/** 获取当天开放的秘境名 */
function getTodayRealm() {
    const day = new Date().getDay()
    for (const name of Object.keys(SECRET_REALMS)) {
        if (SECRET_REALMS[name].day === day) return name
    }
    return ''
}

/** 生成播报文案 */
function buildNoticeMsg() {
    const name = getTodayRealm()
    if (!name) return ''
    const cfg = SECRET_REALMS[name]
    const dayCN = WEEKDAY_CN[cfg.day]
    return `${cfg.emoji} 虚境秘境已开放！\n今天是${dayCN}，开放【${name}】\n${cfg.desc}可获得大量灵石\n发送「#${name}」即可探索（每晚20:00-24:00）`
}

export class secretnotice extends plugin {
    constructor() {
        super({
            name: '秘境播报',
            dsc: '每天20点准时播报秘境开放',
            event: 'message',
            priority: 1000,
            rule: [
                {
                    reg: '^[#＃]?秘境播报测试$',
                    fnc: 'testNotice'
                }
            ]
        })
    }

    /** 手动测试播报(任何人可测试,仅回复自己) */
    async testNotice(e) {
        const msg = buildNoticeMsg()
        if (!msg) { e.reply('今天没有开放的秘境~'); return true }
        e.reply(`【秘境播报测试】\n${msg}\n\n（正式播报会发送到白名单群，请在 config/xujing.config.yaml 的 wife_cfg.secret_group 配置群号）`)
        return true
    }
}

// 每小时整点执行：到配置的播报时间(默认20点)且当天未播报过则播报
schedule.scheduleJob('0 0 * * * *', async () => {
    try {
        const time = new Date()
        const hour = time.getHours()
        const secret_time = Number((await readCfg("wife_cfg", "secret_time")) || 20)
        const notice = await readCfg("wife_cfg", "secret_notice")
        console.log(`[秘境播报]整点检查: 当前${hour}点, 设定${secret_time}点, 开关=${notice}`)
        if (hour !== secret_time) return
        if (notice !== 'T') { console.log('[秘境播报]未开启(secret_notice≠T),请在配置中设为 T'); return }
        // 当天已播报则跳过(用日期key防重复)
        const dayKey = moment().format('YYYY-MM-DD')
        const nkey = `xujing:secret-notice:${dayKey}`
        if (await redis.get(nkey)) { console.log('[秘境播报]今天已播报过,跳过'); return }
        const msg = buildNoticeMsg()
        if (!msg) { console.log('[秘境播报]今天没有开放的秘境'); return }
        // 白名单群播报: 优先 secret_group, 为空则用 wife_cfg.group
        let groups = (await readCfg("wife_cfg", "secret_group")) || []
        if (!groups.length) groups = (await readCfg("wife_cfg", "group")) || []
        console.log('[秘境播报]播报群:', JSON.stringify(groups))
        if (!groups.length) {
            console.log('[秘境播报]未配置白名单群!请设置 wife_cfg.secret_group')
            return
        }
        for (let key of groups) {
            try {
                const img = await textToImg(msg)
                await Bot.pickGroup(key).sendMsg(img || msg)
                console.log(`正在通知群聊${key}秘境开放`)
            } catch (err) {
                console.log(`群聊${key}不存在或发送失败`)
            }
        }
        await redis.set(nkey, '1', { EX: 24 * 60 * 60 })
    } catch (err) {
        console.log('秘境播报失败:', err.message)
    }
})
