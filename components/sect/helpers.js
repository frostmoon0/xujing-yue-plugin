import { textToImg } from '../common-lib/reply-img.js'
import { POS, sectName } from '../fake_data.js'
import { REGIONS, getLoc, getWorld, regionNameOf } from '../world_data.js'

export function fmtTime (t) {
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function replyLines (e, title, lines) {
  const full = [title, ...lines]
  let img = null
  try { img = await textToImg(full.join('\n')) } catch (err) { }
  if (img) e.reply(img)
  else e.reply(full.join('\n'))
}

export const getPlayer = (f, uid) => (f.players && f.players[String(uid)]) || null
export const posCn = (pos) => (POS[pos] && POS[pos].cn) || pos || '弟子'

export function regionOfArea (area) {
  for (const k of Object.keys(REGIONS)) {
    if (REGIONS[k].areas.includes(area)) return k
  }
  return null
}

export function sectRegion (f, id) {
  const s = f.sects[id]
  if (s && s.region) return s.region
  const cnt = {}
  for (const [area, owner] of Object.entries(f.areas || {})) {
    if (owner === id) {
      const r = regionOfArea(area)
      if (r) cnt[r] = (cnt[r] || 0) + 1
    }
  }
  let best = 'center'
  let bn = 0
  for (const [r, n] of Object.entries(cnt)) if (n > bn) { best = r; bn = n }
  if (s) s.region = best
  return best
}

export function sameRegion (e, f, sid) {
  const gid = String(e.group_id || '')
  const w = getWorld(gid)
  const myLoc = getLoc(w, e.user_id)
  const sReg = sectRegion(f, sid)
  if (myLoc !== sReg) return { ok: false, msg: `你位于【${regionNameOf(myLoc)}】，宗门【${sectName(f, sid)}】在【${regionNameOf(sReg)}】，请先 #去${regionNameOf(sReg)} 再操作~` }
  return { ok: true }
}

export function relTxt (f, sid) {
  const s = f.sects[sid]
  const al = ((s && s.allies) || []).map(aid => sectName(f, aid)).filter(n => n && n !== '未知')
  const en = ((s && s.enemies) || []).map(eid => sectName(f, eid)).filter(n => n && n !== '未知')
  return `盟友：${al.length ? al.join('、') : '无'}　敌对：${en.length ? en.join('、') : '无'}`
}
