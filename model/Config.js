import plugin from '../../../lib/plugins/plugin.js'
import cfg from '../../../lib/config/config.js'
import common from '../../../lib/common/common.js'
import fs from 'fs'
import { buildForwardNodes } from '../components/common-lib/reply-img.js'

class Config {

    /** 读取文件 */
    async getread(path) {
        return await fs.promises
            .readFile(path, 'utf8')
            .then((data) => {
                return JSON.parse(data)
            })
            .catch((err) => {
                logger.error('读取失败')
                console.error(err)
                return false
            })
    }

    /** 写入文件 */
    async getwrite(path, cot = {}) {
        return await fs.promises
            .writeFile(path, JSON.stringify(cot, '', '\t'))
            .then(() => {
                return true
            })
            .catch((err) => {
                logger.error('写入失败')
                console.error(err)
                return false
            })
    }

    /** 发消息 */
    async getSend(msg) {
        if (await redis.del(`lin:notice:notificationsAll`,)) {
            // 发送全部管理
            for (let index of cfg.masterQQ) {
                await common.relpyPrivate(index, msg)
            }
        } else {
            // 发给第一个管理
            await common.relpyPrivate(cfg.masterQQ[0], msg)
            await common.sleep(200)
        }
    }

    /**
     * @description: 秒转换
     * @param {Number} time  秒数
     * @param {boolean} repair  是否需要补零
     * @return {object} 包含天，时，分，秒的对象
     */
    getsecond(time, repair) {
        let second = parseInt(time)
        let minute = 0
        let hour = 0
        let day = 0
        if (second > 60) {
            minute = parseInt(second / 60)
            second = parseInt(second % 60)
        }
        if (minute > 60) {
            hour = parseInt(minute / 60)
            minute = parseInt(minute % 60)
        }
        if (hour > 23) {
            day = parseInt(hour / 24)
            hour = parseInt(hour % 24)
        }
        if (repair) {
            hour = hour < 10 ? "0" + hour : hour
            minute = minute < 10 ? "0" + minute : minute
            second = second < 10 ? "0" + second : second
        }
        return {
            day,
            hour,
            minute,
            second
        }
    }

    /**
     * @description: 
     * @param {Array} message 发送的消息
     * @return {*} 
     */
    async getforwardMsg(message, e) {
        // 长文本合并渲染成图片(相邻短文本合成一张图); 短文本/富媒体节点原样
        const nodes = await buildForwardNodes(message)
        if (!nodes.length) return
        // 只有一个节点时直接发送,不再套转发(如幻境试炼合成的一张图)
        if (nodes.length === 1) {
            e.reply(nodes[0])
            return
        }
        //制作转发消息
        let forwardMsg = await Promise.all(nodes.map(async (i) => ({
            message: i,
            nickname: Bot.nickname,
            user_id: Bot.uin
        })))
        //发送
        if (e.isGroup) {
            forwardMsg = await e.group.makeForwardMsg(forwardMsg)
        } else {
            forwardMsg = await e.friend.makeForwardMsg(forwardMsg)
        }

        //发送消息
        e.reply(forwardMsg)

    }
}


export default new Config();