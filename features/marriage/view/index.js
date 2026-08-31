export * from './family.js'
export * from './marry.js'
export * from './event.js'
export * from './help.js'

export const marriageViewMap = {
  family: '家庭展示',
  marry: '求婚结果',
  event: '事件展示',
  help: '帮助说明'
}

export function getMarriageViewMap () {
  return marriageViewMap
}
