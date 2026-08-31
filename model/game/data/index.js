import createdata from './createdata.js'
/**生成游戏数据*/
class DateIndex {
    constructor() {
        /**生成yaml配置数据(将 resources/defset 模板复制到 config)*/
        createdata.moveConfig({})
    }
    /** 数据激活*/
    start = () => {
        return
    }
}
export default new DateIndex()