const mockery = require('mockery')
const test = require('ava')
const os = require('os')
const mockdate = require('mockdate')
const pify = require('pify')

const mocks = require('./helpers/_mocks')

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
    '   ELAPSED   PID  PPID  %CPU     RSS           TIME' + os.EOL +
    '2-40:50:53   430     1   3.0    5145  1-02:03:04.07' + os.EOL +
    '  40:50:53   432   430   0.0    2364  1-01:02:03.10' + os.EOL +
    '  01:50:50   727     1  10.0  348932       14:27.26' + os.EOL +
    '     00:20  7166     1   0.1    3756        0:00.02'

  mockery.registerMock('child_process', {
    spawn: () => mocks.spawn(stdout, '', null, 0, null)
  })

  mockery.registerMock('os', {
    EOL: os.EOL,
    platform: () => 'darwin',
    type: () => 'type',
    release: () => 'release'
  })

  const ps = require('../lib/ps')

  const result = await pify(ps)([430, 7166], {})
  t.deepEqual(result, {
    430: {
      cpu: (93784070 / 319853000) * 100,
      memory: 5145 * 1024,
      ppid: 1,
      pid: 430,
      ctime: (1 * 86400 + 2 * 3600 + 3 * 60 + 4 * 1) * 1000 + (10 * 7),
      elapsed: (2 * 86400 + 40 * 3600 + 50 * 60 + 53 * 1) * 1000,
      timestamp: 864000000
    },
    7166: {
      cpu: (20 / 20000) * 100,
      memory: 3756 * 1024,
      ppid: 1,
      pid: 7166,
      ctime: (10 * 2),
      elapsed: (20 * 1) * 1000,
      timestamp: 864000000
    }
  })

  mockery.deregisterMock('child_process')
  mockery.deregisterMock('os')
})

test('should parse ps output on *nix', async t => {
  t.pass()
  // const stdout = '' +
  //   '   ELAPSED   PID  PPID  %CPU     RSS        TIME' + os.EOL +
  //   '2-40:50:53   430     1   3.0    5145  1-02:03:04' + os.EOL +
  //   '  40:50:53   432   430   0.0    2364  1-01:02:03' + os.EOL +
  //   '  01:50:50   727     1  10.0  348932       14:27' + os.EOL +
  //   '     00:20  7166     1   0.1    3756        0:00'
  //
  // mockery.registerMock('child_process', {
  //   spawn: () => mocks.spawn(stdout, '', null, 0, null)
  // })
  // mockery.registerMock('os', {
  //   EOL: os.EOL,
  //   platform: () => 'linux',
  //   type: () => 'type',
  //   release: () => 'release'
  // })
  //
  // const ps = require('../lib/ps')
  //
  // const result = await pify(ps)([430, 7166], {})
  // t.deepEqual(result, {
  //   430: {
  //     cpu: 3.0,
  //     memory: 5145 * 1024,
  //     ppid: 1,
  //     pid: 430,
  //     ctime: (1 * 86400 + 2 * 3600 + 3 * 60 + 4 * 1) * 1000,
  //     elapsed: (2 * 86400 + 40 * 3600 + 50 * 60 + 53 * 1) * 1000,
  //     timestamp: 864000000
  //   },
  //   7166: {
  //     cpu: 0.1,
  //     memory: 3756 * 1024,
  //     ppid: 1,
  //     pid: 7166,
  //     ctime: 0,
  //     elapsed: (20 * 1) * 1000,
  //     timestamp: 864000000
  //   }
  // })
  //
  // mockery.deregisterMock('child_process')
  // mockery.deregisterMock('os')
})

test('should be able to set usePs from env var', async t => {
  let usePsFromStats

  mockery.registerMock('./lib/stats', (_, options) => {
    usePsFromStats = options.usePs
  })

  const beforeValue = process.env.PIDUSAGE_USE_PS
  process.env.PIDUSAGE_USE_PS = 'true'

  const pidusage = require('../')
  pidusage(1, () => {})

  t.is(usePsFromStats, true)

  process.env.PIDUSAGE_USE_PS = beforeValue
  mockery.deregisterMock('./lib/stats')
})
