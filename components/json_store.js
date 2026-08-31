import fs from 'fs'
import path from 'path'

let tempSeq = 0
const RENAME_RETRY_CODES = new Set(['EPERM', 'EACCES', 'EBUSY'])
const waitSync = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

function renameWithRetry (io, tmp, file) {
  let last
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      io.renameSync(tmp, file)
      return
    } catch (err) {
      last = err
      if (!RENAME_RETRY_CODES.has(err && err.code) || attempt === 4) throw err
      waitSync(10 * (attempt + 1))
    }
  }
  throw last
}

/**
 * 将 JSON 先完整写入同目录临时文件，再原子替换正式文件。
 * 正式文件在写入失败或进程异常退出时不会被清空成半截内容。
 * io 参数仅供测试注入，生产环境使用 node:fs。
 */
export function writeJsonAtomic (file, data, space = '\t', io = fs) {
  const dir = path.dirname(file)
  if (!io.existsSync(dir)) io.mkdirSync(dir, { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.${++tempSeq}.tmp`
  try {
    io.writeFileSync(tmp, JSON.stringify(data, null, space), 'utf8')
    renameWithRetry(io, tmp, file)
    return true
  } catch (err) {
    try { if (io.existsSync(tmp)) io.unlinkSync(tmp) } catch (e) { }
    throw err
  }
}
