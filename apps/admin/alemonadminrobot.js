import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
/**该方法可用于关闭云崽部分功能 */
export class AlemonAdminRobot extends plugin {
    constructor() {
        super(BotApi.SuperInex.getUser({
            rule: [
                {
                    reg: '^#虚境开启.*',
                    fnc: 'openRobotConfig',
                    auth: 'master',
                },
                {
                    reg: '^#虚境关闭.*',
                    fnc: 'offRobotConfig',
                    auth: 'master',
                },
                {
                    reg: '^#虚境添加主人.*',
                    fnc: 'addRobotConfig',
                    auth: 'master',
                },
                {
                    reg: '^#虚境删除主人.*',
                    fnc: 'deleteRobotConfig',
                    auth: 'master',
                }
            ]
        }))
    }
    openRobotConfig = async (e) => {
        if (!e.isMaster) {
            return
        }
        const name = e.msg.replace('#虚境开启', '')
        if (name == '云崽') {
            e.reply(BotApi.BotModify.openReadconfig())
        }
        if (name == '私聊') {
            e.reply(BotApi.BotModify.OnGroup())
        }
        e.reply(BotApi.BotModify.openReadconfighelp({ name }))
        return
    }
    offRobotConfig = async (e) => {
        if (!e.isMaster) {
            return
        }
        const name = e.msg.replace('#虚境关闭', '')
        if (name == '云崽') {
            e.reply(BotApi.BotModify.deleteAllConfig())
            return
        }
        if (name == '私聊') {
            e.reply(BotApi.BotModify.OffGroup())
            return
        }
        e.reply(BotApi.BotModify.Readconfighelp({ name }))
        return
    }
    addRobotConfig = async (e) => {
        if (!e.isMaster) {
            return
        }
        e.reply(BotApi.BotModify.AddMaster({
            mastername: e.msg.replace('#虚境添加主人', '')
        }))
        return
    }
    deleteRobotConfig = async (e) => {
        if (!e.isMaster) {
            return
        }
        e.reply(BotApi.BotModify.DeleteMaster({
            mastername: e.msg.replace('#虚境删除主人', '')
        }))
        return
    }
}