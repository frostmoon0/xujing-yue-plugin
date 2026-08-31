/** 配置声明(唯一配置来源)
 * 已精简:移除与本插件(虚境决斗/娶群友/抽卡)无关的原神插件配置残骸
 * 系统启动时会根据此 schema 自动重写 config/cfg.js
 */
export const cfgSchema = {
  sys: {
    title: '系统设置',
    cfg: {
      renderScale: {
        title: '渲染精度',
        key: '渲染',
        type: 'num',
        def: 100,
        input: (n) => Math.min(200, Math.max(50, (n * 1 || 100))),
        oldCfgKey: 'sys.scale',
        desc: '可选值50~200，建议100。设置高精度会提高图片的精细度，但因图片较大可能会影响渲染与发送速度'
      }
    }
  }
}
