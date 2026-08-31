import path from 'node:path'
import fs from 'node:fs'
import command from '../command.js'
import { Plugin_Name, Plugin_Path } from '../plugin.js'
import puppeteer from '../../model/robot/puppeteer/puppeteer.js'

/** 渲染配置缓存(5秒刷新,支持热更新) */
let _cfg = null
let _cfgAt = 0
async function getCfg () {
  if (_cfg && Date.now() - _cfgAt < 5000) return _cfg
  let cfg = { min_length: 50, max_length: 600 }
  try {
    const min_length = Number(await command.getConfig('reply_cfg', 'min_length'))
    const max_length = Number(await command.getConfig('reply_cfg', 'max_length'))
    cfg = {
      min_length: min_length > 0 ? min_length : 50,
      max_length: max_length > 0 ? max_length : 600
    }
  } catch (err) { /* 配置缺失时使用默认值 */ }
  _cfg = cfg
  _cfgAt = Date.now()
  return cfg
}

/** 随机取一张帮助背景图 */
function pickBg () {
  const dir = path.join(Plugin_Path, 'resources', 'help', 'imgs')
  try {
    if (!fs.existsSync(dir)) return ''
    const list = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    if (!list.length) return ''
    return list[Math.floor(Math.random() * list.length)]
  } catch (err) {
    return ''
  }
}

/** 展开嵌套数组段(oicq 的 segment.at/atme 可能返回数组形式) */
function flattenSegs (msg) {
  if (Array.isArray(msg)) return msg.flat(Infinity)
  return msg
}

/* 富媒体段类型(含这些则不是纯文本, 不渲染) */
const RICH_SEG_TYPES = ['image', 'video', 'record', 'file', 'forward', 'json', 'xml', 'share', 'gift', 'music']

/**
 * 是否为纯文本消息(可渲染成图片)
 * 采用黑名单式: 只要不含图片/视频/文件等富媒体段就视为可渲染,兼容不同 oicq 版本的段结构
 */
export function isPlainText (msg) {
  const flat = flattenSegs(msg)
  if (typeof flat === 'string') {
    // base64 图片
    if (/^base64:\/\//i.test(flat)) return false
    // 疑似 base64 图片数据(超长且含字母, 无空白)
    if (flat.length > 500 && /^[A-Za-z0-9+/=]+$/.test(flat) && /[A-Za-z]/.test(flat)) return false
    return true
  }
  if (Array.isArray(flat)) {
    if (!flat.length) return false
    return flat.every(i => {
      if (typeof i === 'string') return true
      if (i && typeof i === 'object' && typeof i.type === 'string') {
        // 非富媒体段(含at/face/任意未知文本段)一律视为可渲染
        return !RICH_SEG_TYPES.includes(i.type)
      }
      return false
    })
  }
  return false
}

/** 提取纯文本 */
function extractText (msg) {
  const flat = flattenSegs(msg)
  if (typeof flat === 'string') return flat
  if (Array.isArray(flat)) {
    let text = ''
    for (const i of flat) {
      if (typeof i === 'string') text += i
      else if (i && typeof i === 'object' && i.type === 'text' && i.text) text += i.text
      else if (i && typeof i === 'object' && i.type === 'at') text += (i.text || `@${i.qq || ''} `)
    }
    return text
  }
  return ''
}

/** 文本分页(按行, 单页不超过 max 字符) */
function splitText (text, max) {
  const pages = []
  let cur = ''
  const flush = () => { if (cur) { pages.push(cur); cur = '' } }
  for (const line of String(text).split('\n')) {
    if (line.length > max) {
      flush()
      for (let i = 0; i < line.length; i += max) pages.push(line.slice(i, i + max))
      continue
    }
    if (cur.length + line.length + 1 > max) {
      flush()
      cur = line
    } else {
      cur = cur ? cur + '\n' + line : line
    }
  }
  flush()
  return pages.length ? pages : [String(text)]
}

/** 渲染文本为图片(返回 oicq 图片消息数组); 不传 max 默认不分页, 全部内容渲染成一张长图 */
async function renderText (text, max, options = {}) {
  const pages = splitText(text, max || Infinity)
  const bg = pickBg()
  const resPath = `../../../../../plugins/${Plugin_Name}/resources/`
  // 与帮助模板一致的目录层级(xujing-yue-plugin/text/index),保证相对资源路径正确(否则css/背景加载失败)
  const tplName = `${Plugin_Name}/text/index`
  try { fs.mkdirSync(path.join(process.cwd(), 'data', 'html', Plugin_Name, 'text', 'index'), { recursive: true }) } catch (err) {}
  const imgs = []
  for (const [i, page] of pages.entries()) {
    const img = await puppeteer.screenshot(tplName, {
      tplFile: path.join(Plugin_Path, 'resources', 'text', 'index.html'),
      pluResPath: resPath,
      _res_path: resPath,
      saveId: `text-${Date.now()}-${i}`,
      bg,
      content: page,
      columns: options.columns || 1,
      leftContent: options.leftContent || '',
      rightContent: options.rightContent || '',
      column1Content: options.column1Content || '',
      column2Content: options.column2Content || '',
      column3Content: options.column3Content || '',
      pageInfo: pages.length > 1 ? `${i + 1}/${pages.length}` : '',
      quality: 100,
      pageGotoParams: { waitUntil: 'networkidle0' }
    })
    if (img) imgs.push(img)
  }
  return imgs
}

/** 制作转发消息(多图) */
async function makeForward (e, imgs) {
  try {
    const nodes = imgs.map(img => ({
      message: img,
      nickname: (Bot && Bot.nickname) || '虚境',
      user_id: (Bot && Bot.uin) || 0
    }))
    if (e && e.isGroup && e.group) return await e.group.makeForwardMsg(nodes)
    if (e && e.friend) return await e.friend.makeForwardMsg(nodes)
  } catch (err) {
    if (logger && logger.error) logger.error(`[虚境][转发图片失败]${err}`)
  }
  return imgs // 失败回退: 多图直接发
}

/**
 * 回复入口: 长文本 → 渲染图片(超长自动分页并用转发发送); 一句话/短消息直接发文字
 * @returns 最终要发送的消息
 */
export async function maybeToImg (e, msg) {
  try {
    if (!isPlainText(msg)) {
      console.log('[虚境][render] 非纯文本(含图片/视频等富媒体), 不渲染')
      return msg
    }
    const text = extractText(msg)
    if (!text || !text.trim()) {
      console.log('[虚境][render] 空文本, 不渲染')
      return msg
    }
    const cfg = await getCfg()
    // 一句话/单行短消息: 不渲染, 直接发文字; 多行/长消息一律渲染成图片
    if (text.length < cfg.min_length && !text.includes('\n')) {
      console.log(`[虚境][render] 短消息(${text.length}字, 阈值${cfg.min_length}), 不渲染`)
      return msg
    }
    console.log(`[虚境][render] 长消息(${text.length}字) → 渲染图片`)
    const imgs = await renderText(text)
    if (!imgs.length) {
      // 判定可渲染但图片生成失败(多半是puppeteer问题,保留此日志便于排查)
      console.log(`[虚境插件][渲染失败] 文本长度${text.length}, 图片生成为空`)
      return msg
    }
    // 单张 → 直接发图片; 多张 → 转发套起来
    if (imgs.length === 1) return imgs[0]
    return await makeForward(e, imgs)
  } catch (err) {
    if (logger && logger.error) logger.error(`[虚境][图片回复失败]${err}`)
    return msg
  }
}

/**
 * 转发消息节点处理: 相邻纯文本合并为一段,整段按 max_length 分页渲染成图片
 * (如幻境试炼一回合一段的记录会合成一张图); 短文本(<min_length)保持文字; 图片/富媒体节点原样
 * @returns {Array} 可发送的消息数组(文本或图片)
 */
export async function buildForwardNodes (message) {
  const merged = []
  for (const item of (message || [])) {
    if (isPlainText(item)) {
      const text = extractText(item)
      const last = merged[merged.length - 1]
      if (last && last.__text !== undefined) last.__text += '\n' + text
      else merged.push({ __text: text })
    } else {
      merged.push(item)
    }
  }
  const cfg = await getCfg()
  const nodes = []
  for (const item of merged) {
    if (item && item.__text !== undefined) {
      const text = item.__text
      // 一句话/单行短消息: 保持文字; 多行/长消息渲染成图片
      if (text.length < cfg.min_length && !text.includes('\n')) { nodes.push(text); continue }
      const imgs = await renderText(text)
      if (imgs.length) nodes.push(...imgs)
      else nodes.push(text)
    } else {
      nodes.push(item)
    }
  }
  return nodes
}

/**
 * 单节点文本 → 图片(战斗转发节点用); 图片/富媒体/单行短消息原样返回
 */
export async function nodeToImg (msg) {
  try {
    if (!isPlainText(msg)) return msg
    const text = extractText(msg)
    if (!text || !text.trim()) return msg
    const cfg = await getCfg()
    if (text.length < cfg.min_length && !text.includes('\n')) return msg
    const imgs = await renderText(text)
    return imgs.length ? imgs : msg
  } catch (err) {
    return msg
  }
}

/**
 * 无事件对象时渲染文本为图片(定时/自动播报用)
 * @param {number} [max] 单页最大字符数; 不传则不分页, 全部内容渲染成一张长图
 * @param {object} [options] 图片布局选项, 支持 columns、leftContent、rightContent、column1Content、column2Content、column3Content
 * @returns 图片消息 或 null(单行短消息/渲染失败)
 */
export async function textToImg (text, max, options = {}) {
  try {
    if (!text || !text.trim()) return null
    const cfg = await getCfg()
    if (text.length < cfg.min_length && !text.includes('\n')) return null
    const imgs = await renderText(text, max, options)
    return imgs[0] || null
  } catch (err) {
    return null
  }
}
