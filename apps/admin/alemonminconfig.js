import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
/*数据激活：当间接编译到data/indexjs的时候此方法可删除*/
AlemonApi.DataIndex.start()
export class AlemonAdminConfig extends plugin {
    constructor() {
        super(BotApi.SuperInex.getUser({
            rule: [
                {
                    reg: '^#虚境配置更改.*',
                    fnc: 'alemonConfigUpdata',
                    auth: 'master',
                },
                {
                    reg: '^#虚境配置',
                    fnc: 'alemonConfigShow',
                    auth: 'master',
                },
                {
                    reg: '^#虚境重置配置',
                    fnc: 'alemonConfigre',
                    auth: 'master',
                },
                {
                    reg: '^#虚境重置图片',
                    fnc: 'alemonReImg',
                    auth: 'master',
                }
            ]
        }))
    }
    alemonConfigUpdata = async (e) => {
        if (!e.isMaster) {
            return
        }
        const [name, size] = e.msg.replace('#虚境配置更改', '').split('\*')
        /*配置文件方法,右键方法转定义后自行编写*/
        e.reply(AlemonApi.DefsetData.updataConfig({ name, size }))
        return
    }
    alemonConfigShow = async (e) => {
        if (!e.isMaster) {
            return
        }
        const isreply = await e.reply(await BotApi.ImgIndex.showPuppeteer({
            path: 'config', name: 'config', data: {
                // config.html 模板按 config 对象渲染, 必须包一层 config 字段, 否则面板空白
                config: await AlemonApi.DefsetData.getConfig({
                    app: 'parameter',
                    name: 'cooling'
                })
            }
        }))
        await BotApi.User.surveySet({ e, isreply })
        return
    }
    alemonConfigre = async (e) => {
        if (!e.isMaster) {
            return
        }
        AlemonApi.CreateData.moveConfig({ choice: 'updata' })
        e.reply('重置完成')
        return
    }
    alemonReImg = async (e) => {
        if (!e.isMaster) {
            return
        }
        return
    }
}