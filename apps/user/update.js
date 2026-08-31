import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { plugin } from '../../model/api/api.js'
import { Plugin_Path } from '../../components/plugin.js'

/* git 命令统一走 exec：windowsHide 避免 Windows 弹黑窗；默认超时 3 分钟 */
const execAsync = promisify(exec)
const gitRun = async (args, timeout = 180000) => {
  const { stdout, stderr } = await execAsync(
    `git -C "${Plugin_Path}" ${args}`,
    { windowsHide: true, timeout, maxBuffer: 1024 * 1024 }
  )
  return { stdout: String(stdout || '').trim(), stderr: String(stderr || '').trim() }
}

export class xujing_update extends plugin {
  constructor () {
    super({
      name: '虚境插件_更新',
      dsc: '#虚境更新：git 拉取最新代码',
      event: 'message',
      priority: 1000,
      rule: [
        { reg: '^[#＃]?(虚境更新|更新虚境|虚境更新插件)$', fnc: 'update', auth: 'master' }
      ]
    })
  }

  async update (e) {
    if (!e.isMaster) {
      e.reply('凡人，休得僭越！此命令仅管理员可用~')
      return true
    }
    /* 1. git 是否可用 */
    try {
      await execAsync('git --version', { windowsHide: true })
    } catch {
      e.reply('未检测到 git，无法使用 #虚境更新。\n请先安装 git，或改用 git clone 方式安装本插件。')
      return true
    }
    /* 2. 是否为 git 仓库 */
    try {
      await gitRun('rev-parse --git-dir')
    } catch {
      e.reply('本插件不是通过 git 安装的，无法自动更新。\n建议用 git clone 安装后再使用 #虚境更新：\ngit clone https://gitee.com/frost-moon05/xujing-yue-plugin.git plugins/xujing-yue-plugin')
      return true
    }
    /* 3. 确定分支与远程：优先 origin（clone 自带），无则回退 gitee/github */
    let branch = 'master'
    try {
      branch = (await gitRun('symbolic-ref --short HEAD')).stdout || branch
    } catch { /* 保持默认 */ }
    let remote = 'origin'
    try {
      const remotes = (await gitRun('remote')).stdout.split(/\s+/).filter(Boolean)
      if (!remotes.includes('origin')) {
        remote = remotes.find(r => r === 'gitee') || remotes.find(r => r === 'github') || remotes[0]
      }
      if (!remote) {
        e.reply('未配置 git 远程仓库，无法更新。')
        return true
      }
    } catch {
      e.reply('读取 git 远程仓库失败，无法更新。')
      return true
    }
    /* 4. 拉取 */
    await e.reply(`正在从 ${remote}（${branch}）拉取最新代码，请稍候…`)
    try {
      const { stdout, stderr } = await gitRun(`pull --ff-only ${remote} ${branch}`)
      const msg = [stdout, stderr].filter(Boolean).join('\n')
      if (/already up.?to.?date/i.test(msg)) {
        return e.reply(`✅ 虚境插件已是最新版本（${branch}），无需更新。`)
      }
      return e.reply(`✅ 虚境更新完成！\n${msg}\n\n请重启 Bot 使新代码生效。`)
    } catch (err) {
      const detail = String(err.stderr || err.message || err).trim()
      const hint = /local changes|not up to date|diverged|cannot pull/i.test(detail)
        ? '\n\n（本地有改动与远程冲突，请先提交或暂存本地改动后再试）'
        : ''
      return e.reply(`❌ 虚境更新失败：\n${detail}${hint}`)
    }
  }
}
