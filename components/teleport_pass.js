import { getBag, hasDingxianyou } from './equip_data.js'
import { getBoss } from './boss_data.js'

/**
 * 跨区资格：只有定仙游提供免费传送；争夺中的登仙令持有者没有定仙游时禁止跨区。
 * 已收入背包的登仙令只是渡劫飞升凭证，不影响跨区。
 */
export function teleportPass (uid, gid) {
  const dingxianyou = hasDingxianyou(getBag(uid, gid))
  const boss = getBoss(gid)
  const activeToken = !!(boss.token && boss.token.holder && String(boss.token.holder) === String(uid) && boss.token.end > Date.now())
  return {
    free: dingxianyou,
    reason: dingxianyou ? '定仙游' : '',
    activeToken,
    blocked: activeToken && !dingxianyou
  }
}
