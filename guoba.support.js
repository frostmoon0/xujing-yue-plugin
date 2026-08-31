/**
 * 锅巴插件(Guoba-Plugin)支持文件
 * 让本插件的配置可以在锅巴 Web 面板中可视化修改
 * 配置存储于 config/xujing.config.yaml，此文件仅描述表单
 */
import fs from 'node:fs'
import YAML from 'yaml'
import { Plugin_Name } from './components/plugin.js'

const cfgPath = `./plugins/${Plugin_Name}/config/xujing.config.yaml`

export function supportGuoba() {
  return {
    // 插件信息(前端展示)
    pluginInfo: {
      name: 'xujing-yue-plugin',
      title: '虚境修仙',
      description: '娶群友·修仙·装备·秘境养成小游戏',
      author: 'xujing',
      authorLink: 'https://github.com/',
      link: 'https://github.com/',
      isV3: true,
      isV2: false,
      showInMenu: 'auto',
      icon: 'mdi:sword-cross',
      iconColor: '#d19f56'
    },
    // 配置项描述
    configInfo: {
      schemas: [
        // ===== 伪玩家·优先名字 =====
        { label: '伪玩家·优先名字', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'name_cfg.priority_names',
          label: '优先抽取的伪玩家名字',
          helpMessage: '新伪玩家入世时优先使用这些名字（可随时增删，回车/逗号/空格分隔）',
          component: 'GTags',
          componentProps: { allowAdd: true, allowDel: true }
        },

        // ===== 决斗设置 =====
        { label: '决斗设置', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'duel_cfg.Magnification',
          label: '战斗力依赖系数',
          helpMessage: '每个小境界/装备加成影响胜率%，默认8，胜率限制5%~100%',
          component: 'InputNumber',
          componentProps: { min: 1, max: 50, step: 1 }
        },
        {
          field: 'duel_cfg.Cooling_time',
          label: '决斗冷却时间(秒)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'duel_cfg.cdtime_exercise',
          label: '锻炼冷却时间(分钟)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'duel_cfg.cdtime_break',
          label: '突破冷却时间(分钟)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },

        // ===== 娶群友·概率 =====
        { label: '娶群友·概率', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'wife_cfg.qqwife',
          label: '强娶成功率(成)',
          component: 'InputNumber',
          componentProps: { min: 0, max: 10 }
        },
        {
          field: 'wife_cfg.sjwife',
          label: '随机娶群友成功率(成)',
          component: 'InputNumber',
          componentProps: { min: 0, max: 10 }
        },

        // ===== 娶群友·冷却 =====
        { label: '娶群友·冷却(分钟)', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'wife_cfg.sjcd',
          label: '随机娶冷却(分)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.qqcd',
          label: '强娶冷却(分)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.bbcd',
          label: '抱抱冷却(分)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.fkcd',
          label: '双修冷却(分)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.ggcd',
          label: '逛街随机事件冷却(分)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.qlpcd',
          label: '抢老婆冷却(分)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.poorcd',
          label: '领取低保冷却(分)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.gifttime',
          label: '逛街行动上限(次)',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },

        // ===== 秘境播报 =====
        { label: '秘境播报', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'wife_cfg.secret_notice',
          label: '秘境开放准时播报',
          helpMessage: '每天到点向白名单群播报当天开放的秘境',
          component: 'Select',
          componentProps: {
            options: [
              { label: '开启', value: 'T' },
              { label: '关闭', value: 'F' }
            ]
          }
        },
        {
          field: 'wife_cfg.secret_group',
          label: '秘境播报白名单群',
          helpMessage: '只向这些群播报秘境开放，可添加多个',
          component: 'GTags',
          componentProps: { allowAdd: true, allowDel: true }
        },
        {
          field: 'wife_cfg.secret_time',
          label: '秘境播报时间(24制时)',
          helpMessage: '默认20，即晚上20:00准时播报',
          component: 'InputNumber',
          componentProps: { min: 0, max: 23 }
        },

        // ===== 自动挂机 =====
        { label: '自动挂机', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'wife_cfg.afk_notice',
          label: '挂机收益提示',
          helpMessage: '沉默满2小时再发言自动结算挂机灵石并提示，F关 T开',
          component: 'Select',
          componentProps: {
            options: [
              { label: '开启', value: 'T' },
              { label: '关闭', value: 'F' }
            ]
          }
        },
        {
          field: 'wife_cfg.afk_group',
          label: '挂机提示白名单群',
          helpMessage: '只在这些群提示挂机收益，可添加多个',
          component: 'GTags',
          componentProps: { allowAdd: true, allowDel: true }
        },
        {
          field: 'wife_cfg.afk_hour',
          label: '满几小时没说话才提示',
          helpMessage: '默认24，即沉默满1天后再发言才结算提示',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.afk_money',
          label: '挂机每天最多灵石',
          helpMessage: '默认2400，即一天挂机最多获得2400灵石',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'wife_cfg.afk_lp',
          label: '挂机每天最多灵力',
          helpMessage: '默认300，即一天挂机最多获得300灵力（溢出进累积池，再多消散）',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },

        // ===== 闲置灵石清理 =====
        { label: '闲置灵石清理', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'idle_cfg.enable',
          label: '闲置灵石清理开关',
          helpMessage: '超过N天未使用虚境指令的玩家，每日检查时清空其灵石余额，F关 T开',
          component: 'Select',
          componentProps: {
            options: [
              { label: '开启', value: 'T' },
              { label: '关闭', value: 'F' }
            ]
          }
        },
        {
          field: 'idle_cfg.days',
          label: '闲置天数阈值',
          helpMessage: '默认5，超过5天未使用虚境指令就清空灵石余额',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'idle_cfg.group',
          label: '闲置清理白名单群',
          helpMessage: '只在这些群生效，可添加多个；留空则所有群生效',
          component: 'GTags',
          componentProps: { allowAdd: true, allowDel: true }
        },

        // ===== 幻境试炼 =====
        { label: '幻境试炼', component: 'SOFT_GROUP_BEGIN' },
        {
          field: 'trial_cfg.trial_notice',
          label: '每日排行榜播报',
          helpMessage: '每天0点向白名单群渲染发送排行榜图片，F关 T开',
          component: 'Select',
          componentProps: {
            options: [
              { label: '开启', value: 'T' },
              { label: '关闭', value: 'F' }
            ]
          }
        },
        {
          field: 'trial_cfg.trial_group',
          label: '排行榜播报白名单群',
          helpMessage: '每天0点只向这些群发送排行榜图片，可添加多个',
          component: 'GTags',
          componentProps: { allowAdd: true, allowDel: true }
        },
        {
          field: 'trial_cfg.trial_cd',
          label: '试炼冷却时间(秒)',
          helpMessage: '默认3600，即试炼后需调息1小时才能再次挑战',
          component: 'InputNumber',
          componentProps: { min: 1 }
        },
        {
          field: 'trial_cfg.trial_rounds',
          label: '试炼攻击回合数',
          helpMessage: '默认10，即每次试炼攻击10回合结算总输出(3~30)',
          component: 'InputNumber',
          componentProps: { min: 3, max: 30 }
        }
      ],

      // 读取:返回给前端填充(从 yaml 读出)
      getConfigData() {
        let data = {}
        if (fs.existsSync(cfgPath)) {
          data = YAML.parse(fs.readFileSync(cfgPath, 'utf8')) || {}
        }
        return data
      },

      // 保存:前端点确定后调用
      setConfigData(data, { Result }) {
        try {
          // 深合并,保留 yaml 中未在表单里的配置
          let old = {}
          if (fs.existsSync(cfgPath)) {
            old = YAML.parse(fs.readFileSync(cfgPath, 'utf8')) || {}
          }
          const merged = deepMerge(old, data || {})
          fs.writeFileSync(cfgPath, YAML.stringify(merged, null, 2), 'utf8')
          return Result.ok({}, '保存成功~')
        } catch (err) {
          return Result.fail(err.message || '保存失败')
        }
      }
    }
  }
}

/** 深合并对象 */
function deepMerge(base, patch) {
  const out = { ...base }
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}
