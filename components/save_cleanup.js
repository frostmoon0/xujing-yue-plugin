import fs from 'fs'
import path from 'path'
import { Save_Path } from './plugin.js'

const TEMP_MAX_AGE = 60 * 60 * 1000
const TEST_MAX_AGE = 24 * 60 * 60 * 1000
const RECOVERY_RE = /\.(?:corrupt\..*\.bak|restore-before-.*\.bak)$/i
const TEMP_RE = /\.(?:tmp|cleanup\.tmp)$/i
const TEST_PATH_RE = /(?:^|[\\/])(?:test[^\\/]*|migrate-[^\\/]*|shenyou-[^\\/]*)(?:[\\/]|$)/i
const TEST_FILE_RE = /^(?:pet_pet-test[^/]*|world_(?:buytest|shenyou-)[^/]*)/i

function isTestArtifact (file, root) {
  const rel = path.relative(root, file).replace(/\\/g, '/')
  return TEST_PATH_RE.test(`/${rel}`) || TEST_FILE_RE.test(path.basename(file))
}

/**
 * 清理插件正式存档目录中的残留文件。
 * 不扫描 D 盘备份, 不按内容猜测删除正式数字群号存档。
 */
export function cleanupSaveFiles (root = Save_Path, now = Date.now()) {
  const report = { removed: 0, bytes: 0, errors: 0 }
  const walk = (dir) => {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch (err) { report.errors++; return }
    for (const entry of entries) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(file)
        if (isTestArtifact(file, root)) {
          try {
            if (!fs.readdirSync(file).length) fs.rmdirSync(file)
          } catch (err) { report.errors++ }
        }
        continue
      }
      let stat
      try { stat = fs.statSync(file) } catch (err) { report.errors++; continue }
      const age = Math.max(0, now - stat.mtimeMs)
      const recovery = RECOVERY_RE.test(entry.name)
      const staleTemp = TEMP_RE.test(entry.name) && age >= TEMP_MAX_AGE
      const staleTest = isTestArtifact(file, root) && age >= TEST_MAX_AGE
      if (!recovery && !staleTemp && !staleTest) continue
      try {
        fs.unlinkSync(file)
        report.removed++
        report.bytes += stat.size
      } catch (err) { report.errors++ }
    }
  }
  if (fs.existsSync(root)) walk(root)
  return report
}
