// ===== 房子容量 / 成员 / 超员清理 共享工具(getwife / equip 共用) =====
// 规则:
//  1. 房子可居住人数 = 老婆(1) + 小妾数, 不超过房子 space(满级瑶池仙地30人)
//  2. 无房子记录的用户按默认小破屋(2人)计算
//  3. 超员清理: 保留老婆(跳过shuangxiu中与老婆重复项)、去重、超员从末尾删小妾
//  4. 双修是多人玩法(开银趴, 人越多灵力越多), 未超员小妾绝不删

/** 房子可居住人数: space=-1 仍按无上限兼容旧档(瑶池仙地现为30人) */
export const houseSpace = (house) => {
    const s = Number(house && house.space)
    return s === -1 ? Infinity : (Number.isFinite(s) ? Math.max(0, s) : 0)
}

/** 当前居住人数 = 老婆(1) + 小妾数(排除与老婆重复的项) */
export const residentCount = (home, xq) => {
    let n = 0
    if (home && home.s && Number(home.s) !== 0) n++
    const list = (xq && Array.isArray(xq.shuangxiu)) ? xq.shuangxiu : []
    const wife = (home && home.s) ? String(home.s) : ''
    n += list.filter(x => String(x) !== wife).length
    return n
}

/**
 * 容量检查: 该用户房子能否再容纳 count 位成员(老婆/小妾)
 * @param {object} homejson 家庭存档(uid→{s,wait,money,love})
 * @param {object} inpajson 小妾存档(uid→{shuangxiu,...})
 * @param {object} housejson 房子存档(uid→{space,...})
 * @param {string|number} uid 要检查的用户
 * @param {number} count 新增人数(默认1)
 * @returns {{ ok:boolean, cap:number, cur:number }}
 */
export const canAddResident = (homejson, inpajson, housejson, uid, count = 1) => {
    const house = housejson && housejson[uid]
    const cap = house ? houseSpace(house) : 2//无房子记录默认小破屋2人
    const cur = residentCount(homejson && homejson[uid], inpajson && inpajson[uid])
    return { ok: cur + count <= cap, cap, cur }
}

/** 小破屋模板(无房子时自动补上) */
export const HOUSE_TPL = { name: '小破屋', space: 2, price: 500, loveup: 1, work: 0, hug: 0, cultivate: 0 }

/**
 * 超员清理: 遍历所有用户, 无房子的自动补小破屋(space=2), 超过房子容量的删除多余小妾(保留老婆、去重、跳过与老婆重复项)
 * @param {object} homeData 家庭存档
 * @param {object} houseData 房子存档(会被补上小破屋)
 * @param {object} xqData 小妾存档
 * @returns {{ removed:number, houseChanged:boolean }}
 */
export const cleanOverCapacity = (homeData, houseData, xqData) => {
    if (!homeData || !xqData) return { removed: 0, houseChanged: false }
    let removed = 0
    let houseChanged = false
    for (const [uid, h] of Object.entries(homeData)) {
        if (!h || typeof h !== 'object') continue
        let house = houseData && houseData[uid]
        if (!house) {
            // 无房子记录 → 自动补小破屋
            houseData[uid] = { ...HOUSE_TPL }
            house = houseData[uid]
            houseChanged = true
        }
        const cap = houseSpace(house)
        if (cap === Infinity) continue//满级无上限
        const xq = xqData[uid]
        if (!xq || !Array.isArray(xq.shuangxiu)) continue
        const wife = h.s ? String(h.s) : ''
        // 去重 + 跳过与老婆重复的记录(双修会把老婆也计入shuangxiu)
        const seen = new Set()
        const list = []
        for (const item of xq.shuangxiu) {
            const key = String(item)
            if (key === wife) continue
            if (seen.has(key)) continue
            seen.add(key)
            list.push(item)
        }
        // 超员: 保留老婆(1) + 容量内的小妾, 从末尾删超出的
        const keep = cap - (wife ? 1 : 0)
        const over = list.length - Math.max(0, keep)
        if (over > 0) {
            list.splice(list.length - over, over)
            removed += over
        }
        if (list.length !== xq.shuangxiu.length) xq.shuangxiu = list
    }
    return { removed, houseChanged }
}
