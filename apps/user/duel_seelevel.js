import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
import fs from "fs";
import xujing_data from '../../components/xujing_data.js'
import { Plugin_Name } from '../../components/plugin.js'
//配置一些有意思的参数

export class duel_seelevel extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '我的等级',
            /** 功能描述 */
            dsc: '',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^[#＃]?我的(等级|经验)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'seelevel'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^[#＃]?我的(境界)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'seelevel2'
                }
            ]
        })
    }
    /**
     * 
     */
    async seelevel(e) {
        let user_id = e.user_id;
        const json = await xujing_data.getQQYUserBattle(user_id, null, false, `${e.group_id}.json`)
        if (json[e.user_id].experience < 1) {
            json[e.user_id].experience = 0
        }//当灵力小于1时，自动归零
        e.reply(`你的境界是${json[e.user_id].levelname},你的灵力是${json[e.user_id].experience}${(json[e.user_id].accum || 0) > 0 ? `（累积+${json[e.user_id].accum}，突破后并入）` : ''},是否是开挂${json[e.user_id].Privilege}`)
        return
    }
    async seelevel2(e) {
        let user_id = e.user_id;
        const json = await xujing_data.getQQYUserBattle(user_id, null, false, `${e.group_id}.json`)
        if (json[e.user_id].experience < 1) {
            json[e.user_id].experience = 0
        }//当灵力小于1时，自动归零
        e.reply(`你的境界是${json[e.user_id].levelname},你的灵力是${json[e.user_id].experience}${(json[e.user_id].accum || 0) > 0 ? `（累积+${json[e.user_id].accum}，突破后并入）` : ''},是否是开挂${json[e.user_id].Privilege}`)
        return
    }
}