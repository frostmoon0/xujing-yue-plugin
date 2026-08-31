import fs from 'node:fs'
import YAML from 'yaml'
import { __dirname } from '../../../main.js'
class DefsetUpdata {
    /**
     * @param { app, name } param0 
     * @returns 
     */
    getConfig = ( { app, name }) => {
        /*获得配置地址*/
        const file = `${__dirname}/config/${app}/${name}.yaml`
        /*读取配置*/
        const data = YAML.parse(fs.readFileSync(file, 'utf8'))
        return data
    }
    /**
     * 修改参数配置
     * @param { name, size } param0 键名与数值
     * @returns 提示信息
     */
    updataConfig = ({ name, size }) => {
        const file = `${__dirname}/config/parameter/cooling.yaml`
        if (!fs.existsSync(file)) {
            return '配置文件不存在'
        }
        let data = {}
        try {
            data = YAML.parse(fs.readFileSync(file, 'utf8')) || {}
        } catch { }
        const num = Number(size)
        if (isNaN(num) || num < 0) {
            return '配置值无效，请输入数字，如：#虚境配置更改timeout*30'
        }
        data[name] = data[name] || {}
        data[name].size = num
        fs.writeFileSync(file, YAML.stringify(data), 'utf8')
        return `已将 [${name}] 冷却时间设置为 ${num} 秒`
    }
}
export default new DefsetUpdata()