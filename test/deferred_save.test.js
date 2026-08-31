import test from 'node:test'
import assert from 'node:assert/strict'
import {
  _test,
  flushDeferredSaves,
  pendingDeferredSaves,
  saveOrDefer,
  withDeferredSaveContext
} from '../components/deferred_save.js'

test.beforeEach(() => _test.clear())
test.afterEach(() => _test.clear())

test('后台同一目标只保留最后一次保存', async () => {
  const saved = []
  await withDeferredSaveContext(async () => {
    saveOrDefer('fake:g1', () => saved.push('old'))
    saveOrDefer('fake:g1', () => saved.push('new'))
  })

  assert.equal(pendingDeferredSaves(), 1)
  assert.deepEqual(flushDeferredSaves(), { saved: 1, failed: 0, pending: 0 })
  assert.deepEqual(saved, ['new'])
})

test('保存失败会保留到下一轮重试', async () => {
  let attempts = 0
  await withDeferredSaveContext(async () => {
    saveOrDefer('world:g1', () => {
      attempts++
      if (attempts === 1) throw new Error('temporary failure')
    })
  })

  assert.deepEqual(flushDeferredSaves(), { saved: 0, failed: 1, pending: 1 })
  assert.deepEqual(flushDeferredSaves(), { saved: 1, failed: 0, pending: 0 })
  assert.equal(attempts, 2)
})

test('玩家立即保存会取消同目标的后台保存', async () => {
  const saved = []
  await withDeferredSaveContext(async () => {
    saveOrDefer('pet:g1:fake', () => saved.push('background'))
  })
  saveOrDefer('pet:g1:fake', () => saved.push('player'))

  assert.equal(pendingDeferredSaves(), 0)
  assert.deepEqual(flushDeferredSaves(), { saved: 0, failed: 0, pending: 0 })
  assert.deepEqual(saved, ['player'])
})
