/* ============================================================
 * 玩家宗门系统 · 聚合入口(由 sect_system.js 拆分生成)
 * 业务逻辑拆分至 components/sect/: utils/economy/diplomacy/hr/captive/war/tick
 * 此处仅做统一导出, 保证所有外部命名导出与 default 与拆分前一致
 * ============================================================ */
export * from './sect/utils.js'
export * from './sect/economy.js'
export * from './sect/diplomacy.js'
export * from './sect/hr.js'
export * from './sect/captive.js'
export * from './sect/war.js'
export * from './sect/tick.js'

import { CFG } from './sect/utils.js'
import { sectTick } from './sect/tick.js'
import { startSectAttack, startRogueAttack, abortSectAttack, rogueTeamOf, createRogueTeam, inviteRogue, agreeRogue, applyRogue, respondApply, kickRogue, transferRogue, quitRogue, disbandRogue, respondDefend, joinSectFight, sectReinforce, sectServantRally } from './sect/war.js'
import { captiveOf, handleCaptives, sectJailList, releaseSectJail, playerEscape, startRescue, rescuingOf, settleSectJails } from './sect/captive.js'
import { createPlayerSect, offer, offerAllGongfa, exchange, upgradeFacility, upgradeAreaDef, abandonArea, claimSalary, takeFromVault } from './sect/economy.js'
import { appointTo, abdicateTo, askAbdicate, seizePower, getFacilityLevel, answerSectJoin } from './sect/hr.js'
import { declareWar, makePeace, allySect, breakAlly, allyAssist, aiDiplomacy, aiAllyAssist, coalitionShares, shareCaptivesByOutput } from './sect/diplomacy.js'
import { playerPower, playerLevel, injuryInfo, sectRegion, isPlayerLead, areaDefLevel, getVault, regionOfArea } from './sect/utils.js'

export default { CFG, sectTick, startSectAttack, startRogueAttack, abortSectAttack, captiveOf, rogueTeamOf,
  createRogueTeam, inviteRogue, agreeRogue, applyRogue, respondApply, kickRogue, transferRogue,
  quitRogue, disbandRogue, respondDefend, joinSectFight, sectReinforce, sectServantRally,
  handleCaptives, createPlayerSect, offer, offerAllGongfa, exchange, upgradeFacility, upgradeAreaDef, abandonArea, appointTo,
  abdicateTo, askAbdicate, seizePower, declareWar, makePeace, playerPower, playerLevel, injuryInfo,
  sectRegion, isPlayerLead, areaDefLevel, getVault, regionOfArea, getFacilityLevel, answerSectJoin,
  claimSalary, takeFromVault, allySect, breakAlly, allyAssist, aiDiplomacy, aiAllyAssist,
  coalitionShares, shareCaptivesByOutput, sectJailList, releaseSectJail, playerEscape, startRescue,
  rescuingOf, settleSectJails }
