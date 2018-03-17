import os from 'os'

import test from 'ava'
import mockery from 'mockery'
import mockdate from 'mockdate'

import pify from 'pify'

import mocks from './helpers/mocks'

test.before(() => {
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  })
  mockdate.set(new Date(1427749200000))
})

test.beforeEach(() => {
  mockery.resetCache()
})

test.after(() => {
  mockery.disable()
  mockdate.reset()
})

test('should parse wmic output on Windows', async t => {
  const stdout = '' +
    'CreationDate               KernelModeTime  ProcessId  UserModeTime  WorkingSetSize' + os.EOL +
    '20150329221650.080654+060  153750000       777        8556250000    110821376'

  mockery.registerMock('child_process', {
    spawn: () => mocks.spawn(stdout, '', null, 0, null)
  })
  mockery.registerMock('os', {
    EOL: os.EOL, platform: () => 'linux', type: () => 'type', release: () => 'release', uptime: os.uptime}
  )

  const wmic = require('../lib/wmic')

  const result = await pify(wmic)([6456], {})
  t.deepEqual(result, {
    777: {
      cpu: 0,
      memory: 110821376,
      pid: 777,
      ctime: (855625 + 15375),
      elapsed: 1427749200000 - new Date('2015-03-29T22:16:50.080654+0100').getTime(),
      timestamp: 1427749200000
    }
  })

  mockery.deregisterMock('child_process')
  mockery.deregisterMock('os')
})
