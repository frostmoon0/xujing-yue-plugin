/* ============================================================
 * 虚境灵兽(宠物) - 物种与血脉数据
 * 血脉(BLOODLINES)定品质档位(1~7: 白绿蓝紫金红彩)与属性倾向
 * 物种(SPECIES)定具体形态/大区/繁殖方式, 每物种归属一个血脉
 *
 * 命名原则(修仙小说风, 按玩家要求重做):
 *  - 全部为修仙/玄幻小说耳熟能详的妖兽灵兽名(疾风狼/啸月狼/紫电貂/
 *    火灵狐/玄冰蟒/噬金蚁/三足金蟾/踏云驹/龙鳞马/九幽蟒等)
 *  - 无现实动物(家畜家禽宠物全去掉), 山海经只保留最出名的几个
 * 特殊秘境预留: 物种可带 origin:'secret', 通过 registerPetSpecies 注入
 * ============================================================ */

/** 品质(与装备系统一致: 1白 2绿 3蓝 4紫 5金 6红 7彩) */
export const PET_QUALITY = {
  1: { icon: '⚪', name: '白色' },
  2: { icon: '🟢', name: '绿色' },
  3: { icon: '🔵', name: '蓝色' },
  4: { icon: '🟣', name: '紫色' },
  5: { icon: '🟡', name: '金色' },
  6: { icon: '🔴', name: '红色' },
  7: { icon: '🌈', name: '彩色' }
}
export function qualityNameOf (tier) {
  const q = PET_QUALITY[tier]
  return q ? `${q.icon}${q.name}` : '未知'
}

/** 大区名(与 world_data.REGIONS 一致; mixed=混池) */
export const PET_REGION_NAME = {
  center: '中州', east: '东海', west: '西域', north: '北境', south: '南疆', mixed: '混池'
}
export function petRegionNameOf (key) {
  return PET_REGION_NAME[key] || key || '未知'
}

/* ---------- 血脉表: id -> { id, name, quality, lean, desc } ---------- */
export const BLOODLINES = {
  /* 1 白 凡品 */
  fan:     { id: 'fan',     name: '凡兽血脉', quality: 1, lean: 'balanced', desc: '尘世常见野兽，灵智初开，平凡无奇。' },
  chentu:  { id: 'chentu',  name: '尘土血脉', quality: 1, lean: 'balanced', desc: '生于凡尘土木，灵蕴浅薄，胜在随处可见。' },
  /* 2 绿 下品 */
  shanlin: { id: 'shanlin', name: '山林血脉', quality: 2, lean: 'def',      desc: '山林灵气滋养，皮骨坚韧，耐力出众。' },
  xize:    { id: 'xize',    name: '溪泽血脉', quality: 2, lean: 'hp',       desc: '溪泽水汽蕴灵，体魄绵长，气血悠远。' },
  huangyuan: { id: 'huangyuan', name: '荒原血脉', quality: 2, lean: 'atk',  desc: '荒原烈风淬体，凶性渐生，爪牙锋利。' },
  /* 3 蓝 中品 */
  lingmei: { id: 'lingmei', name: '灵魅血脉', quality: 3, lean: 'balanced', desc: '山中灵魅，通晓吐纳化形，机敏狡黠。' },
  yunhe:   { id: 'yunhe',   name: '云鹤血脉', quality: 3, lean: 'atk',      desc: '翱翔云端的灵禽血脉，锐目如电。' },
  shuiyi:  { id: 'shuiyi',  name: '水裔血脉', quality: 3, lean: 'hp',       desc: '江河湖海之裔，水性天成，气血绵长。' },
  shanyue: { id: 'shanyue', name: '山岳血脉', quality: 3, lean: 'def',      desc: '巍巍山岳凝魂，身如磐石，防御天成。' },
  /* 4 紫 上品 */
  yaoling: { id: 'yaoling', name: '妖灵血脉', quality: 4, lean: 'atk',      desc: '妖气缠绕，凶戾强横，来去如风。' },
  yiwei:   { id: 'yiwei',   name: '异种血脉', quality: 4, lean: 'balanced', desc: '异兽异种，天资不凡，非寻常之物。' },
  youmei:  { id: 'youmei',  name: '幽魅血脉', quality: 4, lean: 'hp',       desc: '幽冥之气附体，诡异难测，神出鬼没。' },
  leize:   { id: 'leize',   name: '雷泽血脉', quality: 4, lean: 'atk',      desc: '雷泽淬炼，攻势凌厉，动若奔雷。' },
  /* 5 金 地阶 */
  xuangui: { id: 'xuangui', name: '玄龟血脉', quality: 5, lean: 'def',      desc: '玄武旁支，寿元绵长，甲壳坚不可摧。' },
  tianying: { id: 'tianying', name: '天鹰血脉', quality: 5, lean: 'atk',    desc: '九天之上，俯瞰苍生，一击必中。' },
  shanjun: { id: 'shanjun', name: '山君血脉', quality: 5, lean: 'atk',      desc: '百兽之王，威压山野，吼镇群邪。' },
  xuanmang: { id: 'xuanmang', name: '玄蟒血脉', quality: 5, lean: 'def',    desc: '蟒中王侯，鳞甲如铁，绞杀万物。' },
  shenhai: { id: 'shenhai', name: '深海血脉', quality: 5, lean: 'hp',       desc: '深海巨灵，底蕴无尽，翻江倒海。' },
  longyi:  { id: 'longyi',  name: '龙裔血脉', quality: 5, lean: 'balanced', desc: '真龙与万灵杂交之后，潜龙在渊，不可小觑。' },
  /* 6 红 天阶 */
  zhuque:  { id: 'zhuque',  name: '朱雀血脉', quality: 6, lean: 'atk',      desc: '南方火德，焚尽万物，浴火愈烈。' },
  tianyao: { id: 'tianyao', name: '天妖血脉', quality: 6, lean: 'atk',      desc: '上古天妖后裔，凶威滔天，肆虐八荒。' },
  gushang: { id: 'gushang', name: '上古遗脉', quality: 6, lean: 'balanced', desc: '上古残存的血脉，神秘莫测，底蕴深厚。' },
  mingyuan: { id: 'mingyuan', name: '冥渊血脉', quality: 6, lean: 'hp',     desc: '冥渊之气缠绕，阴寒蚀骨，噬魂夺魄。' },
  huanggu: { id: 'huanggu', name: '荒古血脉', quality: 6, lean: 'balanced', desc: '荒古年间遗泽，气血如龙，凶横无匹。' },
  /* 7 彩 神兽 */
  zhenlong: { id: 'zhenlong', name: '真龙血脉', quality: 7, lean: 'atk',    desc: '万灵之首，真龙一脉，气吞山河，叱咤风云。' },
  fenghuang: { id: 'fenghuang', name: '凤凰血脉', quality: 7, lean: 'hp',   desc: '百鸟之王，涅槃重生，浴火不死，祥瑞之极。' },
  xuanwu:  { id: 'xuanwu',  name: '玄武血脉', quality: 7, lean: 'def',      desc: '北方水神，龟蛇同体，防御无双，寿与天齐。' },
  baihu:   { id: 'baihu',   name: '白虎血脉', quality: 7, lean: 'atk',      desc: '西方金煞，杀伐果决，锐不可当。' },
  qilin:   { id: 'qilin',   name: '麒麟血脉', quality: 7, lean: 'balanced', desc: '瑞兽之首，仁德之相，福泽绵长。' },
  jiao:    { id: 'jiao',    name: '蛟龙血脉', quality: 7, lean: 'balanced', desc: '非真龙而通龙性，化龙有望，锋芒内敛。' },
  kunpeng: { id: 'kunpeng', name: '鲲鹏血脉', quality: 7, lean: 'atk',      desc: '北冥有鱼，化而为鹏，扶摇直上九万里。' },
  zhulong: { id: 'zhulong', name: '烛龙血脉', quality: 7, lean: 'hp',       desc: '烛照九幽，睁目为昼，闭目为夜，威能莫测。' },
  jiuye:   { id: 'jiuye',   name: '九尾血脉', quality: 7, lean: 'atk',      desc: '九尾灵狐一脉，惑尽苍生，媚而不妖。' }
}
export const BLOODLINE_IDS = Object.keys(BLOODLINES)
export function bloodlineOf (id) {
  return BLOODLINES[id] || null
}
/** 某品质档的所有血脉 */
export function bloodlinesOfQuality (tier) {
  return BLOODLINE_IDS.map(id => BLOODLINES[id]).filter(b => b.quality === Number(tier))
}

/* ---------- 属性倾向(血脉 lean) ---------- */
export const LEAN_BIAS = {
  atk:      { atk: 1,   def: -0.7, hp: -0.2 },
  def:      { atk: -0.7, def: 1,  hp: 0.3 },
  hp:       { atk: -0.4, def: 0.2, hp: 1 },
  balanced: { atk: 0,   def: 0,   hp: 0 }
}

/* ---------- 属性分配(物种 archetype) ---------- */
export const ARCH_BIAS = {
  beast:    { atk: 0,    def: 0,    hp: 0 },
  bird:     { atk: 0.9,  def: -0.8, hp: -0.3 },
  aquatic:  { atk: -0.4, def: -0.3, hp: 1 },
  insect:   { atk: 0.8,  def: -1.2, hp: -0.9 },
  plant:    { atk: -1.4, def: 1,    hp: 1 },
  dragon:   { atk: 0.6,  def: 0.2,  hp: 0.6 },
  scale:    { atk: -0.4, def: 1.1,  hp: 0.1 },
  yaogui:   { atk: 1,    def: -0.5, hp: 0 }
}
export const ARCH_NAME = {
  beast: '兽类', bird: '禽鸟', aquatic: '水族', insect: '虫类',
  plant: '灵植', dragon: '龙属', scale: '鳞甲', yaogui: '妖兽'
}

/* ============================================================
 * 签名物种(手写, 红/彩 + 有名气的金/紫)
 * 修仙/玄幻经典神兽与凶兽, 不堆砌山海经
 * [name, bloodline, archetype, zone, eggLaying, rarityWeight, desc]
 * ============================================================ */
const SIGNATURE = [
  /* ---- 彩·神兽(修仙界鼎鼎大名) ---- */
  ['五爪金龙', 'zhenlong', 'dragon', 'center', 1, 1, '真龙一脉最尊贵者，五爪祥云缠绕，鳞甲流光溢彩，气吞山河。'],
  ['应龙', 'zhenlong', 'dragon', 'center', 1, 1, '有翼之龙，曾助先贤伐定四方，翼展遮天，雷鸣电掣。'],
  ['蟠龙', 'zhenlong', 'dragon', 'center', 1, 1, '盘踞山川未化之龙，得道后可飞升九天，吞吐间山河震颤。'],
  ['青龙', 'zhenlong', 'dragon', 'east', 1, 1, '东方青木之龙，司掌春风化雨，鳞甲如碧玉，行云布雨。'],
  ['白龙马', 'zhenlong', 'dragon', 'west', 1, 1, '西海龙王三太子所化，踏云而来，白鬃如雪，俊逸无双。'],
  ['火凤', 'fenghuang', 'bird', 'south', 1, 1, '南疆火德凤凰，涅槃重生，浴火不死，翱翔于火山之巅。'],
  ['青鸾', 'fenghuang', 'bird', 'center', 1, 1, '凤凰之亚，青羽流光，鸣则祥和，为吉祥之禽。'],
  ['冰凤', 'fenghuang', 'bird', 'north', 1, 1, '凤凰寒裔，羽如冰晶，振翅间风雪漫天。'],
  ['金乌', 'fenghuang', 'bird', 'west', 1, 1, '负日而行的三足金乌，金光灼灼，栖于烈日荒漠，焚尽邪祟。'],
  ['麒麟', 'qilin', 'beast', 'center', 0, 1, '仁兽之首，四蹄生云，所至之处枯木逢春，祥瑞之兆。'],
  ['墨麒麟', 'qilin', 'beast', 'east', 0, 1, '通体墨黑的麒麟，曾为姜尚坐骑，踏平九州烽烟。'],
  ['貔貅', 'qilin', 'beast', 'center', 0, 1, '招财瑞兽，只进不出，金银所至皆入囊中，修士争相供养。'],
  ['白泽', 'qilin', 'beast', 'north', 0, 1, '通晓万物之灵兽，能言，知天下鬼神之事，智者之兽。'],
  ['玄武', 'xuanwu', 'scale', 'east', 1, 1, '北方水神，龟蛇交缠，沉眠北海，一出则天地变色。'],
  ['玄龟', 'xuanwu', 'scale', 'center', 1, 1, '神龟通灵，背负河图洛书，寿可千岁，防御冠绝当世。'],
  ['白虎', 'baihu', 'beast', 'west', 0, 1, '西方金煞化形，通体雪白无杂，杀伐果决，百兽见之辟易。'],
  ['九尾狐', 'jiuye', 'beast', 'south', 0, 1, '青丘九尾灵狐，一尾一智，九尾尽出则通晓天命。'],
  ['鲲鹏', 'kunpeng', 'bird', 'east', 1, 1, '北冥有鱼，其名为鲲，化而为鹏，水击三千里，扶摇直上。'],
  ['天马', 'kunpeng', 'beast', 'center', 0, 1, '天马行空，四蹄踏云，日行万里，来去无踪。'],
  ['金翅大鹏', 'kunpeng', 'bird', 'west', 1, 1, '翅若垂天之云，翼展遮天，一振翅便是九万里，凶名赫赫。'],
  ['蛟', 'jiao', 'dragon', 'east', 1, 1, '潜于深渊的蛟，身披鳞甲，一朝化龙则翻江倒海。'],
  ['螭', 'jiao', 'dragon', 'center', 1, 1, '无角之龙，常雕于殿柱之上，性情温良而通水泽。'],
  ['虬', 'jiao', 'dragon', 'east', 1, 1, '有角小龙，盘踞于深潭古井，隐有龙气，不可轻侮。'],
  ['烛龙', 'zhulong', 'dragon', 'north', 1, 1, '人面蛇身而赤，烛照九幽，睁目为昼，闭目为夜。'],
  /* ---- 红·天阶(修仙界凶名赫赫) ---- */
  ['朱雀', 'zhuque', 'bird', 'south', 1, 3, '南方火德神鸟，一身赤羽如烈焰，司掌炎夏，鸣则焚天。'],
  ['毕方', 'zhuque', 'bird', 'east', 1, 3, '上古神鸟，青身赤足白喙，其鸣叫，则见其地有火。'],
  ['精卫', 'gushang', 'bird', 'east', 1, 3, '炎帝之女所化，衔石填海，矢志不移，至孝至坚。'],
  ['天狗', 'gushang', 'beast', 'west', 0, 3, '状如狸而白首，声如榴榴，可御凶，亦通星象。'],
  ['饕餮', 'huanggu', 'yaogui', 'south', 0, 3, '上古凶兽，羊身人面，食量无度，贪得无厌，位列四凶。'],
  ['年兽', 'huanggu', 'yaogui', 'center', 0, 3, '岁末出没之凶兽，惧红惧响，爆竹声起便仓皇遁去。'],
  ['山魈', 'tianyao', 'yaogui', 'south', 0, 3, '形似巨猿而面如鬼魅，生于深山，力大无穷，旧时山民奉为山神。'],
  ['鲛人', 'mingyuan', 'aquatic', 'east', 0, 3, '居于南海的鲛人，织水为绡，泣泪成珠，人身鱼尾。'],
  ['青狮', 'tianyao', 'beast', 'south', 0, 3, '曾为普贤坐骑的狮王，青鬃如焰，咆哮震山，凶焰滔天。'],
  ['白象', 'huanggu', 'beast', 'south', 0, 3, '六牙白象，佛门瑞兽，象牙如白玉，踏地生莲。'],
  ['哮天犬', 'tianyao', 'beast', 'west', 0, 3, '哮天犬，神将二郎真君座下神犬，啸声惊天，噬妖如常。'],
  ['避水金睛兽', 'shenhai', 'beast', 'east', 0, 3, '金睛火眼，能避万水，踏波而行，寻常水兽见之辟易。'],
  ['五色神牛', 'huanggu', 'beast', 'east', 0, 3, '封神中黄飞虎坐骑，皮毛五色，力可撼山，蹄下生风雷。'],
  ['獬豸', 'qilin', 'beast', 'center', 0, 3, '独角神兽，能辨曲直，明断是非，正气凛然，万邪不侵。'],
  /* ---- 金·地阶(知名妖兽/龙生九子) ---- */
  ['狻猊', 'longyi', 'beast', 'center', 0, 6, '龙生九子之一，形如狮子，喜静好坐，常踞香炉吞吐烟火。'],
  ['霸下', 'longyi', 'scale', 'center', 1, 6, '龙生九子之一，力大无穷，负山而立，撼地无垠。'],
  ['狴犴', 'shanjun', 'beast', 'center', 0, 6, '龙生九子之一，形似猛虎，性刚烈，好诉讼断狱。'],
  ['囚牛', 'longyi', 'dragon', 'center', 1, 6, '龙生九子之一，喜音乐，常立琴头聆听世间曲调。'],
  ['蒲牢', 'longyi', 'dragon', 'center', 1, 6, '龙生九子之一，好鸣，声震九霄，常踞钟钮。'],
  ['赑屃', 'longyi', 'scale', 'center', 1, 6, '龙生九子之一，力大负碑，驮尽人间功德碑文。'],
  ['螭吻', 'longyi', 'dragon', 'center', 1, 6, '龙生九子之一，好吞，常踞屋脊镇火辟邪。'],
  ['椒图', 'longyi', 'scale', 'center', 1, 6, '龙生九子之一，性最守静，闭口不言，常护门环。'],
  ['负屃', 'longyi', 'scale', 'center', 1, 6, '龙生九子之一，好斯文，常负石碑文，雅性天成。'],
  ['谛听', 'longyi', 'beast', 'south', 0, 6, '地藏菩萨坐骑，能聆听三界，辨明善恶，神通广大。'],
  ['四不像', 'longyi', 'beast', 'east', 0, 6, '角似鹿面似马蹄似牛尾似驴，姜尚曾乘之伐纣，祥瑞异兽。'],
  ['金蟾', 'xuangui', 'scale', 'center', 1, 6, '口衔钱串的灵蟾，三足鼎立，金蟾一吐，财源广进。'],
  ['三足金蟾', 'xuangui', 'scale', 'center', 1, 6, '万年金蟾化形三足，腹藏乾坤，为聚财纳福之灵物。'],
  ['踏云驹', 'tianying', 'beast', 'center', 0, 6, '四蹄踏云，日行千里，为金丹修士梦寐以求的坐骑。'],
  ['龙鳞马', 'longyi', 'beast', 'center', 0, 6, '身披龙鳞的灵驹，隐隐有龙气，嘶鸣间雷声隐隐。'],
  ['金瞳雕', 'tianying', 'bird', 'north', 1, 6, '金瞳如焰，翼展数丈，高空盘旋，猎物无所遁形。'],
  ['碧眼金雕', 'tianying', 'bird', 'center', 1, 6, '碧眼泛金光，利爪如钩，一抓之力可裂金铁。'],
  ['赤焰狮', 'shanjun', 'beast', 'west', 0, 6, '鬃毛如赤焰燃烧，一声怒吼，方圆数里尽成焦土。'],
  ['雷纹虎', 'shanjun', 'beast', 'west', 0, 6, '虎身遍布雷纹，动辄电光缭绕，吼声如雷。'],
  ['玄冰蛛', 'youmei', 'insect', 'north', 1, 6, '吐丝成冰的灵蛛，蛛网坚逾精钢，猎物触之即冻。'],
  ['噬金蚁', 'leize', 'insect', 'center', 1, 6, '以金铁为食的蚁群，所过之处刀兵尽蚀，如蝗虫过境。']
]

/* ============================================================
 * 中低档修仙妖兽(按大区, 按品质档分组)
 * 名字均为修仙/玄幻小说常见妖兽, 非随机拼接
 * { zone: { tier: [[name, bloodline, archetype, egg], ...] } }
 * ============================================================ */
const ZONE_BEASTS = {
  /* 中州: 山林平原灵气灵兽 */
  center: {
    1: [
      ['灰毛狼', 'fan', 'beast', 0], ['青皮狼', 'fan', 'beast', 0], ['山猫', 'fan', 'beast', 0],
      ['野狐', 'fan', 'beast', 0], ['灵兔', 'fan', 'beast', 0], ['苍鹿', 'fan', 'beast', 0],
      ['野牛', 'fan', 'beast', 0], ['斑羚', 'fan', 'beast', 0], ['獐子', 'fan', 'beast', 0],
      ['野猪', 'fan', 'beast', 0], ['灰鼠', 'fan', 'beast', 0], ['鼬鼠', 'fan', 'beast', 0],
      ['白狸', 'fan', 'beast', 0], ['灰貂', 'fan', 'beast', 0], ['刺猬', 'fan', 'beast', 0],
      ['野雉', 'fan', 'bird', 1], ['麻雀', 'fan', 'bird', 1], ['喜鹊', 'fan', 'bird', 1],
      ['乌鸦', 'fan', 'bird', 1], ['草蛇', 'fan', 'scale', 1], ['土龟', 'fan', 'scale', 1],
      ['蝗虫', 'fan', 'insect', 1], ['萤火虫', 'fan', 'insect', 1], ['蝼蚁', 'fan', 'insect', 1],
      ['野蘑菇', 'fan', 'plant', 0], ['车前草', 'fan', 'plant', 0]
    ],
    2: [
      ['疾风狼', 'shanlin', 'beast', 0], ['铁背狼', 'shanlin', 'beast', 0], ['赤狐', 'shanlin', 'beast', 0],
      ['灵狐', 'shanlin', 'beast', 0], ['白狐', 'shanlin', 'beast', 0], ['玉兔', 'xize', 'beast', 0],
      ['灵猴', 'shanlin', 'beast', 0], ['通臂猿', 'shanlin', 'beast', 0], ['花豹', 'shanlin', 'beast', 0],
      ['黑豹', 'huangyuan', 'beast', 0], ['灵貂', 'shanlin', 'beast', 0], ['紫貂', 'shanlin', 'beast', 0],
      ['青鹿', 'shanyue', 'beast', 0], ['灵猿', 'lingmei', 'beast', 0], ['山雕', 'yunhe', 'bird', 1],
      ['游隼', 'yunhe', 'bird', 1], ['翠鸟', 'xize', 'bird', 1], ['百灵鸟', 'yunhe', 'bird', 1],
      ['黄鹂', 'lingmei', 'bird', 1], ['山雀', 'fan', 'bird', 1], ['青蛇', 'shanlin', 'scale', 1],
      ['灵龟', 'xize', 'scale', 1], ['林蛙', 'xize', 'scale', 1], ['草蜥', 'shanlin', 'scale', 1],
      ['灵芝草', 'lingmei', 'plant', 0], ['茯苓', 'shanlin', 'plant', 0]
    ],
    3: [
      ['啸月狼', 'lingmei', 'beast', 0], ['赤焰狐', 'leize', 'beast', 0], ['玉面狐', 'lingmei', 'beast', 0],
      ['碧眼灵猿', 'lingmei', 'beast', 0], ['金刚猿', 'shanyue', 'beast', 0], ['幽冥豹', 'youmei', 'beast', 0],
      ['玄猫', 'youmei', 'beast', 0], ['雷貂', 'leize', 'beast', 0], ['火猴', 'leize', 'beast', 0],
      ['紫瞳狼', 'yaoling', 'beast', 0], ['风影豹', 'lingmei', 'beast', 0], ['青羽鹰', 'yunhe', 'bird', 1],
      ['铁爪隼', 'yunhe', 'bird', 1], ['玄鸟', 'youmei', 'bird', 1], ['火鸦', 'leize', 'bird', 1],
      ['青蟒', 'shanlin', 'scale', 1], ['玄龟', 'xize', 'scale', 1], ['赤练蛇', 'leize', 'scale', 1],
      ['灵鹤', 'yunhe', 'bird', 1], ['碧竹蛇', 'lingmei', 'scale', 1], ['金线蛙', 'xize', 'scale', 1],
      ['灵草精', 'lingmei', 'plant', 0], ['青藤妖', 'lingmei', 'plant', 0]
    ],
    4: [
      ['嗜血狼', 'yaoling', 'beast', 0], ['魅影狐', 'youmei', 'beast', 0], ['通灵猿', 'yiwei', 'beast', 0],
      ['大力猿', 'yaoling', 'beast', 0], ['魔纹豹', 'yaoling', 'beast', 0], ['玄影豹', 'youmei', 'beast', 0],
      ['紫电貂', 'leize', 'beast', 0], ['赤炎猴', 'leize', 'beast', 0], ['幽冥猫', 'youmei', 'beast', 0],
      ['寒鸦', 'youmei', 'bird', 1], ['赤羽鹰', 'leize', 'bird', 1], ['黑翼鹰', 'yaoling', 'bird', 1],
      ['九幽蟒', 'youmei', 'scale', 1], ['火纹蟒', 'leize', 'scale', 1], ['金冠雕', 'tianying', 'bird', 1],
      ['碧眼鹰', 'yiwei', 'bird', 1], ['雷竹精', 'leize', 'plant', 0], ['寒月狐', 'youmei', 'beast', 0],
      ['裂山熊', 'shanyue', 'beast', 0], ['紫翼蝙蝠', 'youmei', 'insect', 1]
    ],
    5: [
      ['赤炎狮', 'shanjun', 'beast', 0], ['金毛狮', 'shanjun', 'beast', 0], ['金瞳雕', 'tianying', 'bird', 1],
      ['碧眼金雕', 'tianying', 'bird', 1], ['仙鹤', 'gushang', 'bird', 1], ['金蟾', 'xuangui', 'scale', 1],
      ['三足金蟾', 'xuangui', 'scale', 1], ['踏云驹', 'tianying', 'beast', 0], ['龙鳞马', 'longyi', 'beast', 0],
      ['噬金蚁', 'leize', 'insect', 1], ['玄冰蛛', 'youmei', 'insect', 1], ['虎王', 'shanjun', 'beast', 0],
      ['狮王', 'shanjun', 'beast', 0], ['玉麒麟幼兽', 'qilin', 'beast', 0]
    ]
  },
  /* 东海: 江河湖海水族灵兽 */
  east: {
    1: [
      ['银鱼', 'fan', 'aquatic', 1], ['草鲤', 'fan', 'aquatic', 1], ['青鲢', 'fan', 'aquatic', 1],
      ['灰虾', 'fan', 'scale', 1], ['小蟹', 'fan', 'scale', 1], ['田螺', 'fan', 'aquatic', 1],
      ['河蚌', 'fan', 'aquatic', 1], ['水母', 'fan', 'aquatic', 0], ['芦苇鱼', 'fan', 'aquatic', 1],
      ['水龟', 'fan', 'scale', 1], ['青蛙', 'fan', 'scale', 1], ['泥鳅', 'fan', 'aquatic', 1],
      ['黄鳝', 'fan', 'aquatic', 1], ['鲫鱼', 'fan', 'aquatic', 1], ['水藻精', 'fan', 'plant', 0],
      ['蝌蚪精', 'fan', 'scale', 1], ['石螺', 'fan', 'aquatic', 1], ['鲇鱼', 'fan', 'aquatic', 1],
      ['青蛤', 'fan', 'aquatic', 1], ['水蚤', 'fan', 'insect', 1]
    ],
    2: [
      ['锦鲤', 'shuiyi', 'aquatic', 1], ['灵鱼', 'xize', 'aquatic', 1], ['白鲢', 'xize', 'aquatic', 1],
      ['青虾', 'xize', 'scale', 1], ['花蟹', 'xize', 'scale', 1], ['海星', 'shuiyi', 'aquatic', 0],
      ['海马', 'shuiyi', 'aquatic', 0], ['蝾螈', 'xize', 'scale', 1], ['鲈鱼', 'xize', 'aquatic', 1],
      ['鳗鱼', 'shuiyi', 'aquatic', 1], ['蛤蜊', 'xize', 'aquatic', 1], ['扇贝', 'shuiyi', 'aquatic', 1],
      ['珊瑚虫', 'shuiyi', 'insect', 1], ['龙须草', 'shuiyi', 'plant', 0], ['碧波鱼', 'shuiyi', 'aquatic', 1],
      ['灵虾', 'xize', 'scale', 1], ['金鳞鱼', 'shuiyi', 'aquatic', 1], ['玄水螺', 'xize', 'aquatic', 1]
    ],
    3: [
      ['金鳞鲤', 'shuiyi', 'aquatic', 1], ['碧水鱼', 'shuiyi', 'aquatic', 1], ['龙须鱼', 'lingmei', 'aquatic', 1],
      ['紫蟹', 'youmei', 'scale', 1], ['赤甲蟹', 'leize', 'scale', 1], ['灵龟', 'shuiyi', 'scale', 1],
      ['海豚', 'shuiyi', 'aquatic', 0], ['电鳐', 'leize', 'aquatic', 0], ['蓝龙鱼', 'lingmei', 'aquatic', 1],
      ['珍珠蚌', 'shuiyi', 'aquatic', 1], ['珊瑚灵', 'lingmei', 'plant', 0], ['水灵草', 'shuiyi', 'plant', 0],
      ['玄水鱼', 'youmei', 'aquatic', 1], ['紫鳞鱼', 'youmei', 'aquatic', 1], ['雷鳞鱼', 'leize', 'aquatic', 1],
      ['逆鳞鱼', 'yaoling', 'aquatic', 1], ['碧波龙鲤', 'lingmei', 'aquatic', 1], ['玉蚌', 'shuiyi', 'aquatic', 1]
    ],
    4: [
      ['寒冰鲛', 'youmei', 'aquatic', 1], ['赤鳞鱼', 'yaoling', 'aquatic', 1], ['黑水玄蛇', 'youmei', 'scale', 1],
      ['双头鳗', 'yiwei', 'aquatic', 1], ['雷鳍鱼', 'leize', 'aquatic', 1], ['玄水龟', 'shuiyi', 'scale', 1],
      ['紫珊瑚妖', 'youmei', 'plant', 0], ['深海鳗', 'yaoling', 'aquatic', 1], ['水魅', 'youmei', 'aquatic', 0],
      ['黑鳞鲨', 'yaoling', 'aquatic', 0], ['噬骨鱼', 'youmei', 'aquatic', 1], ['寒潮蟹', 'leize', 'scale', 1],
      ['碧玉龙须', 'lingmei', 'plant', 0], ['紫电鳗', 'leize', 'aquatic', 1], ['沉渊龟', 'youmei', 'scale', 1],
      ['龙须虾', 'lingmei', 'scale', 1], ['玄水蛟幼体', 'jiao', 'dragon', 1]
    ],
    5: [
      ['金翅鱼', 'shenhai', 'aquatic', 1], ['龙龟', 'xuangui', 'scale', 1], ['金甲蟹', 'xuangui', 'scale', 1],
      ['蓝鳍鲛', 'shenhai', 'aquatic', 1], ['镇海龟', 'xuangui', 'scale', 1], ['碧海豚', 'shenhai', 'aquatic', 0],
      ['金鳞龙鲤', 'longyi', 'aquatic', 1], ['通灵龟', 'xuangui', 'scale', 1], ['赤龙鱼', 'longyi', 'aquatic', 1],
      ['晶须虾', 'shenhai', 'scale', 1], ['碧水玄龟', 'xuangui', 'scale', 1], ['蛟幼崽', 'jiao', 'dragon', 1]
    ]
  },
  /* 西域: 荒漠戈壁凶悍妖兽 */
  west: {
    1: [
      ['沙鼠', 'fan', 'beast', 0], ['沙兔', 'fan', 'beast', 0], ['黄羊', 'fan', 'beast', 0],
      ['野骆驼', 'fan', 'beast', 0], ['壁虎', 'fan', 'scale', 1], ['沙蝎', 'fan', 'insect', 1],
      ['毒蛛', 'fan', 'insect', 1], ['沙蜥', 'fan', 'scale', 1], ['旱獭', 'fan', 'beast', 0],
      ['鸵鸟', 'fan', 'bird', 1], ['沙雀', 'fan', 'bird', 1], ['秃鹫', 'fan', 'bird', 1],
      ['沙漠蚁', 'fan', 'insect', 1], ['沙蛾', 'fan', 'insect', 1], ['土拨鼠', 'fan', 'beast', 0],
      ['沙漠甲虫', 'fan', 'insect', 1], ['灰蜥蜴', 'fan', 'scale', 1], ['沙蛇', 'fan', 'scale', 1]
    ],
    2: [
      ['沙狐', 'huangyuan', 'beast', 0], ['赤沙狼', 'huangyuan', 'beast', 0], ['响尾蛇', 'leize', 'scale', 1],
      ['眼镜蛇', 'yaoling', 'scale', 1], ['巨蝎', 'leize', 'insect', 1], ['黄蜂', 'huangyuan', 'insect', 1],
      ['跳鼠', 'huangyuan', 'beast', 0], ['沙百灵', 'huangyuan', 'bird', 1], ['石鸡', 'shanyue', 'bird', 1],
      ['沙蟒', 'huangyuan', 'scale', 1], ['沙漠蜥', 'huangyuan', 'scale', 1], ['火蚁', 'leize', 'insect', 1],
      ['烈风鹰', 'huangyuan', 'bird', 1], ['黄沙蝎', 'huangyuan', 'insect', 1]
    ],
    3: [
      ['疾风貂', 'lingmei', 'beast', 0], ['荒漠狐', 'lingmei', 'beast', 0], ['铁背蜥', 'shanyue', 'scale', 1],
      ['毒火蝎', 'leize', 'insect', 1], ['金蝎', 'leize', 'insect', 1], ['沙鹰', 'yunhe', 'bird', 1],
      ['赤隼', 'yunhe', 'bird', 1], ['风蛇', 'lingmei', 'scale', 1], ['沙龟', 'shanyue', 'scale', 1],
      ['流沙蜥', 'youmei', 'scale', 1], ['火焰蝎', 'leize', 'insect', 1], ['紫沙鹰', 'yaoling', 'bird', 1],
      ['狂沙兽', 'lingmei', 'beast', 0]
    ],
    4: [
      ['幽冥狼', 'youmei', 'beast', 0], ['噬魂蝎', 'youmei', 'insect', 1], ['赤沙蟒', 'yaoling', 'scale', 1],
      ['黑火蝎', 'leize', 'insect', 1], ['风鹰', 'yunhe', 'bird', 1], ['紫沙蜥', 'youmei', 'scale', 1],
      ['魅影狐', 'youmei', 'beast', 0], ['血蜘蛛', 'youmei', 'insect', 1], ['雷蝎', 'leize', 'insect', 1],
      ['焚沙兽', 'yaoling', 'beast', 0], ['暗沙蟒', 'youmei', 'scale', 1], ['沙魔', 'yaoling', 'yaogui', 0],
      ['灼骨蜥', 'leize', 'scale', 1]
    ],
    5: [
      ['金甲蝎', 'xuangui', 'insect', 1], ['沙龙王', 'xuanmang', 'scale', 1], ['金蝎王', 'leize', 'insect', 1],
      ['铁甲蜥王', 'xuangui', 'scale', 1], ['风沙狮', 'shanjun', 'beast', 0], ['赤炎狮', 'shanjun', 'beast', 0],
      ['荒漠虎王', 'shanjun', 'beast', 0], ['金翼沙雕', 'tianying', 'bird', 1], ['流沙巨蟒', 'xuanmang', 'scale', 1]
    ]
  },
  /* 北境: 冰原雪域寒系灵兽 */
  north: {
    1: [
      ['雪兔', 'fan', 'beast', 0], ['白鼠', 'fan', 'beast', 0], ['雪雀', 'fan', 'bird', 1],
      ['冰鱼', 'fan', 'aquatic', 1], ['雪蛤', 'fan', 'scale', 1], ['冰蚕', 'fan', 'insect', 1],
      ['雪貂', 'fan', 'beast', 0], ['白狼', 'fan', 'beast', 0], ['雪雁', 'fan', 'bird', 1],
      ['冰蜥', 'fan', 'scale', 1], ['霜蛾', 'fan', 'insect', 1], ['寒鸦', 'fan', 'bird', 1],
      ['冰晶虫', 'fan', 'insect', 1], ['雪蛆', 'fan', 'insect', 1], ['冰苔藓', 'fan', 'plant', 0]
    ],
    2: [
      ['雪狐', 'shanlin', 'beast', 0], ['白狐', 'shanlin', 'beast', 0], ['银狐', 'shanlin', 'beast', 0],
      ['冰狼', 'huangyuan', 'beast', 0], ['雪鸮', 'youmei', 'bird', 1], ['冰鲤', 'xize', 'aquatic', 1],
      ['寒雀', 'yunhe', 'bird', 1], ['雪貂', 'shanlin', 'beast', 0], ['白鹿', 'shanyue', 'beast', 0],
      ['冰晶蛛', 'youmei', 'insect', 1], ['霜蛇', 'leize', 'scale', 1], ['雪鹑', 'yunhe', 'bird', 1],
      ['冰蛙', 'xize', 'scale', 1]
    ],
    3: [
      ['玄冰狼', 'leize', 'beast', 0], ['冰晶狐', 'youmei', 'beast', 0], ['雪灵貂', 'lingmei', 'beast', 0],
      ['冰鹰', 'yunhe', 'bird', 1], ['寒雕', 'yunhe', 'bird', 1], ['玄冰蟒', 'youmei', 'scale', 1],
      ['冰蜥蜴', 'shanyue', 'scale', 1], ['雪鸮王', 'youmei', 'bird', 1], ['冰蚕王', 'lingmei', 'insect', 1],
      ['寒冰蛛', 'youmei', 'insect', 1], ['霜狼', 'lingmei', 'beast', 0], ['冰晶鹤', 'yunhe', 'bird', 1],
      ['寒玉蛇', 'shanyue', 'scale', 1]
    ],
    4: [
      ['幽冥雪狼', 'youmei', 'beast', 0], ['寒冰蟒', 'youmei', 'scale', 1], ['雪岭貂王', 'yiwei', 'beast', 0],
      ['玄冰兽', 'yaoling', 'beast', 0], ['冰霜虎', 'leize', 'beast', 0], ['极地狐王', 'yiwei', 'beast', 0],
      ['冰翼鸟', 'yunhe', 'bird', 1], ['寒渊蛟', 'yaoling', 'dragon', 1], ['冰晶狼王', 'yaoling', 'beast', 0],
      ['雪域鹰王', 'tianying', 'bird', 1], ['玄冰蝎', 'youmei', 'insect', 1], ['冰莲精', 'youmei', 'plant', 0]
    ],
    5: [
      ['冰甲兽', 'xuangui', 'beast', 0], ['雪岭狮', 'shanjun', 'beast', 0], ['玄冰龟', 'xuangui', 'scale', 1],
      ['极光鹿', 'tianying', 'beast', 0], ['冰霜虎王', 'shanjun', 'beast', 0], ['雪域狼王', 'shanjun', 'beast', 0],
      ['寒冰玄龟', 'xuangui', 'scale', 1], ['冰雪灵鹤', 'gushang', 'bird', 1], ['万年雪莲', 'youmei', 'plant', 0]
    ]
  },
  /* 南疆: 热带雨林瘴谷毒虫灵兽 */
  south: {
    1: [
      ['毒蛙', 'fan', 'scale', 1], ['褐蛇', 'fan', 'scale', 1], ['壁虎', 'fan', 'scale', 1],
      ['小蜈蚣', 'fan', 'insect', 1], ['白蚁', 'fan', 'insect', 1], ['野猴', 'fan', 'beast', 0],
      ['山鸡', 'fan', 'bird', 1], ['水獭', 'fan', 'beast', 0], ['变色蜥', 'fan', 'scale', 1],
      ['食虫花', 'fan', 'plant', 0], ['苔藓精', 'fan', 'plant', 0], ['蝮蛇', 'fan', 'scale', 1],
      ['绿蛛', 'fan', 'insect', 1], ['花蚊', 'fan', 'insect', 1], ['山雀', 'fan', 'bird', 1]
    ],
    2: [
      ['青蛇', 'shanlin', 'scale', 1], ['树蛙', 'xize', 'scale', 1], ['毒蝶', 'youmei', 'insect', 1],
      ['彩蝶', 'lingmei', 'insect', 1], ['蜂猴', 'lingmei', 'beast', 0], ['眼镜蛇', 'yaoling', 'scale', 1],
      ['巨蛛', 'youmei', 'insect', 1], ['食人花', 'youmei', 'plant', 0], ['曼陀罗', 'youmei', 'plant', 0],
      ['青藤妖', 'lingmei', 'plant', 0], ['金丝猴', 'lingmei', 'beast', 0], ['孔雀', 'lingmei', 'bird', 1],
      ['鹦鹉', 'lingmei', 'bird', 1], ['火蝶', 'leize', 'insect', 1]
    ],
    3: [
      ['竹叶青', 'lingmei', 'scale', 1], ['金环蛇', 'leize', 'scale', 1], ['银环蛇', 'youmei', 'scale', 1],
      ['蛊虫', 'youmei', 'insect', 1], ['五色蝶', 'lingmei', 'insect', 1], ['灵猿', 'lingmei', 'beast', 0],
      ['蟒蛇', 'xuanmang', 'scale', 1], ['毒王蝎', 'leize', 'insect', 1], ['瘴气花', 'youmei', 'plant', 0],
      ['蛊蝶', 'youmei', 'insect', 1], ['烈焰豹', 'leize', 'beast', 0], ['花面狸', 'lingmei', 'beast', 0],
      ['翠羽鸟', 'yunhe', 'bird', 1], ['毒藤', 'youmei', 'plant', 0]
    ],
    4: [
      ['黑水玄蛇', 'youmei', 'scale', 1], ['噬血蛊', 'youmei', 'insect', 1], ['九毒蝎', 'leize', 'insect', 1],
      ['鬼面蝶', 'youmei', 'insect', 1], ['火蟾蜍', 'leize', 'scale', 1], ['剧毒蜥蜴', 'yaoling', 'scale', 1],
      ['幽林豹', 'yaoling', 'beast', 0], ['血藤', 'youmei', 'plant', 0], ['毒龙花', 'youmei', 'plant', 0],
      ['百蛊王', 'yaoling', 'insect', 1], ['噬魂花', 'youmei', 'plant', 0], ['紫毒蛛', 'youmei', 'insect', 1],
      ['深山猿王', 'yaoling', 'beast', 0]
    ],
    5: [
      ['金蚕蛊', 'xuangui', 'insect', 1], ['玄蟒', 'xuanmang', 'scale', 1], ['毒蟾王', 'leize', 'scale', 1],
      ['赤蛊蝶', 'gushang', 'insect', 1], ['噬毒兽', 'xuangui', 'beast', 0], ['龙涎草', 'gushang', 'plant', 0],
      ['毒龙蟒', 'xuanmang', 'scale', 1], ['蛊王', 'gushang', 'insect', 1], ['万年毒参', 'gushang', 'plant', 0]
    ]
  },
  /* 混池: 修仙世界通用灵兽(四海八荒皆见) */
  mixed: {
    1: [
      ['灵犬', 'fan', 'beast', 0], ['玄猫', 'fan', 'beast', 0], ['灵鸡', 'fan', 'bird', 1],
      ['灵鸭', 'fan', 'bird', 1], ['灵鹅', 'fan', 'bird', 1], ['灵兔', 'fan', 'beast', 0],
      ['灵鼠', 'fan', 'beast', 0], ['灵龟', 'fan', 'scale', 1], ['灵鱼', 'fan', 'aquatic', 1],
      ['灵虾', 'fan', 'scale', 1], ['灵蛙', 'fan', 'scale', 1], ['灵虫', 'fan', 'insect', 1],
      ['灵草', 'fan', 'plant', 0], ['灵雀', 'fan', 'bird', 1], ['灵猴', 'fan', 'beast', 0],
      ['灵马', 'fan', 'beast', 0], ['灵牛', 'fan', 'beast', 0], ['灵羊', 'fan', 'beast', 0],
      ['灵猪', 'fan', 'beast', 0], ['灵蛇', 'fan', 'scale', 1], ['灵蝶', 'fan', 'insect', 1],
      ['灵蜂', 'fan', 'insect', 1], ['灵蝉', 'fan', 'insect', 1]
    ],
    2: [
      ['疾风犬', 'shanlin', 'beast', 0], ['火灵猫', 'leize', 'beast', 0], ['铁背牛', 'shanlin', 'beast', 0],
      ['青灵羊', 'shanlin', 'beast', 0], ['灵雉', 'shanlin', 'bird', 1], ['五彩鸡', 'lingmei', 'bird', 1],
      ['踏云兔', 'xize', 'beast', 0], ['灵貂', 'shanlin', 'beast', 0], ['碧水鱼', 'xize', 'aquatic', 1],
      ['灵鹤', 'yunhe', 'bird', 1], ['百灵鸟', 'yunhe', 'bird', 1], ['穿山甲', 'shanyue', 'scale', 0],
      ['灵蛇', 'shanlin', 'scale', 1], ['玉蛙', 'xize', 'scale', 1], ['灵藕', 'xize', 'plant', 0]
    ],
    3: [
      ['玄灵犬', 'lingmei', 'beast', 0], ['追风猫', 'lingmei', 'beast', 0], ['紫灵貂', 'lingmei', 'beast', 0],
      ['灵狐', 'lingmei', 'beast', 0], ['银鳞鱼', 'shuiyi', 'aquatic', 1], ['玉兔', 'lingmei', 'beast', 0],
      ['灵龟王', 'shanyue', 'scale', 1], ['玄猫', 'youmei', 'beast', 0], ['碧眼灵猴', 'lingmei', 'beast', 0],
      ['风灵雀', 'yunhe', 'bird', 1], ['火灵蝶', 'leize', 'insect', 1], ['青玉蛇', 'lingmei', 'scale', 1],
      ['灵鹤', 'yunhe', 'bird', 1], ['雾灵猫', 'youmei', 'beast', 0]
    ],
    4: [
      ['魔灵犬', 'yaoling', 'beast', 0], ['幽影猫', 'youmei', 'beast', 0], ['噬金蚁', 'leize', 'insect', 1],
      ['赤炎狐', 'leize', 'beast', 0], ['幽冥蝶', 'youmei', 'insect', 1], ['通灵兽', 'yiwei', 'beast', 0],
      ['金灵鼠', 'yiwei', 'beast', 0], ['紫灵貂王', 'yiwei', 'beast', 0], ['魅影猫', 'youmei', 'beast', 0],
      ['九命猫', 'youmei', 'beast', 0], ['玄羽鸦', 'youmei', 'bird', 1], ['雷灵貂', 'leize', 'beast', 0],
      ['化形狐', 'yaoling', 'beast', 0]
    ],
    5: [
      ['灵犬王', 'shanjun', 'beast', 0], ['三足金蟾', 'xuangui', 'scale', 1], ['金灵驹', 'tianying', 'beast', 0],
      ['通灵马', 'longyi', 'beast', 0], ['瑞兽幼崽', 'qilin', 'beast', 0], ['金羽雕', 'tianying', 'bird', 1],
      ['灵鹤王', 'gushang', 'bird', 1], ['金猿', 'shanjun', 'beast', 0], ['紫晶灵狐', 'yiwei', 'beast', 0],
      ['七彩灵雀', 'gushang', 'bird', 1], ['吞天蟒', 'xuanmang', 'scale', 1], ['赤焰驹', 'tianying', 'beast', 0]
    ]
  }
}

/* 品质档 rarityWeight(红3彩1, 与签名一致) */
const TIER_WEIGHT = { 1: 30, 2: 25, 3: 18, 4: 10, 5: 6, 6: 3, 7: 1 }

/* ---------- 补充修仙妖兽(补足数量, 均修仙小说常见) ---------- */
/* [name, bloodline, archetype, egg, zone] */
const EXTRA = [
  /* 中州补充 */
  ['银月狼', 'shanlin', 'beast', 0, 'center'], ['黑风狼', 'huangyuan', 'beast', 0, 'center'],
  ['赤狼', 'huangyuan', 'beast', 0, 'center'], ['火云豹', 'leize', 'beast', 0, 'center'],
  ['银貂', 'shanlin', 'beast', 0, 'center'], ['金丝猿', 'shanlin', 'beast', 0, 'center'],
  ['风鹿', 'shanyue', 'beast', 0, 'center'], ['灵驹', 'huangyuan', 'beast', 0, 'center'],
  ['千里驹', 'huangyuan', 'beast', 0, 'center'], ['紫燕', 'yunhe', 'bird', 1, 'center'],
  ['火燕', 'leize', 'bird', 1, 'center'], ['金线蛇', 'shanlin', 'scale', 1, 'center'],
  ['铁甲蚁', 'shanlin', 'insect', 1, 'center'], ['灵蚕', 'shanlin', 'insect', 1, 'center'],
  ['玉蟾', 'xize', 'scale', 1, 'center'], ['血参', 'lingmei', 'plant', 0, 'center'],
  ['青纹虎', 'shanyue', 'beast', 0, 'center'], ['炎虎', 'leize', 'beast', 0, 'center'],
  ['紫瞳魔狼', 'yaoling', 'beast', 0, 'center'], ['闪电豹', 'leize', 'beast', 0, 'center'],
  ['幻狐', 'youmei', 'beast', 0, 'center'], ['紫电豹', 'leize', 'beast', 0, 'center'],
  ['火眼猿', 'leize', 'beast', 0, 'center'], ['魔猿', 'yaoling', 'beast', 0, 'center'],
  ['七彩鹿', 'lingmei', 'beast', 0, 'center'], ['紫云驹', 'lingmei', 'beast', 0, 'center'],
  ['云鹰', 'yunhe', 'bird', 1, 'center'], ['风雷鹰', 'leize', 'bird', 1, 'center'],
  ['紫电鹰', 'leize', 'bird', 1, 'center'], ['青鳞蟒', 'lingmei', 'scale', 1, 'center'],
  ['金鳞蟒', 'yiwei', 'scale', 1, 'center'], ['七彩灵雀', 'lingmei', 'bird', 1, 'center'],
  ['银翅蝉', 'yunhe', 'insect', 1, 'center'], ['冰心莲', 'shanyue', 'plant', 0, 'center'],
  ['紫灵芝', 'youmei', 'plant', 0, 'center'], ['青玉藤', 'lingmei', 'plant', 0, 'center'],
  ['天狼', 'yaoling', 'beast', 0, 'center'], ['血狼', 'youmei', 'beast', 0, 'center'],
  ['裂山虎', 'yaoling', 'beast', 0, 'center'], ['金瞳虎', 'yiwei', 'beast', 0, 'center'],
  ['金角鹿', 'yiwei', 'beast', 0, 'center'], ['深渊巨蟒', 'youmei', 'scale', 1, 'center'],
  ['紫电蛇', 'leize', 'scale', 1, 'center'], ['毒牙蛇', 'youmei', 'scale', 1, 'center'],
  ['魔猿王', 'yaoling', 'beast', 0, 'center'], ['金蝶', 'lingmei', 'insect', 1, 'center'],
  ['银蝶', 'youmei', 'insect', 1, 'center'], ['千年何首乌', 'youmei', 'plant', 0, 'center'],
  ['赤阳果', 'yaoling', 'plant', 0, 'center'], ['风雷貂', 'leize', 'beast', 0, 'center'],
  ['紫晶狮', 'shanjun', 'beast', 0, 'center'], ['裂山虎王', 'shanjun', 'beast', 0, 'center'],
  ['金瞳雕王', 'tianying', 'bird', 1, 'center'], ['吞天兽', 'xuanmang', 'beast', 0, 'center'],
  ['金角兽', 'xuangui', 'beast', 0, 'center'], ['雷角兽', 'leize', 'beast', 0, 'center'],
  ['金鳞蟒王', 'xuanmang', 'scale', 1, 'center'], ['千年灵芝', 'gushang', 'plant', 0, 'center'],
  /* 东海补充 */
  ['水晶虾', 'xize', 'scale', 1, 'east'], ['鳌虾', 'xize', 'scale', 1, 'east'],
  ['银鱼王', 'shuiyi', 'aquatic', 1, 'east'], ['碧波鲤', 'xize', 'aquatic', 1, 'east'],
  ['珍珠鱼', 'shuiyi', 'aquatic', 1, 'east'], ['青蛤王', 'xize', 'aquatic', 1, 'east'],
  ['水仙草', 'xize', 'plant', 0, 'east'], ['芦笛鱼', 'xize', 'aquatic', 1, 'east'],
  ['玄甲蟹', 'shanyue', 'scale', 1, 'east'], ['铁甲蟹', 'shanyue', 'scale', 1, 'east'],
  ['金鳞蟹', 'lingmei', 'scale', 1, 'east'], ['五彩鱼', 'lingmei', 'aquatic', 1, 'east'],
  ['龙鲤', 'lingmei', 'aquatic', 1, 'east'], ['寒玉蚌', 'shuiyi', 'aquatic', 1, 'east'],
  ['紫珊瑚', 'youmei', 'plant', 0, 'east'], ['银鲛', 'shuiyi', 'aquatic', 1, 'east'],
  ['玄水虾', 'shuiyi', 'scale', 1, 'east'], ['碧水蛟龙', 'lingmei', 'dragon', 1, 'east'],
  ['紫电鲨', 'leize', 'aquatic', 0, 'east'], ['赤炎鲛', 'yaoling', 'aquatic', 1, 'east'],
  ['寒渊蟹', 'youmei', 'scale', 1, 'east'], ['血珊瑚', 'youmei', 'plant', 0, 'east'],
  ['深海巨鳗', 'yaoling', 'aquatic', 1, 'east'], ['幽冥水母', 'youmei', 'aquatic', 0, 'east'],
  ['毒刺水母', 'youmei', 'aquatic', 0, 'east'], ['碧海龙鲸', 'youmei', 'aquatic', 0, 'east'],
  ['龙宫珍珠蚌', 'shenhai', 'aquatic', 1, 'east'], ['玄水鲨王', 'shenhai', 'aquatic', 0, 'east'],
  ['金鳞龙王', 'longyi', 'dragon', 1, 'east'], ['赤须龙虾', 'xuangui', 'scale', 1, 'east'],
  ['深海龙鲸', 'shenhai', 'aquatic', 0, 'east'], ['碧海龙龟', 'xuangui', 'scale', 1, 'east'],
  ['紫晶蟹王', 'xuangui', 'scale', 1, 'east'], ['龙宫珍珠精', 'shenhai', 'aquatic', 1, 'east'],
  ['深海巨章', 'shenhai', 'aquatic', 1, 'east'],
  /* 西域补充 */
  ['沙甲虫王', 'huangyuan', 'insect', 1, 'west'], ['沙鹰隼', 'huangyuan', 'bird', 1, 'west'],
  ['烈阳蛇', 'huangyuan', 'scale', 1, 'west'], ['荒漠狼', 'huangyuan', 'beast', 0, 'west'],
  ['沙獾', 'huangyuan', 'beast', 0, 'west'], ['赤砂蜥', 'huangyuan', 'scale', 1, 'west'],
  ['炙蚁', 'leize', 'insect', 1, 'west'], ['荒漠蜥王', 'huangyuan', 'scale', 1, 'west'],
  ['紫沙蝎', 'lingmei', 'insect', 1, 'west'], ['焰火蛛', 'leize', 'insect', 1, 'west'],
  ['金砂蟒', 'lingmei', 'scale', 1, 'west'], ['荒漠狮', 'shanyue', 'beast', 0, 'west'],
  ['玄沙狐', 'lingmei', 'beast', 0, 'west'], ['焚石兽', 'yaoling', 'beast', 0, 'west'],
  ['沙灵鹫', 'yunhe', 'bird', 1, 'west'], ['紫焰蝎', 'yaoling', 'insect', 1, 'west'],
  ['噬魂蛛', 'youmei', 'insect', 1, 'west'], ['赤焰沙蟒', 'yaoling', 'scale', 1, 'west'],
  ['幽冥沙狐', 'youmei', 'beast', 0, 'west'], ['焚天蝎', 'yaoling', 'insect', 1, 'west'],
  ['黑沙暴兽', 'youmei', 'beast', 0, 'west'], ['紫焰蛇', 'leize', 'scale', 1, 'west'],
  ['沙魔鹰', 'yaoling', 'bird', 1, 'west'], ['炎魔兽', 'yaoling', 'yaogui', 0, 'west'],
  ['炎龙蜥', 'xuanmang', 'scale', 1, 'west'], ['金沙兽王', 'shanjun', 'beast', 0, 'west'],
  ['焚天狮王', 'shanjun', 'beast', 0, 'west'], ['沙灵金雕', 'tianying', 'bird', 1, 'west'],
  ['荒古沙蝎', 'huanggu', 'insect', 1, 'west'], ['沙暴巨龙', 'longyi', 'dragon', 1, 'west'],
  /* 北境补充 */
  ['霜狼', 'shanlin', 'beast', 0, 'north'], ['寒貂', 'shanlin', 'beast', 0, 'north'],
  ['冰原兔', 'chentu', 'beast', 0, 'north'], ['雪鹰', 'yunhe', 'bird', 1, 'north'],
  ['冰蛇', 'leize', 'scale', 1, 'north'], ['寒晶虫', 'youmei', 'insect', 1, 'north'],
  ['冰鹿', 'shanyue', 'beast', 0, 'north'], ['冰原熊', 'shanyue', 'beast', 0, 'north'],
  ['玄冰貂', 'youmei', 'beast', 0, 'north'], ['雪域鹰', 'yunhe', 'bird', 1, 'north'],
  ['寒冰鱼', 'xize', 'aquatic', 1, 'north'], ['霜晶蛛', 'youmei', 'insect', 1, 'north'],
  ['寒玉鹿', 'lingmei', 'beast', 0, 'north'], ['冰晶狼王', 'yiwei', 'beast', 0, 'north'],
  ['冰封兽', 'youmei', 'beast', 0, 'north'], ['玄冰熊王', 'yaoling', 'beast', 0, 'north'],
  ['雪岭巨蟒', 'youmei', 'scale', 1, 'north'], ['寒晶狼', 'youmei', 'beast', 0, 'north'],
  ['霜天鹰王', 'tianying', 'bird', 1, 'north'], ['冰髓蜥', 'youmei', 'scale', 1, 'north'],
  ['极夜猫', 'youmei', 'beast', 0, 'north'], ['冰魄兽王', 'shanjun', 'beast', 0, 'north'],
  ['雪域熊王', 'shanjun', 'beast', 0, 'north'], ['极光雪狐王', 'tianying', 'beast', 0, 'north'],
  ['寒渊龟王', 'xuangui', 'scale', 1, 'north'], ['玄冰龙蟒', 'xuanmang', 'scale', 1, 'north'],
  ['冰麒麟', 'qilin', 'beast', 0, 'north'], ['万年雪莲', 'youmei', 'plant', 0, 'north'],
  /* 南疆补充 */
  ['金丝蛇', 'shanlin', 'scale', 1, 'south'], ['毒蘑菇', 'youmei', 'plant', 0, 'south'],
  ['花妖', 'lingmei', 'plant', 0, 'south'], ['藤蔓精', 'lingmei', 'plant', 0, 'south'],
  ['火蚁王', 'leize', 'insect', 1, 'south'], ['五毒蛇', 'youmei', 'scale', 1, 'south'],
  ['灵蜂', 'lingmei', 'insect', 1, 'south'], ['蛊虫王', 'youmei', 'insect', 1, 'south'],
  ['紫蝶王', 'lingmei', 'insect', 1, 'south'], ['毒蟾', 'youmei', 'scale', 1, 'south'],
  ['鬼面蛛', 'youmei', 'insect', 1, 'south'], ['噬心蛊', 'youmei', 'insect', 1, 'south'],
  ['火莲', 'leize', 'plant', 0, 'south'], ['毒龙藤', 'youmei', 'plant', 0, 'south'],
  ['魅花精', 'lingmei', 'plant', 0, 'south'], ['金蝉', 'lingmei', 'insect', 1, 'south'],
  ['血蛊王', 'youmei', 'insect', 1, 'south'], ['噬魂蛊', 'youmei', 'insect', 1, 'south'],
  ['毒龙王', 'yaoling', 'scale', 1, 'south'], ['幽冥花妖', 'youmei', 'plant', 0, 'south'],
  ['蛊毒蟾王', 'yaoling', 'scale', 1, 'south'], ['万毒蛛', 'youmei', 'insect', 1, 'south'],
  ['噬心花', 'youmei', 'plant', 0, 'south'], ['魔藤', 'yaoling', 'plant', 0, 'south'],
  ['蛊灵', 'yaoling', 'insect', 1, 'south'], ['毒凤蝶', 'gushang', 'insect', 1, 'south'],
  ['噬毒蟒王', 'xuanmang', 'scale', 1, 'south'], ['血藤王', 'gushang', 'plant', 0, 'south'],
  ['蛊祖', 'gushang', 'insect', 1, 'south'], ['万毒之王', 'gushang', 'yaogui', 0, 'south'],
  /* 混池补充 */
  ['玉灵猫', 'shanlin', 'beast', 0, 'mixed'], ['风灵犬', 'shanlin', 'beast', 0, 'mixed'],
  ['玄灵羊', 'shanlin', 'beast', 0, 'mixed'], ['灵山羊', 'shanlin', 'beast', 0, 'mixed'],
  ['碧玉鸡', 'xize', 'bird', 1, 'mixed'], ['玄水鸭', 'xize', 'bird', 1, 'mixed'],
  ['银鳞鲤', 'xize', 'aquatic', 1, 'mixed'], ['火灵鸟', 'leize', 'bird', 1, 'mixed'],
  ['紫灵狐', 'lingmei', 'beast', 0, 'mixed'], ['金灵猫', 'lingmei', 'beast', 0, 'mixed'],
  ['云灵犬', 'yunhe', 'beast', 0, 'mixed'], ['碧灵鹤', 'yunhe', 'bird', 1, 'mixed'],
  ['玄灵龟', 'shanyue', 'scale', 1, 'mixed'], ['星辰蝶', 'youmei', 'insect', 1, 'mixed'],
  ['火灵蟒', 'lingmei', 'scale', 1, 'mixed'], ['紫晶灵猫', 'youmei', 'beast', 0, 'mixed'],
  ['九命灵猫', 'youmei', 'beast', 0, 'mixed'], ['噬灵犬', 'yaoling', 'beast', 0, 'mixed'],
  ['幽冥灵猫', 'youmei', 'beast', 0, 'mixed'], ['赤炎灵猿', 'leize', 'beast', 0, 'mixed'],
  ['风灵豹', 'lingmei', 'beast', 0, 'mixed'], ['雷灵猫', 'leize', 'beast', 0, 'mixed'],
  ['玄冰灵貂', 'youmei', 'beast', 0, 'mixed'], ['通灵灵猫', 'yiwei', 'beast', 0, 'mixed'],
  ['金玉麒麟', 'qilin', 'beast', 0, 'mixed'], ['天灵犬王', 'shanjun', 'beast', 0, 'mixed'],
  ['通灵龟王', 'xuangui', 'scale', 1, 'mixed'], ['金毛灵狮', 'shanjun', 'beast', 0, 'mixed'],
  ['紫晶麒麟', 'qilin', 'beast', 0, 'mixed'], ['七彩凤凰', 'fenghuang', 'bird', 1, 'mixed'],
  ['金羽凤凰', 'fenghuang', 'bird', 1, 'mixed'],
  /* 南疆补充 */
  ['金蚕皇', 'lingmei', 'insect', 1, 'south'], ['七彩蛊蝶', 'youmei', 'insect', 1, 'south'],
  ['蛊龙', 'yaoling', 'scale', 1, 'south'], ['毒龙蝎', 'yaoling', 'insect', 1, 'south'],
  ['血蛊母', 'youmei', 'insect', 1, 'south'], ['幽冥蛊', 'youmei', 'insect', 1, 'south'],
  ['万毒藤', 'youmei', 'plant', 0, 'south'], ['火蜈蚣王', 'leize', 'insect', 1, 'south'],
  ['噬心蛊王', 'yaoling', 'insect', 1, 'south'], ['蛊王母', 'xuangui', 'insect', 1, 'south'],
  /* 北境补充 */
  ['冰霜狼王', 'yaoling', 'beast', 0, 'north'], ['雪域冰狐', 'yaoling', 'beast', 0, 'north'],
  ['极光貂', 'lingmei', 'beast', 0, 'north'], ['寒冰翼龙', 'xuanmang', 'dragon', 1, 'north'],
  ['冰晶蝎王', 'youmei', 'insect', 1, 'north'], ['雪岭虎', 'shanjun', 'beast', 0, 'north'],
  ['玄冰狮', 'shanjun', 'beast', 0, 'north'], ['万载冰髓', 'xuangui', 'plant', 0, 'north'],
  /* 东海补充 */
  ['深海巨章王', 'shenhai', 'aquatic', 1, 'east'], ['碧海龙鲸', 'shenhai', 'aquatic', 0, 'east'],
  ['玄水龙龟', 'xuangui', 'scale', 1, 'east'], ['赤焰龙虾', 'leize', 'scale', 1, 'east'],
  ['深海龙王', 'jiao', 'dragon', 1, 'east'], ['紫电鲸', 'leize', 'aquatic', 0, 'east']
]

/* ---------- 修仙妖兽文案模板 ---------- */
const ZONE_DESC = {
  center: [
    '{zone}山水之间常见的{name}，灵智初开，颇具灵性。',
    '在中州山林田野间出没的{name}，野性未驯，成长可期。',
    '{zone}灵气滋养的{name}，吞吐天地灵气，渐通人性。'
  ],
  east: [
    '{zone}碧波之中游弋的{name}，生于水汽充沛之地，身姿灵动。',
    '在东海群岛之间出没的{name}，惯了潮起潮落，水性极佳。',
    '{zone}水汽化灵的{name}，于浪花间时隐时现，颇具灵性。'
  ],
  west: [
    '{zone}烈阳之下栖息的{name}，耐得酷热干涸，性情坚韧。',
    '大漠孤烟中的{name}，于黄沙之间穿行，踪迹难觅。',
    '{zone}沙海之中淬炼的{name}，凶悍却亦有灵性。'
  ],
  north: [
    '{zone}苦寒之地存活的{name}，御寒之能远超同侪。',
    '极光流转的雪原上，{name}披霜踏雪，往来如风。',
    '{zone}冰天雪地中修行的{name}，一身寒霜之气。'
  ],
  south: [
    '{zone}瘴气弥漫的林间，{name}身带奇异本领，常人不敢近。',
    '{zone}十万大山中的{name}，生于湿热密林，凶名在外。',
    '苗岭深处的{name}，与百毒为邻，通晓诡异之道。'
  ],
  mixed: [
    '四海八荒皆有踪迹的{name}，无论身处何域都能生存。',
    '云游修士偶遇的{name}，随遇而安，灵性内敛。',
    '分布极广的{name}，五方大区皆有其出没的传闻。'
  ]
}
const ARCH_PHRASE = {
  beast: '爪牙渐利，颇有灵性。',
  bird: '振翅欲飞，目如点漆。',
  aquatic: '游动如鱼，呼吸间水汽萦绕。',
  insect: '体小而剧毒，蛰伏如影。',
  plant: '根须盘结，其性温润。',
  dragon: '隐有龙气，不可轻侮。',
  scale: '鳞甲初成，皮肉坚韧。',
  yaogui: '妖气萦绕，凶戾难驯。'
}

function realDesc (zone, name, tier, arch, egg, idx) {
  const pool = ZONE_DESC[zone] || ZONE_DESC.center
  const zName = petRegionNameOf(zone)
  const qName = PET_QUALITY[tier].name
  let d = pool[idx % pool.length].replace('{name}', name).replace('{zone}', zName)
  d += '（' + qName + '）' + ARCH_PHRASE[arch]
  if (egg) d += '此兽卵生，可获其蛋加以孵化。'
  return d
}

/* ---------- 组装全部物种(签名 + 修仙妖兽), 去重 + 引用校验 ---------- */
export const SPECIES = []
const NAME_SET = new Set()

function pushSpecies (s) {
  if (!s || !s.name || !s.bloodline || NAME_SET.has(s.name)) return
  const bl = bloodlineOf(s.bloodline)
  if (!bl) return
  NAME_SET.add(s.name)
  SPECIES.push({
    id: s.id || `${s.zone}_${s.name}`,
    name: s.name,
    bloodline: s.bloodline,
    archetype: s.archetype || 'beast',
    zone: s.zone || 'mixed',
    eggLaying: !!s.eggLaying,
    rarityWeight: s.rarityWeight || 10,
    desc: s.desc || ''
  })
}

/* 签名物种(手写, 含丰富文案) */
for (const [name, bloodline, arch, zone, egg, rw, desc] of SIGNATURE) {
  pushSpecies({
    id: `sig_${zone}_${name}`, name, bloodline, archetype: arch, zone,
    eggLaying: egg, rarityWeight: rw, desc
  })
}

/* 修仙妖兽(按大区 × 品质档) */
for (const zone of Object.keys(ZONE_BEASTS)) {
  for (const tier of Object.keys(ZONE_BEASTS[zone])) {
    ZONE_BEASTS[zone][tier].forEach((row, idx) => {
      const [name, bloodline, arch, egg] = row
      const bl = bloodlineOf(bloodline)
      if (!bl || bl.quality !== Number(tier)) return // 档位与血脉品质一致才收录
      pushSpecies({
        id: `${zone}_${name}`,
        name,
        bloodline,
        archetype: arch,
        zone,
        eggLaying: !!egg,
        rarityWeight: TIER_WEIGHT[bl.quality] || 10,
        desc: realDesc(zone, name, bl.quality, arch, !!egg, idx)
      })
    })
  }
}

/* 补充修仙妖兽 */
for (const [name, bloodline, arch, egg, zone] of EXTRA) {
  const bl = bloodlineOf(bloodline)
  if (!bl) continue
  pushSpecies({
    id: `${zone}_${name}`,
    name,
    bloodline,
    archetype: arch,
    zone,
    eggLaying: !!egg,
    rarityWeight: TIER_WEIGHT[bl.quality] || 10,
    desc: realDesc(zone, name, bl.quality, arch, !!egg, name.length)
  })
}

/** 特殊秘境物种注册(预留): registerPetSpecies(species) */
export function registerPetSpecies (species) {
  pushSpecies(species)
  return species
}

/** 物种 → 血脉(含品质) 快捷 */
export function speciesMeta (speciesId) {
  const s = SPECIES.find(x => x.id === speciesId)
  if (!s) return null
  const bl = bloodlineOf(s.bloodline)
  return { species: s, bloodline: bl, quality: bl ? bl.quality : 1 }
}

/** 按大区取物种池(当前大区 + 混池), 用于搜寻抽卡 */
export function speciesPoolOf (region) {
  const list = []
  for (const s of SPECIES) {
    if (s.zone === region || s.zone === 'mixed') list.push(s)
  }
  return list
}

/** 全部物种(供图鉴) */
export function allSpecies () {
  return SPECIES
}
