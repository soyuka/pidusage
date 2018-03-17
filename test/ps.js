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
  mockdate.set(new Date(864000000))
})

test.beforeEach(() => {
  mockery.resetCache()
})

test.after(() => {
  mockery.disable()
  mockdate.reset()
})

test('should parse ps output on Darwin', async t => {
  const stdout = '' +
    '   ELAPSED   PID  %CPU     RSS           TIME' + os.EOL +
    '2-40:50:53   430   3.0    5145  1-02:03:04.07' + os.EOL +
    '  40:50:53   432   0.0    2364  1-01:02:03.10' + os.EOL +
    '  01:50:50   727  10.0  348932       14:27.26' + os.EOL +
    '     00:20  7166   0.1    3756        0:00.02'

  mockery.registerMock('child_process', {
    spawn: () => mocks.spawn(stdout, '', null, 0, null)
  })
  mockery.registerMock('os', {
    EOL: os.EOL, platform: () => 'darwin', type: () => 'type', release: () => 'release'}
  )

  const ps = require('../lib/ps')

  const result = await pify(ps)([348932], {})
  t.deepEqual(result, {
    430: {
      cpu: 3.0,
      memory: 5145 * 1024,
      pid: 430,
      ctime: (1 * 86400 + 2 * 3600 + 3 * 60 + 4 * 1) * 1000 + (600 * 7),
      elapsed: (2 * 86400 + 40 * 3600 + 50 * 60 + 53 * 1) * 1000,
      timestamp: 864000000
    },
    432: {
      cpu: 0.0,
      memory: 2364 * 1024,
      pid: 432,
      ctime: (1 * 86400 + 1 * 3600 + 2 * 60 + 3 * 1) * 1000 + (600 * 10),
      elapsed: (40 * 3600 + 50 * 60 + 53 * 1) * 1000,
      timestamp: 864000000
    },
    727: {
      cpu: 10.0,
      memory: 348932 * 1024,
      pid: 727,
      ctime: (14 * 60 + 27 * 1) * 1000 + (600 * 26),
      elapsed: (1 * 3600 + 50 * 60 + 50 * 1) * 1000,
      timestamp: 864000000
    },
    7166: {
      cpu: 0.1,
      memory: 3756 * 1024,
      pid: 7166,
      ctime: (600 * 2),
      elapsed: (20 * 1) * 1000,
      timestamp: 864000000
    }
  })

  mockery.deregisterMock('child_process')
  mockery.deregisterMock('os')
})

test('should parse ps output on *nix', async t => {
  const stdout = '' +
    '   ELAPSED   PID  %CPU     RSS        TIME' + os.EOL +
    '2-40:50:53   430   3.0    5145  1-02:03:04' + os.EOL +
    '  40:50:53   432   0.0    2364  1-01:02:03' + os.EOL +
    '  01:50:50   727  10.0  348932       14:27' + os.EOL +
    '     00:20  7166   0.1    3756        0:00'

  mockery.registerMock('child_process', {
    spawn: () => mocks.spawn(stdout, '', null, 0, null)
  })
  mockery.registerMock('os', {
    EOL: os.EOL, platform: () => 'linux', type: () => 'type', release: () => 'release'}
  )

  const ps = require('../lib/ps')

  const result = await pify(ps)([11678], {})
  t.deepEqual(result, {
    430: {
      cpu: 3.0,
      memory: 5145 * 1024,
      pid: 430,
      ctime: (1 * 86400 + 2 * 3600 + 3 * 60 + 4 * 1) * 1000,
      elapsed: (2 * 86400 + 40 * 3600 + 50 * 60 + 53 * 1) * 1000,
      timestamp: 864000000
    },
    432: {
      cpu: 0.0,
      memory: 2364 * 1024,
      pid: 432,
      ctime: (1 * 86400 + 1 * 3600 + 2 * 60 + 3 * 1) * 1000,
      elapsed: (40 * 3600 + 50 * 60 + 53 * 1) * 1000,
      timestamp: 864000000
    },
    727: {
      cpu: 10.0,
      memory: 348932 * 1024,
      pid: 727,
      ctime: (14 * 60 + 27 * 1) * 1000,
      elapsed: (1 * 3600 + 50 * 60 + 50 * 1) * 1000,
      timestamp: 864000000
    },
    7166: {
      cpu: 0.1,
      memory: 3756 * 1024,
      pid: 7166,
      ctime: 0,
      elapsed: (20 * 1) * 1000,
      timestamp: 864000000
    }
  })

  mockery.deregisterMock('child_process')
  mockery.deregisterMock('os')
})
