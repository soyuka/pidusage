const mockery = require('mockery')
const test = require('ava')
const os = require('os')
const mockdate = require('mockdate')
const pify = require('pify')

const mocks = require('./helpers/_mocks')

const timeout = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))

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

test('should parse gwmi output on Windows', async t => {
  const stdout = '' +
    'Active code page: 936' + os.EOL +
    '' + os.EOL +
    '' + os.EOL +
    'CreationDate               KernelModeTime  ParentProcessId  ProcessId  UserModeTime  WorkingSetSize' + os.EOL +
    '------------               -----------     -----------     ------------   --------  --------' + os.EOL +
    '20150329221650.080654+060  153750000       0                777        8556250000    110821376'

  let calls = 0

  mockery.registerMock('child_process', {
    spawn: () => {
      calls++
      return mocks.spawn(stdout, '', null, 0, null)
    }
  })

  const gwmi = require('../lib/gwmi')

  let result = await pify(gwmi)([6456], { maxage: 1000 })
  t.deepEqual(result, {
    777: {
      cpu: 0,
      memory: 110821376,
      ppid: 0,
      pid: 777,
      ctime: (855625 + 15375),
      elapsed: 1427749200000 - new Date('2015-03-29T22:16:50.080654+0100').getTime(),
      timestamp: 1427749200000
    }
  })

  result = await pify(gwmi)([6456], { maxage: 1000 })

  t.is(calls, 3, '2 first calls to put in history + 1')

  mockdate.set(new Date(1427749202000))

  // wait 1 second, it should do 2 calls again
  await timeout(1000)

  calls = 0
  result = await pify(gwmi)([6456], { maxage: 1000 })

  t.is(calls, 2, '2 first calls')

  mockery.deregisterMock('child_process')
})
